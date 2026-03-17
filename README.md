# specv

A CLI tool that previews Markdown files in the current directory with GitHub-style rendering in your browser.

## Features

- GitHub Flavored Markdown (GFM) rendering
- Syntax-highlighted code blocks with copy button
- Preview / Source toggle
- File tree (sidebar) with search
- VSCode-style Quick Open (`Cmd+P`) with fzf fuzzy search
- Sidebar toggle (`Cmd+B`)
- Dark / Light mode (follows OS preference + manual toggle)
- GitHub dark theme color scheme
- Automatic port detection (tries next port on conflict)

## Usage

```bash
# Preview .md files in the current directory
npx specv@latest

# Specify a port
npx specv@latest -p 3000
```

A browser window opens automatically, rendering your Markdown files with GitHub-style formatting.

## Keyboard Shortcuts

| Shortcut           | Action              |
| ------------------ | ------------------- |
| `Cmd+P` / `Ctrl+P` | Quick Open (search) |
| `Cmd+B` / `Ctrl+B` | Toggle sidebar      |

## Architecture

```
Hono Server (API) ─── React SPA (Vite build)
  /api/files            FileTree + Preview + Source
  /api/file?path=...    react-markdown + prism-react-renderer
```

- **Server:** Hono + @hono/node-server + commander (CLI)
- **Client:** React 19 + Vite + Tailwind CSS v4
- **Markdown:** react-markdown + remark-gfm
- **Search:** fzf (fuzzy finder) + TanStack Hotkeys
- **Security:** Path traversal protection, restricted to .md files only

## Development

```bash
# Client dev server (HMR)
pnpm dev:client

# Server development
pnpm dev:server

# Run tests
pnpm test

# Build
pnpm build
```

## CI/CD

Automated via GitHub Actions:

- **CI** — Runs lint / knip / typecheck / test / build on PRs and main pushes
- **Publish** — Publishes to npm on GitHub Release creation (Trusted Publishing)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
