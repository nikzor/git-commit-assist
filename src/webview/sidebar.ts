import { createDiffRenderer } from './diffRenderer.js';
import { createScreenManager } from './screenManager.js';
import type { GitDiffSummary, WebviewMessage } from './types.js';

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

(function () {
  const vscode = acquireVsCodeApi();
  const keyStatusEl = document.getElementById('keyStatus') as HTMLElement;
  const homeScreenEl = document.getElementById('homeScreen') as HTMLElement;
  const diffScreenEl = document.getElementById('diffScreen') as HTMLElement;
  const overviewScreenEl = document.getElementById('overviewScreen') as HTMLElement;
  const diffMetaEl = document.getElementById('diffMeta') as HTMLElement;
  const diffStatsEl = document.getElementById('diffStats') as HTMLElement;
  const diffFilesListEl = document.getElementById('diffFilesList') as HTMLElement;
  const overviewDiffStatsEl = document.getElementById('overviewDiffStats') as HTMLElement;
  const overviewDiffFilesListEl = document.getElementById('overviewDiffFilesList') as HTMLElement;

  const screens = createScreenManager(homeScreenEl, diffScreenEl, overviewScreenEl);
  const renderer = createDiffRenderer({
    diffMetaEl,
    diffStatsEl,
    diffFilesListEl,
    overviewDiffStatsEl,
    overviewDiffFilesListEl,
  });

  let lastDiff: GitDiffSummary | null = null;

  (document.getElementById('startReview') as HTMLElement).addEventListener('click', () => {
    vscode.postMessage({ command: 'startReview' });
  });

  (document.getElementById('cancelReview') as HTMLElement).addEventListener('click', () => {
    screens.showHome();
  });
  (document.getElementById('proceedReview') as HTMLElement).addEventListener('click', () => {
    screens.showOverview();
    if (lastDiff) {
      renderer.renderOverview(lastDiff);
    }
  });
  (document.getElementById('overviewGoBack') as HTMLElement).addEventListener('click', () => {
    screens.showDiff();
  });

  vscode.postMessage({ command: 'webviewReady' });

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
          lastDiff = message.diff;
          renderer.renderDiff(message.diff);
          screens.showDiff();
        }
        break;
      case 'showReport':
        // TODO: render report in the sidebar
        break;
    }
  });
})();
