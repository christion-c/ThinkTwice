// Checks that the Drizzle table definitions match the tables the SQL migrations create.
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { categories, expenses, users } from "../../src/db/schema.ts";
import { queryOnce, testDatabaseUrls } from "../helpers/database.ts";

const urls = testDatabaseUrls();

interface ColumnShape {
  name: string;
  notNull: boolean;
  hasDefault: boolean;
}

/** Describes each column of a Drizzle table definition. */
function drizzleColumns(table: PgTable): ColumnShape[] {
  return getTableConfig(table)
    .columns.map((column) => ({
      name: column.name,
      notNull: column.notNull,
      hasDefault: column.hasDefault,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Describes each column of a table as it exists in the migrated database. */
async function databaseColumns(tableName: string): Promise<ColumnShape[]> {
  const { rows } = await queryOnce<{
    column_name: string;
    is_nullable: string;
    column_default: string | null;
  }>(
    urls.owner,
    "SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
    [tableName],
  );
  return rows
    .map((row) => ({
      name: row.column_name,
      notNull: row.is_nullable === "NO",
      hasDefault: row.column_default !== null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

describe("Drizzle schema", () => {
  it.each([
    ["users", users],
    ["categories", categories],
    ["expenses", expenses],
  ] as const)("matches the %s table", async (tableName, table) => {
    expect(drizzleColumns(table)).toEqual(await databaseColumns(tableName));
  });
});
