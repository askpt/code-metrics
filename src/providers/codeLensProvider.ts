import * as vscode from "vscode";
import {
  ComplexityAnalyzerFactory,
  UnifiedFunctionComplexity,
} from "../complexityAnalyzer/complexityAnalyzerFactory";

export class ComplexityCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const config = vscode.workspace.getConfiguration("cognitiveComplexity");
    const enabled = config.get<boolean>("enabled", true);
    const showCodeLens = config.get<boolean>("showCodeLens", true);

    if (!enabled || !showCodeLens || !this.isSupported(document)) {
      return [];
    }

    const excludePatterns = config.get<string[]>("excludePatterns", []);
    if (this.isExcluded(document.uri.fsPath, excludePatterns)) {
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
    return excludePatterns.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*")
      );
      return regex.test(filePath);
    });
  }

  private createCodeLenses(
    functions: UnifiedFunctionComplexity[],
    document: vscode.TextDocument,
    config: vscode.WorkspaceConfiguration
  ): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const warningThreshold = config.get<number>("warningThreshold", 10);
    const errorThreshold = config.get<number>("threshold", 15);

    functions.forEach((func) => {
      // Only show code lens for functions with complexity > 0
      if (func.complexity > 0) {
        const codeLens = this.createCodeLens(
          func,
          document,
          warningThreshold,
          errorThreshold
        );
        if (codeLens) {
          codeLenses.push(codeLens);
        }
      }
    });

    return codeLenses;
  }

  private createCodeLens(
    func: UnifiedFunctionComplexity,
    document: vscode.TextDocument,
    warningThreshold: number,
    errorThreshold: number
  ): vscode.CodeLens | undefined {
    const complexity = func.complexity;

    // Create range for the code lens (above the function)
    const line = func.startLine;
    const range = new vscode.Range(line, 0, line, 0);

    // Determine status and icon
    let statusIcon = "";
    let statusText = "";
    if (complexity >= errorThreshold) {
      statusIcon = "🔴";
      statusText = "High Complexity";
    } else if (complexity >= warningThreshold) {
      statusIcon = "🟡";
      statusText = "Moderate Complexity";
    } else {
      statusIcon = "🟢";
      statusText = "Low Complexity";
    }

    // Create the code lens title
    const title = `${statusIcon} ${statusText} (${complexity}%)`;

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
  const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("cognitiveComplexity")) {
      setTimeout(() => provider.refresh(), 100);
    }
  });

  return vscode.Disposable.from(...disposables, configWatcher);
}
