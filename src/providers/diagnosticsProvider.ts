/**
 * @fileoverview VS Code Diagnostics Provider for Cognitive Complexity
 *
 * This module publishes cognitive complexity scores as VS Code diagnostics,
 * making high-complexity functions visible in the Problems pane and as
 * squiggly underlines in the editor — even when CodeLens is disabled.
 *
 * Severity mapping (using existing thresholds from settings):
 *   complexity >= errorThreshold  → DiagnosticSeverity.Error
 *   complexity >= warningThreshold → DiagnosticSeverity.Warning
 *   (functions below warningThreshold are not reported)
 *
 * The provider listens to document open/change/close events and updates
 * diagnostics incrementally so that analysis always reflects the current
 * editor state without requiring a full workspace scan.
 */

import * as vscode from "vscode";
import { MetricsAnalyzerFactory } from "../metricsAnalyzer/metricsAnalyzerFactory";
import { ConfigurationManager } from "../configuration";

/**
 * Provides cognitive complexity diagnostics for open text documents.
 *
 * Diagnostics are refreshed whenever a supported document is opened or
 * modified, and cleared when the document is closed.  Configuration changes
 * (threshold updates, enable/disable) trigger a full refresh of all
 * currently tracked documents.
 */
export class ComplexityDiagnosticsProvider {
  /** Diagnostic collection that backs the Problems pane entries. */
  private readonly collection: vscode.DiagnosticCollection;

  /** URIs of all open documents that currently have diagnostics entries. */
  private readonly trackedUris = new Set<string>();

  constructor(collection: vscode.DiagnosticCollection) {
    this.collection = collection;
  }

  /**
   * Analyses the given document and publishes diagnostics for all functions
   * whose cognitive complexity meets or exceeds the configured warning threshold.
   * Does nothing if the extension is disabled or the language is unsupported.
   *
   * @param document - The VS Code text document to analyse
   */
  public updateDiagnostics(document: vscode.TextDocument): void {
    if (document.uri.scheme === "output") {
      return;
    }

    const config = ConfigurationManager.getConfiguration(document.uri);

    if (!config.enabled || !MetricsAnalyzerFactory.isSupportedLanguage(document.languageId)) {
      this.collection.delete(document.uri);
      this.trackedUris.delete(document.uri.toString());
      return;
    }

    const functions = MetricsAnalyzerFactory.analyzeFile(
      document.getText(),
      document.languageId
    );

    const diagnostics: vscode.Diagnostic[] = [];

    for (const func of functions) {
      if (func.complexity < config.warningThreshold) {
        continue;
      }

      const severity =
        func.complexity >= config.errorThreshold
          ? vscode.DiagnosticSeverity.Error
          : vscode.DiagnosticSeverity.Warning;

      const range = new vscode.Range(
        func.startLine,
        func.startColumn,
        func.startLine,
        func.startColumn
      );

      const message =
        `Cognitive complexity of ${func.name} is ${func.complexity}` +
        (severity === vscode.DiagnosticSeverity.Error
          ? ` (exceeds error threshold of ${config.errorThreshold})`
          : ` (exceeds warning threshold of ${config.warningThreshold})`);

      const diagnostic = new vscode.Diagnostic(range, message, severity);
      diagnostic.source = "code-metrics";
      diagnostic.code = "cognitive-complexity";
      diagnostics.push(diagnostic);
    }

    this.collection.set(document.uri, diagnostics);
    this.trackedUris.add(document.uri.toString());
  }

  /**
   * Clears diagnostics for the given document and stops tracking it.
   *
   * @param uri - The URI of the document whose diagnostics should be removed
   */
  public clearDiagnostics(uri: vscode.Uri): void {
    this.collection.delete(uri);
    this.trackedUris.delete(uri.toString());
  }

  /**
   * Re-analyses all currently tracked documents.
   * Called when configuration changes so diagnostics reflect the new thresholds.
   */
  public refreshAll(): void {
    for (const doc of vscode.workspace.textDocuments) {
      if (this.trackedUris.has(doc.uri.toString())) {
        this.updateDiagnostics(doc);
      }
    }
  }

  /** Disposes the underlying diagnostic collection. */
  public dispose(): void {
    this.collection.dispose();
  }
}

/**
 * Registers the complexity diagnostics provider and wires up all document
 * lifecycle listeners.  Returns a `vscode.Disposable` that tears everything
 * down when the extension deactivates.
 *
 * @param context - The extension context used to track subscriptions
 * @returns A disposable that cleans up all registered listeners and the
 *          diagnostic collection
 */
export function registerDiagnosticsProvider(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const collection = vscode.languages.createDiagnosticCollection("code-metrics");
  const provider = new ComplexityDiagnosticsProvider(collection);

  // Analyse all already-open documents on activation.
  for (const doc of vscode.workspace.textDocuments) {
    provider.updateDiagnostics(doc);
  }

  const disposables: vscode.Disposable[] = [collection];

  disposables.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      provider.updateDiagnostics(doc);
    })
  );

  disposables.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      provider.updateDiagnostics(e.document);
    })
  );

  disposables.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      provider.clearDiagnostics(doc.uri);
    })
  );

  // Re-publish diagnostics when thresholds or enable flag change.
  disposables.push(
    ConfigurationManager.onConfigurationChanged(() => {
      provider.refreshAll();
    })
  );

  context.subscriptions.push(...disposables);

  return vscode.Disposable.from(...disposables);
}
