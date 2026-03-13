# Contributing to specv

Thank you for your interest in contributing to specv! This guide will help you get started.

## How to Contribute

1. **Open an Issue** — Before starting work, check existing issues or create a new one to discuss the change.
2. **Fork & Branch** — Fork the repository and create a feature branch from `main`.
3. **Make Changes** — Implement your changes following the guidelines below.
4. **Submit a PR** — Open a pull request against `main` with a clear description of the change.

## Development Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/specv.git
cd specv

# Install dependencies
pnpm install

# Start the client dev server (HMR)
pnpm dev:client

# Start the server
pnpm dev:server

# Run tests
pnpm test

# Build
pnpm build
```

## Code Quality

This project uses [Ultracite](https://github.com/haydenbleasel/ultracite) for linting and formatting, enforced via [Lefthook](https://github.com/evilmartians/lefthook) pre-commit hooks.

```bash
# Check for issues
pnpm check

# Auto-fix issues
pnpm fix

# Type check
pnpm typecheck

# Find unused exports
pnpm knip
```

All checks must pass before a PR can be merged.

## Commit Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification with the following types:

- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code refactoring (no feature change)
- `chore:` — Maintenance tasks
- `docs:` — Documentation changes
- `test:` — Adding or updating tests
- `ci:` — CI/CD changes

Use `!` after the type for breaking changes (e.g., `feat!: redesign API`).

## Reporting Bugs

Please include:

- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, Node.js version)
