/**
 * @fileoverview Rust Cognitive Complexity Analyzer
 *
 * This module provides cognitive complexity analysis for Rust source code using Tree-sitter.
 * It implements the cognitive complexity metric which measures how difficult code is to
 * understand, taking into account control flow, nesting, and other complexity factors.
 *
 * The analyzer uses the tree-sitter-rust parser to build an Abstract Syntax Tree (AST)
 * and then traverses it to calculate complexity scores for each function/method.
 */

import Parser from "tree-sitter";
const Rust = require("tree-sitter-rust"); // noqa

// Module-level singleton: parser initialization is expensive, so we reuse one instance per language.
const _parser = new Parser();
_parser.setLanguage(Rust);

/**
 * Represents a single complexity detail for a specific Rust code construct.
 * Each detail contributes to the overall cognitive complexity of a function.
 */
interface RustMetricsDetail {
  /** The complexity increment this detail adds to the total complexity */
  increment: number;
  /** Human-readable explanation of why this construct increases complexity */
  reason: string;
  /** Line number where this complexity-contributing construct is located (0-based) */
  line: number;
  /** Column number where this complexity-contributing construct starts (0-based) */
  column: number;
  /** Current nesting level of this construct (0 for top-level) */
  nesting: number;
}

/**
 * Represents the complete cognitive complexity analysis results for a single Rust function or method.
 * Includes the overall complexity score and detailed breakdown of contributing factors.
 */
interface RustFunctionMetrics {
  /** The name or identifier of the function/method */
  name: string;
  /** The total cognitive complexity score for this function */
  complexity: number;
  /** Array of individual complexity details that contribute to the total score */
  details: RustMetricsDetail[];
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
 * Cognitive Complexity Analyzer for Rust source code.
 *
 * This class implements cognitive complexity analysis specifically for Rust code.
 * Cognitive complexity is a metric that measures how difficult code is to understand,
 * taking into account factors like:
 * - Control flow statements (if, for, while, loop, match)
 * - Nesting levels
 * - Logical operators (&& and ||)
 * - Closures (when nested)
 * - Labeled breaks and continues
 *
 * The analyzer uses Tree-sitter for parsing and provides detailed analysis
 * including the exact location and reason for each complexity increment.
 *
 * @example
 * ```typescript
 * const analyzer = new RustMetricsAnalyzer();
 * const results = analyzer.analyzeFunctions(rustSourceCode);
 * console.log(`Function ${results[0].name} has complexity ${results[0].complexity}`);
 * ```
 */
export class RustMetricsAnalyzer {
  /** Current nesting level during analysis */
  private nesting = 0;
  /** Current complexity score during analysis */
  private complexity = 0;
  /** Array of complexity details for the current function being analyzed */
  private details: RustMetricsDetail[] = [];
  /** The source code text being analyzed */
  private sourceText: string;
  /** Tree-sitter parser instance configured for Rust */
  private parser: Parser;

  /**
   * Creates a new instance of the Rust cognitive complexity analyzer.
   * Initializes the Tree-sitter parser with the Rust language grammar.
   */
  constructor() {
    this.parser = _parser;
    this.sourceText = "";
  }

  /**
   * Analyzes all functions in the provided Rust source code.
   *
   * This method parses the source code and identifies all function-like constructs
   * (free functions and impl methods) and calculates their cognitive complexity scores.
   *
   * @param sourceText - The complete Rust source code to analyze
   * @returns An array of complexity analysis results, one for each function found
   *
   * @example
   * ```typescript
   * const sourceCode = `
   * fn add(a: i32, b: i32) -> i32 {
   *   if a < 0 || b < 0 {
   *     return 0;
   *   }
   *   a + b
   * }`;
   * const results = analyzer.analyzeFunctions(sourceCode);
   * // results[0].complexity would be 2 (if statement + logical OR)
   * ```
   */
  public analyzeFunctions(sourceText: string): RustFunctionMetrics[] {
    this.sourceText = sourceText;
    const tree = this.parser.parse(sourceText);
    const functions: RustFunctionMetrics[] = [];

    const visit = (node: Parser.SyntaxNode) => {
      if (this.isFunctionDeclaration(node)) {
        const result = this.analyzeFunction(node);
        if (result) {
          functions.push(result);
        }
      } else {
        for (const child of node.children) {
          visit(child);
        }
      }
    };

    visit(tree.rootNode);
    return functions;
  }

