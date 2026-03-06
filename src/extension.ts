import * as vscode from 'vscode';
import { reviewDiffCommand } from './commands/reviewDiff';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'git-commit-assist.reviewDiff',
    () => reviewDiffCommand(context.extensionUri)
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
