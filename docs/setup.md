# Development Setup

How to get from a freshly reset Windows computer back to working on ThinkTwice.

Keep this file up to date: every tool, package, service or account the project depends on must be listed here (see rule 12 in `CLAUDE.md`).

_Last updated: 2026-10-22. The project has no application code yet, so only the base tools are needed._

## 1. Install the base tools

Open PowerShell and run:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Python.Python.3.14 -e
winget install --id Docker.DockerDesktop -e
winget install --id Microsoft.VisualStudioCode -e
```

Close and reopen PowerShell afterwards so the new commands are on your `PATH`.

| Tool | Used for | Version on the dev machine |
|---|---|---|
| Git | Version control | 2.55.0 |
| Node.js (LTS) | Expo app and Fastify API | 24.21.0 |
| Python | ML service | 3.14.7 |
| Docker Desktop | Runs the API, PostgreSQL and ML service locally | 29.7.2 |
| VS Code | Editor | 1.142.0 |

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
```

Git will open a browser window to sign in to GitHub the first time you push.

## 4. Set up Claude Code

1. In VS Code, install the **Claude Code** extension and sign in.
2. Open the `ThinkTwice` folder in VS Code.

`CLAUDE.md` is in the repo, so Claude picks up the project context and rules automatically. Claude's personal memory lives outside the repo and is lost on a reset; anything important from it is already recorded in `CLAUDE.md`.

## 5. Accounts and services

| Service | Used for | What to restore |
|---|---|---|
| GitHub | Code hosting (`christion-c/ThinkTwice`) | Sign in |
| Firebase | Authentication and web hosting | Not set up yet |
| thinktwice.site | Domain for the web app and API | Domain registrar login |

## 6. Secrets

No secrets are needed yet. When they are, they will be listed in `.env.example` files. Copy each one to `.env` and fill in the real values. `.env` files are never committed, so keep the real values somewhere safe outside this computer, such as a password manager.

## 7. Verify

```powershell
git --version
node --version
python --version
docker --version
git status
```

Each command should print a version, and `git status` should show you are on the `christion` branch.
