# Known Issues

Open problems, gaps and cleanup for the ThinkTwice rebuild. Add new issues here as they're found, and remove them (in the same commit as the fix) once they're resolved.

_Last updated: 2026-10-22._

**Priority:** P1 = blocks the next milestone, P2 = needed before release, P3 = nice to have.

## Open

| #   | Priority | Area       | Issue                                                                                                                                                                                                                                                                                                                                                      |
| --- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | P2       | Branding   | **App icon source is too small.** `docs/brand/app-logo.png` is 512×512; app stores need 1024×1024 (ideally a vector SVG), plus an Android adaptive icon with the artwork inside the safe zone.                                                                                                                                                             |
| 2   | P2       | Deployment | **API hosting is undecided.** `api.thinktwice.site` has no host chosen yet. Needed before release.                                                                                                                                                                                                                                                         |
| 3   | P2       | Deployment | **Firebase setup for the rebuild is undecided.** Decide whether the rebuild reuses the previous version's Firebase project or gets a new one, set `FIREBASE_PROJECT_ID` to it (it's the local-only placeholder `demo-thinktwice` for now), and record it in `docs/setup.md`.                                                                               |
| 4   | P3       | Tooling    | **TypeScript 7 isn't supported yet.** The repo uses TypeScript 6.0 because typescript-eslint (and Expo SDK 58's template) only support TypeScript below 6.1. Upgrade once typescript-eslint supports TypeScript 7.                                                                                                                                         |
| 5   | P3       | Setup      | **Node.js on the dev machine is one patch behind.** It has 24.21.0; the latest Node 24 LTS release is 24.22.1. Update with `winget upgrade OpenJS.NodeJS.LTS`, then update the version in `docs/setup.md`.                                                                                                                                                 |
| 6   | P3       | API        | **Graceful shutdown hasn't been verified yet.** `services/api/src/server.ts` closes the server on SIGINT/SIGTERM, but Windows (Git Bash) can't send a real SIGTERM, so it's only been tested by force-stopping. Verify it once the API runs in Docker (when it's added to `compose.yaml`).                                                                 |
| 7   | P2       | API        | **Deleting a Firebase account isn't designed yet.** Account deletion must also delete the user's Firebase sign-in account. Without `firebase-admin`, either the app deletes it with the Firebase JS SDK (`deleteUser`) after the API deletes the data, or the API calls Firebase's REST API with a service account. Decide when building account deletion. |

## Notes

These aren't to-dos; they're facts worth knowing.

- **`main` still holds the previous version of the app.** The rebuild lives on `christion`. The first pull request from `christion` into `main` will replace the old code entirely, so only open it once the rebuild is ready to take over. The old code stays in `main`'s git history.
- **The previous version is live at thinktwice.site.** Don't deploy over it until the rebuild is ready (see `CLAUDE.md`).
- **Only Claude's commits are pushed automatically.** Commits made by hand need a manual `git push` (see the Git workflow note in `CLAUDE.md`).
- **Claude's personal memory isn't in the repo** and is lost on a computer reset. Everything important from it is recorded in `CLAUDE.md`.
