# ThinkTwice Known Issues and To-Do

Open bugs, requests and cleanup now live in the **ThinkTwice Issue Tracker**:
<https://claude.ai/artifact/LUxkvCZ7CTfgNFHui1emFY>

- Filter by status, priority (P1-P3), area and section; open an issue for
  its full write-up and related files.
- Set statuses and add new issues there, not in this file. Claude can read
  and update the tracker too, so ask it to log or close issues as you work.
- The tracker is private until shared. Ask Christion for access (Contributor
  to change statuses, Viewer to read).

The list moved there on 2026-10-10. This file's history (`git log -p
docs/KNOWN_ISSUES.md`) has every earlier version.

## Notes

These aren't to-dos; they're facts worth knowing.

- `apps/backend/src/db/migrations/006-create-daily-driving-logs.ts`
  mentions `apps/frontend/lib/finance-projections.ts`, which is now
  `lib/fuel/projections.ts`. Leave it: applied migrations must not be
  edited.

- The devcontainer has no `gcloud` or `gh` CLI. Deploys, Secret Manager
  access and PR creation happen from the Windows laptop (see
  [deploying.md](deploying.md) and
  [christion-laptop-setup.md](christion-laptop-setup.md)).

- Local ADC has to be set up on each machine as an impersonated credential
  for `thinktwice-dev-backend`, never a downloaded key (root README, step 4).

- Docker inside the devcontainer publishes ports on the host, not on
  `localhost`. To reach a container from inside the devcontainer, use its
  bridge IP (`docker inspect`) or `host.docker.internal`.
