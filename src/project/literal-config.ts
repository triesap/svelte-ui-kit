/** Syntactic object prototypes are outside the literal configuration contract. */
import ts from "typescript";
export function hasLiteralPrototypeAssignment(node: ts.Node): boolean {
  if (
    ts.isPropertyAssignment(node) &&
    (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
    node.name.text === "__proto__"
  )
    return true;
  return ts.forEachChild(node, hasLiteralPrototypeAssignment) === true;
}
