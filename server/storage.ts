import { 
  portfolioItems, type PortfolioItem, type InsertPortfolioItem,
  contactMessages, type ContactMessage, type InsertContactMessage,
  albums, type Album, type InsertAlbum,
  albumsCache, type AlbumCache, type InsertAlbumCache,
  albumPasswords,
  crmClients, type CrmClient, type InsertCrmClient,
  crmWorks, type CrmWork, type InsertCrmWork,
  crmPayments, type CrmPayment, type InsertCrmPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getPortfolioItems(): Promise<PortfolioItem[]>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  getContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage>;
  getAlbums(): Promise<Album[]>;
  createAlbum(album: InsertAlbum): Promise<Album>;
  getAlbumCache(code: string): Promise<AlbumCache | undefined>;
  setAlbumCache(cache: InsertAlbumCache): Promise<AlbumCache>;
  getAlbumPasswords(): Promise<Record<string, string>>;
  getAlbumPassword(code: string): Promise<string | null>;
  setAlbumPassword(code: string, password: string): Promise<void>;
  removeAlbumPassword(code: string): Promise<void>;
  // CRM
  getCrmClients(): Promise<CrmClient[]>;
  getCrmClient(id: number): Promise<CrmClient | undefined>;
  createCrmClient(client: InsertCrmClient): Promise<CrmClient>;
  updateCrmClient(id: number, client: Partial<InsertCrmClient>): Promise<CrmClient>;
  deleteCrmClient(id: number): Promise<void>;
  getCrmWorks(): Promise<CrmWork[]>;
  createCrmWork(work: InsertCrmWork): Promise<CrmWork>;
  updateCrmWork(id: number, work: Partial<InsertCrmWork>): Promise<CrmWork>;
  deleteCrmWork(id: number): Promise<void>;
  getCrmPayments(): Promise<CrmPayment[]>;
  createCrmPayment(payment: InsertCrmPayment): Promise<CrmPayment>;
  updateCrmPayment(id: number, payment: Partial<InsertCrmPayment>): Promise<CrmPayment>;
  deleteCrmPayment(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPortfolioItems(): Promise<PortfolioItem[]> {
    return await db.select().from(portfolioItems).orderBy(desc(portfolioItems.id));
  }

  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const [newItem] = await db.insert(portfolioItems).values(item).returning();
    return newItem;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db.insert(contactMessages).values(message).returning();
    return newMessage;
  }

  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage> {
    const [updated] = await db.update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, id))
      .returning();
    return updated;
  }

  async getAlbums(): Promise<Album[]> {
    return await db.select().from(albums).orderBy(desc(albums.createdAt));
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const [newAlbum] = await db.insert(albums).values(album).returning();
    return newAlbum;
  }

  async getAlbumCache(code: string): Promise<AlbumCache | undefined> {
    const [cached] = await db.select().from(albumsCache).where(eq(albumsCache.code, code));
    return cached;
  }

  async setAlbumCache(insertCache: InsertAlbumCache): Promise<AlbumCache> {
    const [cache] = await db.insert(albumsCache)
      .values(insertCache)
      .onConflictDoUpdate({
        target: albumsCache.code,
        set: { 
          pageCount: insertCache.pageCount,
          lastChecked: new Date()
        }
      })
      .returning();
    return cache;
  }

  async getAlbumPasswords(): Promise<Record<string, string>> {
    const rows = await db.select().from(albumPasswords);
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.code] = row.password;
    }
    return result;
  }

  async getAlbumPassword(code: string): Promise<string | null> {
    const [row] = await db.select().from(albumPasswords).where(eq(albumPasswords.code, code));
    return row ? row.password : null;
  }

  async setAlbumPassword(code: string, password: string): Promise<void> {
    await db.insert(albumPasswords)
      .values({ code, password })
      .onConflictDoUpdate({
        target: albumPasswords.code,
        set: { password },
      });
  }

  async removeAlbumPassword(code: string): Promise<void> {
    await db.delete(albumPasswords).where(eq(albumPasswords.code, code));
  }

  // CRM
  async getCrmClients(): Promise<CrmClient[]> {
    return await db.select().from(crmClients).orderBy(desc(crmClients.createdAt));
  }

  async getCrmClient(id: number): Promise<CrmClient | undefined> {
    const [client] = await db.select().from(crmClients).where(eq(crmClients.id, id));
    return client;
  }

  async createCrmClient(client: InsertCrmClient): Promise<CrmClient> {
    const [newClient] = await db.insert(crmClients).values(client).returning();
    return newClient;
  }

  async updateCrmClient(id: number, client: Partial<InsertCrmClient>): Promise<CrmClient> {
    const [updated] = await db.update(crmClients)
      .set(client)
      .where(eq(crmClients.id, id))
      .returning();
    return updated;
  }

  async deleteCrmClient(id: number): Promise<void> {
    await db.delete(crmWorks).where(eq(crmWorks.clientId, id));
    await db.delete(crmClients).where(eq(crmClients.id, id));
  }

  async getCrmWorks(): Promise<CrmWork[]> {
    return await db.select().from(crmWorks).orderBy(desc(crmWorks.createdAt));
  }

  async createCrmWork(work: InsertCrmWork): Promise<CrmWork> {
    const [newWork] = await db.insert(crmWorks).values(work).returning();
    return newWork;
  }

  async updateCrmWork(id: number, work: Partial<InsertCrmWork>): Promise<CrmWork> {
    const [updated] = await db.update(crmWorks)
      .set(work)
      .where(eq(crmWorks.id, id))
      .returning();
    return updated;
  }

  async deleteCrmWork(id: number): Promise<void> {
    await db.delete(crmWorks).where(eq(crmWorks.id, id));
  }

  async getCrmPayments(): Promise<CrmPayment[]> {
    return await db.select().from(crmPayments).orderBy(desc(crmPayments.createdAt));
  }

  async createCrmPayment(payment: InsertCrmPayment): Promise<CrmPayment> {
    const [p] = await db.insert(crmPayments).values(payment).returning();
    return p;
  }

  async updateCrmPayment(id: number, payment: Partial<InsertCrmPayment>): Promise<CrmPayment> {
    const [p] = await db.update(crmPayments).set(payment).where(eq(crmPayments.id, id)).returning();
    return p;
  }

  async deleteCrmPayment(id: number): Promise<void> {
    await db.delete(crmPayments).where(eq(crmPayments.id, id));
  }
}

export const storage = new DatabaseStorage();
