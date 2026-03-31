import * as vscode from 'vscode';
import { getStagedDiff } from '../git/diffProvider';
import { extractLibraryReferences, analyzeDiff } from '../analyzer/reviewEngine';
import { fetchDocumentationForReferences } from '../context7/client';
import { SidebarProvider } from '../webview/sidebarProvider';
import { SecretStorageService } from '../services/secretStorage';

export async function reviewDiffCommand(
  sidebarProvider: SidebarProvider,
  secretService: SecretStorageService
): Promise<void> {
  const apiKey = await secretService.requireApiKey();
  if (!apiKey) {
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
      title: 'Reviewing staged changes...',
      cancellable: false,
    },
    async () => {
      try {
        const diff = await getStagedDiff(workspaceRoot);

        if (diff.files.length === 0) {
          vscode.window.showInformationMessage('No staged changes to review.');
          return;
        }

        const libraryRefs = extractLibraryReferences(diff);
        const docsContext = await fetchDocumentationForReferences(libraryRefs);
        const report = await analyzeDiff(diff, docsContext);

        sidebarProvider.showReport(report);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Review failed: ${message}`);
      }
    }
  );
}
