import Parser from "tree-sitter";

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
