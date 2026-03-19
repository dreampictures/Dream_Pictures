import { pgTable, text, serial, timestamp, boolean, integer, real } from "drizzle-orm/pg-core";
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

// CRM Tables
export const crmClients = pgTable("crm_clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  dob: text("dob"),
  anniversary: text("anniversary"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crmWorks = pgTable("crm_works", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => crmClients.id),
  clientName: text("client_name").notNull(),
  description: text("description").notNull(),
  workType: text("work_type").notNull().default("Other"),
  workStage: text("work_stage").notNull().default("Shoot Done"),
  totalPrice: real("total_price").notNull().default(0),
  advancePaid: real("advance_paid").notNull().default(0),
  workDate: text("work_date").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crmPayments = pgTable("crm_payments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => crmClients.id),
  workId: integer("work_id").references(() => crmWorks.id),
  clientName: text("client_name").notNull(),
  amount: real("amount").notNull().default(0),
  paymentDate: text("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull().default("Cash"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crmExpenses = pgTable("crm_expenses", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  category: text("category").notNull().default("General"),
  description: text("description").notNull(),
  amount: real("amount").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("Cash"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCrmExpenseSchema = createInsertSchema(crmExpenses).omit({ id: true, createdAt: true });
export type CrmExpense = typeof crmExpenses.$inferSelect;
export type InsertCrmExpense = z.infer<typeof insertCrmExpenseSchema>;

export const insertCrmClientSchema = createInsertSchema(crmClients).omit({ id: true, createdAt: true });
export const insertCrmWorkSchema = createInsertSchema(crmWorks).omit({ id: true, createdAt: true });
export const insertCrmPaymentSchema = createInsertSchema(crmPayments).omit({ id: true, createdAt: true });

export type CrmClient = typeof crmClients.$inferSelect;
export type InsertCrmClient = z.infer<typeof insertCrmClientSchema>;
export type CrmWork = typeof crmWorks.$inferSelect;
export type InsertCrmWork = z.infer<typeof insertCrmWorkSchema>;
export type CrmPayment = typeof crmPayments.$inferSelect;
export type InsertCrmPayment = z.infer<typeof insertCrmPaymentSchema>;

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
