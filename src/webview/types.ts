export interface GitDiffSummary {
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
  includeMarkdownFiles?: boolean;
  overviewMarkdown?: string;
  overviewHtml?: string;
  context7Used?: boolean;
  context7Sources?: string[];
  context7Message?: string;
}
