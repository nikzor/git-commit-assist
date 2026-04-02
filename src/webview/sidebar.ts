declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

interface GitDiffSummary {
  raw: string;
  filesCount: number;
  addedLines: number;
  removedLines: number;
  files: DiffFile[];
}

interface DiffFile {
  filePath: string;
  language: string;
  hunks: DiffHunk[];
}

interface DiffHunk {
  header: string;
  addedLines: string[];
  removedLines: string[];
  context: string[];
}

interface WebviewMessage {
  command: string;
  configured?: boolean;
  diff?: GitDiffSummary;
}

(function () {
  const vscode = acquireVsCodeApi();
  const keyStatusEl = document.getElementById('keyStatus')!;
  const homeScreenEl = document.getElementById('homeScreen')!;
  const diffScreenEl = document.getElementById('diffScreen')!;
  const diffMetaEl = document.getElementById('diffMeta')!;
  const diffStatsEl = document.getElementById('diffStats')!;
  const diffFilesListEl = document.getElementById('diffFilesList')!;
  const maxFilesToRender = 10;
  const maxLinesPerFile = 80;

  function showHomeScreen(): void {
    homeScreenEl.classList.remove('hidden');
    diffScreenEl.classList.add('hidden');
  }

  function showDiffScreen(): void {
    homeScreenEl.classList.add('hidden');
    diffScreenEl.classList.remove('hidden');
  }

  document.getElementById('startReview')!.addEventListener('click', () => {
    showDiffScreen();
    vscode.postMessage({ command: 'startReview' });
  });

  document.getElementById('cancelReview')!.addEventListener('click', () => {
    showHomeScreen();
  });

  vscode.postMessage({ command: 'webviewReady' });

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

  function renderFiles(diff: GitDiffSummary): void {
    clearNode(diffFilesListEl);

    if (diff.files.length === 0) {
      const emptyEl = document.createElement('p');
      emptyEl.className = 'empty-diff';
      emptyEl.textContent = 'No staged diff loaded.';
      diffFilesListEl.appendChild(emptyEl);
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
      diffFilesListEl.appendChild(fileCardEl);
    }

    if (diff.files.length > filesToRender.length) {
      const truncatedFilesEl = document.createElement('p');
      truncatedFilesEl.className = 'empty-diff';
      truncatedFilesEl.textContent = `Showing ${filesToRender.length} of ${diff.files.length} files.`;
      diffFilesListEl.appendChild(truncatedFilesEl);
    }
  }

  function renderDiff(diff: GitDiffSummary): void {
    diffMetaEl.textContent = diff.filesCount === 0
      ? 'No staged changes found.'
      : 'Staged changes loaded from your workspace.';

    diffStatsEl.textContent = `Files: ${diff.filesCount} | +${diff.addedLines} | -${diff.removedLines}`;
    renderFiles(diff);
  }

  function setKeyStatus(configured: boolean): void {
    keyStatusEl.textContent = configured ? 'Configured' : 'Not set';
    keyStatusEl.className = configured ? 'value status-ok' : 'value status-missing';
  }

  window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data as WebviewMessage;
    switch (message.command) {
      case 'keyStatus':
        setKeyStatus(Boolean(message.configured));
        break;
      case 'showDiff':
        if (message.diff) {
          renderDiff(message.diff);
        }
        break;
      case 'showReport':
        // TODO: render report in the sidebar
        break;
    }
  });
})();
