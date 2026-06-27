/**
 * @fileoverview Go Cognitive Complexity Analyzer
 *
 * This module provides cognitive complexity analysis for Go source code using Tree-sitter.
 * It implements the cognitive complexity metric which measures how difficult code is to
 * understand, taking into account control flow, nesting, and other complexity factors.
 *
 * The analyzer uses the tree-sitter-go parser to build an Abstract Syntax Tree (AST)
 * and then traverses it to calculate complexity scores for each function/method.
 */

import Parser from "tree-sitter";
import Go from "tree-sitter-go";

// Module-level singleton: parser initialization is expensive, so we reuse one instance per language.
const _parser = new Parser();
_parser.setLanguage(Go);

/**
 * Represents a single complexity detail for a specific Go code construct.
 * Each detail contributes to the overall cognitive complexity of a function.
 */
interface GoMetricsDetail {
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
 * Represents the complete cognitive complexity analysis results for a single Go function or method.
 * Includes the overall complexity score and detailed breakdown of contributing factors.
 */
interface GoFunctionMetrics {
  /** The name or identifier of the function/method */
  name: string;
  /** The total cognitive complexity score for this function */
  complexity: number;
  /** Array of individual complexity details that contribute to the total score */
  details: GoMetricsDetail[];
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
 * Cognitive Complexity Analyzer for Go source code.
 *
 * This class implements cognitive complexity analysis specifically for Go code.
 * Cognitive complexity is a metric that measures how difficult code is to understand,
 * taking into account factors like:
 * - Control flow statements (if, for, switch, select)
 * - Nesting levels
 * - Recover calls (similar to catch in other languages)
 * - Logical operators (&&, ||)
 * - Closures (function literals)
 *
 * The analyzer uses Tree-sitter for parsing and provides detailed analysis
 * including the exact location and reason for each complexity increment.
 *
 * @example
 * ```typescript
 * const analyzer = new GoMetricsAnalyzer();
 * const results = analyzer.analyzeFunctions(goSourceCode);
 * console.log(`Function ${results[0].name} has complexity ${results[0].complexity}`);
 * ```
 */
export class GoMetricsAnalyzer {
  /** Current nesting level during analysis */
  private nesting = 0;
  /** Current complexity score during analysis */
  private complexity = 0;
  /** Array of complexity details for the current function being analyzed */
  private details: GoMetricsDetail[] = [];
  /** The source code text being analyzed */
  private sourceText: string;
  /** Tree-sitter parser instance configured for Go */
  private parser: Parser;

  /**
   * Creates a new instance of the Go cognitive complexity analyzer.
   * Initializes the Tree-sitter parser with the Go language grammar.
   */
  constructor() {
    this.parser = _parser;
    this.sourceText = "";
  }

  /**
   * Analyzes all functions in the provided Go source code.
   *
   * This method parses the source code and identifies all function-like constructs
   * (functions, methods) and calculates their cognitive complexity scores.
   *
   * @param sourceText - The complete Go source code to analyze
   * @returns An array of complexity analysis results, one for each function found
   *
   * @example
   * ```typescript
   * const sourceCode = `
   * package main
   *
   * func Add(a, b int) int {
   *   if a < 0 || b < 0 {
   *     return 0
   *   }
   *   return a + b
   * }`;
   * const results = analyzer.analyzeFunctions(sourceCode);
   * // results[0].complexity would be 2 (if statement + logical OR)
   * ```
   */
  public analyzeFunctions(sourceText: string): GoFunctionMetrics[] {
    this.sourceText = sourceText;
    const tree = this.parser.parse(sourceText);
    const functions: GoFunctionMetrics[] = [];

    const visit = (node: Parser.SyntaxNode) => {
      if (this.isFunctionDeclaration(node)) {
        const result = this.analyzeFunction(node);
        if (result) {
          functions.push(result);
        }
        // Go does not allow nested function_declaration or method_declaration
        // inside function bodies, so there is no need to recurse further.
        return;
      }

      for (const child of node.children) {
        visit(child);
      }
    };

    visit(tree.rootNode);
    return functions;
  }

  /**
   * Determines if a syntax node represents a function declaration.
   *
   * Checks for various Go function-like constructs including:
   * - Regular functions (function_declaration)
   * - Methods with receivers (method_declaration)
   *
   * Note: func_literal (closures/anonymous functions) are analyzed
   * as part of their parent function's complexity.
   *
   * @param node - The syntax node to check
   * @returns True if the node represents a function declaration
   */
  private isFunctionDeclaration(node: Parser.SyntaxNode): boolean {
    return (
      node.type === "function_declaration" || node.type === "method_declaration"
    );
  }

