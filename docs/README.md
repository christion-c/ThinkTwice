# ThinkTwice Documentation

Start with the root [README](../README.md) for setup and daily development.

**Project status**
- [Known issues and to-do](KNOWN_ISSUES.md): open bugs, unfinished features, and cleanup.
- [Project context](PROJECT_CONTEXT.md): dated status and project history.

**How each part works**
- [Backend](backend.md): Express API architecture, migrations, env vars, running and testing.
- [Frontend](frontend.md): Expo app setup, validation, troubleshooting.
- [ML service](ml-service.md): FastAPI endpoints and the `/predict` contract.
- [Shared types](shared-types.md): the `@thinktwice/shared-types` API contract package.

**Shipping**
- [CI](ci.md): what the GitHub Actions workflow checks.
- [Deploying](deploying.md): backend, ML and frontend deploy steps, checks, and the GCP/Firebase resource table.
- [Release notes](RELEASE_NOTES.md): what changed in each app version, with paste-ready Play Console text.
- [Christion's laptop setup](christion-laptop-setup.md): personal machine-recovery notes.

**Rules for contributors and coding agents** live in `AGENTS.md` files next to
the code they cover (root [AGENTS.md](../AGENTS.md), `apps/frontend/AGENTS.md`);
they stay there because agents read the nearest one.

Keep durable rules in `AGENTS.md`, dated history in `PROJECT_CONTEXT.md`, and
open work in `KNOWN_ISSUES.md`.
