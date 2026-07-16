# Contributing to EduMind AI

Thanks for your interest in improving EduMind AI.

## Getting started

1. Fork the repository and clone your fork.
2. Follow the "Local installation" steps in the README.
3. Create a feature branch: `git checkout -b feature/your-feature-name`.

## Development workflow

- Run `npm run typecheck` and `npm run lint` before committing.
- Run `npm run test` to make sure existing tests still pass.
- Keep AI-provider logic in `lib/ai/`, recommendation logic in
  `lib/recommendations/`, and validation schemas in `lib/validations/` —
  don't inline this logic into route handlers or components.
- Never commit `.env.local` or any file containing real secrets.

## Pull requests

- Keep PRs focused on a single change where possible.
- Describe what changed and why in the PR description.
- Make sure CI (`.github/workflows/ci.yml`) passes before requesting review.

## Code style

- TypeScript everywhere; avoid `any` unless genuinely necessary.
- Prefer small, reusable components over large ones.
- Include loading, empty, and error states for anything that fetches data.
