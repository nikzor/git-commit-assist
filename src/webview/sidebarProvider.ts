import * as vscode from 'vscode';
import { ReviewReport } from '../models/types';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'git-commit-assist.sidebar';

  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === 'startReview') {
        vscode.commands.executeCommand('git-commit-assist.reviewDiff');
      }
    });

    webviewView.onDidDispose(() => {
      this.view = undefined;
    });
  }

  public showReport(report: ReviewReport): void {
    if (this.view) {
      this.view.webview.postMessage({ command: 'showReport', report });
      this.view.show?.(true);
    }
  }

  private getHtml(): string {
    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      padding: 16px 12px;
    }

    .header {
      margin-bottom: 16px;
    }

    .header h2 {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-foreground);
      margin-bottom: 8px;
    }

    .description {
      font-size: 12px;
      line-height: 1.5;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 20px;
    }

    .info-section {
      margin-bottom: 20px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 12px;
      line-height: 1.4;
    }

    .info-item .label {
      color: var(--vscode-descriptionForeground);
      min-width: 60px;
      flex-shrink: 0;
    }

    .info-item .value {
      color: var(--vscode-foreground);
    }

    .divider {
      height: 1px;
      background: var(--vscode-widget-border);
      margin: 16px 0;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 12px;
    }

    .steps {
      list-style: none;
      margin-bottom: 20px;
    }

    .steps li {
      font-size: 12px;
      line-height: 1.5;
      color: var(--vscode-descriptionForeground);
      padding: 3px 0;
      padding-left: 16px;
      position: relative;
    }

    .steps li::before {
      content: attr(data-step);
      position: absolute;
      left: 0;
      color: var(--vscode-textLink-foreground);
      font-weight: 600;
    }

    button {
      width: 100%;
      padding: 8px 16px;
      border: none;
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    button:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 1px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>Git Commit Assist</h2>
  </div>

  <p class="description">
    Review your staged changes and get code improvement suggestions
    powered by up-to-date library documentation.
  </p>

  <div class="divider"></div>

  <div class="section-title">How it works</div>
  <ol class="steps">
    <li data-step="1.">Stage your changes with git add</li>
    <li data-step="2.">Click "Start Review" below</li>
    <li data-step="3.">Review suggestions in the report</li>
  </ol>

  <div class="divider"></div>

  <div class="info-section">
    <div class="section-title">Details</div>
    <div class="info-item">
      <span class="label">Version</span>
      <span class="value">0.0.1</span>
    </div>
    <div class="info-item">
      <span class="label">Engine</span>
      <span class="value">Context7 MCP</span>
    </div>
  </div>

  <button id="startReview">Start Review</button>

  <script>
    const vscode = acquireVsCodeApi();

    document.getElementById('startReview').addEventListener('click', () => {
      vscode.postMessage({ command: 'startReview' });
    });
  </script>
</body>
</html>`;
  }
}
