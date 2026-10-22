# Development Setup

How to get from a freshly reset Windows computer back to working on ThinkTwice.

Keep this file up to date: every tool, package, service or account the project depends on must be listed here (see rule 12 in `CLAUDE.md`).

_Last updated: 2026-10-22._

## 1. Install the base tools

Open PowerShell and run:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id pnpm.pnpm -e
winget install --id Python.Python.3.14 -e
winget install --id Docker.DockerDesktop -e
winget install --id Microsoft.VisualStudioCode -e
```

Close and reopen PowerShell afterwards so the new commands are on your `PATH`.

| Tool           | Used for                                        | Version on the dev machine |
| -------------- | ----------------------------------------------- | -------------------------- |
| Git            | Version control                                 | 2.55.0                     |
| Node.js (LTS)  | Expo app and Fastify API                        | 24.21.0                    |
| pnpm           | JavaScript package manager                      | 12.14.0                    |
| Python         | ML service                                      | 3.14.7                     |
| Docker Desktop | Runs the API, PostgreSQL and ML service locally | 29.7.2                     |
| VS Code        | Editor                                          | 1.142.0                    |

pnpm automatically switches to the exact version pinned in `package.json` (`packageManager`), so any recent pnpm 12 install works.

Start Docker Desktop once after installing it and finish its setup (it may ask to enable WSL 2 and restart).

## 2. Configure Git

```powershell
git config --global user.name "Christion"
git config --global user.email "<your GitHub email>"
```

## 3. Get the code

```powershell
mkdir $HOME\Projects
cd $HOME\Projects
git clone https://github.com/christion-c/ThinkTwice.git
cd ThinkTwice
git switch christion
pnpm install
```

`pnpm install` installs every JavaScript tool the repo uses (TypeScript, ESLint, Prettier, Lefthook) at the versions locked in `pnpm-lock.yaml`, and installs the git hooks that check formatting, linting and commit messages on every commit.

Git will open a browser window to sign in to GitHub the first time you push.

## 4. Set up Claude Code

1. In VS Code, install the **Claude Code** extension and sign in.
2. Open the `ThinkTwice` folder in VS Code.

`CLAUDE.md` is in the repo, so Claude picks up the project context and rules automatically. Claude's personal memory lives outside the repo and is lost on a reset; anything important from it is already recorded in `CLAUDE.md`.

## 5. Accounts and services

| Service                 | Used for                                                                   | What to restore                                                                                 |
| ----------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| GitHub                  | Code hosting (`christion-c/ThinkTwice`)                                    | Sign in                                                                                         |
| Firebase / Google Cloud | Sign-in, web hosting, and the live previous version (Cloud Run, Cloud SQL) | Sign in at console.firebase.google.com. Project: `thinktwice-dev-christion`. It has real users. |
| thinktwice.site         | Domain for the web app and API                                             | Domain registrar login                                                                          |

## 6. Environment files and secrets

Each part of the project that needs settings has a `.env.example` file listing every variable. Copy each one to `.env` (which is never committed) and fill in the values:

```powershell
Copy-Item .env.example .env
Copy-Item services\api\.env.example services\api\.env
```

Then replace every `change-me` with a strong random password. Generate one with `openssl rand -hex 24` (Git Bash). The owner and app passwords must be the same in both files.

| File                | Contains secrets?  | Where real values come from                                                     |
| ------------------- | ------------------ | ------------------------------------------------------------------------------- |
| `.env`              | Database passwords | Local only: generate new ones. They only protect the database on this computer. |
| `services/api/.env` | Database passwords | Local only: the same owner and app passwords as the root `.env`.                |

Local database passwords don't need to be backed up: after a reset, generate new ones and recreate the database (step 7). When production secrets are added, keep their real values somewhere safe outside this computer, such as a password manager, and note where each one comes from in this table.

## 7. Start the database and run the API

Make sure Docker Desktop is running, then:

```powershell
docker compose up --detach --wait
pnpm --filter @thinktwice/api db:migrate
pnpm --filter @thinktwice/api dev
```

- The first `docker compose up` creates the database roles and the `thinktwice` and `thinktwice_test` databases.
- `db:migrate` creates the tables. Run it again whenever a new migration is added.
- The API starts at <http://127.0.0.1:3000> and reloads when its code changes. Open <http://127.0.0.1:3000/health>; it should show `{"status":"ok"}`.

To wipe the local database and start over (for example, after changing the passwords): `docker compose down --volumes`, then run the commands above again.

## 8. Verify

```powershell
git --version
node --version
python --version
docker --version
pnpm --version
git status
pnpm format:check
pnpm lint
pnpm test
```

Each version command should print a version, `git status` should show you are on the `christion` branch, and the last three commands should pass with no errors. `pnpm test` needs the database from step 7 to be running.
