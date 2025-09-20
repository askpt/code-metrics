/**
 * @fileoverview Configuration Management Module
 *
 * This module provides a centralized way to access VS Code configuration settings
 * for the code metrics extension. It ensures type safety and provides
 * default values for all configuration options.
 */

import * as vscode from "vscode";

/**
 * Interface defining all configuration options for the code metrics extension.
 * This interface ensures type safety when accessing configuration values.
 */
export interface CodeMetricsConfig {
  /** Whether the extension is enabled */
  enabled: boolean;
  /** Whether to show CodeLens above functions */
  showCodeLens: boolean;
  /** Complexity threshold for warning status (yellow indicator) */
  warningThreshold: number;
  /** Complexity threshold for error status (red indicator) */
  errorThreshold: number;
  /** Glob patterns for files to exclude from analysis */
  excludePatterns: string[];
}

/**
 * Default configuration values used when user hasn't specified custom values.
 */
export const DEFAULT_CONFIG: CodeMetricsConfig = {
  enabled: true,
  showCodeLens: true,
  warningThreshold: 10,
  errorThreshold: 15,
  excludePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/out/**",
    "**/*.min.js",
    "**/*.spec.*",
    "**/*.test.*",
  ],
};

/**
 * Configuration manager class that provides typed access to extension settings.
 * This class centralizes configuration access and ensures consistent behavior
 * throughout the extension.
 */
export class ConfigurationManager {
  private static readonly CONFIG_SECTION = "codeMetrics";

  /**
   * Gets the current configuration with all values resolved to their actual or default values.
   *
   * @param resource - Optional URI for workspace-specific configuration
   * @returns Complete configuration object with all values
   */
  public static getConfiguration(resource?: vscode.Uri): CodeMetricsConfig {
    const config = vscode.workspace.getConfiguration(
      this.CONFIG_SECTION,
      resource
    );

    return {
      enabled: config.get<boolean>("enabled", DEFAULT_CONFIG.enabled),
      showCodeLens: config.get<boolean>(
        "showCodeLens",
        DEFAULT_CONFIG.showCodeLens
      ),
      warningThreshold: config.get<number>(
        "warningThreshold",
        DEFAULT_CONFIG.warningThreshold
      ),
      errorThreshold: config.get<number>(
        "errorThreshold",
        DEFAULT_CONFIG.errorThreshold
      ),
      excludePatterns: config.get<string[]>(
        "excludePatterns",
        DEFAULT_CONFIG.excludePatterns
      ),
    };
  }

  /**
   * Gets a specific configuration value with type safety.
   *
   * @param key - The configuration key to retrieve
   * @param resource - Optional URI for workspace-specific configuration
   * @returns The configuration value or its default
   */
  public static get<K extends keyof CodeMetricsConfig>(
    key: K,
    resource?: vscode.Uri
  ): CodeMetricsConfig[K] {
    const config = vscode.workspace.getConfiguration(
      this.CONFIG_SECTION,
      resource
    );
    return config.get<CodeMetricsConfig[K]>(key, DEFAULT_CONFIG[key]);
  }

  /**
   * Checks if the extension is enabled for the given resource.
   *
   * @param resource - Optional URI for workspace-specific configuration
   * @returns true if the extension is enabled
   */
  public static isEnabled(resource?: vscode.Uri): boolean {
    return this.get("enabled", resource);
  }

  /**
   * Gets the complexity status for a given complexity score.
   *
   * @param complexity - The complexity score to evaluate
   * @param resource - Optional URI for workspace-specific configuration
   * @returns Object containing status information
   */
  public static getComplexityStatus(
    complexity: number,
    resource?: vscode.Uri
  ): {
    level: "low" | "warning" | "error";
    icon: string;
    text: string;
  } {
    const config = this.getConfiguration(resource);

    if (complexity >= config.errorThreshold) {
      return {
        level: "error",
        icon: "🔴",
        text: "High Complexity",
      };
    } else if (complexity >= config.warningThreshold) {
      return {
        level: "warning",
        icon: "🟡",
        text: "Moderate Complexity",
      };
    } else {
      return {
        level: "low",
        icon: "🟢",
        text: "Low Complexity",
      };
    }
  }

  /**
   * Validates that thresholds are properly configured (warning < error).
   *
   * @param resource - Optional URI for workspace-specific configuration
   * @returns Object with validation results
   */
  public static validateConfiguration(resource?: vscode.Uri): {
    valid: boolean;
    warnings: string[];
  } {
    const config = this.getConfiguration(resource);
    const warnings: string[] = [];

    // Check that warning threshold is less than error threshold
    if (config.warningThreshold >= config.errorThreshold) {
      warnings.push(
        `Warning threshold (${config.warningThreshold}) should be less than error threshold (${config.errorThreshold})`
      );
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Creates a file watcher that fires when configuration changes.
   *
   * @param callback - Function to call when configuration changes
   * @returns Disposable that can be used to stop watching
   */
  public static onConfigurationChanged(
    callback: (e: vscode.ConfigurationChangeEvent) => void
  ): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(this.CONFIG_SECTION)) {
        callback(e);
      }
    });
  }

  /**
   * Logs the current configuration to the console for debugging purposes.
   *
   * @param resource - Optional URI for workspace-specific configuration
   */
  public static logCurrentConfiguration(resource?: vscode.Uri): void {
    const config = this.getConfiguration(resource);
    const validation = this.validateConfiguration(resource);

    console.log("Current Code Metrics Configuration:", {
      config,
      validation,
    });
  }
}
