/**
 * @fileoverview Tests for Extension Activation
 *
 * This file contains unit tests for the extension activation,
 * ensuring that commands are properly registered.
 */

import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Activation Tests", () => {
  // Ensure extension is activated before running tests
  suiteSetup(async () => {
    // Get the extension
    const extension = vscode.extensions.getExtension("dev-asilva.code-metrics");
    
    if (extension) {
      // Activate the extension if it's not already active
      if (!extension.isActive) {
        await extension.activate();
      }
    }
  });

  test("should register cognitiveComplexity.showFunctionDetails command", async () => {
    // Get all registered commands
    const commands = await vscode.commands.getCommands(true);

    // Verify that our command is registered
    assert.ok(
      commands.includes("cognitiveComplexity.showFunctionDetails"),
      "Command cognitiveComplexity.showFunctionDetails should be registered"
    );
  });

  test("should execute cognitiveComplexity.showFunctionDetails command without errors", async () => {
    // This should not throw an error
    try {
      await vscode.commands.executeCommand(
        "cognitiveComplexity.showFunctionDetails"
      );
      // If we reach here, the command executed successfully (even if it's a no-op)
      assert.ok(true, "Command executed without errors");
    } catch (error) {
      assert.fail(
        `Command execution should not throw errors, but got: ${error}`
      );
    }
  });

  test("should execute cognitiveComplexity.showFunctionDetails command with arguments", async () => {
    // Test with function complexity data and URI (like the CodeLens provider would call it)
    const mockFunctionData: import("../metricsAnalyzer/metricsAnalyzerFactory").UnifiedFunctionMetrics = {
      name: "TestFunction",
      complexity: 5,
      details: [],
      startLine: 10,
      endLine: 20,
      startColumn: 0,
      endColumn: 50,
    };

    const mockUri = vscode.Uri.file("/test/file.cs");

    try {
      await vscode.commands.executeCommand(
        "cognitiveComplexity.showFunctionDetails",
        mockFunctionData,
        mockUri
      );
      // If we reach here, the command executed successfully
      assert.ok(true, "Command executed with arguments without errors");
    } catch (error) {
      assert.fail(
        `Command execution with arguments should not throw errors, but got: ${error}`
      );
    }
  });
});
