/**
 * @fileoverview Metrics Analyzer Factory and Interfaces
 *
 * This module provides the core abstractions and factory pattern implementation
 * for analyzing code metrics across multiple programming languages.
 *
 * The module defines:
 * - UnifiedMetricsDetail: Individual complexity contributors
 * - UnifiedFunctionMetrics: Complete function analysis results
 * - MetricsAnalyzerFactory: Main entry point for metrics analysis
 *
 * The factory pattern allows for easy extension to support additional programming
 * languages while maintaining a consistent API for consumers.
 *
 */

/**
 * Represents a single complexity detail for a specific code construct.
 * Each detail contributes to the overall complexity of a function.
 */
export interface UnifiedMetricsDetail {
  /** The complexity increment this detail adds to the total complexity */
  increment: number;
  /** Human-readable explanation of why this construct increases complexity */
  reason: string;
  /** Line number where this complexity-contributing construct is located (1-based) */
  line: number;
  /** Column number where this complexity-contributing construct starts (0-based) */
  column: number;
  /** Nesting level of this construct (0 for top-level) */
  nesting: number;
}

/**
 * Represents the complete metrics analysis results for a single function.
 * Includes the overall complexity score and detailed breakdown of contributing factors.
 */
export interface UnifiedFunctionMetrics {
  /** The name or identifier of the function */
  name: string;
  /** The total cyclomatic complexity score for this function */
  complexity: number;
  /** Array of individual complexity details that contribute to the total score */
  details: UnifiedMetricsDetail[];
  /** Line number where the function definition starts (1-based) */
  startLine: number;
  /** Line number where the function definition ends (1-based) */
  endLine: number;
  /** Column number where the function definition starts (0-based) */
  startColumn: number;
  /** Column number where the function definition ends (0-based) */
  endColumn: number;
}

/**
 * Factory class for creating and managing complexity analyzers for different programming languages.
 *
 * This class provides the main API for analyzing cognitive complexity across multiple languages.
 * It uses a factory pattern to create language-specific analyzers dynamically, ensuring
 * efficient memory usage and supporting easy extension for new languages.
 *
 * @example
 * ```typescript
 * const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, 'typescript');
 * console.log(`Found ${results.length} functions with complexities:`, results);
 * ```
 */
export class MetricsAnalyzerFactory {
  /**
   * Returns a list of supported languages for complexity analysis.
   * @returns An array of language identifiers (e.g., 'typescript', 'javascript', 'python')
   */
  static getSupportedLanguages(): string[] {
    return Object.keys(languageAnalyzers);
  }

  /**
   * Analyzes the complexity of functions within a source code file.
   *
   * This method serves as the main entry point for complexity analysis. It determines
   * the appropriate analyzer based on the language ID and processes the source code
   * to extract complexity metrics for all functions found.
   *
   * @param fileName - The name of the file being analyzed (used for context and error reporting)
   * @param sourceText - The complete source code content to analyze
   * @param languageId - VS Code language identifier (e.g., 'typescript', 'javascript', 'python')
   *
   * @returns An array of complexity analysis results, one for each function found in the source code.
   *          Returns an empty array if no functions are found or if the language is not supported.
   *
   * @example
   * ```typescript
   * const results = ComplexityAnalyzerFactory.analyzeFile(
   *   'utils.ts',
   *   `
   *   function calculateSum(a: number, b: number): number {
   *     if (a < 0 || b < 0) {
   *       throw new Error('Negative numbers not allowed');
   *     }
   *     return a + b;
   *   }
   *   `,
   *   'typescript'
   * );
   * // results[0].complexity would be 2 (base complexity 1 + if statement 1)
   * ```
   */
  public static analyzeFile(
    sourceText: string,
    languageId: string
  ): UnifiedFunctionMetrics[] {
    // Get the analyzer function for the specified language
    const analyzer = languageAnalyzers[languageId];
    if (analyzer) {
      // Call the analyzer function with the source code
      return analyzer(sourceText);
    }
    // Return an empty array if languageId does not match any known analyzers
    return [];
  }
}

