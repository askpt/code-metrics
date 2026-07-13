/**
 * @fileoverview Java Cognitive Complexity Analyzer
 *
 * This module provides cognitive complexity analysis for Java source code using Tree-sitter.
 * It implements the cognitive complexity metric which measures how difficult code is to
 * understand, taking into account control flow, nesting, and other complexity factors.
 *
 * The analyzer uses the tree-sitter-java parser to build an Abstract Syntax Tree (AST)
 * and then traverses it to calculate complexity scores for each method/constructor.
 */

import Parser from "tree-sitter";
import Java from "tree-sitter-java";

// Module-level singleton: parser initialization is expensive, so we reuse one instance per language.
const _parser = new Parser();
_parser.setLanguage(Java);

/**
 * Represents a single complexity detail for a specific Java code construct.
 * Each detail contributes to the overall cognitive complexity of a method.
 */
interface JavaMetricsDetail {
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
 * Represents the complete cognitive complexity analysis results for a single Java method.
 * Includes the overall complexity score and detailed breakdown of contributing factors.
 */
interface JavaFunctionMetrics {
  /** The name or identifier of the method (qualified as ClassName.methodName) */
  name: string;
  /** The total cognitive complexity score for this method */
  complexity: number;
  /** Array of individual complexity details that contribute to the total score */
  details: JavaMetricsDetail[];
  /** Line number where the method definition starts (0-based) */
  startLine: number;
  /** Line number where the method definition ends (0-based) */
  endLine: number;
  /** Column number where the method definition starts (0-based) */
  startColumn: number;
  /** Column number where the method definition ends (0-based) */
  endColumn: number;
}

/**
 * Cognitive Complexity Analyzer for Java source code.
 *
 * This class implements cognitive complexity analysis specifically for Java code.
 * Cognitive complexity is a metric that measures how difficult code is to understand,
 * taking into account factors like:
 * - Control flow statements (if, for, while, do-while, switch, catch)
 * - Nesting levels
 * - Logical operators (&& and ||)
 * - Lambda expressions
 * - Ternary expressions
 *
 * The analyzer uses Tree-sitter for parsing and provides detailed analysis
 * including the exact location and reason for each complexity increment.
 *
 * @example
 * ```typescript
 * const results = JavaMetricsAnalyzer.analyzeFile(javaSourceCode);
 * console.log(`Method ${results[0].name} has complexity ${results[0].complexity}`);
 * ```
 */
export class JavaMetricsAnalyzer {
  private static readonly ELSE_BRANCH_INDEX = 2;

  /** Node types that represent method or constructor declarations. */
  private static readonly METHOD_DECLARATION_TYPES: ReadonlySet<string> = new Set([
    "method_declaration",
    "constructor_declaration",
  ]);

  /** Node types that increase the nesting level for cognitive complexity analysis. */
  private static readonly NESTING_TYPES: ReadonlySet<string> = new Set([
    "if_statement",
    "while_statement",
    "for_statement",
    "enhanced_for_statement",
    "do_statement",
    "catch_clause",
    "switch_expression",
    "lambda_expression",
  ]);

  /** Current nesting level during analysis */
  private nesting = 0;
  /** Current complexity score during analysis */
  private complexity = 0;
  /** Array of complexity details for the current method being analyzed */
  private details: JavaMetricsDetail[] = [];
  /** The source code text being analyzed */
  private sourceText: string;

  constructor() {
    this.sourceText = "";
  }

