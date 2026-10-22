# Project Rules

These rules apply to everyone working on this project, human or AI. Follow them strictly.

## 1. Code has to work
- Never commit code that has not been run or tested.
- If something can't be verified, say so explicitly. Don't claim it works.

## 2. Code has to be clean
- Use clear, descriptive names for variables, functions and files.
- No dead code, commented-out code or leftover debug output.
- Keep formatting consistent with the surrounding code.

## 3. Code has to be modular
- Each function does one thing.
- Each file or module has one clear responsibility.
- Avoid duplication: extract shared logic instead of copy-pasting it.

## 4. Every function has a 1-line comment
- Put a single-line comment directly above (or as the docstring of) every function, explaining what it does for someone new to the code.

## 5. ABSOLUTELY NO deprecated practices
- Don't use deprecated APIs, libraries, language features or patterns.
- Use current, supported versions of dependencies.
- If unsure whether something is deprecated, check the official documentation before using it.

## 6. Always use best and most up-to-date practices
- Follow the current recommended approach from official documentation and style guides.
- Prefer modern language features and tooling over older equivalents.
- When there are multiple ways to do something, choose the one currently recommended, not just the one that works.

## 7. This is a production app: keep the project tree professional and easy to follow
- Follow the standard, conventional project layout for the language and framework in use.
- Group files by clear purpose (e.g. source, tests, config, docs, assets) in predictably named folders.
- Keep paths shallow and descriptive: a new developer should be able to guess where something lives.
- Use consistent naming for files and folders throughout the project.
- No stray files in the root: only top-level config and docs belong there.

## 8. Handle errors properly
- Never silently swallow errors: handle them, or let them propagate with useful context.
- Validate all external input (user input, API responses, files) at the boundary.
- Show users clear, friendly error messages; never expose stack traces or internal details to them.

## 9. Never commit secrets
- No API keys, passwords, tokens or credentials in the code or the git history.
- Load secrets from environment variables or a secrets manager.
- Keep `.env` files git-ignored, and commit a `.env.example` with placeholder values instead.

## 10. Log meaningfully
- Use a proper logging library with levels (debug, info, warning, error), not print statements.
- Log enough context to diagnose problems in production.
- Never log secrets or sensitive personal data.

## 11. Code must be tested
- New features and bug fixes come with tests.
- All tests must pass before code is committed or merged.
- Tests live in the project's standard test location and follow the same rules as the rest of the code.

## Git workflow note
- Claude pushes to `origin/christion` immediately after every commit it makes on the `christion` branch, without asking.
- Commits made manually are not pushed automatically. Push them yourself.
- Never push to `main` without asking first.
