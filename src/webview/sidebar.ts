declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

(function () {
  const vscode = acquireVsCodeApi();

  document.getElementById('startReview')!.addEventListener('click', () => {
    vscode.postMessage({ command: 'startReview' });
  });

  window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data;
    if (message.command === 'showReport') {
      // TODO: render report in the sidebar
    }
  });
})();
