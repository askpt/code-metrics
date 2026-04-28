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
 */
const excludeRegexCache = new Map<
  string,
  { regex: RegExp; isFullPath: boolean }[]
>();

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
  const cacheKey = patterns.join("\x00");
  let compiled = excludeRegexCache.get(cacheKey);
  if (!compiled) {
    compiled = patterns.map(compileExcludePattern);
    excludeRegexCache.set(cacheKey, compiled);
  }
  return compiled;
}

export class MetricsCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const config = ConfigurationManager.getConfiguration(document.uri);

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

    try {
      const sourceText = document.getText();
      const functions = MetricsAnalyzerFactory.analyzeFile(
        sourceText,
        document.languageId
      );
      return this.createCodeLenses(functions, document, config);
    } catch (error) {
      console.error("Error creating code lenses:", error);
      return [];
    }
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ): vscode.CodeLens | Thenable<vscode.CodeLens> {
    // CodeLens is already resolved in provideCodeLenses
    return codeLens;
  }

  private isSupported(document: vscode.TextDocument): boolean {
    const supportedLanguages = MetricsAnalyzerFactory.getSupportedLanguages();
    return (
      supportedLanguages.includes(document.languageId) &&
      !document.uri.scheme.startsWith("git")
    );
  }

  private isExcluded(filePath: string, excludePatterns: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, "/");
    const compiled = getCompiledPatterns(excludePatterns);
    return compiled.some(({ regex, isFullPath }) => {
      if (isFullPath) {
        return regex.test(normalizedPath);
      } else {
        const filename = normalizedPath.split("/").pop() || "";
        return regex.test(filename);
      }
    });
  }

  private createCodeLenses(
    functions: UnifiedFunctionMetrics[],
    document: vscode.TextDocument,
    config: CodeMetricsConfig
  ): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];

    functions.forEach((func) => {
      // Only show code lens for functions with complexity > 0
      if (func.complexity > 0) {
        const codeLens = this.createCodeLens(func, document);
        if (codeLens) {
          codeLenses.push(codeLens);
        }
      }
    });

    return codeLenses;
  }

  private createCodeLens(
    func: UnifiedFunctionMetrics,
    document: vscode.TextDocument
  ): vscode.CodeLens | undefined {
    const complexity = func.complexity;

    // Create range for the code lens (above the function)
    const line = func.startLine;
    const range = new vscode.Range(line, 0, line, 0);

    // Get status information using configuration manager
    const status = ConfigurationManager.getComplexityStatus(
      complexity,
      document.uri
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
  const configWatcher = ConfigurationManager.onConfigurationChanged((e) => {
    setTimeout(() => provider.refresh(), 100);
  });

  return vscode.Disposable.from(...disposables, configWatcher);
}
