CREATE TABLE IF NOT EXISTS "album_images" (
        "id" serial PRIMARY KEY NOT NULL,
        "album_id" integer,
        "image_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "albums" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "client_name" text NOT NULL,
        "event_date" text,
        "cover_image_url" text,
        "passcode" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "albums_cache" (
        "id" serial PRIMARY KEY NOT NULL,
        "code" text NOT NULL,
        "page_count" integer NOT NULL,
        "last_checked" timestamp DEFAULT now(),
        CONSTRAINT "albums_cache_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "phone" text,
        "service" text NOT NULL,
        "message" text NOT NULL,
        "status" text DEFAULT 'new',
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portfolio_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "category" text NOT NULL,
        "image_url" text NOT NULL,
        "featured" boolean DEFAULT false,
        "album_id" text
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "album_images" ADD CONSTRAINT "album_images_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
