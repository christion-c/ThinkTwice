import type { Migration } from "./migration.types.js";

/**
 * Creates the application's user-profile table.
 *
 * Firebase remains responsible for authentication. PostgreSQL stores only
 * ThinkTwice profile information and the Firebase UID used to identify the
 * authenticated user.
 */
export const createUsersMigration: Migration = {
  id: "001_create_users",
  description: "Create the users table",

  async up(client) {
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        firebase_uid TEXT NOT NULL UNIQUE
          CHECK (char_length(firebase_uid) BETWEEN 1 AND 128),

        email TEXT
          CHECK (email IS NULL OR char_length(email) <= 320),

        display_name TEXT
          CHECK (
            display_name IS NULL
            OR char_length(display_name) <= 100
          ),

        photo_url TEXT
          CHECK (
            photo_url IS NULL
            OR char_length(photo_url) <= 2048
          ),

        email_verified BOOLEAN NOT NULL DEFAULT FALSE,

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  },
};