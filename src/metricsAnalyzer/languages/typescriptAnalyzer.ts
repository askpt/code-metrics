/**
 * @fileoverview TypeScript Cognitive Complexity Analyzer
 *
 * This module provides cognitive complexity analysis for TypeScript source code using Tree-sitter.
 * It implements the cognitive complexity metric which measures how difficult code is to
 * understand, taking into account control flow, nesting, and other complexity factors.
 *
 * TypeScript is a superset of JavaScript, so this analyzer handles the same constructs
 * as the JavaScript analyzer plus TypeScript-specific syntax. It uses the tree-sitter-typescript
 * parser for accurate AST generation.
 */

import Parser from "tree-sitter";
const { typescript: TypeScriptLanguage } = require("tree-sitter-typescript"); // noqa

// Module-level singleton: parser initialization is expensive, so we reuse one instance per language.
const _parser = new Parser();
_parser.setLanguage(TypeScriptLanguage);

/**
 * Represents a single complexity detail for a specific TypeScript code construct.
 * Each detail contributes to the overall cognitive complexity of a function.
 */
interface TypeScriptMetricsDetail {
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
 * Represents the complete cognitive complexity analysis results for a single TypeScript function.
 * Includes the overall complexity score and detailed breakdown of contributing factors.
 */
interface TypeScriptFunctionMetrics {
  /** The name or identifier of the function/method */
  name: string;
  /** The total cognitive complexity score for this function */
  complexity: number;
  /** Array of individual complexity details that contribute to the total score */
  details: TypeScriptMetricsDetail[];
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
 * Cognitive Complexity Analyzer for TypeScript source code.
 *
 * This class implements cognitive complexity analysis specifically for TypeScript code.
 * Since TypeScript is a superset of JavaScript, it handles the same control flow constructs
 * as the JavaScript analyzer. TypeScript-specific syntax (type annotations, interfaces,
 * generics) generally does not affect cognitive complexity.
 *
 * Cognitive complexity factors include:
 * - Control flow statements (if, for, while, do, switch)
 * - Nesting levels
 * - Catch clauses (exception handling)
 * - Logical operators (&&, ||, ??)
 * - Ternary expressions
 * - Nested functions and arrow functions
 *
 * @example
 * ```typescript
 * const results = TypeScriptMetricsAnalyzer.analyzeFile(tsSourceCode);
 * console.log(`Function ${results[0].name} has complexity ${results[0].complexity}`);
 * ```
 */
export class TypeScriptMetricsAnalyzer {
  /** Current nesting level during analysis */
  private nesting = 0;
  /** Current complexity score during analysis */
  private complexity = 0;
  /** Array of complexity details for the current function being analyzed */
  private details: TypeScriptMetricsDetail[] = [];
  /** The source code text being analyzed */
  private sourceText: string;
  /** Tree-sitter parser instance configured for TypeScript */
  private parser: Parser;

  /**
   * Creates a new instance of the TypeScript cognitive complexity analyzer.
   * Initializes the Tree-sitter parser with the TypeScript language grammar.
   */
  constructor() {
    this.parser = _parser;
    this.sourceText = "";
  }

  /**
   * Analyzes all functions in the provided TypeScript source code.
   *
   * @param sourceText - The complete TypeScript source code to analyze
   * @returns An array of complexity analysis results, one for each function found
   */
  public analyzeFunctions(sourceText: string): TypeScriptFunctionMetrics[] {
    this.sourceText = sourceText;
    const tree = this.parser.parse(sourceText);
    const functions: TypeScriptFunctionMetrics[] = [];
    this.collectFunctions(tree.rootNode, functions, false);
    return functions;
  }

