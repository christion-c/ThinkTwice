# Next Session Handoff

Written 2026-10-10 at the end of a long Claude Code session. A new session
should read this first: it says where the project stands, how to get every
tool signed in again, and how Christion likes to work. Update or delete it
once it stops being true.

## Where things stand

- **Code:** `main` at `b2e1a2f` (merge of PR #19). CI ("Validate") passed on
  every `main` commit that day. Only `main` and `parker` exist on GitHub.

- **App version:** 1.1.0 (`apps/frontend/app.json`). EAS sets the Android
  build number itself (`appVersionSource: remote`).

- **Backend (Cloud Run `thinktwice-backend`):** deployed from the 1.1.0
  code, by digest. Migration `010` (asset growth, "already paid this month")
  ran in production.

- **ML service (Cloud Run `thinktwice-ml`):** deployed from the same code, by
  digest.

- **Website (thinktwice.site):** **behind.** Still serves an earlier build
  (`entry-66cfc2c7…`), so Google sign-in is off on the web. Redeploying it is
  P1 in the tracker.

- **Android:** the 1.1.0 production build passed a full check from Play's
  **internal testing** track (Google sign-in, Finance, Fuel, Settings).
  **Not yet promoted to the closed test:** in Play Console, Internal testing →
  Promote release → Closed testing, paste the "What's new" text from
  [RELEASE_NOTES.md](RELEASE_NOTES.md), then wait for Google's review.

- **Google sign-in setup (done):** Google provider enabled in Firebase Auth,
  `thinktwice.site` added to authorized domains,
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set in EAS (production and preview),
  and both Android SHA-1s (EAS upload key, Play app-signing key) added to the
  Firebase Android app.

- **Parker** is away. Don't change his branch or share the tracker with him
  until Christion says so. Every commit on `parker` is already in `main`, so
  it can simply be brought up to `main` later.

## The issue tracker is the to-do list

Open work lives in the **ThinkTwice Issue Tracker**, a private claude.ai
artifact owned by Christion's account:
<https://claude.ai/artifact/LUxkvCZ7CTfgNFHui1emFY>

`docs/KNOWN_ISSUES.md` only points there (plus standing notes). When
Christion says "add this to known issues", add a row to the tracker, not to
the file.

For Claude: read and write it with the `ArtifactData` tool (load it with
ToolSearch), collection `issues`, one document per issue:

- `title`, `body` (plain text; `code`, **bold**, numbered or bulleted
  lines), `section`, `priority` (`P1`-`P3`), `area` (`Backend`, `Frontend`,
  `ML`, `Infra`, `Docs`, `Store`), `status` (`open`, `in_progress`, `done`),
  `files` (array of repo paths), `added` and optional `updated`
  (YYYY-MM-DD), `order`, and optional `assignee` (an opaque `u_…` id, never
  a name).

- Sections: Bugs, Requested app changes, New features, Features to finish,
  Repo and process, Security and dependencies, Production practices, Code
  health.

- Pin every write to an existing document with `if_version` from a read.
  Update statuses as work progresses.

To change the page itself, read it with the `Artifact` tool
(`action: "read"`, that `url`), edit, and publish back to the same `url`. It
declares the `db` and `user` (`profile` scope) capabilities.

**Start here (the four P1s):**

1. **"Delete my account" deletes the data but not the login.** Needs the
   Cloud Run log first, from Christion's laptop (the command is in the
   tracker item). Suspected cause: the backend's service account lacks
   `roles/firebaseauth.admin`.

2. **A deleted account can come straight back** (no `checkRevoked`, and the
   user is upserted on every request).

3. **The privacy policy and delete-account page leave out the money plan and
   check-ins**, which Google Play's data-safety form must match.

4. **Redeploy the website** from `main`.

## Getting signed in again

The devcontainer mounts the laptop clone (`C:\users\bubba\projects\thinktwice`)
at `/workspace`, so the repo, `.env` files and the `node_modules` and `.venv`
volumes survive closing the container. Logins and Claude's memory don't
(memory lives in `~/.claude` inside the container). Full laptop rebuild
steps: [christion-laptop-setup.md](christion-laptop-setup.md).

### Inside the devcontainer (what Claude can use)

- **Git:** pushing works through VS Code's credential helper. There's no
  `gh` CLI and no GitHub token, so Christion opens and merges PRs on
  github.com (Claude gives the `pull/new/<branch>` link).

- **Docker:** uses the laptop's Docker Desktop. Containers publish ports on
  the host, not `localhost`; reach one by its bridge IP
  (`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <name>`).

- **No `gcloud`, `eas` login or Firebase login here.** Deploys, logs, EAS
  and Play run on the laptop; Claude gives the exact commands.

- **ML tests:** if `services/ml/.venv` lacks dev packages,
  `services/ml/.venv/bin/python -m pip install -r services/ml/requirements-dev.txt`.

