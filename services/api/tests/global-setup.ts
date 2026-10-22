import { runMigrations } from "../src/db/migrate.ts";
import { testDatabaseUrls } from "./helpers/database.ts";

/** Brings the test database up to the latest migration before the test run. */
export default async function setup(): Promise<void> {
  await runMigrations(testDatabaseUrls().owner);
}
