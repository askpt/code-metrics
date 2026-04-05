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
  /** Line number where the function definition starts (0-based) */
  startLine: number;
  /** Line number where the function definition ends (0-based) */
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
 * const results = MetricsAnalyzerFactory.analyzeFile(sourceCode, 'csharp');
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
   * @param sourceText - The complete source code content to analyze
   * @param languageId - VS Code language identifier (e.g., 'csharp', 'go')
   *
   * @returns An array of complexity analysis results, one for each function found in the source code.
   *          Returns an empty array if no functions are found or if the language is not supported.
   *
   * @example
   * ```typescript
   * const results = MetricsAnalyzerFactory.analyzeFile(
   *   `
   *   public class Test {
   *     public int Add(int a, int b) {
   *       if (a < 0 || b < 0) {
   *         throw new Error('Negative numbers not allowed');
   *       }
   *       return a + b;
   *     }
   *   }
   *   `,
   *   'csharp'
   * );
   * // results[0].complexity would be 3 (if +1, || +1, nesting +1)
   * ```
   */
  public static analyzeFile(
    sourceText: string,
    languageId: string
  ): UnifiedFunctionMetrics[] {
    // Get the analyzer function for the specified language
    const analyzer = languageAnalyzers[languageId];
    if (analyzer) {
      // Use cache to avoid re-analyzing identical source text
      const cacheKey = `${languageId}:${sourceText.length}:${hashString(sourceText)}`;
      const cached = analysisCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      const results = analyzer(sourceText);
      if (analysisCache.size >= CACHE_MAX_SIZE) {
        analysisCache.delete(analysisCache.keys().next().value!);
      }
      analysisCache.set(cacheKey, results);
      return results;
    }
    // Return an empty array if languageId does not match any known analyzers
    return [];
  }
}

/** Maximum number of analysis results to keep in cache (one entry per unique file content). */
const CACHE_MAX_SIZE = 20;

/** Cache of analysis results keyed by language + content hash. Evicts oldest entry when full. */
const analysisCache = new Map<string, UnifiedFunctionMetrics[]>();

/** Fast non-cryptographic hash for cache key generation (djb2 variant). */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Raw detail shape returned by all language-specific analyzers.
 * `line` and `column` are 0-based and are normalized to 1-based by createAnalyzer.
 */
interface RawMetricsDetail {
  increment: number;
  reason: string;
  line: number;
  column: number;
  nesting: number;
}

/**
 * Raw function-level shape returned by all language-specific analyzers.
 * All position fields (`startLine`, `endLine`, `startColumn`, `endColumn`) are 0-based
 * and are passed through as-is to `UnifiedFunctionMetrics` without normalization.
 */
interface RawFunctionMetrics {
  name: string;
  complexity: number;
  details: RawMetricsDetail[];
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

/** Shape of a language analyzer class that must expose a static `analyzeFile` method. */
interface AnalyzerClass {
  analyzeFile(sourceText: string): RawFunctionMetrics[];
}

/**
 * Creates a language-specific cognitive complexity analyzer function.
 *
 * All language analyzers share the same output shape and the same normalization
 * step (0-based → 1-based line/column in detail positions). This helper
 * centralises that logic so individual language registrations stay concise.
 *
 * @param modulePath - require()-style path to the language analyzer module (relative to this file)
 * @param className  - Name of the exported analyzer class that exposes a static `analyzeFile` method
 * @returns A function that takes source text and returns an array of UnifiedFunctionMetrics
 * @throws {Error} If the module does not export the expected class with an `analyzeFile` method
 */
export function createAnalyzer(
  modulePath: string,
  className: string
): (sourceText: string) => UnifiedFunctionMetrics[] {
  return function (sourceText: string): UnifiedFunctionMetrics[] {
    const mod = require(modulePath) as Record<string, AnalyzerClass | undefined>;
    const analyzerClass = mod[className];
    if (!analyzerClass || typeof analyzerClass.analyzeFile !== "function") {
      throw new Error(
        `Analyzer module "${modulePath}" does not export a class named "${className}" ` +
        `with a static analyzeFile method.`
      );
    }
    const functions: RawFunctionMetrics[] = analyzerClass.analyzeFile(sourceText);
    return functions.map((func: RawFunctionMetrics) => ({
      name: func.name,
      complexity: func.complexity,
      details: func.details.map((detail: RawMetricsDetail) => ({
        increment: detail.increment,
        reason: detail.reason,
        line: detail.line + 1,     // analyzers use 0-based; normalize to 1-based
        column: detail.column + 1, // analyzers use 0-based; normalize to 1-based
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
 * A record of language-specific analyzers that compute cognitive complexity metrics for source code.
 *
 * @remarks
 * Line and column numbers in detail positions are normalized to 1-based across all languages.
 * Each analyzer module is lazily loaded via require() on first invocation (Node.js caches the module
 * afterwards), so startup time is not affected by the number of supported languages.
 */
const languageAnalyzers: Record<
  string,
  (sourceText: string) => UnifiedFunctionMetrics[]
> = {
  csharp:          createAnalyzer("./languages/csharpAnalyzer",     "CSharpMetricsAnalyzer"),
  go:              createAnalyzer("./languages/goAnalyzer",          "GoMetricsAnalyzer"),
  javascript:      createAnalyzer("./languages/javascriptAnalyzer",  "JavaScriptMetricsAnalyzer"),
  javascriptreact: createAnalyzer("./languages/javascriptAnalyzer",  "JavaScriptMetricsAnalyzer"),
  typescript:      createAnalyzer("./languages/typescriptAnalyzer",  "TypeScriptMetricsAnalyzer"),
  typescriptreact: createAnalyzer("./languages/typescriptAnalyzer",  "TypeScriptMetricsAnalyzer"),
};