  /**
   * Analyzes all methods and constructors in the provided Java source code.
   *
   * @param sourceText - The complete Java source code to analyze
   * @returns An array of complexity analysis results, one for each method/constructor found
   */
  public analyzeFunctions(sourceText: string): JavaFunctionMetrics[] {
    this.sourceText = sourceText;
    const tree = _parser.parse(sourceText);
    const functions: JavaFunctionMetrics[] = [];

    const visit = (node: Parser.SyntaxNode) => {
      if (this.isMethodDeclaration(node)) {
        const result = this.analyzeMethod(node);
        if (result) {
          functions.push(result);
        }
        // Do not recurse into the method body again — analyzeMethod handles it
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
   * Determines if a syntax node represents a method or constructor declaration.
   */
  private isMethodDeclaration(node: Parser.SyntaxNode): boolean {
    return JavaMetricsAnalyzer.METHOD_DECLARATION_TYPES.has(node.type);
  }

  /**
   * Analyzes the cognitive complexity of a single method or constructor.
   *
   * @param node - The syntax node representing the method/constructor declaration
   * @returns Complexity analysis result or null if no body is found
   */
  private analyzeMethod(node: Parser.SyntaxNode): JavaFunctionMetrics | null {
    // Check for the body first — abstract/interface methods have no body and can be
    // skipped without resetting state or performing the O(depth) name resolution walk.
    const body = node.childForFieldName("body");
    if (!body) {
      return null; // Abstract or interface method without body
    }

    this.nesting = 0;
    this.complexity = 0;
    this.details = [];

    const methodName = this.getMethodName(node);

    this.visitBody(body);

    return {
      name: methodName,
      complexity: this.complexity,
      details: this.details,
      startLine: node.startPosition.row,
      endLine: node.endPosition.row,
      startColumn: node.startPosition.column,
      endColumn: node.endPosition.column,
    };
  }

  /**
   * Extracts the qualified method name (ClassName.methodName).
   *
   * @param node - The method or constructor declaration node
   * @returns Qualified name string
   */
  private getMethodName(node: Parser.SyntaxNode): string {
    const nameNode = node.childForFieldName("name");
    const methodName = nameNode
      ? this.sourceText.substring(nameNode.startIndex, nameNode.endIndex)
      : "<anonymous>";

    // Walk up the AST to find the enclosing class or interface name
    let parent = node.parent;
    while (parent) {
      if (
        parent.type === "class_declaration" ||
        parent.type === "interface_declaration" ||
        parent.type === "enum_declaration"
      ) {
        const classNameNode = parent.childForFieldName("name");
        if (classNameNode) {
          const className = this.sourceText.substring(
            classNameNode.startIndex,
            classNameNode.endIndex
          );
          return `${className}.${methodName}`;
        }
      }
      parent = parent.parent;
    }

    return methodName;
  }

  /**
   * Visits a block node, traversing all child nodes at the current nesting level.
   *
   * @param node - The block or body node to visit
   */
  private visitBody(node: Parser.SyntaxNode): void {
    for (const child of node.children) {
      this.visit(child);
    }
  }

  /**
   * Recursively visits a syntax node, calculating its complexity contribution
   * and traversing its children with updated nesting levels.
   *
   * @param node - The current syntax node being visited
   * @param skipSelfIncrement - When true, skips this node's own structural increment
   * (used for else-if nodes that are already counted by the parent if_statement).
   */
  private visit(node: Parser.SyntaxNode, skipSelfIncrement = false): void {
    const increment =
      skipSelfIncrement && node.type === "if_statement"
        ? 0
        : this.getComplexityIncrement(node);
    if (increment > 0) {
      this.addDetail(
        increment,
        this.getComplexityReason(node),
        node.startPosition.row,
        node.startPosition.column
      );
    }

    if (node.type === "if_statement") {
      // A single find() serves both as the existence check and the position source,
      // avoiding the prior double scan (hasElseBranch via .some() + .find()).
      const elseToken = node.children.find((c) => !c.isNamed && c.type === "else");
      if (elseToken) {
        this.addDetail(
          1,
          this.getElseBranchReason(node),
          elseToken.startPosition.row,
          elseToken.startPosition.column
        );
      }
    }

    // Conditionally bump nesting, iterate children once, then restore.
    // When nesting, if_statement's else branch skips the inner if's own increment
    // to avoid double-counting (the else_clause +1 already accounts for it).
    const nests = this.increasesNesting(node);
    if (nests) { this.nesting++; }
    const elseBranchNode =
      nests && node.type === "if_statement"
        ? this.getElseBranchNode(node)
        : undefined;
    for (const child of node.children) {
      if (!this.isMethodDeclaration(child)) {
        this.visit(child, elseBranchNode !== undefined && child === elseBranchNode);
      }
    }
    if (nests) { this.nesting--; }
  }

  private addDetail(
    increment: number,
    reason: string,
    line: number,
    column: number
  ): void {
    this.complexity += increment;
    this.details.push({
      increment,
      reason,
      line,
      column,
      nesting: this.nesting,
    });
  }

  /**
   * Returns the reason label for an if-statement else branch.
   * Distinguishes between `else if` (nested if_statement as else branch)
   * and plain `else` (block or single statement branch).
   */
  private getElseBranchReason(node: Parser.SyntaxNode): string {
    const elseBranch = this.getElseBranchNode(node);
    return elseBranch?.type === "if_statement" ? "else if clause" : "else clause";
  }

  /**
   * Returns the optional else branch node for an if_statement.
   * For tree-sitter-java named children: index 0 = condition, 1 = then branch,
   * 2 = else branch when present.
   */
  private getElseBranchNode(node: Parser.SyntaxNode): Parser.SyntaxNode | null {
    return node.namedChildren.length > JavaMetricsAnalyzer.ELSE_BRANCH_INDEX
      ? node.namedChildren[JavaMetricsAnalyzer.ELSE_BRANCH_INDEX]
      : null;
  }

  /**
   * Calculates the complexity increment for a specific syntax node type.
   *
   * Structural increments (1 + nesting):
   *   All node types in NESTING_TYPES (if_statement, while_statement, for_statement,
   *   enhanced_for_statement, do_statement, catch_clause, switch_expression, lambda_expression)
   *
   * Flat increments (+1):
   *   ternary_expression, binary && / ||
   *
   * @param node - The syntax node to evaluate
   * @returns The complexity increment (0 or positive integer)
   */
  private getComplexityIncrement(node: Parser.SyntaxNode): number {
    // All NESTING_TYPES nodes produce a structural increment (1 + current nesting).
    // NESTING_TYPES is the single source of truth for structural-increment node types.
    if (JavaMetricsAnalyzer.NESTING_TYPES.has(node.type)) {
      return 1 + this.nesting;
    }

    switch (node.type) {
      case "ternary_expression":
        return 1;

      case "binary_expression": {
        const op = this.getBinaryOperator(node);
        // Only count if this is the "outermost" binary expression for this operator chain
        // (i.e. the parent is NOT also a binary_expression with the same operator)
        if (op === "&&" || op === "||") {
          const parent = node.parent;
          if (parent && parent.type === "binary_expression") {
            const parentOp = this.getBinaryOperator(parent);
            if (parentOp === op) {
              return 0; // Already counted by the parent
            }
          }
          return 1;
        }
        return 0;
      }

      default:
        return 0;
    }
  }

  /**
   * Extracts the operator from a binary expression node.
   *
   * @param node - The binary_expression syntax node
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
      case "enhanced_for_statement":
        return "enhanced for loop";
      case "do_statement":
        return "do-while loop";
      case "catch_clause":
        return "catch clause";
      case "switch_expression":
        return "switch statement";
      case "lambda_expression":
        return "lambda expression";
      case "ternary_expression":
        return "ternary expression";
      case "binary_expression": {
        const op = this.getBinaryOperator(node);
        return `binary ${op} operator`;
      }
      default:
        return "unknown complexity source";
    }
  }

  /**
   * Determines if a syntax node increases the nesting level for child nodes.
   *
   * @param node - The syntax node to check
   * @returns True if the node increases nesting level
   */
  private increasesNesting(node: Parser.SyntaxNode): boolean {
    return JavaMetricsAnalyzer.NESTING_TYPES.has(node.type);
  }

  /**
   * Static factory method to analyze Java source code.
   *
   * @param sourceText - The complete Java source code to analyze
   * @returns An array of complexity analysis results for all methods found
   */
  public static analyzeFile(sourceText: string): JavaFunctionMetrics[] {
    const analyzer = new JavaMetricsAnalyzer();
    return analyzer.analyzeFunctions(sourceText);
  }
}
