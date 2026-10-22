// Starts everything for local development: the database, then the API, the ML service and the app.
// Usage: pnpm dev (Expo's menu, press "a" for Android or "w" for web) or pnpm dev:android (opens the emulator).
import { spawn, spawnSync } from "node:child_process";

const IS_WINDOWS = process.platform === "win32";

/** Returns the one-off setup steps and the long-running processes to start, in order. */
export function devPlan({ android = false } = {}) {
  return {
    setup: [
      { label: "database", command: "docker compose up --detach --wait" },
      {
        label: "migrations",
        command: "pnpm --filter @thinktwice/api db:migrate",
      },
    ],
    services: [
      { label: "api", command: "pnpm --filter @thinktwice/api dev" },
      { label: "ml", command: "pnpm --filter @thinktwice/ml dev" },
    ],
    app: {
      label: "app",
      command: `pnpm --filter @thinktwice/app ${android ? "dev:android" : "dev"}`,
    },
  };
}

/** Adds a label to the start of every line of output, so the API's and ML service's logs can be told apart. */
export function labelLines(label, chunk) {
  return chunk.toString().replace(/^(?=.)/gm, `[${label}] `);
}

/** Runs a setup step to completion, exiting with its code if it fails. */
function runSetupStep({ label, command }) {
  console.log(`[dev] ${label}: ${command}`);
  const result = spawnSync(command, { shell: true, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`[dev] ${label} failed; stopping.`);
    process.exit(result.status ?? 1);
  }
}

/** Starts a long-running process whose output is labeled line by line. */
function startService({ label, command }) {
  const child = spawn(command, {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) =>
    process.stdout.write(labelLines(label, chunk)),
  );
  child.stderr.on("data", (chunk) =>
    process.stderr.write(labelLines(label, chunk)),
  );
  return child;
}

/** Stops a process and everything it started (on Windows, killing the shell alone leaves its children running). */
function stopProcess(child) {
  if (child.exitCode !== null || child.pid === undefined) {
    return;
  }
  if (IS_WINDOWS) {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
  } else {
    child.kill("SIGTERM");
  }
}

/** Runs the whole plan and shuts every process down when any of them exits or Ctrl+C is pressed. */
function main() {
  const plan = devPlan({ android: process.argv.includes("--android") });
  plan.setup.forEach(runSetupStep);

  const services = plan.services.map(startService);
  // The app keeps the terminal so Expo's keyboard shortcuts work.
  const app = spawn(plan.app.command, { shell: true, stdio: "inherit" });
  const all = [...services, app];

  let stopping = false;
  const stopAll = (code) => {
    if (stopping) {
      return;
    }
    stopping = true;
    all.forEach(stopProcess);
    process.exitCode = code;
  };
  for (const [index, child] of all.entries()) {
    child.on("exit", (code) => {
      if (!stopping) {
        const label =
          index < services.length
            ? plan.services[index]?.label
            : plan.app.label;
        console.log(
          `[dev] ${label ?? "process"} exited (code ${String(code)}); stopping everything.`,
        );
      }
      stopAll(code ?? 0);
    });
  }
  process.on("SIGINT", () => {
    stopAll(0);
  });
}

if (import.meta.main) {
  main();
}
