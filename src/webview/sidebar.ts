declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

(function () {
  const vscode = acquireVsCodeApi();
  const keyStatusEl = document.getElementById('keyStatus')!;
  const homeScreenEl = document.getElementById('homeScreen')!;
  const diffScreenEl = document.getElementById('diffScreen')!;

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

  function setKeyStatus(configured: boolean): void {
    keyStatusEl.textContent = configured ? 'Configured' : 'Not set';
    keyStatusEl.className = configured ? 'value status-ok' : 'value status-missing';
  }

  window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data;
    switch (message.command) {
      case 'keyStatus':
        setKeyStatus(message.configured);
        break;
      case 'showReport':
        // TODO: render report in the sidebar
        break;
    }
  });
})();
