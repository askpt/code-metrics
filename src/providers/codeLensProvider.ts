import * as vscode from "vscode";
import {
  MetricsAnalyzerFactory,
  UnifiedFunctionMetrics,
} from "../metricsAnalyzer/metricsAnalyzerFactory";
import { ConfigurationManager, CodeMetricsConfig } from "../configuration";

/**
 * Compiled regex cache for exclude patterns.
 * Key: joined pattern string (patterns change rarely; cache avoids per-request recompilation).
 * Value: array of compiled { regex, isFullPath } entries ready for matching.
 * Capped at EXCLUDE_CACHE_MAX_SIZE entries (LRU eviction) to prevent unbounded growth when
 * workspace settings vary across many open folders or when settings change frequently.
 */
const excludeRegexCache = new Map<
  string,
  { regex: RegExp; isFullPath: boolean }[]
>();

/** Maximum number of distinct pattern-list compilations to keep in the exclude regex cache. */
const EXCLUDE_CACHE_MAX_SIZE = 32;

const CONFIG_CACHE_MAX_SIZE = 32;

/**
 * Maximum number of document analysis results to keep in the analysis cache.
 * One entry per open document is typical; 64 is generous for large workspaces.
 */
const ANALYSIS_CACHE_MAX_SIZE = 64;

/**
 * Maximum number of per-path exclusion decisions to keep in the result cache.
 * File paths are stable within a session; 512 is generous for large workspaces.
 */
const EXCLUDE_RESULT_CACHE_MAX_SIZE = 512;

/** Compiles a single glob pattern into a regex, honouring `**`, `*`, `?` wildcards. */
function compileExcludePattern(
  pattern: string
): { regex: RegExp; isFullPath: boolean } {
  const normalized = pattern.replace(/\\/g, "/");
  const isFullPath = normalized.includes("/");

  if (isFullPath) {
    const regexPattern = normalized
      .replace(/\*\*/g, "\x00DS\x00")
      .replace(/\*/g, "\x00S\x00")
      .replace(/\?/g, "\x00Q\x00")
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\x00DS\x00/g, ".*")
      .replace(/\x00S\x00/g, "[^/]*")
      .replace(/\x00Q\x00/g, "[^/]");
    return { regex: new RegExp(`^${regexPattern}$`), isFullPath: true };
  } else {
    const regexPattern = normalized
      .replace(/\*/g, "\x00S\x00")
      .replace(/\?/g, "\x00Q\x00")
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\x00S\x00/g, ".*")
      .replace(/\x00Q\x00/g, ".");
    return { regex: new RegExp(`^${regexPattern}$`), isFullPath: false };
  }
}

/** Returns compiled regex entries for the given patterns, using a cache to avoid recompilation. */
function getCompiledPatterns(
  patterns: string[]
): { regex: RegExp; isFullPath: boolean }[] {
  // Normalize separators before keying so Windows paths (backslash) and
  // forward-slash paths for the same pattern list share a single cache entry.
  const cacheKey = patterns.map((p) => p.replace(/\\/g, "/")).join("\x00");
  let compiled = excludeRegexCache.get(cacheKey);
  if (!compiled) {
    compiled = patterns.map(compileExcludePattern);
    if (excludeRegexCache.size >= EXCLUDE_CACHE_MAX_SIZE) {
      // Evict the least-recently-used entry (first key in insertion order).
      excludeRegexCache.delete(excludeRegexCache.keys().next().value!);
    }
    excludeRegexCache.set(cacheKey, compiled);
  } else {
    // Refresh LRU order: move this entry to the end.
    excludeRegexCache.delete(cacheKey);
    excludeRegexCache.set(cacheKey, compiled);
  }
  return compiled;
}

