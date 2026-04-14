export interface DiffFile {
  filePath: string;
  language: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  addedLines: string[];
  removedLines: string[];
  context: string[];
}

export interface StagedDiff {
  files: DiffFile[];
  raw: string;
}

export interface GitDiffSummary {
  filesCount: number;
  addedLines: number;
  removedLines: number;
  files: DiffFile[];
}

export interface LibraryReference {
  name: string;
  importStatement: string;
  filePath: string;
}

export interface DocumentationContext {
  libraryId: string;
  libraryName: string;
  content: string;
}

export interface ReviewSuggestion {
  filePath: string;
  line: number | null;
  severity: "info" | "warning" | "error";
  category:
    | "style"
    | "performance"
    | "correctness"
    | "security"
    | "best-practice";
  message: string;
  suggestedCode: string | null;
  docReference: string | null;
}

export interface ReviewReport {
  timestamp: Date;
  filesReviewed: number;
  suggestions: ReviewSuggestion[];
  documentationSources: string[];
}