  /**
   * Determines if a syntax node represents a function declaration.
   *
   * @param node - The syntax node to check
   * @returns True if the node represents a function item
   */
  private isFunctionDeclaration(node: Parser.SyntaxNode): boolean {
    return node.type === "function_item";
  }

  /**
   * Determines the qualified name for a function, including impl type if applicable.
   *
   * @param node - The function_item syntax node
   * @returns The qualified function name string
   */
  private getFunctionName(node: Parser.SyntaxNode): string {
    const nameNode = node.children.find((child) => child.type === "identifier");
    if (!nameNode) {
      return "<anonymous>";
    }
    const funcName = this.sourceText.substring(
      nameNode.startIndex,
      nameNode.endIndex
    );

    // Check if parent is a declaration_list within an impl_item
    const parent = node.parent;
    if (parent && parent.type === "declaration_list") {
      const implNode = parent.parent;
      if (implNode && implNode.type === "impl_item") {
        const typeNode = implNode.children.find(
          (child) =>
            child.type === "type_identifier" ||
            child.type === "generic_type" ||
            child.type === "scoped_type_identifier"
        );
        if (typeNode) {
          const typeName = this.sourceText.substring(
            typeNode.startIndex,
            typeNode.endIndex
          );
          return `${typeName}::${funcName}`;
        }
      }
    }

    return funcName;
  }

  /**
   * Analyzes the cognitive complexity of a single function.
   *
   * @param node - The syntax node representing the function item
   * @returns Complexity analysis result or null if the function has no body
   */
  private analyzeFunction(node: Parser.SyntaxNode): RustFunctionMetrics | null {
    // Reset state for new function
    this.nesting = 0;
    this.complexity = 0;
    this.details = [];

    const functionName = this.getFunctionName(node);

    // Find the function body (block node)
    const body = node.children.find((child) => child.type === "block");
    if (!body) {
      return null;
    }

    this.visit(body);

    return {
      name: functionName,
      complexity: this.complexity,
      details: [...this.details],
      startLine: node.startPosition.row,
      endLine: node.endPosition.row,
      startColumn: node.startPosition.column,
      endColumn: node.endPosition.column,
    };
  }

  /**
   * Recursively visits all nodes in the syntax tree to analyze complexity.
   *
   * @param node - The current syntax node being visited
   */
  private visit(node: Parser.SyntaxNode, skipSelfIncrement = false): void {
    const baseIncrement = skipSelfIncrement ? 0 : this.getComplexityIncrement(node);
    if (baseIncrement > 0) {
      const nestingPenalty = node.type === "else_clause" ? 0 : this.nesting;
      const increment = baseIncrement + nestingPenalty;
      const reason = this.getComplexityReason(node);
      this.complexity += increment;
      this.details.push({
        increment,
        reason,
        line: node.startPosition.row,
        column: node.startPosition.column,
        nesting: this.nesting,
      });
    }

    if (this.increasesNesting(node)) {
      this.nesting++;
      for (const child of node.children) {
        if (!this.isFunctionDeclaration(child)) {
          if (node.type === "else_clause" && child.type === "if_expression") {
            this.visit(child, true);
            continue;
          }
          this.visit(child);
        }
      }
      this.nesting--;
    } else {
      for (const child of node.children) {
        if (!this.isFunctionDeclaration(child)) {
          if (node.type === "else_clause" && child.type === "if_expression") {
            this.visit(child, true);
            continue;
          }
          this.visit(child);
        }
      }
    }
  }

