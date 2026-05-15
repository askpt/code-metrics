/**
 * @fileoverview TSX (TypeScript React) Cognitive Complexity Analyzer
 *
 * This module provides cognitive complexity analysis for TSX source code using Tree-sitter.
 * The analysis logic is shared with the TypeScript analyzer via {@link JsLikeMetricsAnalyzer}.
 * This class sets up the TSX parser (distinct from the TypeScript parser) and delegates
 * all analysis to the base class.
 *
 * TSX files use the `tsx` Tree-sitter grammar, which correctly parses JSX elements.
 * Using the plain `typescript` grammar for TSX would cause JSX syntax (e.g. `<span>`)
 * to be mis-parsed, producing ERROR nodes that corrupt the AST and inflate complexity.
 *
 * @see JsLikeMetricsAnalyzer for the full list of constructs that affect complexity.
 */

import Parser from "tree-sitter";
import { JsLikeMetricsAnalyzer, JsLikeFunctionMetrics } from "./jsLikeAnalyzer";

const { tsx: TsxLanguage } = require("tree-sitter-typescript"); // noqa

// Module-level singleton: parser initialization is expensive, so we reuse one instance per language.
const _parser = new Parser();
_parser.setLanguage(TsxLanguage);

/**
 * Cognitive Complexity Analyzer for TSX (TypeScript React) source code.
 *
 * Uses the `tsx` Tree-sitter grammar so that JSX elements are parsed correctly
 * instead of being treated as TypeScript comparison or generic expressions.
 * Delegates all analysis logic to {@link JsLikeMetricsAnalyzer}.
 *
 * @example
 * ```typescript
 * const results = TsxMetricsAnalyzer.analyzeFile(tsxSourceCode);
 * console.log(`Component ${results[0].name} has complexity ${results[0].complexity}`);
 * ```
 */
export class TsxMetricsAnalyzer extends JsLikeMetricsAnalyzer {
  constructor() {
    super(_parser);
  }

  /**
   * Static factory method to analyze TSX source code.
   *
   * @param sourceText - The complete TSX source code to analyze
   * @returns An array of complexity analysis results for all functions found
   */
  public static analyzeFile(sourceText: string): JsLikeFunctionMetrics[] {
    return new TsxMetricsAnalyzer().analyzeFunctions(sourceText);
  }
}
