import { execFile } from "child_process";
import { promisify } from "util";
import { DocumentationContext, LibraryReference } from "../models/types";

const execFileAsync = promisify(execFile);
const CTX7_TIMEOUT_MS = 15_000;
const MAX_PARALLEL_LOOKUPS = 2;

interface FetchDocsOptions {
  workspaceRoot?: string;
}

async function runCtx7Command(
  args: string[],
  options: FetchDocsOptions = {},
): Promise<string> {
  try {
    const { stdout } = await execFileAsync("npx", ["-y", "ctx7", ...args], {
      cwd: options.workspaceRoot,
      timeout: CTX7_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 5 * 1024 * 1024,
    });
    return stdout ?? "";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Context7 via npx failed. Run "npx ctx7 setup" and ensure network access. ${message}`,
    );
  }
}

export async function resolveLibraryId(
  libraryName: string,
  options: FetchDocsOptions = {},
): Promise<string | null> {
  const output = await runCtx7Command(
    ["library", libraryName, "API docs"],
    options,
  );
  const match = output.match(/\/[a-z0-9._-]+\/[a-z0-9._-]+/i);
  return match ? match[0] : null;
}

export async function getLibraryDocs(
  libraryId: string,
  topic?: string,
  options: FetchDocsOptions = {},
): Promise<DocumentationContext | null> {
  const query = topic?.trim() || "API reference and best practices";
  const output = await runCtx7Command(["docs", libraryId, query], options);
  if (!output.trim()) {
    return null;
  }

  return {
    libraryId,
    libraryName: libraryId.split("/").pop() ?? libraryId,
    content: output.trim(),
  };
}

export async function fetchDocumentationForReferences(
  references: LibraryReference[],
  options: FetchDocsOptions = {},
): Promise<DocumentationContext[]> {
  const uniqueLibraryNames = [...new Set(references.map((ref) => ref.name))];
  const docs = await mapWithConcurrency(
    uniqueLibraryNames,
    MAX_PARALLEL_LOOKUPS,
    async (libraryName) => {
      const libraryId = await resolveLibraryId(libraryName, options);
      if (!libraryId) {
        return null;
      }
      return getLibraryDocs(
        libraryId,
        `How to use ${libraryName} correctly`,
        options,
      );
    },
  );

  return docs.filter((doc): doc is DocumentationContext => doc !== null);
}

async function mapWithConcurrency<TIn, TOut>(
  items: TIn[],
  concurrency: number,
  mapper: (item: TIn) => Promise<TOut>,
): Promise<TOut[]> {
  if (items.length === 0) {
    return [];
  }

  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<TOut>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: safeConcurrency }, () => worker()),
  );

  return results;
}