  /**
   * Calculates the complexity increment for a specific syntax node type.
   *
   * Based on cognitive complexity rules:
    * - Control flow (if, for, while, loop, match): +1
    * - Else/else-if clauses: +1 (flat)
   * - Logical operators (&& and ||): +1 each
   * - Closures when nested: +1
   * - Labeled breaks/continues: +1
   *
   * @param node - The syntax node to evaluate
   * @returns The complexity increment (0 or positive integer)
   */
  private getComplexityIncrement(node: Parser.SyntaxNode): number {
    switch (node.type) {
      case "if_expression":
      case "for_expression":
      case "while_expression":
      case "loop_expression":
      case "match_expression":
        return 1;
      case "else_clause":
        return 1;

      case "binary_expression": {
        const op = this.getBinaryOperator(node);
        return op === "&&" || op === "||" ? 1 : 0;
      }

      case "closure_expression":
        return this.nesting > 0 ? 1 : 0;

      case "break_expression":
      case "continue_expression": {
        // Labeled break/continue always add complexity; unlabeled do not.
        const hasLabel = node.children.some(
          (child) => child.type === "loop_label"
        );
        return hasLabel ? 1 : 0;
      }

      default:
        return 0;
    }
  }

  /**
   * Extracts the binary operator from a binary expression node.
   *
   * @param node - The binary expression syntax node
   * @returns The operator string or null if not found
   */
  private getBinaryOperator(node: Parser.SyntaxNode): string | null {
    for (const child of node.children) {
      const text = this.sourceText.substring(child.startIndex, child.endIndex);
      if (text === "&&" || text === "||") {
        return text;
      }
    }
    return null;
  }

  /**
   * Generates a human-readable reason for why a syntax node increases complexity.
   *
   * @param node - The syntax node that contributes to complexity
   * @returns A descriptive string explaining the complexity increment
   */
  private getComplexityReason(node: Parser.SyntaxNode): string {
    switch (node.type) {
      case "if_expression":
        return "if expression";
      case "else_clause": {
        const hasNestedIf = node.children.some((child) => child.type === "if_expression");
        return hasNestedIf ? "else if clause" : "else clause";
      }
      case "for_expression":
        return "for loop";
      case "while_expression":
        return "while loop";
      case "loop_expression":
        return "loop expression";
      case "match_expression":
        return "match expression";
      case "binary_expression": {
        const op = this.getBinaryOperator(node);
        return `binary ${op} operator`;
      }
      case "closure_expression":
        return "closure (nested)";
      case "break_expression": {
        const hasLabel = node.children.some(
          (child) => child.type === "loop_label"
        );
        return hasLabel ? "labeled break" : "break (nested)";
      }
      case "continue_expression": {
        const hasLabel = node.children.some(
          (child) => child.type === "loop_label"
        );
        return hasLabel ? "labeled continue" : "continue (nested)";
      }
      default:
        return "unknown complexity source";
    }
  }

  /**
   * Determines if a syntax node increases the nesting level.
   *
   * @param node - The syntax node to check
   * @returns True if the node increases nesting level
   */
  private increasesNesting(node: Parser.SyntaxNode): boolean {
    return (
      node.type === "if_expression" ||
      node.type === "for_expression" ||
      node.type === "while_expression" ||
      node.type === "loop_expression" ||
      node.type === "match_expression" ||
      node.type === "closure_expression"
    );
  }

  /**
   * Static factory method to analyze Rust source code.
   *
   * @param sourceText - The complete Rust source code to analyze
   * @returns An array of complexity analysis results for all functions found
   *
   * @example
   * ```typescript
   * const results = RustMetricsAnalyzer.analyzeFile(rustCode);
   * results.forEach(func => {
   *   console.log(`${func.name}: ${func.complexity}`);
   * });
   * ```
   */
  public static analyzeFile(sourceText: string): RustFunctionMetrics[] {
    const analyzer = new RustMetricsAnalyzer();
    return analyzer.analyzeFunctions(sourceText);
  }
}
