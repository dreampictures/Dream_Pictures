import { 
  portfolioItems, type PortfolioItem, type InsertPortfolioItem,
  contactMessages, type ContactMessage, type InsertContactMessage,
  albums, type Album, type InsertAlbum,
  albumsCache, type AlbumCache, type InsertAlbumCache
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
}

export const storage = new DatabaseStorage();
