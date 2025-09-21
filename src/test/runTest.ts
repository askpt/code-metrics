/**
 * Custom test runner for better coverage integration with VS Code extension testing
 */

import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionTestsEnv = {
      ...process.env,
      // Add any coverage-specific environment variables here
      NODE_OPTIONS: "--require source-map-support/register",
    };

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      extensionTestsEnv,
      launchArgs: [
        "--disable-extensions",
        "--disable-workspace-trust",
        "--disable-gpu",
        "--no-sandbox",
      ],
    });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
