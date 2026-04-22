/**
 * @fileoverview JavaScript Cognitive Complexity Analyzer
 *
 * This module provides cognitive complexity analysis for JavaScript source code using Tree-sitter.
 * The analysis logic is shared with the TypeScript analyzer via {@link JsLikeMetricsAnalyzer}.
 * This class sets up the JavaScript parser and delegates all analysis to the base class.
 *
 * @see JsLikeMetricsAnalyzer for the full list of constructs that affect complexity.
 */

import Parser from "tree-sitter";
import { JsLikeMetricsAnalyzer, JsLikeFunctionMetrics } from "./jsLikeAnalyzer";

const JavaScript = require("tree-sitter-javascript"); // noqa

// Module-level singleton: parser initialization is expensive, so we reuse one instance per language.
const _parser = new Parser();
_parser.setLanguage(JavaScript);

/**
 * Cognitive Complexity Analyzer for JavaScript source code.
 *
 * Delegates all analysis logic to {@link JsLikeMetricsAnalyzer}; this class only
 * provides the JavaScript-specific Tree-sitter parser.
 *
 * @example
 * ```typescript
 * const results = JavaScriptMetricsAnalyzer.analyzeFile(jsSourceCode);
 * console.log(`Function ${results[0].name} has complexity ${results[0].complexity}`);
 * ```
 */
export class JavaScriptMetricsAnalyzer extends JsLikeMetricsAnalyzer {
  constructor() {
    super(_parser);
  }

  /**
   * Static factory method to analyze JavaScript source code.
   *
   * @param sourceText - The complete JavaScript source code to analyze
   * @returns An array of complexity analysis results for all functions found
   */
  public static analyzeFile(sourceText: string): JsLikeFunctionMetrics[] {
    return new JavaScriptMetricsAnalyzer().analyzeFunctions(sourceText);
  }
}
