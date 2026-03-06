import { DocumentationContext, LibraryReference } from '../models/types';

export async function resolveLibraryId(libraryName: string): Promise<string | null> {
  // TODO: Call Context7 MCP `resolve-library-id` tool
  throw new Error('Not implemented');
}

export async function getLibraryDocs(libraryId: string, topic?: string): Promise<DocumentationContext | null> {
  // TODO: Call Context7 MCP `get-library-docs` tool
  throw new Error('Not implemented');
}

export async function fetchDocumentationForReferences(
  references: LibraryReference[]
): Promise<DocumentationContext[]> {
  // TODO: Deduplicate library names, resolve IDs, fetch docs in parallel
  throw new Error('Not implemented');
}
