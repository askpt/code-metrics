/**
 * @fileoverview C# Cognitive Complexity Analyzer
 *
 * This module provides cognitive complexity analysis for C# source code using Tree-sitter.
 * It implements the cognitive complexity metric which measures how difficult code is to
 * understand, taking into account control flow, nesting, and other complexity factors.
 *
 * The analyzer uses the tree-sitter-c-sharp parser to build an Abstract Syntax Tree (AST)
 * and then traverses it to calculate complexity scores for each function/method.
 */

import Parser from "tree-sitter";
import CSharp from "tree-sitter-c-sharp";

/**
 * Represents a single complexity detail for a specific C# code construct.
 * Each detail contributes to the overall cognitive complexity of a function.
 */
interface CSharpMetricsDetail {
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
 * Represents the complete cognitive complexity analysis results for a single C# function or method.
 * Includes the overall complexity score and detailed breakdown of contributing factors.
 */
interface CSharpFunctionMetrics {
  /** The name or identifier of the function/method */
  name: string;
  /** The total cognitive complexity score for this function */
  complexity: number;
  /** Array of individual complexity details that contribute to the total score */
  details: CSharpMetricsDetail[];
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
 * Cognitive Complexity Analyzer for C# source code.
 *
 * This class implements cognitive complexity analysis specifically for C# code.
 * Cognitive complexity is a metric that measures how difficult code is to understand,
 * taking into account factors like:
 * - Control flow statements (if, while, for, switch)
 * - Nesting levels
 * - Exception handling (try-catch)
 * - Logical operators (&&, ||)
 * - Lambda expressions and anonymous methods
 *
 * The analyzer uses Tree-sitter for parsing and provides detailed analysis
 * including the exact location and reason for each complexity increment.
 *
 * @example
 * ```typescript
 * const analyzer = new CSharpCognitiveComplexityAnalyzer();
 * const results = analyzer.analyzeFunctions(csharpSourceCode);
 * console.log(`Function ${results[0].name} has complexity ${results[0].complexity}`);
 * ```
 */
export class CSharpMetricsAnalyzer {
  /** Current nesting level during analysis */
  private nesting = 0;
  /** Current complexity score during analysis */
  private complexity = 0;
  /** Array of complexity details for the current function being analyzed */
  private details: CSharpMetricsDetail[] = [];
  /** The source code text being analyzed */
  private sourceText: string;
  /** Tree-sitter parser instance configured for C# */
  private parser: Parser;

  /**
   * Creates a new instance of the C# cognitive complexity analyzer.
   * Initializes the Tree-sitter parser with the C# language grammar.
   */
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(CSharp);
    this.sourceText = "";
  }

