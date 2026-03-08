import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const CDN_BASE_URL = "https://cdn.thedreampictures.com";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function listR2Albums(): Promise<string[]> {
  const client = getR2Client();
  if (!client) return [];
  const bucket = process.env.R2_BUCKET_NAME || "albums";
  try {
    const cmd = new ListObjectsV2Command({ Bucket: bucket, Delimiter: "/" });
    const res = await client.send(cmd);
    const folders = (res.CommonPrefixes || [])
      .map((p) => p.Prefix?.replace(/\/$/, "") || "")
      .filter(Boolean)
      .filter((name) => name !== "passwords" && !name.startsWith("."));
    return folders.sort();
  } catch (err) {
    console.error("R2 list error:", err);
    return [];
  }
}

function padPageNumber(num: number): string {
  return num.toString().padStart(3, '0');
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Portfolio
  app.get(api.portfolio.list.path, async (req, res) => {
    const items = await storage.getPortfolioItems();
    res.json(items);
  });

  app.post(api.portfolio.create.path, async (req, res) => {
    try {
      const data = api.portfolio.create.input.parse(req.body);
      const item = await storage.createPortfolioItem(data);
      res.status(201).json(item);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Contact
  app.get(api.contact.list.path, async (req, res) => {
    const messages = await storage.getContactMessages();
    res.json(messages);
  });

  app.post(api.contact.create.path, async (req, res) => {
    try {
      const data = api.contact.create.input.parse(req.body);
      const message = await storage.createContactMessage(data);
      res.status(201).json(message);
    } catch (err) {
      console.error("Contact creation error:", err);
      res.status(400).json({ message: "Invalid contact message" });
    }
  });

  app.patch(api.contact.updateStatus.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = api.contact.updateStatus.input.parse(req.body);
      const updated = await storage.updateContactMessageStatus(id, status);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid status update" });
    }
  });

  // Albums
  app.get(api.albums.list.path, async (req, res) => {
    const albums = await storage.getAlbums();
    res.json(albums);
  });

  app.get(api.albums.get.path, async (req, res) => {
    const code = req.params.code;
    try {
      const firstUrl = `${CDN_BASE_URL}/${code}/001.jpg`;
      let firstResponse: Response;
      try {
        firstResponse = await fetch(firstUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(8000),
        });
      } catch (fetchErr: any) {
        console.error(`Album CDN fetch failed for "${code}":`, fetchErr?.message ?? fetchErr);
        return res.status(503).json({ message: "Could not reach the image server. Please try again." });
      }

      if (!firstResponse.ok) {
        return res.status(404).json({ message: "Your album is being prepared. Please contact Dream Pictures." });
      }

      let pageCount = 1;
      let currentCheck = 2;
      let foundEnd = false;
      const MAX_PAGES = 200;

      while (!foundEnd && pageCount < MAX_PAGES) {
        const batchSize = 5;
        const promises = [];
        for (let i = 0; i < batchSize; i++) {
          const checkNum = currentCheck + i;
          if (checkNum > MAX_PAGES) break;
          const url = `${CDN_BASE_URL}/${code}/${padPageNumber(checkNum)}.jpg`;
          promises.push(
            fetch(url, { method: 'HEAD' })
              .then(r => ({ num: checkNum, ok: r.ok }))
              .catch(() => ({ num: checkNum, ok: false }))
          );
        }
        const results = await Promise.all(promises);
        for (const result of results) {
          if (result.ok) {
            pageCount = Math.max(pageCount, result.num);
          } else {
            foundEnd = true;
            break;
          }
        }
        currentCheck += batchSize;
      }

      const pages = Array.from({ length: pageCount }, (_, i) => 
        `${CDN_BASE_URL}/${code}/${padPageNumber(i + 1)}.jpg`
      );
      res.json({ code, pages, totalPages: pageCount });
    } catch (error) {
      console.error("Album fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Album Auth (public — used by album page)
  app.get("/api/albums/:code/auth", async (req, res) => {
    const code = req.params.code.toLowerCase();
    const password = await storage.getAlbumPassword(code);
    res.json({ required: password !== null });
  });

  app.post("/api/albums/:code/verify", async (req, res) => {
    const code = req.params.code.toLowerCase();
    const { password } = req.body;
    const stored = await storage.getAlbumPassword(code);
    if (stored === null) {
      return res.json({ valid: true });
    }
    res.json({ valid: password === stored });
  });

  // Admin — List R2 albums
  app.get("/api/admin/albums", async (req, res) => {
    const albums = await listR2Albums();
    res.json(albums);
  });

  // Admin — Album Passwords
  app.get("/api/admin/album-passwords", async (req, res) => {
    const passwords = await storage.getAlbumPasswords();
    res.json(passwords);
  });

  app.post("/api/admin/album-passwords/:code", async (req, res) => {
    const code = req.params.code.toLowerCase();
    const { password } = req.body;
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Password is required" });
    }
    await storage.setAlbumPassword(code, password);
    res.json({ success: true });
  });

  app.delete("/api/admin/album-passwords/:code", async (req, res) => {
    const code = req.params.code.toLowerCase();
    await storage.removeAlbumPassword(code);
    res.json({ success: true });
  });

  // Admin Login
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    const { validateAdminCredentials } = await import("./admin");
    
    if (validateAdminCredentials(username, password)) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Admin endpoints (require verification from client-side localStorage)
  app.get("/api/admin/contacts", async (req, res) => {
    const messages = await storage.getContactMessages();
    res.json(messages);
  });

  return httpServer;
}
