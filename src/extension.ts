import * as vscode from "vscode";
import { registerCodeLensProvider } from "./providers/codeLensProvider";
import { UnifiedFunctionMetrics } from "./metricsAnalyzer/metricsAnalyzerFactory";
import { ConfigurationManager } from "./configuration";

/** Shared output channel for function complexity details (created once, reused). */
let detailsChannel: vscode.OutputChannel | undefined;

/**
 * Formats a cognitive complexity breakdown for a function and writes it to the
 * shared output channel, then reveals the channel to the user.
 */
function showFunctionDetails(
  func?: UnifiedFunctionMetrics,
  uri?: vscode.Uri
): void {
  if (!func) {
    return;
  }

  if (!detailsChannel) {
    detailsChannel = vscode.window.createOutputChannel("Code Metrics Details");
  }

  const config = ConfigurationManager.getConfiguration(uri);
  const status = ConfigurationManager.getComplexityStatus(func.complexity, config);

  detailsChannel.clear();
  detailsChannel.appendLine(`Function: ${func.name}`);
  detailsChannel.appendLine(
    `Cognitive Complexity: ${func.complexity}  ${status.icon} ${status.text}`
  );
  detailsChannel.appendLine(
    `Location: lines ${func.startLine + 1}–${func.endLine + 1}`
  );

  if (func.details.length === 0) {
    detailsChannel.appendLine("\nNo complexity contributors were reported.");
  } else {
    detailsChannel.appendLine("\nComplexity contributors:");
    detailsChannel.appendLine(
      "  Line  │ +Score │ Nesting │ Reason"
    );
    detailsChannel.appendLine(
      "────────┼────────┼─────────┼────────────────────────────────────"
    );
    for (const d of func.details) {
      const line    = String(d.line).padStart(6);
      const inc     = `+${d.increment}`.padStart(6);
      const nesting = String(d.nesting).padStart(7);
      detailsChannel.appendLine(`  ${line}  │ ${inc}  │ ${nesting}  │ ${d.reason}`);
    }
  }

  detailsChannel.show(true /* preserveFocus */);
}

/**
 * Validates the current configuration and, if the thresholds are misconfigured
 * (e.g. warningThreshold >= errorThreshold), surfaces a warning to the user so
 * the issue isn't silently ignored.
 *
 * Exported for unit-testing purposes.
 */
export function checkConfigurationValidity(): void {
  const { valid, warnings } = ConfigurationManager.validateConfiguration();
  if (!valid) {
    vscode.window.showWarningMessage(
      `Code Metrics: invalid configuration detected. ${warnings.join(" ")}`
    );
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("Code Metrics extension is now active!");
  
  // Register command for CodeLens clicks — shows a formatted breakdown in the output channel
  const showFunctionDetailsCommand = vscode.commands.registerCommand(
    "cognitiveComplexity.showFunctionDetails",
    showFunctionDetails
  );

  // Register providers
  const codeLensDisposable = registerCodeLensProvider();

  // Warn the user up front, and again whenever settings change, if thresholds are invalid.
  checkConfigurationValidity();
  const configValidityWatcher = ConfigurationManager.onConfigurationChanged(() => {
    checkConfigurationValidity();
  });

  context.subscriptions.push(
    showFunctionDetailsCommand,
    codeLensDisposable,
    configValidityWatcher
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("Code Metrics extension is now deactivated");
  detailsChannel?.dispose();
  detailsChannel = undefined;
}
