export interface GitDiffSummary {
  raw: string;
  filesCount: number;
  addedLines: number;
  removedLines: number;
  files: DiffFile[];
}

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

export interface WebviewMessage {
  command: string;
  configured?: boolean;
  diff?: GitDiffSummary;
  rawDiff?: string;
}