  /**
   * Recursively collects functions from the AST and calculates their complexity.
   *
   * @param node - The current AST node to process
   * @param functions - The array to accumulate function metrics into
   * @param isNested - Whether this function is nested inside another function
   */
  private collectFunctions(
    node: Parser.SyntaxNode,
    functions: TypeScriptFunctionMetrics[],
    isNested: boolean
  ): void {
    const isFunctionNode =
      node.type === "function_declaration" ||
      node.type === "function_expression" ||
      node.type === "method_definition" ||
      node.type === "arrow_function";

    if (isFunctionNode) {
      // If nested, add complexity for the nesting
      if (isNested) {
        this.complexity += 1 + this.nesting;
        this.details.push({
          increment: 1 + this.nesting,
          reason: this.getFunctionReason(node.type),
          line: node.startPosition.row,
          column: node.startPosition.column,
          nesting: this.nesting,
        });
      }

      // Save current state before analyzing nested function
      const savedComplexity = this.complexity;
      const savedDetails = this.details;
      const savedNesting = this.nesting;

      // Reset for the new function
      this.complexity = 0;
      this.details = [];
      this.nesting = 0;

      // Analyze the function body
      const funcName = this.getFunctionName(node);
      this.analyzeNode(node);

      const metrics: TypeScriptFunctionMetrics = {
        name: funcName,
        complexity: this.complexity,
        details: this.details,
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        startColumn: node.startPosition.column,
        endColumn: node.endPosition.column,
      };
      functions.push(metrics);

      // Restore state
      this.complexity = savedComplexity;
      this.details = savedDetails;
      this.nesting = savedNesting;
    } else {
      for (const child of node.children) {
        this.collectFunctions(child, functions, isNested);
      }
    }
  }

  /**
   * Returns a human-readable reason for a function node type.
   */
  private getFunctionReason(nodeType: string): string {
    switch (nodeType) {
      case "arrow_function":
        return "arrow function (nested)";
      case "function_expression":
        return "function expression (nested)";
      case "method_definition":
        return "method (nested)";
      default:
        return "function (nested)";
    }
  }

  /**
   * Extracts the name of a function from its AST node.
   *
   * @param node - The function AST node
   * @returns The function name or a descriptive placeholder
   */
  private getFunctionName(node: Parser.SyntaxNode): string {
    if (node.type === "function_declaration" || node.type === "function_expression") {
      const nameNode = node.children.find((c) => c.type === "identifier");
      if (nameNode) {
        return this.sourceText.substring(nameNode.startIndex, nameNode.endIndex);
      }
    }

    if (node.type === "method_definition") {
      const nameNode = node.children.find(
        (c) => c.type === "property_identifier" || c.type === "identifier"
      );
      if (nameNode) {
        return this.sourceText.substring(nameNode.startIndex, nameNode.endIndex);
      }
    }

    if (node.type === "arrow_function") {
      const parent = node.parent;
      if (parent && parent.type === "variable_declarator") {
        const nameNode = parent.children.find((c) => c.type === "identifier");
        if (nameNode) {
          return this.sourceText.substring(nameNode.startIndex, nameNode.endIndex);
        }
      }
      return "(arrow function)";
    }

    return "(anonymous)";
  }

  /**
   * Analyzes a single AST node and its children for complexity contributions.
   *
   * @param node - The AST node to analyze
   * @param skipSelfIncrement - When true, skip incrementing complexity for this node (used for else-if)
   */
  private analyzeNode(node: Parser.SyntaxNode, skipSelfIncrement = false): void {
    if (!skipSelfIncrement) {
      const increment = this.getComplexityIncrement(node);
      if (increment > 0) {
        this.details.push({
          increment,
          reason: this.getComplexityReason(node),
          line: node.startPosition.row,
          column: node.startPosition.column,
          nesting: this.nesting,
        });
        this.complexity += increment;
      }
    }

    const nestingIncreased = this.increasesNesting(node);
    if (nestingIncreased) {
      this.nesting++;
    }

    for (const child of node.children) {
      // Skip nested function bodies - they are analyzed separately
      if (this.isNestedFunction(child)) {
        this.collectFunctions(child, [], true);
        continue;
      }
      // For else_clause containing if_statement (else-if):
      // The else_clause is already counted above. The inner if_statement's structural
      // increment is skipped to avoid double-counting, but its body is still analyzed.
      if (node.type === "else_clause" && child.type === "if_statement") {
        this.analyzeNode(child, true);
        continue;
      }
      this.analyzeNode(child);
    }

    if (nestingIncreased) {
      this.nesting--;
    }
  }

