import * as vscode from "vscode";
import { promises as fs } from "fs";
import * as path from "path";
import { GeminiRepository } from "../ai/geminiRepository";
import { buildDiffOverviewPrompt } from "../analyzer/prompts/diffOverviewPrompt";
import { fetchDocumentationForReferences } from "../context7/client";
import { DocumentationContext, LibraryReference } from "../models/types";
import { SecretStorageService } from "../services/secretStorage";

function extractLibraryReferencesFromRawDiff(
  rawDiff: string,
): LibraryReference[] {
  const refs: LibraryReference[] = [];
  const seen = new Set<string>();
  const lines = rawDiff.split("\n");

  for (const line of lines) {
    if (!line.startsWith("+") || line.startsWith("+++")) {
      continue;
    }

    const content = line.slice(1);
    const fromMatch = content.match(/from\s+['"]([^'"]+)['"]/);
    const importMatch = content.match(/import\s+['"]([^'"]+)['"]/);
    const requireMatch = content.match(/require\(\s*['"]([^'"]+)['"]\s*\)/);
    const libraryName = fromMatch?.[1] ?? importMatch?.[1] ?? requireMatch?.[1];

    if (
      !libraryName ||
      libraryName.startsWith(".") ||
      libraryName.startsWith("/")
    ) {
      continue;
    }

    const key = `${libraryName}:${content}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    refs.push({
      name: libraryName,
      importStatement: content,
      filePath: "unknown",
    });
  }

  return refs;
}

export async function generateOverviewCommand(
  rawDiff: string,
  secretService: SecretStorageService,
  includeMarkdownFiles = false,
): Promise<
  | {
      markdown: string;
      html: string;
      context7Used: boolean;
      context7Sources: string[];
      context7Message: string;
    }
  | undefined
> {
  if (!rawDiff.trim()) {
    vscode.window.showErrorMessage(
      "Git Commit Assist: empty diff, cannot generate AI overview.",
    );
    return undefined;
  }

  const apiKey = await secretService.requireApiKey();
  if (!apiKey) {
    vscode.window.showErrorMessage(
      "Git Commit Assist: API key is required to generate AI overview.",
    );
    return undefined;
  }

  const markdownContext = includeMarkdownFiles
    ? await loadMarkdownContext()
    : "";

  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Generating AI overview...",
      cancellable: false,
    },
    async () => {
      try {
        const { marked } = await import("marked");
        const libraryReferences = extractLibraryReferencesFromRawDiff(rawDiff);
        let docsContext: DocumentationContext[] = [];
        let context7Message = "Context7 не использовался.";
        try {
          docsContext =
            await fetchDocumentationForReferences(libraryReferences);
          context7Message =
            docsContext.length > 0
              ? `Context7: получено ${docsContext.length} набора документации.`
              : "Context7: релевантная документация не найдена.";
        } catch (contextError) {
          const contextMessage =
            contextError instanceof Error
              ? contextError.message
              : String(contextError);
          console.warn(
            `[Git Commit Assist] Context7 unavailable: ${contextMessage}`,
          );
          context7Message = `Context7 недоступен: ${contextMessage}`;
        }

        const prompt = buildDiffOverviewPrompt(
          rawDiff,
          docsContext,
          markdownContext,
        );
        const geminiRepository = new GeminiRepository(apiKey);
        const overview = await geminiRepository.sendMessage(prompt);
        const overviewHtml = marked.parse(overview, { async: false }) as string;

        // Output to extension host console for the current milestone.
        console.log("[Git Commit Assist] AI Overview Result:");
        console.log(overview);
        return {
          markdown: overview,
          html: overviewHtml,
          context7Used: docsContext.length > 0,
          context7Sources: docsContext.map(
            (doc) => `${doc.libraryName} (${doc.libraryId})`,
          ),
          context7Message,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`AI overview failed: ${message}`);
        return undefined;
      }
    },
  );
}

const MAX_MARKDOWN_CHARS_PER_FILE = 3500;
const MAX_MARKDOWN_CHARS_TOTAL = 12000;

async function loadMarkdownContext(): Promise<string> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return "";
  }

  const markdownUris = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, "docs/**/*.md"),
  );
  if (markdownUris.length === 0) {
    return "";
  }

  const snippets: string[] = [];
  let totalChars = 0;
  for (const markdownUri of markdownUris) {
    try {
      const content = await fs.readFile(markdownUri.fsPath, "utf-8");
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        continue;
      }

      if (totalChars >= MAX_MARKDOWN_CHARS_TOTAL) {
        break;
      }

      const remainingChars = MAX_MARKDOWN_CHARS_TOTAL - totalChars;
      const fileChunk = trimmedContent.slice(
        0,
        Math.min(MAX_MARKDOWN_CHARS_PER_FILE, remainingChars),
      );
      const relativePath = path
        .relative(workspaceFolder.uri.fsPath, markdownUri.fsPath)
        .replace(/\\/g, "/");

      snippets.push([`### ${relativePath}`, "```markdown", fileChunk, "```"].join("\n"));
      totalChars += fileChunk.length;
    } catch {
      // File is optional: skip missing or unreadable markdown files.
    }
  }

  return snippets.join("\n\n");
}
