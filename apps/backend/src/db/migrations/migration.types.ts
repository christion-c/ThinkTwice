import type { PoolClient } from "pg";

// Describes one database migration - a numbered database change, such
// as creating a table or adding a column. Migrations let every team
// member build the same database structure in the same order.
export interface Migration {
  // Unique, ordered identifier. Example: "001_create_users"
  readonly id: string;
  // Short explanation of what the migration changes.
  readonly description: string;
  // Performs the database change. PoolClient lets the migration runner
  // execute this inside a Postgres transaction.
  up(client: PoolClient): Promise<void>;
}
