/**
 * @fileoverview Python Cognitive Complexity Analyzer
 *
 * This module provides cognitive complexity analysis for Python source code using Tree-sitter.
 * It implements the cognitive complexity metric which measures how difficult code is to
 * understand, taking into account control flow, nesting, and other complexity factors.
 *
 * The analyzer uses the tree-sitter-python parser to build an Abstract Syntax Tree (AST)
 * and then traverses it to calculate complexity scores for each function/method.
 */

import Parser from "tree-sitter";
const Python = require("tree-sitter-python"); // noqa

// Module-level singleton: parser initialization is expensive, so we reuse one instance per language.
const _parser = new Parser();
_parser.setLanguage(Python);

/**
 * Represents a single complexity detail for a specific Python code construct.
 * Each detail contributes to the overall cognitive complexity of a function.
 */
interface PythonMetricsDetail {
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
 * Represents the complete cognitive complexity analysis results for a single Python function or method.
 * Includes the overall complexity score and detailed breakdown of contributing factors.
 */
interface PythonFunctionMetrics {
  /** The name or identifier of the function/method */
  name: string;
  /** The total cognitive complexity score for this function */
  complexity: number;
  /** Array of individual complexity details that contribute to the total score */
  details: PythonMetricsDetail[];
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
 * Cognitive Complexity Analyzer for Python source code.
 *
 * This class implements cognitive complexity analysis specifically for Python code.
 * Cognitive complexity is a metric that measures how difficult code is to understand,
 * taking into account factors like:
 * - Control flow statements (if, elif, for, while, try/except)
 * - Nesting levels
 * - Logical operators (and, or)
 * - Conditional expressions (ternary)
 * - Comprehensions (list, dict, set, generator)
 * - Lambda expressions (when nested)
 *
 * The analyzer uses Tree-sitter for parsing and provides detailed analysis
 * including the exact location and reason for each complexity increment.
 */
export class PythonMetricsAnalyzer {
  /** Current nesting level during analysis */
  private nesting = 0;
  /** Current complexity score during analysis */
  private complexity = 0;
  /** Array of complexity details for the current function being analyzed */
  private details: PythonMetricsDetail[] = [];
  /** The source code text being analyzed */
  private sourceText: string;
  /** Tree-sitter parser instance configured for Python */
  private parser: Parser;

  constructor() {
    this.parser = _parser;
    this.sourceText = "";
  }

  /**
   * Analyzes all functions in the provided Python source code.
   *
   * Top-level functions and class methods are each analyzed independently.
   * Nested function definitions are collected as separate entries and are not
   * counted toward the enclosing function's complexity.
   *
   * @param sourceText - The complete Python source code to analyze
   * @returns An array of complexity analysis results, one for each function found
   */
  public analyzeFunctions(sourceText: string): PythonFunctionMetrics[] {
    this.sourceText = sourceText;
    const tree = this.parser.parse(sourceText);
    const functions: PythonFunctionMetrics[] = [];

    const visit = (node: Parser.SyntaxNode, className?: string) => {
      if (node.type === "class_definition") {
        // Extract class name and descend into its body
        const nameNode = node.children.find((c) => c.type === "identifier");
        const name = nameNode
          ? this.sourceText.substring(nameNode.startIndex, nameNode.endIndex)
          : "<class>";
        for (const child of node.children) {
          visit(child, name);
        }
        return;
      }

      if (node.type === "function_definition") {
        const result = this.analyzeFunction(node, className);
        if (result) {
          functions.push(result);
        }
        return;
      }

      for (const child of node.children) {
        visit(child, className);
      }
    };

    visit(tree.rootNode);
    return functions;
  }