export class MetricsCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;
  /**
   * Cache of resolved CodeMetricsConfig objects keyed by workspace folder URI string (or "" for
   * the global scope when there is no workspace folder).
   *
   * `provideCodeLenses` is called on every keystroke, so avoiding repeated `getConfiguration`
   * round-trips — which each make 5 separate VS Code API calls — measurably reduces overhead.
   * The cache is cleared by the configuration change watcher whenever settings change.
   */
  private readonly configCache = new Map<string, CodeMetricsConfig>();

  /**
   * Cache of analysis results keyed by `"<uri>#<languageId>#<version>"`.
   *
   * VS Code calls `provideCodeLenses` on every document change, but the document version
   * increments only when the text actually changes. Caching by URI + language ID + version
   * means that cursor movements, focus switches, and scroll events skip the tree-sitter parse
   * entirely without reusing results after a language mode switch.
   * The cache is bounded to ANALYSIS_CACHE_MAX_SIZE entries (LRU eviction).
   */
  private readonly analysisCache = new Map<string, UnifiedFunctionMetrics[]>();

  /**
   * Cache of per-path exclusion decisions.
   * Key: normalized file path (forward-slash separators). Value: whether the path is excluded.
   * Stable within a session — file paths do not change — so the result of expensive regex
   * matching is computed once per path and reused for every subsequent keystroke on that file.
   * Cleared whenever configuration (and thus exclude patterns) changes.
   * Bounded to EXCLUDE_RESULT_CACHE_MAX_SIZE entries (LRU eviction).
   */
  private readonly excludeResultCache = new Map<string, boolean>();

  /**
   * Cache of rendered CodeLens arrays keyed by `"<analysisKey>#<configKey>"`.
   *
   * `createCodeLenses` allocates a `vscode.Range`, `vscode.Command`, and `vscode.CodeLens`
   * object for every function on every call. When neither the document content nor the
   * workspace-folder config has changed, the rendered output is identical — caching it avoids
   * all those short-lived allocations on cursor movements, scroll events, and focus switches.
   *
   * Invalidated by `clearConfigCache()` (threshold changes alter icon/text) and
   * `clearAnalysisCache()` (language-mode switches). Entries for closed documents are
   * pruned proactively by `pruneAnalysisCacheForDocument()`.
   * Bounded to ANALYSIS_CACHE_MAX_SIZE entries (LRU eviction).
   */
  private readonly codeLensCache = new Map<string, vscode.CodeLens[]>();

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    // Use a per-workspace-folder config cache to avoid repeated VS Code API calls on every keystroke.
    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    const configKey = folder ? folder.uri.toString() : "";
    let config = this.configCache.get(configKey);
    if (!config) {
      config = ConfigurationManager.getConfiguration(document.uri);
      if (this.configCache.size >= CONFIG_CACHE_MAX_SIZE) {
        // Evict the oldest entry in insertion order.
        const oldestKey = this.configCache.keys().next().value;
        if (oldestKey !== undefined) {
          this.configCache.delete(oldestKey);
        }
      }
      this.configCache.set(configKey, config);
    } else {
      // Refresh LRU order: move this entry to the end so it survives the next eviction.
      this.configCache.delete(configKey);
      this.configCache.set(configKey, config);
    }

    if (
      !config.enabled ||
      !config.showCodeLens ||
      !this.isSupported(document)
    ) {
      return [];
    }

    if (this.isExcluded(document.uri.fsPath, config.excludePatterns)) {
      return [];
    }

    // Bail out early if VS Code has already cancelled this request (e.g. the user
    // typed another character while analysis was pending). This avoids wasting a
    // potentially expensive tree-sitter parse whose result would be discarded anyway.
    if (token.isCancellationRequested) {
      return [];
    }

    try {
      const analysisKey = `${document.uri.toString()}#${document.languageId}#${document.version}`;
      let functions = this.analysisCache.get(analysisKey);
      if (!functions) {
        const sourceText = document.getText();
        functions = MetricsAnalyzerFactory.analyzeFile(
          sourceText,
          document.languageId
        );
        if (this.analysisCache.size >= ANALYSIS_CACHE_MAX_SIZE) {
          // Evict the least-recently-used entry (first key in insertion order).
          const oldestKey = this.analysisCache.keys().next().value;
          if (oldestKey !== undefined) {
            this.analysisCache.delete(oldestKey);
          }
        }
        this.analysisCache.set(analysisKey, functions);
      } else {
        // Refresh LRU order.
        this.analysisCache.delete(analysisKey);
        this.analysisCache.set(analysisKey, functions);
      }

      // Return a cached CodeLens array when both the document content and config are unchanged,
      // avoiding per-call allocation of Range/Command/CodeLens objects for every function.
      const codeLensKey = `${analysisKey}#${configKey}`;
      let lenses = this.codeLensCache.get(codeLensKey);
      if (!lenses) {
        lenses = this.createCodeLenses(functions, document, config);
        if (this.codeLensCache.size >= ANALYSIS_CACHE_MAX_SIZE) {
          this.codeLensCache.delete(this.codeLensCache.keys().next().value!);
        }
        this.codeLensCache.set(codeLensKey, lenses);
      } else {
        this.codeLensCache.delete(codeLensKey);
        this.codeLensCache.set(codeLensKey, lenses);
      }
      return lenses;
    } catch (error) {
      console.error("Error creating code lenses:", error);
      return [];
    }
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    _token: vscode.CancellationToken
  ): vscode.CodeLens | Thenable<vscode.CodeLens> {
    // CodeLens is already resolved in provideCodeLenses
    return codeLens;
  }

  private isSupported(document: vscode.TextDocument): boolean {
    return (
      MetricsAnalyzerFactory.isSupportedLanguage(document.languageId) &&
      !document.uri.scheme.startsWith("git")
    );
  }

  private isExcluded(filePath: string, excludePatterns: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, "/");

    // Check the path-level result cache first. `provideCodeLenses` is called on every
    // keystroke; for the same file path the exclusion decision never changes between
    // config changes, so we avoid rerunning regex matching on every event.
    const cached = this.excludeResultCache.get(normalizedPath);
    if (cached !== undefined) {
      // Refresh LRU position so frequently-opened files survive eviction.
      this.excludeResultCache.delete(normalizedPath);
      this.excludeResultCache.set(normalizedPath, cached);
      return cached;
    }

    const compiled = getCompiledPatterns(excludePatterns);
    // Lazily extract the filename the first time a basename-only pattern is encountered.
    // Using lastIndexOf + substring avoids allocating an intermediate array for the common
    // case where all patterns are full-path patterns (the default configuration).
    let filename: string | undefined;
    const result = compiled.some(({ regex, isFullPath }) => {
      if (isFullPath) {
        return regex.test(normalizedPath);
      }
      if (filename === undefined) {
        const sep = normalizedPath.lastIndexOf("/");
        filename = sep === -1 ? normalizedPath : normalizedPath.substring(sep + 1);
      }
      return regex.test(filename);
    });

    // Store result, evicting the oldest entry if the cache is full.
    if (this.excludeResultCache.size >= EXCLUDE_RESULT_CACHE_MAX_SIZE) {
      this.excludeResultCache.delete(
        this.excludeResultCache.keys().next().value!
      );
    }
    this.excludeResultCache.set(normalizedPath, result);
    return result;
  }

  private createCodeLenses(
    functions: UnifiedFunctionMetrics[],
    document: vscode.TextDocument,
    config: CodeMetricsConfig
  ): vscode.CodeLens[] {
    return functions
      .filter((func) => func.complexity > 0)
      .map((func) => this.createCodeLens(func, document, config));
  }

  private createCodeLens(
    func: UnifiedFunctionMetrics,
    document: vscode.TextDocument,
    config: CodeMetricsConfig
  ): vscode.CodeLens {
    const complexity = func.complexity;

    // Create range for the code lens (above the function)
    const line = func.startLine;
    const range = new vscode.Range(line, 0, line, 0);

    // Get status information using the already-resolved config
    const status = ConfigurationManager.getComplexityStatus(
      complexity,
      config
    );

    // Create the code lens title
    const title = `${status.icon} ${status.text} (${complexity})`;

    // Create command to show detailed report for this function
    const command: vscode.Command = {
      title: title,
      command: "cognitiveComplexity.showFunctionDetails",
      arguments: [func, document.uri],
    };

    return new vscode.CodeLens(range, command);
  }

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  public clearConfigCache(): void {
    this.configCache.clear();
    // Exclude patterns are part of config; invalidate path-level exclusion results too.
    this.excludeResultCache.clear();
    // Threshold changes alter icon/text in every CodeLens — discard the rendered cache.
    this.codeLensCache.clear();
  }

  public clearAnalysisCache(): void {
    this.analysisCache.clear();
    this.codeLensCache.clear();
  }

  /**
   * Removes all analysis-cache and codeLens-cache entries whose key starts with the given
   * document URI. Called when a document is closed so stale per-version entries don't
   * occupy memory until the cache fills up and LRU eviction takes over.
   */
  public pruneAnalysisCacheForDocument(uriString: string): void {
    const prefix = `${uriString}#`;
    for (const key of this.analysisCache.keys()) {
      if (key.startsWith(prefix)) {
        this.analysisCache.delete(key);
      }
    }
    for (const key of this.codeLensCache.keys()) {
      if (key.startsWith(prefix)) {
        this.codeLensCache.delete(key);
      }
    }
  }
}

// Register the code lens provider
export function registerCodeLensProvider(): vscode.Disposable {
  const provider = new MetricsCodeLensProvider();

  const languages = MetricsAnalyzerFactory.getSupportedLanguages();
  const disposables: vscode.Disposable[] = [];
  languages.forEach((language) => {
    disposables.push(
      vscode.languages.registerCodeLensProvider({ language }, provider)
    );
  });

  // Refresh code lenses when configuration changes
  const configWatcher = ConfigurationManager.onConfigurationChanged((_e) => {
    excludeRegexCache.clear();
    provider.clearConfigCache();
    setTimeout(() => provider.refresh(), 100);
  });

  // Proactively evict analysis-cache entries for closed documents to reduce memory pressure.
  const closeWatcher = vscode.workspace.onDidCloseTextDocument((doc) => {
    provider.pruneAnalysisCacheForDocument(doc.uri.toString());
  });

  return vscode.Disposable.from(...disposables, configWatcher, closeWatcher);
}
