ALTER TABLE "crm_works" ADD COLUMN IF NOT EXISTS "work_type" text NOT NULL DEFAULT 'Other';
ALTER TABLE "crm_works" ADD COLUMN IF NOT EXISTS "work_stage" text NOT NULL DEFAULT 'Shoot Done';

CREATE TABLE IF NOT EXISTS "crm_payments" (
  "id" serial PRIMARY KEY NOT NULL,
  "client_id" integer REFERENCES "crm_clients"("id") ON DELETE SET NULL,
  "client_name" text NOT NULL,
  "amount" real NOT NULL DEFAULT 0,
  "payment_date" text NOT NULL,
  "payment_method" text NOT NULL DEFAULT 'Cash',
  "notes" text,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_works_client_id ON crm_works(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_works_status ON crm_works(status);
CREATE INDEX IF NOT EXISTS idx_crm_works_work_date ON crm_works(work_date);
CREATE INDEX IF NOT EXISTS idx_crm_payments_client_id ON crm_payments(client_id);
