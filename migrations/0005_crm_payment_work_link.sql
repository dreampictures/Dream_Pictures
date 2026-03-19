-- Link payments to works + add performance indexes
ALTER TABLE "crm_payments" ADD COLUMN IF NOT EXISTS "work_id" integer REFERENCES "crm_works"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_crm_payments_date" ON "crm_payments"("payment_date");
CREATE INDEX IF NOT EXISTS "idx_crm_payments_work_id" ON "crm_payments"("work_id");
CREATE INDEX IF NOT EXISTS "idx_crm_works_status" ON "crm_works"("status");
CREATE INDEX IF NOT EXISTS "idx_crm_works_date" ON "crm_works"("work_date");
CREATE INDEX IF NOT EXISTS "idx_crm_expenses_date" ON "crm_expenses"("date");
CREATE INDEX IF NOT EXISTS "idx_crm_clients_phone" ON "crm_clients"("phone");
