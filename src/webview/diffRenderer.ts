import { DiffFile, GitDiffSummary } from './types';

interface DiffRendererElements {
  diffMetaEl: HTMLElement;
  diffStatsEl: HTMLElement;
  diffFilesListEl: HTMLElement;
  overviewDiffStatsEl: HTMLElement;
  overviewDiffFilesListEl: HTMLElement;
}

export interface DiffRenderer {
  renderDiff(diff: GitDiffSummary): void;
  renderOverview(diff: GitDiffSummary): void;
}

export function createDiffRenderer(
  elements: DiffRendererElements,
  maxFilesToRender = 10,
  maxLinesPerFile = 80
): DiffRenderer {
  const {
    diffMetaEl,
    diffStatsEl,
    diffFilesListEl,
    overviewDiffStatsEl,
    overviewDiffFilesListEl,
  } = elements;

  function clearNode(node: HTMLElement): void {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function appendLine(container: HTMLElement, lineType: 'add' | 'remove' | 'context', text: string): void {
    const lineEl = document.createElement('div');
    lineEl.className = `diff-line diff-line-${lineType}`;
    const prefix = lineType === 'add' ? '+ ' : lineType === 'remove' ? '- ' : '  ';
    lineEl.textContent = `${prefix}${text}`;
    container.appendChild(lineEl);
  }

  function countFileStats(file: DiffFile): { added: number; removed: number } {
    return file.hunks.reduce(
      (acc, hunk) => {
        acc.added += hunk.addedLines.length;
        acc.removed += hunk.removedLines.length;
        return acc;
      },
      { added: 0, removed: 0 }
    );
  }

  function renderFiles(targetEl: HTMLElement, diff: GitDiffSummary): void {
    clearNode(targetEl);

    if (diff.files.length === 0) {
      const emptyEl = document.createElement('p');
      emptyEl.className = 'empty-diff';
      emptyEl.textContent = 'No staged diff loaded.';
      targetEl.appendChild(emptyEl);
      return;
    }

    const filesToRender = diff.files.slice(0, maxFilesToRender);
    for (const file of filesToRender) {
      const fileCardEl = document.createElement('section');
      fileCardEl.className = 'diff-file-card';

      const headerEl = document.createElement('div');
      headerEl.className = 'diff-file-header';

      const pathEl = document.createElement('div');
      pathEl.className = 'diff-file-path';
      pathEl.textContent = file.filePath;

      const stats = countFileStats(file);
      const statsEl = document.createElement('div');
      statsEl.className = 'diff-file-stats';
      statsEl.textContent = `+${stats.added}  -${stats.removed}`;

      headerEl.appendChild(pathEl);
      headerEl.appendChild(statsEl);

      const linesEl = document.createElement('div');
      linesEl.className = 'diff-file-lines';
      let renderedLines = 0;

      for (const hunk of file.hunks) {
        if (renderedLines >= maxLinesPerFile) {
          break;
        }

        const hunkHeaderEl = document.createElement('div');
        hunkHeaderEl.className = 'diff-hunk-header';
        hunkHeaderEl.textContent = hunk.header;
        linesEl.appendChild(hunkHeaderEl);

        for (const contextLine of hunk.context) {
          if (renderedLines >= maxLinesPerFile) {
            break;
          }
          appendLine(linesEl, 'context', contextLine);
          renderedLines += 1;
        }

        for (const removedLine of hunk.removedLines) {
          if (renderedLines >= maxLinesPerFile) {
            break;
          }
          appendLine(linesEl, 'remove', removedLine);
          renderedLines += 1;
        }

        for (const addedLine of hunk.addedLines) {
          if (renderedLines >= maxLinesPerFile) {
            break;
          }
          appendLine(linesEl, 'add', addedLine);
          renderedLines += 1;
        }
      }

      if (renderedLines >= maxLinesPerFile) {
        const truncatedEl = document.createElement('div');
        truncatedEl.className = 'diff-truncated';
        truncatedEl.textContent = 'Preview truncated for this file.';
        linesEl.appendChild(truncatedEl);
      }

      fileCardEl.appendChild(headerEl);
      fileCardEl.appendChild(linesEl);
      targetEl.appendChild(fileCardEl);
    }

    if (diff.files.length > filesToRender.length) {
      const truncatedFilesEl = document.createElement('p');
      truncatedFilesEl.className = 'empty-diff';
      truncatedFilesEl.textContent = `Showing ${filesToRender.length} of ${diff.files.length} files.`;
      targetEl.appendChild(truncatedFilesEl);
    }
  }

  return {
    renderDiff(diff: GitDiffSummary): void {
      diffMetaEl.textContent = diff.filesCount === 0
        ? 'No staged changes found.'
        : 'Staged changes loaded from your workspace.';

      diffStatsEl.textContent = `Files: ${diff.filesCount} | +${diff.addedLines} | -${diff.removedLines}`;
      renderFiles(diffFilesListEl, diff);
    },
    renderOverview(diff: GitDiffSummary): void {
      overviewDiffStatsEl.textContent = `Files: ${diff.filesCount} | +${diff.addedLines} | -${diff.removedLines}`;
      renderFiles(overviewDiffFilesListEl, diff);
    },
  };
}
