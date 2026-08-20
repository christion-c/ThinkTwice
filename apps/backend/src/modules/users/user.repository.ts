import { database } from "../../db/pool.js";
import { expectOneRow } from "../../lib/db-helpers.js";

// User information received from a verified Firebase ID token.
export interface UpsertUserInput {
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  emailVerified: boolean;
}

// Application-facing representation of a PostgreSQL user.
export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Internal representation of a row returned by PostgreSQL.
interface UserRow {
  id: string;
  firebase_uid: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

// Converts PostgreSQL snake_case column names into camelCase properties.
function mapUserRow(row: UserRow): UserProfile {
  return {
    id: row.id,
    firebaseUid: row.firebase_uid,
    email: row.email,
    displayName: row.display_name,
    photoUrl: row.photo_url,
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Creates a ThinkTwice profile for a new Firebase user, or updates the
// existing one when Firebase account information changes. Postgres
// identifies the account using the verified Firebase UID.
export async function upsertUserFromFirebase(
  input: UpsertUserInput,
): Promise<UserProfile> {
  const result = await database.query<UserRow>(
    `
      INSERT INTO users (
        firebase_uid,
        email,
        display_name,
        photo_url,
        email_verified
      )
      VALUES ($1, $2, $3, $4, $5)

      ON CONFLICT (firebase_uid)
      DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        photo_url = EXCLUDED.photo_url,
        email_verified = EXCLUDED.email_verified,
        updated_at = CURRENT_TIMESTAMP

      RETURNING
        id,
        firebase_uid,
        email,
        display_name,
        photo_url,
        email_verified,
        created_at,
        updated_at
    `,
    [
      input.firebaseUid,
      input.email,
      input.displayName,
      input.photoUrl,
      input.emailVerified,
    ],
  );

  const user = expectOneRow(result, "created user");

  return mapUserRow(user);
}