- **Backend tests** need Postgres. A throwaway one:
  `docker run -d --rm --name tt-pg -e POSTGRES_USER=thinktwice -e POSTGRES_PASSWORD=thinktwice_dev -e POSTGRES_DB=thinktwice postgres:17`,
  then `DATABASE_URL=postgresql://thinktwice:thinktwice_dev@<bridge-ip>:5432/thinktwice npm test`
  in `apps/backend`, and `docker stop tt-pg` after.

### On the laptop (Windows PowerShell)

Run each once per machine, or again if a command says you're signed out:

| Service                    | Sign in                                                                                                                                       | Check                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Google Cloud               | `gcloud auth login`, then `gcloud config set project thinktwice-dev-christion`                                                                | `gcloud run services list --region us-east4`                          |
| Local backend credentials  | `gcloud auth application-default login --impersonate-service-account=thinktwice-dev-backend@thinktwice-dev-christion.iam.gserviceaccount.com` | path goes in the root `.env` as `GOOGLE_ADC_PATH`                     |
| Docker → Artifact Registry | `gcloud auth configure-docker us-east4-docker.pkg.dev`                                                                                        | a `docker push` succeeds                                              |
| Expo / EAS                 | `npx eas-cli login` (from `apps\frontend`)                                                                                                    | `npx eas-cli whoami`, `npx eas-cli env:list --environment production` |
| Firebase Hosting           | `npx firebase-tools@latest login`                                                                                                             | `npx firebase-tools@latest projects:list`                             |
| Play Console               | browser, Christion's Google account                                                                                                           | app `com.thinktwicefinance.app`                                       |
| claude.ai                  | browser, the same account as Claude Code                                                                                                      | the tracker link opens                                                |

Run EAS, Expo export and Firebase commands from `apps\frontend`, and Docker
builds from the repo root. Run `npm ci` in `apps\frontend` after pulling,
because the Expo package versions changed in 1.1.0.

### Environment files

`.env` files are gitignored, and Claude must never create, print or commit
them. If they're missing, Christion copies `.env.example` → `.env` (repo root)
and `apps/frontend/.env.example` → `apps/frontend/.env`, then fills in the
values. The `EXPO_PUBLIC_*` values match `npx eas-cli env:list --environment
production`, except `EXPO_PUBLIC_API_URL`, which is
`http://localhost:3000` for local web development.

## Quick health checks

From anywhere (expected results in brackets):

```bash
curl -s https://thinktwice-backend-93723759667.us-east4.run.app/health        # "database":"connected"
curl -s -o /dev/null -w "%{http_code}\n" https://thinktwice-backend-93723759667.us-east4.run.app/money-plan   # 401 (404 = old code)
curl -s https://thinktwice.site/ | grep -o 'entry-[a-f0-9]*\.js'              # changes after a web deploy
curl -s "https://api.github.com/repos/christion-c/ThinkTwice/actions/runs?branch=main&per_page=3"  # CI results
```

The ML service returns 403 to unauthenticated requests even when healthy.
The backend also answers at `https://thinktwice-backend-u2huwum3ta-uk.a.run.app`
(the same service; the EAS environment uses that one).

## How Christion likes to work

- **Branches and PRs:** branch off `main` for every change, commit by area
  with clear messages, and ask before pushing. Christion merges on GitHub.
  Afterwards, switch back to `main`, pull, and delete the merged branch.

- **Checks before handing off:** run the subsystem checks in the root
  `AGENTS.md`, and say plainly what wasn't run.

- **Deploy order:** backend before frontend. Deploy Cloud Run **by digest**,
  never `:latest` (a stale `:latest` once broke production), and confirm
  with the 401-vs-404 check.

- **Ask before decisions that are his:** product behavior, priorities,
  anything visible to testers.

- **Docs:**
  - Leave a blank line between list items.
  - Indent nested lists 2 spaces.
  - Run `npx --prefix apps/backend prettier --check <file>` on Markdown.
    Christion's editor runs Prettier on save, and once flattened a list by
    saving an older open copy over an edit, so check `git diff` before
    committing a file he has open.

- **Release notes** for each app version go in
  [RELEASE_NOTES.md](RELEASE_NOTES.md), with a Play "What's new" under 500
  characters.

## Lessons from 2026-10-10

- **Frontend dependencies:** align Expo's patch versions
  (`npx expo install --check`) _before_ `npm audit fix`. The other order
  broke the web export.

- **Frontend Docker image:** its build context is `apps/frontend` (as in
  `compose.yaml`), not the repo root.

- **Native Google sign-in** uses `@react-native-google-signin/google-signin`,
  set up in `lib/google-sign-in.native.ts`. Web uses Firebase's popup in
  `lib/google-sign-in.ts`. Details: [frontend.md](frontend.md#google-sign-in).

- **Dated facts drift.** Re-check counts, versions and commit numbers before
  repeating them.
