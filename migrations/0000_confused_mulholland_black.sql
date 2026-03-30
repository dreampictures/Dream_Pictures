CREATE TABLE "album_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"album_id" integer,
	"image_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "album_passwords" (
	"code" text PRIMARY KEY NOT NULL,
	"password" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"client_name" text NOT NULL,
	"event_date" text,
	"cover_image_url" text,
	"passcode" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "albums_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"page_count" integer NOT NULL,
	"last_checked" timestamp DEFAULT now(),
	CONSTRAINT "albums_cache_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"service" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'new',
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"dob" text,
	"anniversary" text,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"description" text NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"payment_method" text DEFAULT 'Cash' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"work_id" integer,
	"client_name" text NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"payment_date" text NOT NULL,
	"payment_method" text DEFAULT 'Cash' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_works" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"client_name" text NOT NULL,
	"description" text NOT NULL,
	"work_type" text DEFAULT 'Other' NOT NULL,
	"work_stage" text DEFAULT 'Shoot Done' NOT NULL,
	"total_price" real DEFAULT 0 NOT NULL,
	"advance_paid" real DEFAULT 0 NOT NULL,
	"work_date" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"image_url" text NOT NULL,
	"featured" boolean DEFAULT false,
	"album_id" text
);
--> statement-breakpoint
ALTER TABLE "album_images" ADD CONSTRAINT "album_images_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_payments" ADD CONSTRAINT "crm_payments_client_id_crm_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."crm_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_payments" ADD CONSTRAINT "crm_payments_work_id_crm_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."crm_works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_works" ADD CONSTRAINT "crm_works_client_id_crm_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."crm_clients"("id") ON DELETE no action ON UPDATE no action;