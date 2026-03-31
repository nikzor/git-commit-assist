import * as vscode from 'vscode';

const API_KEY_SECRET = 'git-commit-assist.openaiApiKey';

export class SecretStorageService {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  async getApiKey(): Promise<string | undefined> {
    return this.secrets.get(API_KEY_SECRET);
  }

  async storeApiKey(key: string): Promise<void> {
    await this.secrets.store(API_KEY_SECRET, key);
  }

  async deleteApiKey(): Promise<void> {
    await this.secrets.delete(API_KEY_SECRET);
  }

  async requireApiKey(): Promise<string | undefined> {
    const existing = await this.getApiKey();
    if (existing) {
      return existing;
    }

    const key = await vscode.window.showInputBox({
      title: 'OpenAI API Key',
      prompt: 'Enter your OpenAI API key to enable code review',
      password: true,
      placeHolder: 'sk-...',
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value.trim()) {
          return 'API key cannot be empty';
        }
        return undefined;
      },
    });

    if (key) {
      await this.storeApiKey(key.trim());
      return key.trim();
    }

    return undefined;
  }
}