  /**
   * Analyzes the cognitive complexity of a single function.
   *
   * This method resets the analyzer state and processes the given function
   * node to calculate its cognitive complexity. It extracts the function name,
   * finds the function body, and recursively analyzes all statements within.
   *
   * @param node - The syntax node representing the function declaration
   * @returns Complexity analysis result or null if the function has no body
   */
  private analyzeFunction(node: Parser.SyntaxNode): GoFunctionMetrics | null {
    // Reset state for new function
    this.nesting = 0;
    this.complexity = 0;
    this.details = [];

    // Get function name
    const functionName = this.getFunctionName(node);

    // Find the function body
    const body = this.getFunctionBody(node);
    if (!body) {
      return null; // Interface method or declaration without body
    }

    // Analyze the function body
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
   * Extracts the function name from a function declaration node.
   *
   * Handles different types of function declarations:
   * - Regular functions: uses the identifier
   * - Methods: uses "receiver.methodName" format
   *
   * @param node - The function declaration syntax node
   * @returns The function name as a string
   */
  private getFunctionName(node: Parser.SyntaxNode): string {
    // For method declarations, include receiver type
    if (node.type === "method_declaration") {
      const receiver = node.childForFieldName("receiver");
      const nameNode = node.childForFieldName("name");

      let receiverType = "";
      if (receiver) {
        // Extract the type from the receiver parameter list
        const typeNode = this.findTypeInParameterList(receiver);
        if (typeNode) {
          if (typeNode.type === "pointer_type") {
            // For pointer receivers (*T), display just the base type name T
            // so CodeLens shows "MyStruct.Method" rather than "*MyStruct.Method"
            const innerType = typeNode.children.find(
              (c) => c.type === "type_identifier"
            );
            receiverType = innerType
              ? this.sourceText.substring(innerType.startIndex, innerType.endIndex)
              : this.sourceText
                  .substring(typeNode.startIndex, typeNode.endIndex)
                  .replace(/^\*+\s*/, "")
                  .trim();
          } else {
            receiverType = this.sourceText.substring(
              typeNode.startIndex,
              typeNode.endIndex
            );
          }
        }
      }

      if (nameNode) {
        const methodName = this.sourceText.substring(
          nameNode.startIndex,
          nameNode.endIndex
        );
        if (receiverType) {
          return `${receiverType}.${methodName}`;
        }
        return methodName;
      }
    }

    // For regular function declarations
    const nameNode = node.childForFieldName("name");
    if (nameNode) {
      return this.sourceText.substring(nameNode.startIndex, nameNode.endIndex);
    }

    return "<anonymous>";
  }

  /**
   * Finds the type node within a parameter list (used for method receivers).
   * Returns the full type node via the tree-sitter "type" field, which correctly
   * handles any type form the grammar may produce (pointer, qualified, slice, etc.).
   *
   * @param parameterList - The parameter list node to search
   * @returns The type node or null if not found
   */
  private findTypeInParameterList(
    parameterList: Parser.SyntaxNode
  ): Parser.SyntaxNode | null {
    for (const child of parameterList.children) {
      if (child.type === "parameter_declaration") {
        // Use childForFieldName for O(1) field access rather than a linear
        // scan over the parameter's children.
        const typeNode = child.childForFieldName("type");
        if (typeNode) {
          return typeNode;
        }
      }
    }
    return null;
  }

  /**
   * Finds the function body within a function declaration node.
   *
   * @param node - The function declaration syntax node
   * @returns The body node (block) or null if no body is found
   */
  private getFunctionBody(node: Parser.SyntaxNode): Parser.SyntaxNode | null {
    return node.childForFieldName("body");
  }

  /**
   * Recursively visits all nodes in the syntax tree to analyze complexity.
   *
   * This method traverses the AST and calls checkComplexity for each node
   * to determine if it contributes to the cognitive complexity score.
   * It skips nested function declarations to avoid double-counting.
   *
   * @param node - The current syntax node being visited
   */
  private visit(node: Parser.SyntaxNode): void {
    const baseIncrement = this.getComplexityIncrement(node);
    if (baseIncrement > 0) {
      // Add nesting level to the increment for cognitive complexity
      const increment = baseIncrement + this.nesting;
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

    // Conditionally bump nesting, iterate children once, then restore.
    const nests = this.increasesNesting(node);
    if (nests) { this.nesting++; }
    for (const child of node.children) {
      if (!this.isFunctionDeclaration(child)) {
        this.visit(child);
      }
    }
    if (nests) { this.nesting--; }
  }

  /**
   * Calculates the complexity increment for a specific syntax node type.
   *
   * Based on cognitive complexity rules:
   * - Control flow statements (if, for, switch, select): +1
   * - Recover calls (similar to catch): +1
   * - Logical operators (&&, ||): +1 each
   * - Nested closures (func literals in nested context): +1
   * - Jump statements with labels: +1
   * - Goto statements: +1
   *
   * @param node - The syntax node to evaluate
   * @returns The complexity increment (0 or positive integer)
   */
  private getComplexityIncrement(node: Parser.SyntaxNode): number {
    switch (node.type) {
      // Control flow statements (+1)
      case "if_statement":
      case "for_statement":
      case "expression_switch_statement":
      case "type_switch_statement":
      case "select_statement":
        return 1;

      // Logical operators (+1 for each)
      case "binary_expression": {
        const operator = this.getBinaryOperator(node);
        if (operator === "&&" || operator === "||") {
          return 1;
        }
        return 0;
      }

      // Func literals (closures) - add complexity only when nested
      case "func_literal":
        return this.nesting > 0 ? 1 : 0;

      // Labeled statements with break/continue
      case "break_statement":
      case "continue_statement":
        // Check if it has a label (labeled break/continue add complexity)
        if (this.hasLabel(node)) {
          return 1;
        }
        // Non-labeled break/continue in nested structures
        return this.nesting > 0 ? 1 : 0;

      // Goto statements
      case "goto_statement":
        return 1;

      // Recover calls (similar to catch)
      case "call_expression":
        return this.isRecoverCall(node) ? 1 : 0;

      default:
        return 0;
    }
  }

  /**
   * Checks if a call expression is a recover() call.
   *
   * Uses childForFieldName for O(1) field access rather than a linear
   * scan of all children.
   *
   * @param node - The call expression node to check
   * @returns True if this is a recover() call
   */
  private isRecoverCall(node: Parser.SyntaxNode): boolean {
    const funcNode = node.childForFieldName("function");
    if (!funcNode || funcNode.type !== "identifier") { return false; }
    return this.sourceText.substring(funcNode.startIndex, funcNode.endIndex) === "recover";
  }

  /**
   * Returns true if the node has a label_name child (labeled break/continue/goto).
   *
   * In tree-sitter-go, the label is always the first named child when present,
   * so we can use firstNamedChild for an O(1) lookup instead of scanning all children.
   */
  private hasLabel(node: Parser.SyntaxNode): boolean {
    return node.firstNamedChild?.type === "label_name";
  }

  /**
   * Extracts the binary operator from a binary expression node.
   *
   * Uses node.type for O(1) operator detection — anonymous tokens in tree-sitter
   * have their literal text as their type, so no substring allocation is needed.
   *
   * @param node - The binary expression syntax node
   * @returns The operator string or null if not found
   */
  private getBinaryOperator(node: Parser.SyntaxNode): string | null {
    // binary_expression structure: [left, operator, right] — operator always at index 1
    const operatorNode = node.child(1);
    if (!operatorNode) { return null; }
    const type = operatorNode.type;
    if (type === "&&" || type === "||") { return type; }
    return null;
  }

  /**
   * Generates a human-readable reason for why a syntax node increases complexity.
   *
   * Provides descriptive text explaining the complexity contribution,
   * which is useful for developers to understand what makes their code complex.
   *
   * @param node - The syntax node that contributes to complexity
   * @returns A descriptive string explaining the complexity increment
   */
  private getComplexityReason(node: Parser.SyntaxNode): string {
    switch (node.type) {
      case "if_statement":
        return "if statement";
      case "for_statement":
        return "for loop";
      case "expression_switch_statement":
        return "switch statement";
      case "type_switch_statement":
        return "type switch statement";
      case "select_statement":
        return "select statement";
      case "binary_expression": {
        const operator = this.getBinaryOperator(node);
        return `binary ${operator} operator`;
      }
      case "func_literal":
        return "function literal (nested)";
      case "break_statement":
        return this.hasLabel(node)
          ? "labeled break statement"
          : "break statement (nested)";
      case "continue_statement":
        return this.hasLabel(node)
          ? "labeled continue statement"
          : "continue statement (nested)";
      case "goto_statement":
        return "goto statement";
      case "call_expression":
        // `getComplexityIncrement` returns 1 only when `isRecoverCall` is true,
        // so this path is only reached for recover() calls.
        return "recover call";
      default:
        return "unknown complexity source";
    }
  }

  /**
   * Determines if a syntax node increases the nesting level.
   *
   * Identifies constructs that create a new scope or nesting level,
   * which affects the complexity calculation for nested elements.
   *
   * @param node - The syntax node to check
   * @returns True if the node increases nesting level
   */
  private increasesNesting(node: Parser.SyntaxNode): boolean {
    return (
      node.type === "if_statement" ||
      node.type === "for_statement" ||
      node.type === "expression_switch_statement" ||
      node.type === "type_switch_statement" ||
      node.type === "select_statement" ||
      node.type === "func_literal"
    );
  }

  /**
   * Static factory method to analyze Go source code.
   *
   * Creates a new analyzer instance and runs the analysis on the provided source code.
   * This is a convenience method for one-time analysis without manually managing
   * analyzer instances.
   *
   * @param sourceText - The complete Go source code to analyze
   * @returns An array of complexity analysis results for all functions found
   *
   * @example
   * ```typescript
   * const results = GoMetricsAnalyzer.analyzeFile(goCode);
   * results.forEach(func => {
   *   console.log(`${func.name}: ${func.complexity}`);
   * });
   * ```
   */
  public static analyzeFile(sourceText: string): GoFunctionMetrics[] {
    const analyzer = new GoMetricsAnalyzer();
    return analyzer.analyzeFunctions(sourceText);
  }
}
