CREATE TABLE IF NOT EXISTS "crm_clients" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "dob" text,
  "anniversary" text,
  "address" text,
  "notes" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "crm_works" (
  "id" serial PRIMARY KEY NOT NULL,
  "client_id" integer REFERENCES "crm_clients"("id") ON DELETE SET NULL,
  "client_name" text NOT NULL,
  "description" text NOT NULL,
  "total_price" real NOT NULL DEFAULT 0,
  "advance_paid" real NOT NULL DEFAULT 0,
  "work_date" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp DEFAULT now()
);
