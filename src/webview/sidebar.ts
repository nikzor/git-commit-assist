declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

(function () {
  const vscode = acquireVsCodeApi();
  const keyStatusEl = document.getElementById('keyStatus')!;

  document.getElementById('startReview')!.addEventListener('click', () => {
    vscode.postMessage({ command: 'startReview' });
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
