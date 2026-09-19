import Parser from "tree-sitter";

/**
 * Represents a single complexity detail for a specific code construct.
 * Each detail contributes to the overall cognitive complexity of a function.
 */
export interface MetricsDetail {
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
 * Accumulates cognitive complexity state (current nesting level, running total,
 * and the list of contributing details) while an analyzer traverses a single
 * function/method body.
 *
 * Every language analyzer maintained an identical `nesting`/`complexity`/`details`
 * field trio plus an identical `addDetail()` method; this class centralizes that
 * shared bookkeeping so each analyzer only needs to hold one `acc` field.
 */
export class ComplexityAccumulator {
  /** Current nesting level during analysis */
  nesting = 0;
  /** Current complexity score during analysis */
  complexity = 0;
  /** Array of complexity details for the current function being analyzed */
  details: MetricsDetail[] = [];

  /** Resets all accumulator state, typically before analyzing a new function/method. */
  reset(): void {
    this.nesting = 0;
    this.complexity = 0;
    this.details = [];
  }

  /**
   * Records a complexity-contributing detail and adds its increment to the running total.
   *
   * @param increment - The complexity value contributed by this construct
   * @param reason - Human-readable explanation of why this construct increases complexity
   * @param line - Line number where the construct is located (0-based)
   * @param column - Column number where the construct starts (0-based)
   */
  addDetail(increment: number, reason: string, line: number, column: number): void {
    this.complexity += increment;
    this.details.push({
      increment,
      reason,
      line,
      column,
      nesting: this.nesting,
    });
  }
}

/**
 * Determines whether `node` is the outermost node in a chain of same-operator
 * logical/boolean expressions (e.g. `a && b && c`, `a and b and c`).
 *
 * Cognitive Complexity counts a run of identical boolean operators only once,
 * not once per pairwise node in the parse tree. Since tree-sitter represents
 * `a && b && c` as nested binary expressions, we only want to add complexity
 * for the outermost node of the chain; inner nodes with the same operator and
 * parent type are considered already counted.
 *
 * @param node - The syntax node currently being evaluated
 * @param operator - The operator token for `node` (e.g. "&&", "||", "and")
 * @param sameKindTypes - Node type name(s) that identify this kind of expression
 * @param getOperator - Extracts the operator token from a given node
 * @returns true if `node` is the outermost node in the chain (should be counted)
 */
export function isOutermostInSameOperatorChain(
  node: Parser.SyntaxNode,
  operator: string | null,
  sameKindTypes: string | readonly string[],
  getOperator: (n: Parser.SyntaxNode) => string | null
): boolean {
  const parent = node.parent;
  if (!parent) {
    return true;
  }
  const isSameKind =
    typeof sameKindTypes === "string" ? parent.type === sameKindTypes : sameKindTypes.includes(parent.type);
  if (isSameKind && getOperator(parent) === operator) {
    return false; // inner node of a same-operator chain — already counted by parent
  }
  return true;
}

/**
 * Extracts the `&&`/`||` operator from a binary expression node.
 *
 * binary_expression structure: [left, operator, right] — operator always at
 * index 1. Uses node.type for O(1) operator detection: anonymous tokens in
 * tree-sitter have their literal text as their type, so no sourceText
 * substring allocation is needed.
 *
 * Shared by the C#, Go, Java, and Rust analyzers, which all use the same
 * binary_expression convention for logical operators.
 *
 * @param node - The binary expression syntax node
 * @returns The operator string or null if not found
 */
export function getBinaryLogicalOperator(node: Parser.SyntaxNode): string | null {
  const operatorNode = node.child(1);
  /* c8 ignore next */
  if (!operatorNode) { return null; }
  const type = operatorNode.type;
  if (type === "&&" || type === "||") {
    return type;
  }
  return null;
}

/**
 * Returns true if `node`'s first named child's type matches one of `labelTypes`.
 *
 * Used to detect labeled break/continue/goto statements: in the tree-sitter
 * grammars for Go, Rust, and JS/TS, the label token is always the first (and
 * only) named child of the labeled node, so firstNamedChild gives an O(1)
 * check instead of a linear scan over children.
 *
 * Shared by the Go, Rust, and JS/TS analyzers, which each identify labeled
 * jump statements this way but use different label token type names.
 *
 * @param node - The break/continue/goto syntax node to check
 * @param labelTypes - Node type name(s) that represent a label token
 * @returns true if the node's first named child is a label token
 */
export function hasLabelChild(node: Parser.SyntaxNode, labelTypes: string | readonly string[]): boolean {
  const childType = node.firstNamedChild?.type;
  if (childType === undefined) {
    return false;
  }
  return typeof labelTypes === "string" ? childType === labelTypes : labelTypes.includes(childType);
}

/**
 * Walks up from `node` to find the name of the nearest enclosing type
 * declaration (class, struct, interface, record, or enum), returning `null`
 * if no such ancestor exists (e.g. top-level local functions).
 *
 * Shared by the C# and Java analyzers, which both identify the enclosing
 * type by walking `node.parent` until a type-declaration node type is found,
 * then reading its `name` field.
 *
 * @param node - The syntax node to start searching from (typically a function/method declaration)
 * @param typeDeclarationTypes - Node type name(s) that represent a type declaration
 * @param sourceText - The full source text, used to extract the name substring
 * @returns The enclosing type name, or null if none found
 */
export function findEnclosingTypeName(
  node: Parser.SyntaxNode,
  typeDeclarationTypes: ReadonlySet<string>,
  sourceText: string
): string | null {
  let parent = node.parent;
  while (parent) {
    if (typeDeclarationTypes.has(parent.type)) {
      const nameNode = parent.childForFieldName("name");
      if (nameNode) {
        return sourceText.substring(nameNode.startIndex, nameNode.endIndex);
      }
    }
    parent = parent.parent;
  }
  return null;
}
