CREATE TABLE IF NOT EXISTS "daily_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"opening_balance" real NOT NULL DEFAULT 0,
	"notes_10" real NOT NULL DEFAULT 0,
	"notes_20" real NOT NULL DEFAULT 0,
	"notes_50" real NOT NULL DEFAULT 0,
	"notes_100" real NOT NULL DEFAULT 0,
	"notes_200" real NOT NULL DEFAULT 0,
	"notes_500" real NOT NULL DEFAULT 0,
	"coins" real NOT NULL DEFAULT 0,
	"bob_saving" real NOT NULL DEFAULT 0,
	"bob_current" real NOT NULL DEFAULT 0,
	"hdfc" real NOT NULL DEFAULT 0,
	"kotak" real NOT NULL DEFAULT 0,
	"au" real NOT NULL DEFAULT 0,
	"sbi" real NOT NULL DEFAULT 0,
	"aeps_bob" real NOT NULL DEFAULT 0,
	"aeps_fino" real NOT NULL DEFAULT 0,
	"aeps_payworld" real NOT NULL DEFAULT 0,
	"aeps_digipay" real NOT NULL DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "daily_entries_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"amount" real NOT NULL DEFAULT 0,
	"note" text NOT NULL DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
