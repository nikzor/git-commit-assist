import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
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
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'out', 'webview'),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

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

  private getHtml(webview: vscode.Webview): string {
    const webviewDir = path.join(this.extensionUri.fsPath, 'out', 'webview');

    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'sidebar.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'sidebar.js')
    );

    let html = fs.readFileSync(path.join(webviewDir, 'sidebar.html'), 'utf-8');

    html = html.replace(/\{\{cssUri\}\}/g, cssUri.toString());
    html = html.replace(/\{\{scriptUri\}\}/g, scriptUri.toString());
    html = html.replace(/\{\{cspSource\}\}/g, webview.cspSource);

    return html;
  }
}
