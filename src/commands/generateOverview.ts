import * as vscode from 'vscode';
import { GeminiRepository } from '../ai/geminiRepository';
import { buildDiffOverviewPrompt } from '../analyzer/prompts/diffOverviewPrompt';
import { SecretStorageService } from '../services/secretStorage';

export async function generateOverviewCommand(
  rawDiff: string,
  secretService: SecretStorageService
): Promise<{ markdown: string; html: string } | undefined> {
  if (!rawDiff.trim()) {
    vscode.window.showErrorMessage('Git Commit Assist: empty diff, cannot generate AI overview.');
    return undefined;
  }

  const apiKey = await secretService.requireApiKey();
  if (!apiKey) {
    vscode.window.showErrorMessage('Git Commit Assist: API key is required to generate AI overview.');
    return undefined;
  }

  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Generating AI overview...',
      cancellable: false,
    },
    async () => {
      try {
        const { marked } = await import('marked');
        const prompt = buildDiffOverviewPrompt(rawDiff);
        const geminiRepository = new GeminiRepository(apiKey);
        const overview = await geminiRepository.sendMessage(prompt);
        const overviewHtml = marked.parse(overview, { async: false }) as string;

        // Output to extension host console for the current milestone.
        console.log('[Git Commit Assist] AI Overview Result:');
        console.log(overview);
        return {
          markdown: overview,
          html: overviewHtml,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`AI overview failed: ${message}`);
        return undefined;
      }
    }
  );
}
