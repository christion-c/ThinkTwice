#!/bin/sh
# Creates the ThinkTwice database roles and databases. PostgreSQL runs this once, when the data volume is first created.
set -eu

psql --set=ON_ERROR_STOP=1 --username="$POSTGRES_USER" --dbname=postgres \
  --set=owner_password="$THINKTWICE_OWNER_PASSWORD" \
  --set=app_password="$THINKTWICE_APP_PASSWORD" <<'SQL'
-- Owns the tables and runs migrations. Not a superuser.
CREATE ROLE thinktwice_owner LOGIN PASSWORD :'owner_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

-- Used by the API. Gets only the table privileges that migrations grant it, and can never bypass row-level security.
CREATE ROLE thinktwice_app LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT;

CREATE DATABASE thinktwice OWNER thinktwice_owner;
CREATE DATABASE thinktwice_test OWNER thinktwice_owner;
SQL

for database in thinktwice thinktwice_test; do
  psql --set=ON_ERROR_STOP=1 --username="$POSTGRES_USER" --dbname="$database" \
    --set=database="$database" <<'SQL'
REVOKE ALL ON DATABASE :"database" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"database" TO thinktwice_owner, thinktwice_app;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO thinktwice_app;
SQL
done
