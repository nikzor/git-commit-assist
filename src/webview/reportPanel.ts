import * as vscode from 'vscode';
import { ReviewReport } from '../models/types';

export class ReportPanel {
  private static instance: ReportPanel | undefined;
  private readonly panel: vscode.WebviewPanel;

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.onDidDispose(() => {
      ReportPanel.instance = undefined;
    });
  }

  public static show(report: ReviewReport, extensionUri: vscode.Uri): void {
    if (ReportPanel.instance) {
      ReportPanel.instance.panel.reveal(vscode.ViewColumn.Beside);
      ReportPanel.instance.update(report);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'gitCommitAssistReport',
      'Code Review Report',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    ReportPanel.instance = new ReportPanel(panel);
    ReportPanel.instance.update(report);
  }

  private update(report: ReviewReport): void {
    this.panel.webview.html = this.getHtml(report);
  }

  private getHtml(_report: ReviewReport): string {
    // TODO: Render the review report as HTML
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Code Review Report</title></head>
<body>
  <h1>Code Review Report</h1>
  <p>Report rendering not yet implemented.</p>
</body>
</html>`;
  }
}
