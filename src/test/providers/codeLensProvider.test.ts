import * as assert from "assert";
import * as vscode from "vscode";
import { ComplexityCodeLensProvider } from "../../providers/codeLensProvider";
import { ConfigurationManager } from "../../configuration";
import { UnifiedFunctionComplexity } from "../../complexityAnalyzer/complexityAnalyzerFactory";

suite("Complexity Code Lens Provider Tests", () => {
  let provider: ComplexityCodeLensProvider;
  let mockDocument: vscode.TextDocument;
  let mockToken: vscode.CancellationToken;

  setup(() => {
    provider = new ComplexityCodeLensProvider();
    mockToken = new vscode.CancellationTokenSource().token;
  });

  suite("Provider Configuration", () => {
    test("should use configuration manager for settings", async () => {
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void Method() {
                        if (true) return;
                    }
                }
            `
      );

      // Test that the provider respects the configuration
      const originalGetConfiguration = ConfigurationManager.getConfiguration;
      ConfigurationManager.getConfiguration = () => ({
        enabled: false,
        showCodeLens: true,
        warningThreshold: 10,
        errorThreshold: 15,
        excludePatterns: [],
      });

      const result = await provider.provideCodeLenses(mockDocument, mockToken);
      assert.strictEqual(
        result.length,
        0,
        "Should return empty array when disabled"
      );

      // Restore original function
      ConfigurationManager.getConfiguration = originalGetConfiguration;
    });

    test("should use custom thresholds from configuration", async () => {
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void Method() {
                        if (true) {
                          if (false) {
                            return;
                          }
                        }
                    }
                }
            `
      );

      // Mock configuration with low thresholds
      const originalGetConfiguration = ConfigurationManager.getConfiguration;
      const originalGetComplexityStatus =
        ConfigurationManager.getComplexityStatus;

      ConfigurationManager.getConfiguration = () => ({
        enabled: true,
        showCodeLens: true,
        warningThreshold: 1,
        errorThreshold: 2,
        excludePatterns: [],
      });

      ConfigurationManager.getComplexityStatus = (complexity: number) => {
        if (complexity >= 2) {
          return {
            level: "error" as const,
            icon: "🔴",
            text: "High Complexity",
          };
        } else if (complexity >= 1) {
          return {
            level: "warning" as const,
            icon: "🟡",
            text: "Moderate Complexity",
          };
        }
        return { level: "low" as const, icon: "🟢", text: "Low Complexity" };
      };

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.strictEqual(result.length, 1);
      const codeLens = result[0];
      assert.ok(codeLens.command);

      // With nested if statements, complexity should be >= 2, so should show error status
      const title = codeLens.command!.title;
      assert.ok(
        title.includes("🔴") || title.includes("🟡"),
        `Title should contain status icon: ${title}`
      );

      // Restore original functions
      ConfigurationManager.getConfiguration = originalGetConfiguration;
      ConfigurationManager.getComplexityStatus = originalGetComplexityStatus;
    });
    test("should not provide code lenses when extension is disabled", async () => {
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void Method() {
                        if (true) return;
                    }
                }
            `
      );

      // Mock configuration where extension is disabled
      const mockConfig = createMockConfiguration({
        enabled: false,
        showCodeLens: true,
        excludePatterns: [],
        warningThreshold: 10,
        threshold: 15,
      });

      // Stub workspace.getConfiguration
      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.strictEqual(result.length, 0);

      // Restore original function
      vscode.workspace.getConfiguration = originalGetConfig;
    });

    test("should not provide code lenses when showCodeLens is disabled", async () => {
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void Method() {
                        if (true) return;
                    }
                }
            `
      );

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: false,
        excludePatterns: [],
        warningThreshold: 10,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.strictEqual(result.length, 0);

      vscode.workspace.getConfiguration = originalGetConfig;
    });

    test("should not provide code lenses for unsupported languages", async () => {
      mockDocument = createMockDocument(
        "python",
        `
                def hello_world():
                    print("Hello, World!")
            `
      );

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: true,
        excludePatterns: [],
        warningThreshold: 10,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.strictEqual(result.length, 0);

      vscode.workspace.getConfiguration = originalGetConfig;
    });

    test("should not provide code lenses for git schemes", async () => {
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void Method() {
                        if (true) return;
                    }
                }
            `,
        "git:/path/to/file.cs"
      );

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: true,
        excludePatterns: [],
        warningThreshold: 10,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.strictEqual(result.length, 0);

      vscode.workspace.getConfiguration = originalGetConfig;
    });
  });

  suite("Exclude Patterns", () => {
    test("should exclude files matching exclude patterns", async () => {
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void Method() {
                        if (true) return;
                    }
                }
            `,
        "/path/to/test.generated.cs"
      );

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: true,
        excludePatterns: ["*.generated.*", "**/bin/**"],
        warningThreshold: 10,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.strictEqual(result.length, 0);

      vscode.workspace.getConfiguration = originalGetConfig;
    });

    test("should not exclude files that do not match exclude patterns", async () => {
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void Method() {
                        if (true) return;
                    }
                }
            `,
        "/path/to/test.cs"
      );

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: true,
        excludePatterns: ["*.generated.*", "**/bin/**"],
        warningThreshold: 10,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.ok(result.length > 0);

      vscode.workspace.getConfiguration = originalGetConfig;
    });

    test("should handle wildcard patterns correctly", async () => {
      const testCases = [
        {
          pattern: "*.generated.*",
          path: "/path/test.generated.cs",
          shouldExclude: true,
        },
        {
          pattern: "*.generated.*",
          path: "/path/test.cs",
          shouldExclude: false,
        },
        {
          pattern: "**/bin/**",
          path: "/project/bin/debug/test.cs",
          shouldExclude: true,
        },
        {
          pattern: "**/bin/**",
          path: "/project/src/test.cs",
          shouldExclude: false,
        },
        { pattern: "test*", path: "/path/test.cs", shouldExclude: true },
        { pattern: "test*", path: "/path/src.cs", shouldExclude: false },
      ];

      for (const testCase of testCases) {
        mockDocument = createMockDocument(
          "csharp",
          `
                    public class Test {
                        public void Method() {
                            if (true) return;
                        }
                    }
                `,
          testCase.path
        );

        const mockConfig = createMockConfiguration({
          enabled: true,
          showCodeLens: true,
          excludePatterns: [testCase.pattern],
          warningThreshold: 10,
          threshold: 15,
        });

        const originalGetConfig = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => mockConfig;

        const result = await provider.provideCodeLenses(
          mockDocument,
          mockToken
        );

        if (testCase.shouldExclude) {
          assert.strictEqual(
            result.length,
            0,
            `Pattern ${testCase.pattern} should exclude ${testCase.path}`
          );
        } else {
          assert.ok(
            result.length > 0,
            `Pattern ${testCase.pattern} should not exclude ${testCase.path}`
          );
        }

        vscode.workspace.getConfiguration = originalGetConfig;
      }
    });
  });

  suite("Code Lens Generation", () => {
    test("should create code lens for functions with complexity > 0", async () => {
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void SimpleMethod() {
                        return;
                    }

                    public void ComplexMethod() {
                        if (true) {
                            return;
                        }
                    }
                }
            `
      );

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: true,
        excludePatterns: [],
        warningThreshold: 10,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      // Should only create code lens for the complex method (complexity > 0)
      assert.strictEqual(result.length, 1);
      assert.ok(result[0].command);
      assert.ok(result[0].command!.title.includes("🟢"));
      assert.ok(result[0].command!.title.includes("(1%)"));

      vscode.workspace.getConfiguration = originalGetConfig;
    });

    test("should create code lens with correct complexity levels", async () => {
      // Create a method with moderate complexity (>= warning threshold)
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void ModerateMethod() {
                        if (true) {
                            for (int i = 0; i < 10; i++) {
                                if (i % 2 == 0) {
                                    while (true) {
                                        if (i > 5) {
                                            try {
                                                // complex logic
                                            }
                                            catch (Exception ex) {
                                                if (ex.Message.Length > 0 && ex.Data.Count > 0) {
                                                    throw;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `
      );

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: true,
        excludePatterns: [],
        warningThreshold: 5,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.strictEqual(result.length, 1);
      const codeLens = result[0];

      assert.ok(codeLens.command);
      const title = codeLens.command!.title;

      // Should show yellow icon for moderate complexity
      assert.ok(title.includes("🟡") || title.includes("🔴")); // Could be high complexity
      assert.ok(title.includes("Complexity"));

      vscode.workspace.getConfiguration = originalGetConfig;
    });

    test("should set correct command for code lens", async () => {
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void Method() {
                        if (true) return;
                    }
                }
            `
      );

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: true,
        excludePatterns: [],
        warningThreshold: 10,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.strictEqual(result.length, 1);
      const codeLens = result[0];

      assert.ok(codeLens.command);
      assert.strictEqual(
        codeLens.command!.command,
        "cognitiveComplexity.showFunctionDetails"
      );
      assert.ok(Array.isArray(codeLens.command!.arguments));
      assert.strictEqual(codeLens.command!.arguments!.length, 2);

      // First argument should be function complexity data
      const functionData = codeLens.command!.arguments![0];
      assert.ok(typeof functionData === "object");
      assert.ok("name" in functionData);
      assert.ok("complexity" in functionData);

      // Second argument should be document URI
      const documentUri = codeLens.command!.arguments![1];
      assert.strictEqual(documentUri, mockDocument.uri);

      vscode.workspace.getConfiguration = originalGetConfig;
    });

    test("should position code lens correctly", async () => {
      const sourceCode = `public class Test {
    public void FirstMethod() {
        if (true) return;
    }

    public void SecondMethod() {
        while (false) break;
    }
}`;

      mockDocument = createMockDocument("csharp", sourceCode);

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: true,
        excludePatterns: [],
        warningThreshold: 10,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.strictEqual(result.length, 2);

      // Verify ranges are on function declaration lines
      result.forEach((codeLens) => {
        assert.ok(codeLens.range instanceof vscode.Range);
        assert.strictEqual(codeLens.range.start.character, 0);
        assert.strictEqual(codeLens.range.end.character, 0);
        assert.strictEqual(codeLens.range.start.line, codeLens.range.end.line);
      });

      // First code lens should be before second
      assert.ok(result[0].range.start.line < result[1].range.start.line);

      vscode.workspace.getConfiguration = originalGetConfig;
    });
  });

  suite("Error Handling", () => {
    test("should handle analyzer errors gracefully", async () => {
      // Create malformed C# code that might cause parsing errors
      mockDocument = createMockDocument(
        "csharp",
        `
                public class Test {
                    public void Method() {
                        if (true {  // Missing closing parenthesis
                            return;
                        }
                    }
                }
            `
      );

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: true,
        excludePatterns: [],
        warningThreshold: 10,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      // Should not throw an exception
      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      // Should return empty array on error
      assert.ok(Array.isArray(result));

      vscode.workspace.getConfiguration = originalGetConfig;
    });

    test("should handle empty document", async () => {
      mockDocument = createMockDocument("csharp", "");

      const mockConfig = createMockConfiguration({
        enabled: true,
        showCodeLens: true,
        excludePatterns: [],
        warningThreshold: 10,
        threshold: 15,
      });

      const originalGetConfig = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () => mockConfig;

      const result = await provider.provideCodeLenses(mockDocument, mockToken);

      assert.strictEqual(result.length, 0);

      vscode.workspace.getConfiguration = originalGetConfig;
    });
  });

  suite("Code Lens Resolution", () => {
    test("should return code lens as-is in resolveCodeLens", async () => {
      const mockCodeLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 0));
      mockCodeLens.command = {
        title: "Test Command",
        command: "test.command",
      };

      const result = provider.resolveCodeLens(mockCodeLens, mockToken);

      // Should return the same code lens (synchronous)
      assert.strictEqual(result, mockCodeLens);
    });
  });

  suite("Provider Refresh", () => {
    test("should trigger onDidChangeCodeLenses event when refresh is called", () => {
      let eventFired = false;

      const disposable = provider.onDidChangeCodeLenses(() => {
        eventFired = true;
      });

      provider.refresh();

      assert.strictEqual(eventFired, true);

      disposable.dispose();
    });
  });

  // Helper functions for creating mock objects
  function createMockDocument(
    languageId: string,
    text: string,
    fsPath?: string
  ): vscode.TextDocument {
    const lines = text.split("\n");

    const offsetAt = (position: vscode.Position): number => {
      let offset = 0;
      for (let i = 0; i < position.line; i++) {
        offset += lines[i].length + 1; // +1 for newline
      }
      return offset + position.character;
    };

    const mockDoc = {
      uri: vscode.Uri.file(fsPath || "/test/file.cs"),
      fileName: fsPath || "/test/file.cs",
      isUntitled: false,
      languageId: languageId,
      version: 1,
      isDirty: false,
      isClosed: false,
      save: async () => false,
      eol: vscode.EndOfLine.LF,
      encoding: "utf8",
      notebook: undefined,
      lineCount: lines.length,
      lineAt: ((lineOrPosition: number | vscode.Position) => {
        const lineNumber =
          typeof lineOrPosition === "number"
            ? lineOrPosition
            : lineOrPosition.line;
        const lineText = lines[lineNumber] || "";
        return {
          lineNumber,
          text: lineText,
          range: new vscode.Range(lineNumber, 0, lineNumber, lineText.length),
          rangeIncludingLineBreak: new vscode.Range(
            lineNumber,
            0,
            lineNumber + 1,
            0
          ),
          firstNonWhitespaceCharacterIndex: lineText.search(/\S/),
          isEmptyOrWhitespace: lineText.trim().length === 0,
        };
      }) as vscode.TextDocument["lineAt"],
      offsetAt,
      positionAt: (offset: number) => {
        let currentOffset = 0;
        for (let i = 0; i < lines.length; i++) {
          if (currentOffset + lines[i].length >= offset) {
            return new vscode.Position(i, offset - currentOffset);
          }
          currentOffset += lines[i].length + 1; // +1 for newline
        }
        return new vscode.Position(0, 0);
      },
      getText: (range?: vscode.Range) => {
        if (!range) {
          return text;
        }
        const startOffset = offsetAt(range.start);
        const endOffset = offsetAt(range.end);
        return text.substring(startOffset, endOffset);
      },
      getWordRangeAtPosition: (position: vscode.Position) =>
        new vscode.Range(position, position),
      validateRange: (range: vscode.Range) => range,
      validatePosition: (position: vscode.Position) => position,
    };

    return mockDoc as vscode.TextDocument;
  }

  function createMockConfiguration(
    values: Record<string, any>
  ): vscode.WorkspaceConfiguration {
    return {
      get: <T>(section: string, defaultValue?: T) => {
        return values[section] ?? defaultValue;
      },
      has: (section: string) => section in values,
      inspect: () => undefined,
      update: async () => {},
      readonly: false,
    } as vscode.WorkspaceConfiguration;
  }
});
