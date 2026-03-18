# specv

ローカル Markdown プレビューツール（GitHub スタイルレンダリング）。

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Hono + @hono/node-server
- **Test**: Vitest (unit) + Playwright (E2E)
- **Lint**: Ultracite (Oxlint + Oxfmt) + Knip
- **Git hooks**: lefthook (pre-commit: ultracite + knip + typecheck)

## Commands

```bash
nr dev               # client + server 同時起動
nr dev:client        # Vite dev server (localhost:5173)
nr dev:server        # API server (localhost:4649)
nr build             # Build client + server
nr test              # Unit tests (Vitest)
nr test:e2e          # E2E tests (Playwright, requires build first)
nr typecheck         # TypeScript type check
nr check             # Lint check (ultracite)
nr fix               # Auto-fix lint issues (ultracite)
```

## Architecture

```
src/
├── client/           # React frontend
│   ├── api.ts        # API client (fetch wrapper)
│   ├── components/   # UI components (file-tree, preview, quick-open)
│   │   ├── ui/       # Base UI components (button)
│   │   ├── mermaid-block.tsx  # Mermaid diagram renderer (lazy loaded)
│   │   ├── source.tsx
│   │   └── theme-toggle.tsx
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Client utilities (auto-expand, etc.)
│   ├── lib/          # Path resolution utilities
│   ├── main.tsx      # Entry point
│   └── app.tsx       # Main App component
├── server/
│   ├── cli.ts        # CLI entry (Hono + Node server)
│   ├── api.ts        # API routes (/api/files, /api/file, /api/image, /api/watch)
│   ├── files.ts      # scanMarkdownFiles (recursive .md scanner)
│   ├── security.ts   # Path traversal protection
│   └── watcher.ts    # File watcher (hot reload)
├── shared/
│   └── types.ts      # Shared types (FileNode)
tests/                # Unit tests (Vitest)
e2e/                  # E2E tests (Playwright)
fixtures/             # Manual testing markdown files
```

## Path Aliases

- `@/*` → `src/client/*`
- `@server/*` → `src/server/*`
- `@shared/*` → `src/shared/*`

## Development Style

- TDD（テスト駆動開発）で実装する: テストを先に書き、Red → Green → Refactor のサイクルで進める

## Gotchas

- `preview.tsx` は remark/rehype プラグインを使用: remarkGfm, remarkMath, remarkAlert, rehypeKatex, rehypeSlug, rehypeAutolinkHeadings
- ブラウザを閉じるとサーバーが自動停止する（SSE `/api/lifecycle` による切断検知）
- `sort-keys` ルールが有効: オブジェクトキーはアルファベット順に記述すること
- `no-relative-parent-imports` が有効: `../` ではなくパスエイリアスを使う
- E2E テストは `nr build` 後に実行する必要がある（ビルド済みサーバーを使用）
- `empty-dir/` や `.md` を含まないディレクトリは `scanMarkdownFiles` が自動除外する


# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Oxlint + Oxfmt (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Oxlint + Oxfmt Can't Help

Oxlint + Oxfmt's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Oxlint + Oxfmt can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Oxlint + Oxfmt. Run `pnpm dlx ultracite fix` before committing to ensure compliance.
