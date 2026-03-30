import { 
  portfolioItems, type PortfolioItem, type InsertPortfolioItem,
  contactMessages, type ContactMessage, type InsertContactMessage,
  albums, type Album, type InsertAlbum,
  albumsCache, type AlbumCache, type InsertAlbumCache,
  albumPasswords,
  crmClients, type CrmClient, type InsertCrmClient,
  crmWorks, type CrmWork, type InsertCrmWork,
  crmPayments, type CrmPayment, type InsertCrmPayment,
  crmExpenses, type CrmExpense, type InsertCrmExpense,
  dailyEntries, type DailyEntry, type InsertDailyEntry,
  dailyTransactions, type DailyTransaction, type InsertDailyTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, isNull, isNotNull, lt } from "drizzle-orm";

export interface IStorage {
  getPortfolioItems(): Promise<PortfolioItem[]>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  getContactMessages(): Promise<ContactMessage[]>;
  getTrashMessages(): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage>;
  softDeleteMessage(id: number): Promise<void>;
  restoreMessage(id: number): Promise<void>;
  permanentDeleteMessage(id: number): Promise<void>;
  cleanupOldTrash(): Promise<number>;
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
  getCrmExpenses(): Promise<CrmExpense[]>;
  createCrmExpense(expense: InsertCrmExpense): Promise<CrmExpense>;
  updateCrmExpense(id: number, expense: Partial<InsertCrmExpense>): Promise<CrmExpense>;
  deleteCrmExpense(id: number): Promise<void>;
  searchCrm(q: string): Promise<{ clients: CrmClient[]; works: CrmWork[] }>;
  getClientByPhone(phone: string): Promise<CrmClient | undefined>;
  getPaymentsByWorkId(workId: number): Promise<CrmPayment[]>;
  // Daily Amount
  getDailyEntry(date: string): Promise<DailyEntry | undefined>;
  upsertDailyEntry(entry: InsertDailyEntry): Promise<DailyEntry>;
  getDailyTransactions(date: string): Promise<DailyTransaction[]>;
  createDailyTransaction(tx: InsertDailyTransaction): Promise<DailyTransaction>;
  deleteDailyTransaction(id: number): Promise<void>;
  getDailyHistory(): Promise<DailyEntry[]>;
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
    return await db.select().from(contactMessages)
      .where(isNull(contactMessages.deletedAt))
      .orderBy(desc(contactMessages.createdAt));
  }

  async getTrashMessages(): Promise<ContactMessage[]> {
    await this.cleanupOldTrash();
    return await db.select().from(contactMessages)
      .where(isNotNull(contactMessages.deletedAt))
      .orderBy(desc(contactMessages.deletedAt));
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

  async softDeleteMessage(id: number): Promise<void> {
    await db.update(contactMessages)
      .set({ deletedAt: new Date() })
      .where(eq(contactMessages.id, id));
  }

  async restoreMessage(id: number): Promise<void> {
    await db.update(contactMessages)
      .set({ deletedAt: null })
      .where(eq(contactMessages.id, id));
  }

  async permanentDeleteMessage(id: number): Promise<void> {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
  }

  async cleanupOldTrash(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deleted = await db.delete(contactMessages)
      .where(lt(contactMessages.deletedAt, thirtyDaysAgo))
      .returning();
    return deleted.length;
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

  async getCrmExpenses(): Promise<CrmExpense[]> {
    return await db.select().from(crmExpenses).orderBy(desc(crmExpenses.date));
  }

  async createCrmExpense(expense: InsertCrmExpense): Promise<CrmExpense> {
    const [e] = await db.insert(crmExpenses).values(expense).returning();
    return e;
  }

  async updateCrmExpense(id: number, expense: Partial<InsertCrmExpense>): Promise<CrmExpense> {
    const [e] = await db.update(crmExpenses).set(expense).where(eq(crmExpenses.id, id)).returning();
    return e;
  }

  async deleteCrmExpense(id: number): Promise<void> {
    await db.delete(crmExpenses).where(eq(crmExpenses.id, id));
  }

  async searchCrm(q: string): Promise<{ clients: CrmClient[]; works: CrmWork[] }> {
    const pattern = `%${q}%`;
    const [clients, works] = await Promise.all([
      db.select().from(crmClients)
        .where(or(ilike(crmClients.name, pattern), ilike(crmClients.phone, pattern)))
        .limit(10),
      db.select().from(crmWorks)
        .where(or(ilike(crmWorks.description, pattern), ilike(crmWorks.clientName, pattern)))
        .limit(10),
    ]);
    return { clients, works };
  }

  async getClientByPhone(phone: string): Promise<CrmClient | undefined> {
    const [client] = await db.select().from(crmClients).where(eq(crmClients.phone, phone));
    return client;
  }

  async getPaymentsByWorkId(workId: number): Promise<CrmPayment[]> {
    return await db.select().from(crmPayments).where(eq(crmPayments.workId, workId));
  }

  // Daily Amount
  async getDailyEntry(date: string): Promise<DailyEntry | undefined> {
    const [entry] = await db.select().from(dailyEntries).where(eq(dailyEntries.date, date));
    return entry;
  }

  async upsertDailyEntry(entry: InsertDailyEntry): Promise<DailyEntry> {
    const [result] = await db.insert(dailyEntries)
      .values({ ...entry, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: dailyEntries.date,
        set: {
          openingBalance: entry.openingBalance,
          notes10: entry.notes10,
          notes20: entry.notes20,
          notes50: entry.notes50,
          notes100: entry.notes100,
          notes200: entry.notes200,
          notes500: entry.notes500,
          coins: entry.coins,
          bobSaving: entry.bobSaving,
          bobCurrent: entry.bobCurrent,
          hdfc: entry.hdfc,
          kotak: entry.kotak,
          au: entry.au,
          sbi: entry.sbi,
          aepsBob: entry.aepsBob,
          aepsFino: entry.aepsFino,
          aepsPayworld: entry.aepsPayworld,
          aepsDigipay: entry.aepsDigipay,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getDailyTransactions(date: string): Promise<DailyTransaction[]> {
    return await db.select().from(dailyTransactions)
      .where(eq(dailyTransactions.date, date))
      .orderBy(desc(dailyTransactions.createdAt));
  }

  async createDailyTransaction(tx: InsertDailyTransaction): Promise<DailyTransaction> {
    const [result] = await db.insert(dailyTransactions).values(tx).returning();
    return result;
  }

  async deleteDailyTransaction(id: number): Promise<void> {
    await db.delete(dailyTransactions).where(eq(dailyTransactions.id, id));
  }

  async getDailyHistory(): Promise<DailyEntry[]> {
    return await db.select().from(dailyEntries).orderBy(desc(dailyEntries.date));
  }
}

export const storage = new DatabaseStorage();
