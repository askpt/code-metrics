import * as vscode from "vscode";
import {
  ComplexityAnalyzerFactory,
  UnifiedFunctionComplexity,
} from "../complexityAnalyzer/complexityAnalyzerFactory";
import {
  ConfigurationManager,
  CognitiveComplexityConfig,
} from "../configuration";

export class ComplexityCodeLensProvider implements vscode.CodeLensProvider {
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
      const functions = ComplexityAnalyzerFactory.analyzeFile(
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
    const supportedLanguages =
      ComplexityAnalyzerFactory.getSupportedLanguages();
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
        // Pattern contains path separators - match against full path
        const regexPattern = normalizedPattern
          .replace(/\*\*/g, "___DOUBLESTAR___") // Temporary placeholder
          .replace(/\*/g, "[^/]*") // Single * matches within directory
          .replace(/___DOUBLESTAR___/g, ".*"); // ** matches across directories

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(normalizedPath);
      } else {
        // Pattern has no path separators - match against filename only
        const filename = normalizedPath.split("/").pop() || "";
        const regexPattern = normalizedPattern.replace(/\*/g, ".*"); // * matches any characters in filename

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(filename);
      }
    });
  }

  private createCodeLenses(
    functions: UnifiedFunctionComplexity[],
    document: vscode.TextDocument,
    config: CognitiveComplexityConfig
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
    func: UnifiedFunctionComplexity,
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
    const title = `${status.icon} ${status.text} (${complexity}%)`;

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
  const provider = new ComplexityCodeLensProvider();

  const languages = ComplexityAnalyzerFactory.getSupportedLanguages();
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