  /**
   * Analyzes all functions in the provided C# source code.
   *
   * This method parses the source code and identifies all function-like constructs
   * (methods, constructors, destructors, operators, etc.) and calculates their
   * cognitive complexity scores.
   *
   * @param sourceText - The complete C# source code to analyze
   * @returns An array of complexity analysis results, one for each function found
   *
   * @example
   * ```typescript
   * const sourceCode = `
   * public class Calculator {
   *   public int Add(int a, int b) {
   *     if (a < 0 || b < 0) {
   *       throw new ArgumentException("Negative numbers not allowed");
   *     }
   *     return a + b;
   *   }
   * }`;
   * const results = analyzer.analyzeFunctions(sourceCode);
   * // results[0].complexity would be 2 (if statement + logical OR)
   * ```
   */
  public analyzeFunctions(sourceText: string): CSharpFunctionMetrics[] {
    this.sourceText = sourceText;
    const tree = this.parser.parse(sourceText);
    const functions: CSharpFunctionMetrics[] = [];

    const visit = (node: Parser.SyntaxNode) => {
      if (this.isFunctionDeclaration(node)) {
        const result = this.analyzeFunction(node);
        if (result) {
          functions.push(result);
        }
      }

      // Continue traversing child nodes
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
   * Checks for various C# function-like constructs including:
   * - Regular methods
   * - Constructors and destructors
   * - Operators and conversion operators
   * - Property accessors (get/set)
   * - Local functions
   *
   * @param node - The syntax node to check
   * @returns True if the node represents a function declaration
   */
  private isFunctionDeclaration(node: Parser.SyntaxNode): boolean {
    return (
      node.type === "method_declaration" ||
      node.type === "constructor_declaration" ||
      node.type === "destructor_declaration" ||
      node.type === "operator_declaration" ||
      node.type === "conversion_operator_declaration" ||
      node.type === "accessor_declaration" ||
      node.type === "local_function_statement"
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
   * @returns Complexity analysis result or null if the function has no body (e.g., abstract methods)
   */
  private analyzeFunction(
    node: Parser.SyntaxNode
  ): CSharpFunctionMetrics | null {
    // Reset state for new function
    this.nesting = 0;
    this.complexity = 0;
    this.details = [];

    // Get function name
    const functionName = this.getFunctionName(node);

    // Find the function body
    const body = this.getFunctionBody(node);
    if (!body) {
      return null; // Abstract method or interface method
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
   * - Regular methods: uses the identifier
   * - Constructors: uses class name + "(constructor)"
   * - Destructors: uses "~<destructor>"
   * - Anonymous functions: uses "<anonymous>"
   *
   * @param node - The function declaration syntax node
   * @returns The function name as a string
   */
  private getFunctionName(node: Parser.SyntaxNode): string {
    // Handle special function types first
    if (node.type === "constructor_declaration") {
      // Find parent class
      let parent = node.parent;
      while (parent && parent.type !== "class_declaration") {
        parent = parent.parent;
      }
      if (parent) {
        const classNameNode = parent.children.find(
          (child) => child.type === "identifier"
        );
        if (classNameNode) {
          return (
            this.sourceText.substring(
              classNameNode.startIndex,
              classNameNode.endIndex
            ) + " (constructor)"
          );
        }
      }
      return "<constructor>";
    }

    // For destructors
    if (node.type === "destructor_declaration") {
      return "~<destructor>";
    }

    // Try to find identifier node for the function name (regular methods)
    const nameNode = node.children.find((child) => child.type === "identifier");
    if (nameNode) {
      return this.sourceText.substring(nameNode.startIndex, nameNode.endIndex);
    }

    return "<anonymous>";
  }

  /**
   * Finds the function body within a function declaration node.
   *
   * Looks for either a block statement (traditional method body) or
   * an arrow expression clause (expression-bodied method). When preprocessor
   * directives are present, the body might be separated from the method signature,
   * so we also search sibling nodes for potential method bodies.
   *
   * @param node - The function declaration syntax node
   * @returns The body node or null if no body is found (abstract/interface methods)
   */
  private getFunctionBody(node: Parser.SyntaxNode): Parser.SyntaxNode | null {
    // First, try to find body in immediate children (normal case)
    const directBody = node.children.find(
      (child) =>
        child.type === "block" || child.type === "arrow_expression_clause"
    );

    if (directBody) {
      return directBody;
    }

    // If no body found in children, the method might be split by preprocessor directives
    // Check if this method ends with a semicolon (indicating it's incomplete due to preprocessing)
    const lastChild = node.children[node.children.length - 1];
    if (lastChild && lastChild.type === ";") {
      // This looks like a method signature split by preprocessor - try to find body in siblings
      const parent = node.parent;
      if (parent) {
        // Look for preprocessor blocks that immediately follow this method
        const methodIndex = parent.children.indexOf(node);
        for (let i = methodIndex + 1; i < parent.children.length; i++) {
          const sibling = parent.children[i];

          // If we find a preproc_if, look inside it for method body content
          if (sibling.type === "preproc_if") {
            // Create a synthetic body by analyzing the content within the preprocessor block
            return this.createSyntheticBodyFromPreprocessor(sibling);
          }

          // Stop searching if we hit another method or major declaration
          if (
            this.isFunctionDeclaration(sibling) ||
            sibling.type === "class_declaration" ||
            sibling.type === "interface_declaration"
          ) {
            break;
          }
        }
      }
    }

    return null;
  }

  /**
   * Creates a synthetic function body node by analyzing content within preprocessor blocks.
   * This handles cases where method bodies are fragmented by #if/#else/#endif blocks.
   *
   * @param preprocessorNode - The preprocessor directive node to analyze
   * @returns A synthetic body node that can be analyzed for complexity
   */
  private createSyntheticBodyFromPreprocessor(
    preprocessorNode: Parser.SyntaxNode
  ): Parser.SyntaxNode {
    // Return the preprocessor node itself - we'll handle the complexity analysis
    // by looking at all nodes within it during the visit process
    return preprocessorNode;
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

    // Handle nesting changes
    if (this.increasesNesting(node)) {
      this.nesting++;
      // Process child nodes with increased nesting
      for (const child of node.children) {
        // Skip nested function declarations to avoid double-counting
        if (!this.isFunctionDeclaration(child)) {
          this.visit(child);
        }
      }
      this.nesting--;
    } else {
      // Process child nodes at same nesting level
      for (const child of node.children) {
        // Skip nested function declarations to avoid double-counting
        if (!this.isFunctionDeclaration(child)) {
          this.visit(child);
        }
      }
    }
  }

  /**
   * Calculates the complexity increment for a specific syntax node type.
   *
   * Based on cognitive complexity rules:
   * - Control flow statements (if, while, for, switch): +1
   * - Exception handling (try, catch): +1
   * - Logical operators (&&, ||): +1 each
   * - Conditional expressions (ternary): +1
   * - Nested constructs (lambdas in loops): +1 for nesting
   * - Jump statements in nested contexts: +1
   *
   * @param node - The syntax node to evaluate
   * @returns The complexity increment (0 or positive integer)
   */
  private getComplexityIncrement(node: Parser.SyntaxNode): number {
    switch (node.type) {
      // Control flow statements (+1)
      case "if_statement":
      case "while_statement":
      case "for_statement":
      case "foreach_statement":
      case "switch_statement":
      case "switch_expression":
        return 1;

      // Exception handling (+1)
      case "try_statement":
      case "catch_clause":
        return 1;

      // Logical operators (+1 for each)
      case "binary_expression":
        const operator = this.getBinaryOperator(node);
        if (operator === "&&" || operator === "||") {
          return 1;
        }
        return 0;

      // Conditional expressions (+1)
      case "conditional_expression":
        return 1;

      // Lambda expressions and anonymous methods (+1 for nesting)
      case "lambda_expression":
      case "anonymous_method_expression":
        return this.nesting > 0 ? 1 : 0;

      // Continue and break in nested structures
      case "continue_statement":
      case "break_statement":
        return this.nesting > 0 ? 1 : 0;

      // Goto statements
      case "goto_statement":
        return 1;

      // Handle ERROR nodes that might contain complexity patterns due to preprocessor issues
      case "ERROR":
        return this.getComplexityFromErrorNode(node);

      // Handle malformed field declarations that might contain complexity patterns
      // This can happen when preprocessor directives cause ternary operators to be
      // misinterpreted as field declarations
      case "field_declaration":
      case "variable_declaration":
        return this.getComplexityFromMalformedDeclaration(node);

      default:
        return 0;
    }
  }

  /**
   * Analyzes ERROR nodes for complexity patterns that may have been fragmented by preprocessor directives.
   * This is a heuristic approach to handle cases where tree-sitter cannot parse the code properly
   * due to preprocessor directives splitting method bodies.
   *
   * @param errorNode - The ERROR syntax node to analyze
   * @returns The complexity increment found within the error node
   */
  private getComplexityFromErrorNode(errorNode: Parser.SyntaxNode): number {
    const text = this.sourceText.substring(
      errorNode.startIndex,
      errorNode.endIndex
    );
    let complexity = 0;

    // Look for common complexity patterns in the text
    // Note: This is a heuristic approach and may not catch all cases

    // Look for if keywords that might indicate control flow
    if (/\bif\s*\(/.test(text)) {
      complexity += 1;
    }

    // Look for while loops
    if (/\bwhile\s*\(/.test(text)) {
      complexity += 1;
    }

    // Look for for loops
    if (/\bfor\s*\(/.test(text)) {
      complexity += 1;
    }

    // Look for foreach loops
    if (/\bforeach\s*\(/.test(text)) {
      complexity += 1;
    }

    // Look for logical operators - be more precise about detection
    const logicalOpMatches = text.match(/&&|\|\|/g);
    if (logicalOpMatches) {
      complexity += logicalOpMatches.length;
    }

    // Look for ternary operators - check for fragments too
    // Handle both complete ternary and fragmented ternary parts
    if (
      /\?[^?]*:/.test(text) ||
      (/\?/.test(text) && this.hasMatchingColonInSiblings(errorNode))
    ) {
      complexity += 1;
    }

    // Look for try-catch blocks
    if (/\btry\s*\{/.test(text)) {
      complexity += 1;
    }
    if (/\bcatch\s*\(/.test(text)) {
      complexity += 1;
    }

    return complexity;
  }

  /**
   * Checks if there are matching colon tokens in sibling nodes to complete a ternary operator.
   * This handles cases where the ternary operator is split across multiple ERROR nodes.
   *
   * @param errorNode - The ERROR node that contains a question mark
   * @returns True if a matching colon is found in nearby nodes
   */
  private hasMatchingColonInSiblings(errorNode: Parser.SyntaxNode): boolean {
    const parent = errorNode.parent;
    if (!parent) {
      return false;
    }

    const errorIndex = parent.children.indexOf(errorNode);

    // Look in the next few sibling nodes for a colon
    for (
      let i = errorIndex + 1;
      i < Math.min(errorIndex + 3, parent.children.length);
      i++
    ) {
      const sibling = parent.children[i];
      const siblingText = this.sourceText.substring(
        sibling.startIndex,
        sibling.endIndex
      );
      if (siblingText.includes(":") && !siblingText.includes("::")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Analyzes malformed field/variable declarations for complexity patterns.
   * This handles cases where preprocessor directives cause ternary operators or other
   * complexity patterns to be misinterpreted as variable declarations.
   *
   * @param declarationNode - The field_declaration or variable_declaration node to analyze
   * @returns The complexity increment found within the declaration
   */
  private getComplexityFromMalformedDeclaration(
    declarationNode: Parser.SyntaxNode
  ): number {
    // Only analyze declarations that are likely misinterpreted due to preprocessor issues
    // We check if this declaration is inside a preprocessor block and contains complexity patterns
    if (!this.isInPreprocessorBlock(declarationNode)) {
      return 0; // Normal field declarations don't contribute to complexity
    }

    const text = this.sourceText.substring(
      declarationNode.startIndex,
      declarationNode.endIndex
    );
    let complexity = 0;

    // Look for ternary operators that got misinterpreted as declarations
    // Pattern: identifier ? value : value
    if (/\w+\s*\?\s*[^?]+\s*:\s*[^:;]+/.test(text)) {
      complexity += 1;
    }

    // Look for logical operators
    const logicalOpMatches = text.match(/&&|\|\|/g);
    if (logicalOpMatches) {
      complexity += logicalOpMatches.length;
    }

    return complexity;
  }

  /**
   * Checks if a node is within a preprocessor block (preproc_if, preproc_else, etc.)
   *
   * @param node - The node to check
   * @returns True if the node is within a preprocessor directive block
   */
  private isInPreprocessorBlock(node: Parser.SyntaxNode): boolean {
    let parent = node.parent;
    while (parent) {
      if (parent.type.startsWith("preproc_")) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  /**
   * Generates a human-readable reason for complexity found in ERROR nodes.
   *
   * @param errorNode - The ERROR syntax node to analyze
   * @returns A descriptive string explaining the complexity increment
   */
  private getComplexityReasonFromErrorNode(
    errorNode: Parser.SyntaxNode
  ): string {
    const text = this.sourceText.substring(
      errorNode.startIndex,
      errorNode.endIndex
    );

    // Try to identify what type of complexity pattern was found
    if (/\bif\s*\(/.test(text)) {
      return "if statement (in preprocessor block)";
    }
    if (/\bwhile\s*\(/.test(text)) {
      return "while loop (in preprocessor block)";
    }
    if (/\bfor\s*\(/.test(text)) {
      return "for loop (in preprocessor block)";
    }
    if (/\bforeach\s*\(/.test(text)) {
      return "foreach loop (in preprocessor block)";
    }
    if (/&&|\|\|/.test(text)) {
      return "logical operator (in preprocessor block)";
    }
    if (
      /\?[^?]*:/.test(text) ||
      (/\?/.test(text) && this.hasMatchingColonInSiblings(errorNode))
    ) {
      return "ternary operator (in preprocessor block)";
    }
    if (/\btry\s*\{/.test(text)) {
      return "try statement (in preprocessor block)";
    }
    if (/\bcatch\s*\(/.test(text)) {
      return "catch clause (in preprocessor block)";
    }

    return "complexity pattern (in preprocessor block)";
  }

  /**
   * Generates a human-readable reason for complexity found in malformed declarations.
   *
   * @param declarationNode - The field_declaration or variable_declaration node to analyze
   * @returns A descriptive string explaining the complexity increment
   */
  private getComplexityReasonFromMalformedDeclaration(
    declarationNode: Parser.SyntaxNode
  ): string {
    if (!this.isInPreprocessorBlock(declarationNode)) {
      return "complexity in declaration"; // Fallback
    }

    const text = this.sourceText.substring(
      declarationNode.startIndex,
      declarationNode.endIndex
    );

    // Try to identify what type of complexity pattern was found
    if (/\w+\s*\?\s*[^?]+\s*:\s*[^:;]+/.test(text)) {
      return "ternary operator (in preprocessor block)";
    }
    if (/&&|\|\|/.test(text)) {
      return "logical operator (in preprocessor block)";
    }

    return "complexity pattern in declaration (preprocessor block)";
  }

  /**
   * Extracts the binary operator from a binary expression node.
   *
   * Searches for operator tokens within the binary expression node
   * to identify logical operators like && and ||.
   *
   * @param node - The binary expression syntax node
   * @returns The operator string or null if not found
   */
  private getBinaryOperator(node: Parser.SyntaxNode): string | null {
    // Find the operator token in binary expression
    const operatorNode = node.children.find(
      (child) =>
        child.type === "&&" ||
        child.type === "||" ||
        child.type === "binary_operator"
    );

    if (operatorNode) {
      return this.sourceText.substring(
        operatorNode.startIndex,
        operatorNode.endIndex
      );
    }

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
      case "while_statement":
        return "while loop";
      case "for_statement":
        return "for loop";
      case "foreach_statement":
        return "foreach loop";
      case "switch_statement":
        return "switch statement";
      case "switch_expression":
        return "switch expression";
      case "try_statement":
        return "try statement";
      case "catch_clause":
        return "catch clause";
      case "binary_expression":
        const operator = this.getBinaryOperator(node);
        return `binary ${operator} operator`;
      case "conditional_expression":
        return "ternary operator";
      case "lambda_expression":
        return "lambda expression (nested)";
      case "anonymous_method_expression":
        return "anonymous method (nested)";
      case "continue_statement":
        return "continue statement (nested)";
      case "break_statement":
        return "break statement (nested)";
      case "goto_statement":
        return "goto statement";
      case "ERROR":
        return this.getComplexityReasonFromErrorNode(node);
      case "field_declaration":
      case "variable_declaration":
        return this.getComplexityReasonFromMalformedDeclaration(node);
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
      node.type === "while_statement" ||
      node.type === "for_statement" ||
      node.type === "foreach_statement" ||
      node.type === "switch_statement" ||
      node.type === "try_statement" ||
      node.type === "catch_clause" ||
      node.type === "lambda_expression" ||
      node.type === "anonymous_method_expression"
    );
  }

  /**
   * Static factory method to analyze C# source code.
   *
   * Creates a new analyzer instance and runs the analysis on the provided source code.
   * This is a convenience method for one-time analysis without manually managing
   * analyzer instances.
   *
   * @param sourceText - The complete C# source code to analyze
   * @returns An array of complexity analysis results for all functions found
   *
   * @example
   * ```typescript
   * const results = CSharpCognitiveComplexityAnalyzer.analyzeFile(csharpCode);
   * results.forEach(func => {
   *   console.log(`${func.name}: ${func.complexity}`);
   * });
   * ```
   */
  public static analyzeFile(sourceText: string): CSharpFunctionMetrics[] {
    const analyzer = new CSharpMetricsAnalyzer();
    return analyzer.analyzeFunctions(sourceText);
  }
}
