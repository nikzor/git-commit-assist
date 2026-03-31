import * as vscode from 'vscode';
import { reviewDiffCommand } from './commands/reviewDiff';
import { SidebarProvider } from './webview/sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewId,
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'git-commit-assist.reviewDiff',
      () => reviewDiffCommand(sidebarProvider)
    )
  );
}

export function deactivate() {}