  /**
   * Checks if a node is a nested function definition.
   */
  private isNestedFunction(node: Parser.SyntaxNode): boolean {
    return (
      node.type === "function_expression" ||
      node.type === "arrow_function" ||
      node.type === "method_definition"
    );
  }

  /**
   * Calculates the complexity increment for a specific syntax node type.
   *
   * @param node - The syntax node to evaluate
   * @returns The complexity increment (0 or positive integer)
   */
  private getComplexityIncrement(node: Parser.SyntaxNode): number {
    switch (node.type) {
      // Control flow statements (+1 + nesting)
      case "if_statement":
      case "for_statement":
      case "for_in_statement":
      case "for_of_statement":
      case "while_statement":
      case "do_statement":
      case "switch_statement":
        return 1 + this.nesting;

      // Else/else-if clauses (+1, flat)
      case "else_clause":
        return 1;

      // Exception handling (+1)
      case "catch_clause":
        return 1;

      // Ternary expressions (+1)
      case "ternary_expression":
        return 1;

      // Logical operators (+1 each)
      case "binary_expression":
      case "logical_expression": {
        const op = this.getOperator(node);
        if (op === "&&" || op === "||" || op === "??") {
          return 1;
        }
        return 0;
      }

      // Labeled break/continue (+1)
      case "break_statement":
      case "continue_statement": {
        const hasLabel = node.children.some(
          (c) => c.type === "statement_identifier"
        );
        return hasLabel ? 1 : 0;
      }

      default:
        return 0;
    }
  }

  /**
   * Extracts the operator from a binary or logical expression node.
   */
  private getOperator(node: Parser.SyntaxNode): string | null {
    for (const child of node.children) {
      const text = this.sourceText.substring(child.startIndex, child.endIndex);
      if (text === "&&" || text === "||" || text === "??") {
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
      case "if_statement":
        return "if statement";
      case "else_clause": {
        const hasNestedIf = node.children.some((c) => c.type === "if_statement");
        return hasNestedIf ? "else if clause" : "else clause";
      }
      case "for_statement":
        return "for loop";
      case "for_in_statement":
        return "for...in loop";
      case "for_of_statement":
        return "for...of loop";
      case "while_statement":
        return "while loop";
      case "do_statement":
        return "do...while loop";
      case "switch_statement":
        return "switch statement";
      case "catch_clause":
        return "catch clause";
      case "ternary_expression":
        return "ternary expression";
      case "binary_expression":
      case "logical_expression": {
        const op = this.getOperator(node);
        return `logical ${op} operator`;
      }
      case "break_statement":
        return "labeled break statement";
      case "continue_statement":
        return "labeled continue statement";
      default:
        return "complexity source";
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
      node.type === "if_statement" ||
      node.type === "for_statement" ||
      node.type === "for_in_statement" ||
      node.type === "for_of_statement" ||
      node.type === "while_statement" ||
      node.type === "do_statement" ||
      node.type === "switch_statement" ||
      node.type === "catch_clause"
    );
  }

  /**
   * Static factory method to analyze TypeScript source code.
   *
   * @param sourceText - The complete TypeScript source code to analyze
   * @returns An array of complexity analysis results for all functions found
   *
   * @example
   * ```typescript
   * const results = TypeScriptMetricsAnalyzer.analyzeFile(tsCode);
   * results.forEach(func => {
   *   console.log(`${func.name}: ${func.complexity}`);
   * });
   * ```
   */
  public static analyzeFile(sourceText: string): TypeScriptFunctionMetrics[] {
    const analyzer = new TypeScriptMetricsAnalyzer();
    return analyzer.analyzeFunctions(sourceText);
  }
}
