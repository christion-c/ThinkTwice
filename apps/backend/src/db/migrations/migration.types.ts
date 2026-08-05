import type { PoolClient } from "pg";

/**
 * Describes one database migration.
 *
 * A migration is a numbered database change, such as creating a table
 * or adding a column. Migrations let every team member create the same
 * database structure in the same order.
 */
export interface Migration {
  /**
   * Unique, ordered identifier.
   * Example: "001_create_users"
   */
  readonly id: string;

  /**
   * Short explanation of what the migration changes.
   */
  readonly description: string;

  /**
   * Performs the database change.
   *
   * PoolClient allows the migration runner to execute this function
   * inside a PostgreSQL transaction.
   */
  up(client: PoolClient): Promise<void>;
}