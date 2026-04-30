import * as vscode from "vscode";
import {
  MetricsAnalyzerFactory,
  UnifiedFunctionMetrics,
} from "../metricsAnalyzer/metricsAnalyzerFactory";
import { ConfigurationManager, CodeMetricsConfig } from "../configuration";

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
    // Normalize path separators to forward slashes for consistent matching
    const normalizedPath = filePath.replace(/\\/g, "/");

    return excludePatterns.some((pattern) => {
      // Normalize the pattern to use forward slashes
      const normalizedPattern = pattern.replace(/\\/g, "/");

      // Check if pattern contains path separators
      const hasPathSeparators = normalizedPattern.includes("/");

      if (hasPathSeparators) {
        // Pattern contains path separators - match against full path.
        // Step 1: preserve wildcards as null-byte placeholders so they survive
        //         regex escaping; Step 2: escape regex metacharacters in the
        //         literal portions; Step 3: restore wildcards as regex tokens.
        const regexPattern = normalizedPattern
          .replace(/\*\*/g, "\x00DS\x00") // placeholder for **
          .replace(/\*/g, "\x00S\x00") // placeholder for *
          .replace(/\?/g, "\x00Q\x00") // placeholder for ?
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // escape regex metacharacters
          .replace(/\x00DS\x00/g, ".*") // ** matches across directories
          .replace(/\x00S\x00/g, "[^/]*") // single * matches within directory
          .replace(/\x00Q\x00/g, "[^/]"); // ? matches exactly one non-separator char

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(normalizedPath);
      } else {
        // Pattern has no path separators - match against filename only.
        const filename = normalizedPath.split("/").pop() || "";
        const regexPattern = normalizedPattern
          .replace(/\*/g, "\x00S\x00") // placeholder for *
          .replace(/\?/g, "\x00Q\x00") // placeholder for ?
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // escape regex metacharacters
          .replace(/\x00S\x00/g, ".*") // * matches any characters in filename
          .replace(/\x00Q\x00/g, "."); // ? matches exactly one character in filename

        const regex = new RegExp(`^${regexPattern}$`);
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
