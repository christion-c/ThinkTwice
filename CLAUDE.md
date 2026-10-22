# ThinkTwice

ThinkTwice is an ADHD-friendly personal finance and habit-tracking app (Atlas School CS2900 capstone). Instead of only reviewing past transactions, it uses machine learning to spot recurring spending habits, forecast their future cost, and suggest practical budget adjustments before small habits become big problems.

Example: "$35 on coffee this week" becomes "at this pace, about $140 on coffee by the end of the month."

Tagline: *Don't just track where your money went. See where it's taking you.*

Christion is the sole developer on this project.

## Source documents
Full context lives in the Word documents in the project root:
- `Project Overview.docx`: the primary and most current description of the app.
- `One Page Project Overview.docx`: a condensed version of the above.
- `Project Scoping Document.docx`: early brainstorming from when this was a team project. Its team roles and group commit rules no longer apply. Its feature ideas (Plaid bank connection, vehicle profile and fuel prediction, category spending limits, over-limit warnings) are possible features, not commitments.

## Tech stack
ThinkTwice runs on **iOS, Android and the web** from one codebase. It is designed mobile-first, but the web is a fully supported platform. This stack replaces the one in the Word documents.

- **App (iOS, Android, web):** React Native + Expo, Expo Router, TypeScript, TanStack Query
- **API:** Node.js + Fastify REST API, TypeScript, Zod for validation
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Firebase Authentication (email/password) via the Firebase JS SDK; the API verifies Firebase ID tokens
- **Machine learning:** Python + FastAPI service, called by the Node API
- **Dev environment:** Docker Compose (API + PostgreSQL + ML service)
- **Testing:** Jest + React Native Testing Library (app), Vitest (API), pytest (ML)
- **Version control:** Git + GitHub

## Platform requirements
- Every screen must work on phones, tablets and desktop browsers. Use responsive layouts and keep content centered and calm on wide screens.
- Only add dependencies that support iOS, Android **and** web. Check web support before adding any library.
- Use the Firebase JS SDK, not `@react-native-firebase` (native-only).
- Test changes on all three platforms.

## Domains and hosting
- `thinktwice.site`: the web app (Expo static web export, hosted on Firebase Hosting).
- `api.thinktwice.site`: the Fastify API (host to be decided).
- The ML service is private. Only the API calls it; it is never exposed to the internet.

## Deliverables
- App for iOS, Android and the web (thinktwice.site) with an ADHD-friendly design
- Secure registration and authentication
- Expense and recurring-habit tracking
- Financial dashboards
- Transaction categorization (essential vs. discretionary)
- ML models that identify and forecast spending patterns
- Predictive insights and practical monthly-budget recommendations
- Awareness of nutritional spending habits (snacks, energy drinks, dining)
- REST API and PostgreSQL database
- Documentation, source code and a final presentation

## Design principles
- ADHD-friendly: information is clear, short and manageable, never overwhelming.
- Never shame the user. The tone is supportive, along the lines of "maybe don't do that."
- Understandable by users who are not technically experienced.

# Project Rules

These rules apply to all work on this project, by Christion or Claude. Follow them strictly.

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
