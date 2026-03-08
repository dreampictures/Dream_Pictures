import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

const CDN_BASE_URL = "https://cdn.thedreampictures.com";

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
