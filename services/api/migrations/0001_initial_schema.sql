-- Initial schema: users, categories and expenses, each protected by row-level security (see docs/data-model.md).
-- Never edit a migration after it has been applied; add a new one instead.

-- The signed-in user, set per transaction by the API (see src/db/user-scope.ts). NULL when unset.
CREATE FUNCTION current_app_firebase_uid() RETURNS text
  LANGUAGE sql STABLE
  SET search_path = pg_catalog
  AS $$ SELECT NULLIF(current_setting('app.firebase_uid', true), '') $$;

CREATE FUNCTION current_app_user_id() RETURNS uuid
  LANGUAGE sql STABLE
  SET search_path = pg_catalog
  AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::uuid $$;

-- Keeps updated_at current on every update.
CREATE FUNCTION set_updated_at() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = pg_catalog
  AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

CREATE TYPE category_type AS ENUM ('essential', 'discretionary');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  firebase_uid text NOT NULL,
  email text NOT NULL,
  timezone text NOT NULL,
  monthly_budget_cents integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_firebase_uid_unique UNIQUE (firebase_uid),
  CONSTRAINT users_firebase_uid_length CHECK (char_length(firebase_uid) BETWEEN 1 AND 128),
  CONSTRAINT users_email_length CHECK (char_length(email) BETWEEN 3 AND 320),
  CONSTRAINT users_timezone_length CHECK (char_length(timezone) BETWEEN 1 AND 64),
  CONSTRAINT users_monthly_budget_range CHECK (monthly_budget_cents > 0 AND monthly_budget_cents <= 10000000)
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name text NOT NULL,
  type category_type NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Lets expenses reference (category, owner) pairs, so an expense can only use its own user's category.
  CONSTRAINT categories_id_user_id_unique UNIQUE (id, user_id),
  CONSTRAINT categories_name_length CHECK (char_length(name) BETWEEN 1 AND 40),
  CONSTRAINT categories_name_trimmed CHECK (name = btrim(name)),
  CONSTRAINT categories_sort_order_nonnegative CHECK (sort_order >= 0)
);

CREATE UNIQUE INDEX categories_user_id_name_unique ON categories (user_id, lower(name));

CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  category_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  spent_on date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expenses_category_same_user_fk FOREIGN KEY (category_id, user_id) REFERENCES categories (id, user_id),
  CONSTRAINT expenses_amount_range CHECK (amount_cents > 0 AND amount_cents <= 10000000),
  CONSTRAINT expenses_note_length CHECK (char_length(note) <= 200)
);

CREATE INDEX expenses_user_id_spent_on_idx ON expenses (user_id, spent_on DESC);
CREATE INDEX expenses_category_id_user_id_idx ON expenses (category_id, user_id);

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER expenses_set_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row-level security: every row is visible and writable only inside its owner's scope.
-- FORCE applies the policies to the table owner too, so no role can read across users by accident.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_self_access ON users
  USING (firebase_uid = current_app_firebase_uid())
  WITH CHECK (firebase_uid = current_app_firebase_uid());

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;
CREATE POLICY categories_owner_access ON categories
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
CREATE POLICY expenses_owner_access ON expenses
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

-- The API role can read and write rows (still filtered by the policies above) and nothing else.
GRANT SELECT, INSERT, UPDATE, DELETE ON users, categories, expenses TO thinktwice_app;
