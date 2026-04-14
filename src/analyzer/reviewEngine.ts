import {
  StagedDiff,
  DocumentationContext,
  ReviewReport,
  LibraryReference,
} from "../models/types";
import { extractLibraryReferencesFromDiff } from "./libraryReferences";

export function extractLibraryReferences(diff: StagedDiff): LibraryReference[] {
  return extractLibraryReferencesFromDiff(diff);
}

export async function analyzeDiff(
  diff: StagedDiff,
  docsContext: DocumentationContext[],
): Promise<ReviewReport> {
  // TODO: Analyze the diff against documentation context
  // TODO: Generate structured suggestions grouped by category
  throw new Error("Not implemented");
}
