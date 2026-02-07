# Contributing to GeneChat

Thanks for your interest in contributing! GeneChat is an open-source bioinformatics workbench and we welcome bug reports, feature ideas, and pull requests.

## Bug Reports

Please [open an issue](https://github.com/jvogan/genechat/issues/new?template=bug_report.md) with:

- Steps to reproduce the problem
- Expected vs. actual behavior
- Browser and OS version
- Screenshots or console errors, if applicable

## Feature Requests

[Open an issue](https://github.com/jvogan/genechat/issues/new?template=feature_request.md) to discuss your idea before writing code. This helps avoid duplicate work and ensures the feature fits the project direction.

## Pull Request Process

1. Fork the repo and create a branch from `main`.
2. Make your changes.
3. Ensure `npm run build` succeeds with no TypeScript errors.
4. Run `npm run lint` and fix any warnings.
5. Run `npm run test` and `npm run test:e2e` to verify nothing is broken.
6. Open a pull request with a clear description of the change.

## Development Setup

Requires [Node.js](https://nodejs.org/) 18 or later.

```bash
git clone https://github.com/jvogan/genechat.git
cd genechat
npm install
npx playwright install chromium   # needed for E2E tests
npm run dev
```

See the [README](README.md) for more details.

## Code Style

- TypeScript strict mode. No `any` types without justification.
- ESLint for linting. Run `npm run lint` before committing.
- Tailwind CSS for styling. Use CSS custom properties for theme colors.
- Bioinformatics functions in `src/bio/` must be pure (no side effects, no store access, no DOM).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
