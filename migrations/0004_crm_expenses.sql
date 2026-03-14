CREATE TABLE IF NOT EXISTS "crm_expenses" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "category" text NOT NULL DEFAULT 'General',
  "description" text NOT NULL,
  "amount" real NOT NULL DEFAULT 0,
  "payment_method" text NOT NULL DEFAULT 'Cash',
  "notes" text,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_expenses_date ON crm_expenses(date);
