import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  featured: boolean("featured").default(false),
  albumId: text("album_id"),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  service: text("service").notNull(),
  message: text("message").notNull(),
  status: text("status").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  eventDate: text("event_date"),
  coverImageUrl: text("cover_image_url"),
  passcode: text("passcode"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const albumImages = pgTable("album_images", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").references(() => albums.id),
  imageUrl: text("image_url").notNull(),
});

export const albumsCache = pgTable("albums_cache", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  pageCount: integer("page_count").notNull(),
  lastChecked: timestamp("last_checked").defaultNow(),
});

export const albumPasswords = pgTable("album_passwords", {
  code: text("code").primaryKey(),
  password: text("password").notNull(),
});

export const insertAlbumPasswordSchema = createInsertSchema(albumPasswords);

export const insertPortfolioSchema = createInsertSchema(portfolioItems).omit({ id: true });
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true });
export const insertAlbumSchema = createInsertSchema(albums).omit({ id: true, createdAt: true });
export const insertAlbumCacheSchema = createInsertSchema(albumsCache).omit({ id: true, lastChecked: true });

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;

export type AlbumImage = typeof albumImages.$inferSelect;

export interface AlbumResponse {
  code: string;
  pages: string[];
  totalPages: number;
}

export type AlbumCache = typeof albumsCache.$inferSelect;
export type InsertAlbumCache = z.infer<typeof insertAlbumCacheSchema>;