  /**
   * Analyzes the cognitive complexity of a single function or method.
   *
   * @param node - The syntax node representing the function_definition
   * @param className - Optional class name for method formatting (ClassName.method_name)
   * @returns Complexity analysis result or null if no body is found
   */
  private analyzeFunction(
    node: Parser.SyntaxNode,
    className?: string
  ): PythonFunctionMetrics | null {
    this.nesting = 0;
    this.complexity = 0;
    this.details = [];

    const functionName = this.getFunctionName(node, className);

    const body = node.children.find((c) => c.type === "block");
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
   * Extracts the function/method name from a function_definition node.
   *
   * @param node - The function_definition syntax node
   * @param className - Optional class name for method format (ClassName.method_name)
   * @returns The function name as a string
   */
  private getFunctionName(node: Parser.SyntaxNode, className?: string): string {
    const nameNode = node.children.find((c) => c.type === "identifier");
    const name = nameNode
      ? this.sourceText.substring(nameNode.startIndex, nameNode.endIndex)
      : "<anonymous>";
    return className ? `${className}.${name}` : name;
  }

  /**
   * Recursively visits all nodes in the syntax tree to analyze complexity.
   * Skips nested function definitions (they are analyzed separately).
   *
   * @param node - The current syntax node being visited
   */
  private visit(node: Parser.SyntaxNode): void {
    // Nested functions are analyzed separately; do not count them in the parent
    if (node.type === "function_definition") {
      return;
    }

    // Lambda adds +1 when nested
    if (node.type === "lambda") {
      if (this.nesting > 0) {
        const increment = 1 + this.nesting;
        this.complexity += increment;
        this.details.push({
          increment,
          reason: "lambda (nested)",
          line: node.startPosition.row,
          column: node.startPosition.column,
          nesting: this.nesting,
        });
      }
      this.nesting++;
      for (const child of node.children) {
        this.visit(child);
      }
      this.nesting--;
      return;
    }

    const increment = this.getComplexityIncrement(node);
    if (increment > 0) {
      this.complexity += increment;
      this.details.push({
        increment,
        reason: this.getComplexityReason(node),
        line: node.startPosition.row,
        column: node.startPosition.column,
        nesting: this.nesting,
      });
    }

    if (this.increasesNesting(node)) {
      this.nesting++;
      for (const child of node.children) {
        this.visit(child);
      }
      this.nesting--;
    } else {
      for (const child of node.children) {
        this.visit(child);
      }
    }
  }

  /**
   * Calculates the base complexity increment for a syntax node.
   *
   * Based on SonarSource cognitive complexity rules for Python:
   * - Structural increments (1 + nesting): if, for, while, except, match, comprehensions
   * - Flat increments (+1 only): elif, boolean operators (and/or), conditional expression
   *
   * @param node - The syntax node to evaluate
   * @returns The complexity increment (0 or positive integer)
   */
  private getComplexityIncrement(node: Parser.SyntaxNode): number {
    switch (node.type) {
      // Structural increments: 1 + nesting
      case "if_statement":
      case "for_statement":
      case "while_statement":
      case "except_clause":
      case "match_statement":
      case "list_comprehension":
      case "set_comprehension":
      case "dictionary_comprehension":
      case "generator_expression":
        return 1 + this.nesting;

      // Flat increments: +1 regardless of nesting
      case "elif_clause":
      case "conditional_expression":
        return 1;

      // Boolean operators: +1 per operator
      case "boolean_operator": {
        const op = this.getBooleanOperator(node);
        return op === "and" || op === "or" ? 1 : 0;
      }

      default:
        return 0;
    }
  }

  /**
   * Extracts the boolean operator keyword from a boolean_operator node.
   *
   * @param node - The boolean_operator syntax node
   * @returns The operator text ("and" or "or") or null
   */
  private getBooleanOperator(node: Parser.SyntaxNode): string | null {
    for (const child of node.children) {
      const text = this.sourceText.substring(child.startIndex, child.endIndex);
      if (text === "and" || text === "or") {
        return text;
      }
    }
    return null;
  }

  /**
   * Generates a human-readable reason string for a complexity-contributing node.
   *
   * @param node - The syntax node that contributes to complexity
   * @returns A descriptive string
   */
  private getComplexityReason(node: Parser.SyntaxNode): string {
    switch (node.type) {
      case "if_statement":
        return "if statement";
      case "elif_clause":
        return "elif clause";
      case "for_statement":
        return "for loop";
      case "while_statement":
        return "while loop";
      case "except_clause":
        return "except clause";
      case "match_statement":
        return "match statement";
      case "list_comprehension":
        return "list comprehension";
      case "set_comprehension":
        return "set comprehension";
      case "dictionary_comprehension":
        return "dictionary comprehension";
      case "generator_expression":
        return "generator expression";
      case "conditional_expression":
        return "conditional expression";
      case "boolean_operator": {
        const op = this.getBooleanOperator(node);
        return `boolean ${op} operator`;
      }
      default:
        return "complexity source";
    }
  }

  /**
   * Determines if a syntax node increases the nesting level for child nodes.
   *
   * @param node - The syntax node to check
   * @returns True if traversing into this node's children should use an increased nesting level
   */
  private increasesNesting(node: Parser.SyntaxNode): boolean {
    switch (node.type) {
      case "if_statement":
      case "for_statement":
      case "while_statement":
      case "except_clause":
      case "match_statement":
      case "list_comprehension":
      case "set_comprehension":
      case "dictionary_comprehension":
      case "generator_expression":
        return true;
      default:
        return false;
    }
  }

  /**
   * Static factory method to analyze Python source code.
   *
   * @param sourceText - The complete Python source code to analyze
   * @returns An array of complexity analysis results for all functions found
   */
  public static analyzeFile(sourceText: string): PythonFunctionMetrics[] {
    const analyzer = new PythonMetricsAnalyzer();
    return analyzer.analyzeFunctions(sourceText);
  }
}
