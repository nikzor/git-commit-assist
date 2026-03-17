import { execFile } from 'child_process';
import { promisify } from 'util';
import { DocumentationContext, LibraryReference } from '../models/types';

const execFileAsync = promisify(execFile);

async function runCtx7Command(args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('npx', ['-y', 'ctx7', ...args], {
      maxBuffer: 5 * 1024 * 1024,
    });
    return stdout ?? '';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Context7 via npx failed. Run "npx ctx7 setup" and ensure network access. ${message}`);
  }
}

export async function resolveLibraryId(libraryName: string): Promise<string | null> {
  const output = await runCtx7Command(['library', libraryName, 'API docs']);
  const match = output.match(/\/[a-z0-9._-]+\/[a-z0-9._-]+/i);
  return match ? match[0] : null;
}

export async function getLibraryDocs(libraryId: string, topic?: string): Promise<DocumentationContext | null> {
  const query = topic?.trim() || 'API reference and best practices';
  const output = await runCtx7Command(['docs', libraryId, query]);
  if (!output.trim()) {
    return null;
  }

  return {
    libraryId,
    libraryName: libraryId.split('/').pop() ?? libraryId,
    content: output.trim(),
  };
}

export async function fetchDocumentationForReferences(
  references: LibraryReference[]
): Promise<DocumentationContext[]> {
  const uniqueLibraryNames = [...new Set(references.map((ref) => ref.name))];
  const docs = await Promise.all(
    uniqueLibraryNames.map(async (libraryName) => {
      const libraryId = await resolveLibraryId(libraryName);
      if (!libraryId) {
        return null;
      }
      return getLibraryDocs(libraryId, `How to use ${libraryName} correctly`);
    })
  );

  return docs.filter((doc): doc is DocumentationContext => doc !== null);
}
