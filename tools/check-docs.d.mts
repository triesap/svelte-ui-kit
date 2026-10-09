export interface DocumentationIssue {
  file: string;
  code: string;
  message: string;
}
export function checkLinks(
  root: string,
  documents: readonly string[],
): DocumentationIssue[];
export function markdownFiles(root: string, directory?: string): string[];