/**
 * A record of language-specific analyzers that compute cognitive complexity metrics for source code.
 * Each analyzer is a function that takes source text and returns an array of complexity data for all functions found.
 *
 * @remarks
 * The analyzers normalize line and column numbers to be 1-based across all languages for consistency.
 * Each language analyzer is lazily loaded using require() to optimize initial load time.
 *
 * @example
 * ```typescript
 * const analyzer = languageAnalyzers['csharp'];
 * const complexityData = analyzer(sourceCode);
 * ```
 */
const languageAnalyzers: Record<
  string,
  (sourceText: string) => UnifiedFunctionMetrics[]
> = {
  csharp: createCSharpAnalyzer(),
  go: createGoAnalyzer(),
};

/**
 * Creates a C# cognitive complexity analyzer function.
 *
 * @returns A function that analyzes C# source code and returns an array of function complexity metrics.
 *          The returned analyzer function:
 *          - Takes C# source code as a string parameter
 *          - Analyzes cognitive complexity of all functions in the code
 *          - Returns an array of UnifiedFunctionMetrics objects containing:
 *            - Function name
 *            - Complexity score
 *            - Detailed breakdown of complexity increments with line/column positions (1-based indexing)
 *            - Function boundaries (start/end line and column)
 *
 * @remarks
 * The analyzer dynamically requires the C# analyzer module and normalizes its output
 * from 0-based to 1-based line and column indexing for consistency.
 */
function createCSharpAnalyzer(): (
  sourceText: string
) => UnifiedFunctionMetrics[] {
  return function (sourceText: string) {
    const { CSharpMetricsAnalyzer } = require("./languages/csharpAnalyzer");
    const functions = CSharpMetricsAnalyzer.analyzeFile(sourceText);
    return functions.map((func: any) => ({
      name: func.name,
      complexity: func.complexity,
      details: func.details.map((detail: any) => ({
        increment: detail.increment,
        reason: detail.reason,
        line: detail.line + 1, // C# analyzer uses 0-based, normalize to 1-based
        column: detail.column + 1, // C# analyzer uses 0-based, normalize to 1-based
        nesting: detail.nesting,
      })),
      startLine: func.startLine,
      endLine: func.endLine,
      startColumn: func.startColumn,
      endColumn: func.endColumn,
    }));
  };
}

/**
 * Creates a Go cognitive complexity analyzer function.
 *
 * @returns A function that analyzes Go source code and returns an array of function complexity metrics.
 *          The returned analyzer function:
 *          - Takes Go source code as a string parameter
 *          - Analyzes cognitive complexity of all functions in the code
 *          - Returns an array of UnifiedFunctionMetrics objects containing:
 *            - Function name
 *            - Complexity score
 *            - Detailed breakdown of complexity increments with line/column positions (1-based indexing)
 *            - Function boundaries (start/end line and column)
 *
 * @remarks
 * The analyzer dynamically requires the Go analyzer module and normalizes the detail positions
 * (line and column in the details array) from 0-based to 1-based indexing for consistency
 * with the C# analyzer. Function boundary positions remain as returned by the analyzer.
 */
function createGoAnalyzer(): (sourceText: string) => UnifiedFunctionMetrics[] {
  return function (sourceText: string) {
    const { GoMetricsAnalyzer } = require("./languages/goAnalyzer");
    const functions = GoMetricsAnalyzer.analyzeFile(sourceText);
    return functions.map((func: any) => ({
      name: func.name,
      complexity: func.complexity,
      details: func.details.map((detail: any) => ({
        increment: detail.increment,
        reason: detail.reason,
        line: detail.line + 1, // Go analyzer uses 0-based, normalize to 1-based
        column: detail.column + 1, // Go analyzer uses 0-based, normalize to 1-based
        nesting: detail.nesting,
      })),
      startLine: func.startLine,
      endLine: func.endLine,
      startColumn: func.startColumn,
      endColumn: func.endColumn,
    }));
  };
}
