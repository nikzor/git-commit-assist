import * as vscode from 'vscode';
import { getStagedDiff } from '../git/diffProvider';
import { SidebarProvider } from '../webview/sidebarProvider';
import { SecretStorageService } from '../services/secretStorage';

export async function reviewDiffCommand(
  sidebarProvider: SidebarProvider,
  secretService: SecretStorageService
): Promise<void> {
  const apiKey = await secretService.requireApiKey();
  if (!apiKey) {
    sidebarProvider.updateKeyStatus(false);
    vscode.window.showErrorMessage('Git Commit Assist: API key is required to start review.');
    return;
  }

  sidebarProvider.updateKeyStatus(true);

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Reading staged git diff...',
      cancellable: false,
    },
    async () => {
      try {
        const diff = await getStagedDiff(workspaceRoot);
        sidebarProvider.showDiff(diff);

        if (diff.files.length === 0) {
          vscode.window.showInformationMessage('No staged changes to review.');
          return;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Review failed: ${message}`);
      }
    }
  );
}
