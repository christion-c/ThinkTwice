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
winget install --id astral-sh.uv -e
winget install --id Docker.DockerDesktop -e
winget install --id Microsoft.VisualStudioCode -e
winget install --id Google.AndroidStudio -e
winget install --id EclipseAdoptium.Temurin.17.JDK -e
```

Close and reopen PowerShell afterwards so the new commands are on your `PATH`.

| Tool                | Used for                                                               | Version on the dev machine                     |
| ------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| Git                 | Version control                                                        | 2.55.0                                         |
| Node.js (LTS)       | Expo app and Fastify API                                               | 24.21.0                                        |
| pnpm                | JavaScript package manager                                             | 12.14.0                                        |
| Python              | ML service                                                             | 3.14.7                                         |
| uv                  | Python package manager for the ML service                              | 0.13.5                                         |
| Docker Desktop      | Runs the API, PostgreSQL and ML service locally                        | 29.7.2                                         |
| VS Code             | Editor                                                                 | 1.142.0                                        |
| Android Studio      | Android emulator and SDK for building the app                          | (any current version)                          |
| JDK 17 (Temurin)    | Building the Android app (React Native's Gradle build targets Java 17) | 17.0.20                                        |
| CMake (Android SDK) | Native (C++) parts of the Android build                                | 4.1.2 (installed in Android Studio, see below) |

pnpm automatically switches to the exact version pinned in `package.json` (`packageManager`), so any recent pnpm 12 install works.

After installing the JDK, open Android Studio once so it installs the Android SDK, then tell the Android build tools where it is (PowerShell):

```powershell
[Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
```

The JDK installer sets `JAVA_HOME` to JDK 17 for you.

Android's native build needs two more things on Windows, because some libraries' build paths are over 300 characters, past Windows' old 260-character limit:

1. **Turn on Windows long-path support** (one-time; approve the admin prompt):

   ```powershell
   Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile', '-Command', "New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force"
   ```

2. **Install CMake 4.1.2** in Android Studio: **Settings > Languages & Frameworks > Android SDK > SDK Tools**, tick **Show Package Details**, then under **CMake** tick **4.1.2** and click **Apply**. (Its ninja 1.12 handles long paths; the default CMake 3.22.1 doesn't.) The app's config plugin `apps/app/plugins/with-windows-cmake.js` points the build at it automatically.

Open a new terminal afterwards so all of these take effect.

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
cd services\ml
uv sync
cd ..\..
```

`pnpm install` installs every JavaScript tool the repo uses (TypeScript, ESLint, Prettier, Lefthook) at the versions locked in `pnpm-lock.yaml`, and installs the git hooks that check formatting, linting and commit messages on every commit. `uv sync` creates the ML service's Python environment (`services/ml/.venv`) with the exact versions locked in `services/ml/uv.lock`, downloading the right Python version if needed.

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
Copy-Item services\ml\.env.example services\ml\.env
Copy-Item apps\app\.env.example apps\app\.env
```

Then replace every `change-me` value with a strong random one. Generate database passwords with `openssl rand -hex 24` and the ML service token with `openssl rand -hex 32` (Git Bash). The owner and app passwords must be the same in the root and API files.

| File                | Contains secrets?               | Where real values come from                                                                                                                                                                                                                                                                                                                               |
| ------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env`              | Database passwords              | Local only: generate new ones. They only protect the database on this computer.                                                                                                                                                                                                                                                                           |
| `services/api/.env` | Database passwords              | Local only: the same owner and app passwords as the root `.env`.                                                                                                                                                                                                                                                                                          |
| `services/ml/.env`  | ML service token                | Local only: generate a new one.                                                                                                                                                                                                                                                                                                                           |
| `apps/app/.env`     | No (public Firebase web config) | Firebase console > Project settings > Your apps > Web app, for project `thinktwice-dev-christion`. Fill in `EXPO_PUBLIC_FIREBASE_API_KEY` and `EXPO_PUBLIC_FIREBASE_APP_ID`. For Google sign-in on Android, also `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: Firebase console > Authentication > Sign-in method > Google > Web SDK configuration > Web client ID. |

Local passwords and tokens don't need to be backed up: after a reset, generate new ones and recreate the database (step 8). When production secrets are added, keep their real values somewhere safe outside this computer, such as a password manager, and note where each one comes from in this table.

## 7. Build the Android app (once)

The app uses its own native code (Google sign-in), so it runs in a **development build**: your own debug version of ThinkTwice, instead of Expo Go. Build and install it on the running emulator with:

```powershell
pnpm --filter @thinktwice/app android:build
```

The first build takes 10 to 20 minutes (Gradle downloads its tools). Run it again only after native changes: a new native library, or a change in `apps/app/modules/` or `app.json`. Everyday code changes don't need a rebuild.

## 8. Run everything

1. Make sure **Docker Desktop** is running.
2. For Android, open Android Studio's **Device Manager** and start an emulator (the dev machine uses a Pixel 8a image).
3. Run one command:

   ```powershell
   pnpm dev:android
   ```

   Or `pnpm dev` to choose in Expo's menu: press `a` for Android or `w` for the web (<http://localhost:8081>).

`pnpm dev` (`scripts/dev.js`) does all of this:

- Starts PostgreSQL (`docker compose up --detach --wait`). The first time, this creates the database roles and the `thinktwice` and `thinktwice_test` databases.
- Applies any new database migrations.
- Runs the API at <http://127.0.0.1:3000> and the ML service at <http://127.0.0.1:8000>, both reloading when their code changes. Their logs are labeled `[api]` and `[ml]`.
- Runs the app's Expo dev server, which keeps the terminal so its keyboard shortcuts work, and opens the development build from step 7.

Press **Ctrl+C** to stop everything; if any part stops on its own, the rest stop too. The database keeps running in Docker (stop it with `docker compose stop`).

If the app is already open on the emulator, it may keep showing the previous version: press `r` in the terminal to reload it.

To run one part on its own: `pnpm --filter @thinktwice/api dev`, `pnpm --filter @thinktwice/ml dev` or `pnpm --filter @thinktwice/app dev`.

To wipe the local database and start over (for example, after changing the passwords): `docker compose down --volumes`, then `pnpm dev` again.

## 9. Verify

```powershell
git --version
node --version
python --version
uv --version
docker --version
pnpm --version
git status
pnpm format:check
pnpm lint
pnpm test
```

Each version command should print a version, `git status` should show you are on the `christion` branch, and the last three commands should pass with no errors. `pnpm test` needs the database from step 8 to be running.
