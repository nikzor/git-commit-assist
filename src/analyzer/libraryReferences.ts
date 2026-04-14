import { LibraryReference, StagedDiff } from "../models/types";

const FROM_IMPORT_RE = /from\s+['"]([^'"]+)['"]/;
const SIDE_EFFECT_IMPORT_RE = /import\s+['"]([^'"]+)['"]/;
const REQUIRE_RE = /require\(\s*['"]([^'"]+)['"]\s*\)/;

function resolveLibraryName(importStatement: string): string | null {
  const fromMatch = importStatement.match(FROM_IMPORT_RE);
  if (fromMatch?.[1]) {
    return fromMatch[1];
  }

  const sideEffectImportMatch = importStatement.match(SIDE_EFFECT_IMPORT_RE);
  if (sideEffectImportMatch?.[1]) {
    return sideEffectImportMatch[1];
  }

  const requireMatch = importStatement.match(REQUIRE_RE);
  if (requireMatch?.[1]) {
    return requireMatch[1];
  }

  return null;
}

function isExternalLibrary(libraryName: string): boolean {
  return !libraryName.startsWith(".") && !libraryName.startsWith("/");
}

export function extractLibraryReferencesFromAddedLines(
  addedLines: Array<{ importStatement: string; filePath: string }>,
): LibraryReference[] {
  const seen = new Set<string>();
  const references: LibraryReference[] = [];

  for (const line of addedLines) {
    const libraryName = resolveLibraryName(line.importStatement);
    if (!libraryName || !isExternalLibrary(libraryName)) {
      continue;
    }

    const key = `${line.filePath}:${libraryName}:${line.importStatement}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    references.push({
      name: libraryName,
      importStatement: line.importStatement,
      filePath: line.filePath,
    });
  }

  return references;
}

export function extractLibraryReferencesFromRawDiff(
  rawDiff: string,
): LibraryReference[] {
  const lines = rawDiff.split("\n");
  const addedLines: Array<{ importStatement: string; filePath: string }> = [];
  let currentFilePath = "unknown";

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/(.+) b\/(.+)$/);
      currentFilePath = match?.[2] ?? "unknown";
      continue;
    }

    if (!line.startsWith("+") || line.startsWith("+++")) {
      continue;
    }

    addedLines.push({
      importStatement: line.slice(1),
      filePath: currentFilePath,
    });
  }

  return extractLibraryReferencesFromAddedLines(addedLines);
}

export function extractLibraryReferencesFromDiff(
  diff: StagedDiff,
): LibraryReference[] {
  const addedLines: Array<{ importStatement: string; filePath: string }> = [];

  for (const file of diff.files) {
    for (const hunk of file.hunks) {
      for (const line of hunk.addedLines) {
        addedLines.push({
          importStatement: line,
          filePath: file.filePath,
        });
      }
    }
  }

  return extractLibraryReferencesFromAddedLines(addedLines);
}
