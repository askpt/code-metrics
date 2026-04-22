/**
 * @fileoverview TypeScript Cognitive Complexity Analyzer
 *
 * This module provides cognitive complexity analysis for TypeScript source code using Tree-sitter.
 * The analysis logic is shared with the JavaScript analyzer via {@link JsLikeMetricsAnalyzer}.
 * This class sets up the TypeScript parser and delegates all analysis to the base class.
 *
 * TypeScript is a superset of JavaScript, so it handles the same cognitive complexity
 * constructs as JavaScript. TypeScript-specific syntax (type annotations, interfaces,
 * generics) generally does not affect cognitive complexity.
 *
 * @see JsLikeMetricsAnalyzer for the full list of constructs that affect complexity.
 */

import Parser from "tree-sitter";
import { JsLikeMetricsAnalyzer, JsLikeFunctionMetrics } from "./jsLikeAnalyzer";

const { typescript: TypeScriptLanguage } = require("tree-sitter-typescript"); // noqa

// Module-level singleton: parser initialization is expensive, so we reuse one instance per language.
const _parser = new Parser();
_parser.setLanguage(TypeScriptLanguage);

/**
 * Cognitive Complexity Analyzer for TypeScript source code.
 *
 * Delegates all analysis logic to {@link JsLikeMetricsAnalyzer}; this class only
 * provides the TypeScript-specific Tree-sitter parser.
 *
 * @example
 * ```typescript
 * const results = TypeScriptMetricsAnalyzer.analyzeFile(tsSourceCode);
 * console.log(`Function ${results[0].name} has complexity ${results[0].complexity}`);
 * ```
 */
export class TypeScriptMetricsAnalyzer extends JsLikeMetricsAnalyzer {
  constructor() {
    super(_parser);
  }

  /**
   * Static factory method to analyze TypeScript source code.
   *
   * @param sourceText - The complete TypeScript source code to analyze
   * @returns An array of complexity analysis results for all functions found
   */
  public static analyzeFile(sourceText: string): JsLikeFunctionMetrics[] {
    return new TypeScriptMetricsAnalyzer().analyzeFunctions(sourceText);
  }
}
