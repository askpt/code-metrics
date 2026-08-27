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
