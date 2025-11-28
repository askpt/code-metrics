// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { registerCodeLensProvider } from "./providers/codeLensProvider";
import { UnifiedFunctionMetrics } from "./metricsAnalyzer/metricsAnalyzerFactory";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("Code Metrics extension is now active!");
  
  // Register command for CodeLens clicks (no-op to suppress errors)
  const showFunctionDetailsCommand = vscode.commands.registerCommand(
    "cognitiveComplexity.showFunctionDetails",
    (func: UnifiedFunctionMetrics, uri: vscode.Uri) => {
      // No-op: Suppress command not found error when CodeLens is clicked
      // Future enhancement: Could show function details in a webview or output channel
      // Parameters received: func (function metrics data), uri (document URI)
    }
  );

  // Register providers
  const codeLensDisposable = registerCodeLensProvider();

  context.subscriptions.push(showFunctionDetailsCommand, codeLensDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("Code Metrics extension is now deactivated");
}
