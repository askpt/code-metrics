/**
 * @fileoverview Tests for Configuration Management
 *
 * This file contains unit tests for the configuration management system,
 * ensuring that configuration values are properly loaded, validated,
 * and used throughout the extension.
 */

import * as assert from "assert";
import * as vscode from "vscode";
import {
  ConfigurationManager,
  CodeMetricsConfig,
  DEFAULT_CONFIG,
} from "../configuration";

suite("ConfigurationManager Tests", () => {
  teardown(async () => {
    // Reset configuration to defaults after each test
    const config = vscode.workspace.getConfiguration("codeMetrics");
    await config.update(
      "enabled",
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "warningThreshold",
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "errorThreshold",
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "showCodeLens",
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "excludePatterns",
      undefined,
      vscode.ConfigurationTarget.Global
    );
  });

  test("should return default configuration when no custom values are set", () => {
    const config = ConfigurationManager.getConfiguration();

    assert.strictEqual(config.enabled, DEFAULT_CONFIG.enabled);
    assert.strictEqual(config.showCodeLens, DEFAULT_CONFIG.showCodeLens);
    assert.strictEqual(
      config.warningThreshold,
      DEFAULT_CONFIG.warningThreshold
    );
    assert.strictEqual(config.errorThreshold, DEFAULT_CONFIG.errorThreshold);
    assert.deepStrictEqual(
      config.excludePatterns,
      DEFAULT_CONFIG.excludePatterns
    );
  });

  test("should return custom configuration values when set", async () => {
    const vsConfig = vscode.workspace.getConfiguration("codeMetrics");

    // Set custom values
    await vsConfig.update("enabled", false, vscode.ConfigurationTarget.Global);
    await vsConfig.update(
      "warningThreshold",
      5,
      vscode.ConfigurationTarget.Global
    );
    await vsConfig.update(
      "errorThreshold",
      20,
      vscode.ConfigurationTarget.Global
    );
    await vsConfig.update(
      "showCodeLens",
      false,
      vscode.ConfigurationTarget.Global
    );

    const config = ConfigurationManager.getConfiguration();

    assert.strictEqual(config.enabled, false);
    assert.strictEqual(config.warningThreshold, 5);
    assert.strictEqual(config.errorThreshold, 20);
    assert.strictEqual(config.showCodeLens, false);
  });

  test("should return individual configuration values correctly", async () => {
    const vsConfig = vscode.workspace.getConfiguration("codeMetrics");
    await vsConfig.update(
      "warningThreshold",
      8,
      vscode.ConfigurationTarget.Global
    );

    const warningThreshold = ConfigurationManager.get("warningThreshold");
    const enabled = ConfigurationManager.get("enabled");

    assert.strictEqual(warningThreshold, 8);
    assert.strictEqual(enabled, DEFAULT_CONFIG.enabled);
  });

  test("should report enabled status correctly", async () => {
    // Test default (enabled)
    assert.strictEqual(ConfigurationManager.isEnabled(), true);

    // Test when disabled
    const vsConfig = vscode.workspace.getConfiguration("codeMetrics");
    await vsConfig.update("enabled", false, vscode.ConfigurationTarget.Global);
    assert.strictEqual(ConfigurationManager.isEnabled(), false);
  });

  test("should return correct complexity status for different values", () => {
    // Test with default thresholds (warning: 10, error: 15)

    // Low complexity
    const lowStatus = ConfigurationManager.getComplexityStatus(5);
    assert.strictEqual(lowStatus.level, "low");
    assert.strictEqual(lowStatus.icon, "🟢");
    assert.strictEqual(lowStatus.text, "Low Complexity");

    // Warning complexity
    const warningStatus = ConfigurationManager.getComplexityStatus(10);
    assert.strictEqual(warningStatus.level, "warning");
    assert.strictEqual(warningStatus.icon, "🟡");
    assert.strictEqual(warningStatus.text, "Moderate Complexity");

    // Error complexity
    const errorStatus = ConfigurationManager.getComplexityStatus(15);
    assert.strictEqual(errorStatus.level, "error");
    assert.strictEqual(errorStatus.icon, "🔴");
    assert.strictEqual(errorStatus.text, "High Complexity");
  });

  test("should return correct complexity status with custom thresholds", async () => {
    const vsConfig = vscode.workspace.getConfiguration("codeMetrics");
    await vsConfig.update(
      "warningThreshold",
      5,
      vscode.ConfigurationTarget.Global
    );
    await vsConfig.update(
      "errorThreshold",
      10,
      vscode.ConfigurationTarget.Global
    );

    // Test with custom thresholds
    const lowStatus = ConfigurationManager.getComplexityStatus(3);
    assert.strictEqual(lowStatus.level, "low");

    const warningStatus = ConfigurationManager.getComplexityStatus(7);
    assert.strictEqual(warningStatus.level, "warning");

    const errorStatus = ConfigurationManager.getComplexityStatus(12);
    assert.strictEqual(errorStatus.level, "error");
  });

  test("should validate configuration correctly", () => {
    // Test valid configuration (default)
    const validResult = ConfigurationManager.validateConfiguration();
    assert.strictEqual(validResult.valid, true);
    assert.strictEqual(validResult.warnings.length, 0);
  });

  test("should detect invalid threshold configuration", async () => {
    const vsConfig = vscode.workspace.getConfiguration("codeMetrics");

    // Set invalid thresholds (warning >= error)
    await vsConfig.update(
      "warningThreshold",
      15,
      vscode.ConfigurationTarget.Global
    );
    await vsConfig.update(
      "errorThreshold",
      10,
      vscode.ConfigurationTarget.Global
    );

    const validationResult = ConfigurationManager.validateConfiguration();
    assert.strictEqual(validationResult.valid, false);
    assert.strictEqual(validationResult.warnings.length, 1);
    assert.ok(validationResult.warnings[0].includes("Warning threshold"));
  });

  test("should create configuration change watcher", () => {
    let changeEventFired = false;

    const watcher = ConfigurationManager.onConfigurationChanged(
      (e: vscode.ConfigurationChangeEvent) => {
        changeEventFired = true;
      }
    );

    // Verify watcher is created
    assert.ok(watcher);
    assert.strictEqual(typeof watcher.dispose, "function");

    // Clean up
    watcher.dispose();
  });

  test("should handle edge cases gracefully", () => {
    // Test boundary values
    const boundaryTests = [
      { complexity: 0, expectedLevel: "low" },
      { complexity: 9, expectedLevel: "low" },
      { complexity: 10, expectedLevel: "warning" },
      { complexity: 14, expectedLevel: "warning" },
      { complexity: 15, expectedLevel: "error" },
      { complexity: 100, expectedLevel: "error" },
    ];

    boundaryTests.forEach(({ complexity, expectedLevel }) => {
      const status = ConfigurationManager.getComplexityStatus(complexity);
      assert.strictEqual(
        status.level,
        expectedLevel,
        `Complexity ${complexity} should be ${expectedLevel}, got ${status.level}`
      );
    });
  });

  test("should handle missing configuration gracefully", () => {
    // This tests the fallback to default values when configuration is missing
    const config = ConfigurationManager.getConfiguration();

    // All values should be defined
    assert.ok(config.enabled !== undefined);
    assert.ok(config.showCodeLens !== undefined);
    assert.ok(config.warningThreshold !== undefined);
    assert.ok(config.errorThreshold !== undefined);
    assert.ok(config.excludePatterns !== undefined);
  });
});
