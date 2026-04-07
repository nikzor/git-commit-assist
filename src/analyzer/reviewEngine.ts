import {
  StagedDiff,
  DocumentationContext,
  ReviewReport,
  LibraryReference,
} from "../models/types";

export function extractLibraryReferences(diff: StagedDiff): LibraryReference[] {
  const refs: LibraryReference[] = [];
  const seen = new Set<string>();

  const registerRef = (
    filePath: string,
    importStatement: string,
    name: string,
  ): void => {
    if (!name || name.startsWith(".") || name.startsWith("/")) {
      return;
    }

    const key = `${filePath}:${name}:${importStatement}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    refs.push({
      name,
      importStatement,
      filePath,
    });
  };

  for (const file of diff.files) {
    for (const hunk of file.hunks) {
      for (const line of hunk.addedLines) {
        const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        if (fromMatch?.[1]) {
          registerRef(file.filePath, line, fromMatch[1]);
          continue;
        }

        const importMatch = line.match(/import\s+['"]([^'"]+)['"]/);
        if (importMatch?.[1]) {
          registerRef(file.filePath, line, importMatch[1]);
          continue;
        }

        const requireMatch = line.match(/require\(\s*['"]([^'"]+)['"]\s*\)/);
        if (requireMatch?.[1]) {
          registerRef(file.filePath, line, requireMatch[1]);
        }
      }
    }
  }

  return refs;
}

export async function analyzeDiff(
  diff: StagedDiff,
  docsContext: DocumentationContext[],
): Promise<ReviewReport> {
  // TODO: Analyze the diff against documentation context
  // TODO: Generate structured suggestions grouped by category
  throw new Error("Not implemented");
}
