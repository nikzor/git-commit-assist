# Git Commit Assist

A VS Code extension that reviews your staged git changes and provides code improvement suggestions before you commit. Uses the [Context7](https://context7.com) MCP server to ground suggestions in up-to-date library documentation.

## Features

- **Staged diff analysis** — reads `git diff --cached` and parses changes per file.
- **Documentation-aware** — resolves libraries from your imports via Context7 MCP and fetches relevant docs.
- **Structured review report** — displays suggestions categorized by style, performance, correctness, security, and best practices in a webview panel.

## Usage

1. Stage your changes with `git add`.
2. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
3. Run **Git Commit Assist: Review Staged Changes**.
4. Review the suggestions in the report panel that opens.

## Development

```bash
npm install
npm run compile
```

Press **F5** to launch the Extension Development Host.

## License

MIT
