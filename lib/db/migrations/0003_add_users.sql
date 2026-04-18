CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "image" text,
  "phone" text,
  "password_hash" text,
  "provider" text NOT NULL DEFAULT 'credentials',
  "google_id" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_google_id" ON "users" ("google_id");

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "provider" text NOT NULL,
  "provider_account_id" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
