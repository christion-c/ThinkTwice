// Rule 13: the API's database role can read and write rows and nothing else.
import { describe, expect, it } from "vitest";

import { queryOnce, testDatabaseUrls } from "../helpers/database.ts";
import {
  expectPostgresError,
  PostgresErrorCode,
} from "../helpers/postgres-errors.ts";

const urls = testDatabaseUrls();

/** Runs a statement as the API's database role. */
function asApp(text: string) {
  return queryOnce(urls.app, text);
}

describe("the API database role", () => {
  it("is not a superuser and can't bypass row-level security", async () => {
    const { rows } = await queryOnce<{
      rolsuper: boolean;
      rolbypassrls: boolean;
    }>(
      urls.app,
      "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user",
    );
    expect(rows).toEqual([{ rolsuper: false, rolbypassrls: false }]);
  });

  it.each([
    "CREATE TABLE intruder (id int)",
    "DROP TABLE expenses",
    "ALTER TABLE expenses DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE expenses NO FORCE ROW LEVEL SECURITY",
    "DROP POLICY expenses_owner_access ON expenses",
    "TRUNCATE expenses",
    "SELECT * FROM schema_migrations",
    "SET ROLE thinktwice_owner",
  ])("can't run: %s", async (statement) => {
    await expectPostgresError(
      asApp(statement),
      PostgresErrorCode.insufficientPrivilege,
    );
  });
});
