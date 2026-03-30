import type { Express, Request, Response as ExpressResponse } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const CDN_BASE_URL = "https://cdn.thedreampictures.com";

function validatePin(body: any, res: any): boolean {
  const expected = process.env.ADMIN_PIN;
  if (!expected) return true; // no PIN configured — allow
  if (body?.adminPin !== expected) {
    res.status(403).json({ message: "Invalid PIN" });
    return false;
  }
  return true;
}

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

  // Portfolio image upload → R2 (portfolio/ folder)
  app.post("/api/admin/portfolio/upload-image", upload.single("image"), async (req: Request, res: ExpressResponse) => {
    try {
      const client = getR2Client();
      if (!client) return res.status(500).json({ message: "R2 not configured" });
      if (!req.file) return res.status(400).json({ message: "No file provided" });

      const bucket = process.env.R2_BUCKET_NAME || "albums";
      const ext = req.file.originalname.split(".").pop()?.toLowerCase() || "jpg";
      const key = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        CacheControl: "public, max-age=31536000",
      }));

      const url = `${CDN_BASE_URL}/${key}`;
      res.json({ url });
    } catch (err) {
      console.error("Portfolio upload error:", err);
      res.status(500).json({ message: "Upload failed" });
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

  app.get("/api/admin/contacts/trash", async (req, res) => {
    try {
      const messages = await storage.getTrashMessages();
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch trash" });
    }
  });

  app.delete("/api/admin/contacts/:id", async (req, res) => {
    try {
      await storage.softDeleteMessage(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  app.post("/api/admin/contacts/:id/restore", async (req, res) => {
    try {
      await storage.restoreMessage(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to restore message" });
    }
  });

  app.delete("/api/admin/contacts/:id/permanent", async (req, res) => {
    try {
      await storage.permanentDeleteMessage(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to permanently delete message" });
    }
  });

  // CRM — Clients
  app.get("/api/crm/clients", async (req, res) => {
    try {
      const clients = await storage.getCrmClients();
      res.json(clients);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/crm/clients", async (req, res) => {
    try {
      const { name, phone, dob, anniversary, address, notes } = req.body;
      if (!name || !phone) return res.status(400).json({ message: "Name and phone are required" });
      const existing = await storage.getClientByPhone(phone.trim());
      if (existing) return res.status(409).json({ message: `A client with this phone already exists: ${existing.name}` });
      const client = await storage.createCrmClient({ name, phone: phone.trim(), dob: dob || null, anniversary: anniversary || null, address: address || null, notes: notes || null });
      res.status(201).json(client);
    } catch (err) {
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/crm/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, phone, dob, anniversary, address, notes } = req.body;
      const client = await storage.updateCrmClient(id, { name, phone, dob: dob || null, anniversary: anniversary || null, address: address || null, notes: notes || null });
      res.json(client);
    } catch (err) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/crm/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCrmClient(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // CRM — Works
  app.get("/api/crm/works", async (req, res) => {
    try {
      const works = await storage.getCrmWorks();
      res.json(works);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch works" });
    }
  });

  app.post("/api/crm/works", async (req, res) => {
    try {
      const { clientId, clientName, description, workType, workStage, totalPrice, advancePaid, workDate, status } = req.body;
      if (!clientName || !description || !workDate) return res.status(400).json({ message: "Client, description, and date are required" });
      const work = await storage.createCrmWork({
        clientId: clientId || null,
        clientName,
        description,
        workType: workType || "Other",
        workStage: workStage || "Shoot Done",
        totalPrice: Number(totalPrice) || 0,
        advancePaid: Number(advancePaid) || 0,
        workDate,
        status: status || "pending",
      });
      res.status(201).json(work);
    } catch (err) {
      res.status(500).json({ message: "Failed to create work" });
    }
  });

  app.put("/api/crm/works/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { clientId, clientName, description, workType, workStage, totalPrice, advancePaid, workDate, status } = req.body;
      const work = await storage.updateCrmWork(id, {
        clientId: clientId || null,
        clientName,
        description,
        workType: workType || "Other",
        workStage: workStage || "Shoot Done",
        totalPrice: Number(totalPrice) || 0,
        advancePaid: Number(advancePaid) || 0,
        workDate,
        status,
      });
      res.json(work);
    } catch (err) {
      res.status(500).json({ message: "Failed to update work" });
    }
  });

  app.delete("/api/crm/works/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCrmWork(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete work" });
    }
  });

  // CRM — Payments
  app.get("/api/crm/payments", async (req, res) => {
    try {
      const payments = await storage.getCrmPayments();
      res.json(payments);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/crm/payments", async (req, res) => {
    try {
      const { clientId, workId, clientName, amount, paymentDate, paymentMethod, notes } = req.body;
      if (!clientName || !amount || !paymentDate) return res.status(400).json({ message: "Client, amount, and date are required" });
      const numAmount = Number(amount);

      // Overpayment prevention for work-linked payments
      if (workId) {
        const works = await storage.getCrmWorks();
        const work = works.find(w => w.id === Number(workId));
        if (work) {
          const existingPayments = await storage.getPaymentsByWorkId(Number(workId));
          const alreadyPaid = work.advancePaid + existingPayments.reduce((s, p) => s + p.amount, 0);
          const remaining = work.totalPrice - alreadyPaid;
          if (numAmount > remaining + 0.01) {
            return res.status(400).json({ message: `Payment exceeds balance. Max allowed: ₹${remaining.toLocaleString("en-IN")}` });
          }
        }
      }

      const payment = await storage.createCrmPayment({
        clientId: clientId || null,
        workId: workId ? Number(workId) : null,
        clientName,
        amount: numAmount,
        paymentDate,
        paymentMethod: paymentMethod || "Cash",
        notes: notes || null,
      });

      // Auto-mark work as done if fully paid
      if (workId) {
        const works = await storage.getCrmWorks();
        const work = works.find(w => w.id === Number(workId));
        if (work && work.status === "pending") {
          const allPayments = await storage.getPaymentsByWorkId(Number(workId));
          const totalPaid = work.advancePaid + allPayments.reduce((s, p) => s + p.amount, 0);
          if (totalPaid >= work.totalPrice - 0.01) {
            await storage.updateCrmWork(Number(workId), { ...work, status: "done" });
          }
        }
      }

      res.status(201).json(payment);
    } catch (err) {
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.put("/api/crm/payments/:id", async (req, res) => {
    try {
      if (!validatePin(req.body, res)) return;
      const id = parseInt(req.params.id);
      const { amount, paymentDate, paymentMethod, notes } = req.body;
      if (!amount || !paymentDate) return res.status(400).json({ message: "Amount and date are required" });
      const payment = await storage.updateCrmPayment(id, {
        amount: Number(amount),
        paymentDate,
        paymentMethod: paymentMethod || "Cash",
        notes: notes || null,
      });
      res.json(payment);
    } catch (err) {
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  app.delete("/api/crm/payments/:id", async (req, res) => {
    try {
      if (!validatePin(req.body, res)) return;
      const id = parseInt(req.params.id);
      await storage.deleteCrmPayment(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  // CRM — Expenses
  app.get("/api/crm/expenses", async (req, res) => {
    try {
      const expenses = await storage.getCrmExpenses();
      res.json(expenses);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/crm/expenses", async (req, res) => {
    try {
      const { date, category, description, amount, paymentMethod, notes } = req.body;
      if (!date || !description || !amount) return res.status(400).json({ message: "Date, description, and amount are required" });
      const expense = await storage.createCrmExpense({
        date,
        category: category || "General",
        description,
        amount: Number(amount),
        paymentMethod: paymentMethod || "Cash",
        notes: notes || null,
      });
      res.status(201).json(expense);
    } catch (err) {
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/crm/expenses/:id", async (req, res) => {
    try {
      if (!validatePin(req.body, res)) return;
      const id = parseInt(req.params.id);
      const { date, category, description, amount, notes } = req.body;
      const expense = await storage.updateCrmExpense(id, {
        ...(date && { date }),
        ...(category && { category }),
        ...(description && { description }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(notes !== undefined && { notes: notes || null }),
      });
      res.json(expense);
    } catch (err) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/crm/expenses/:id", async (req, res) => {
    try {
      if (!validatePin(req.body, res)) return;
      const id = parseInt(req.params.id);
      await storage.deleteCrmExpense(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // History work edit (PIN required, only description/price/advance)
  app.put("/api/crm/works/:id/history-edit", async (req, res) => {
    try {
      if (!validatePin(req.body, res)) return;
      const id = parseInt(req.params.id);
      const { description, totalPrice, advancePaid } = req.body;
      if (!description) return res.status(400).json({ message: "Description is required" });
      const works = await storage.getCrmWorks();
      const existing = works.find(w => w.id === id);
      if (!existing) return res.status(404).json({ message: "Work not found" });
      const updated = await storage.updateCrmWork(id, {
        ...existing,
        description,
        totalPrice: Number(totalPrice) || existing.totalPrice,
        advancePaid: Number(advancePaid) || 0,
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update work" });
    }
  });

  // CRM — Global Search
  app.get("/api/crm/search", async (req, res) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (q.length < 2) return res.json({ clients: [], works: [] });
      const results = await storage.searchCrm(q);
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // ─── Daily Amount Routes ──────────────────────────────────────────
  function validateDaPin(req: Request, res: any): boolean {
    const pin = req.headers["x-da-pin"] as string || req.body?.daPin as string || req.query?.daPin as string;
    const expected = process.env.ADMIN_PIN;
    if (!expected) return true;
    if (pin !== expected) {
      res.status(403).json({ message: "Invalid PIN" });
      return false;
    }
    return true;
  }

  app.post("/api/dailyamount/verify-pin", (req, res) => {
    const { pin } = req.body;
    const expected = process.env.ADMIN_PIN;
    if (!expected || pin === expected) {
      res.json({ ok: true });
    } else {
      res.status(403).json({ message: "Invalid PIN" });
    }
  });

  app.get("/api/dailyamount/entry/:date", async (req, res) => {
    if (!validateDaPin(req, res)) return;
    try {
      const entry = await storage.getDailyEntry(req.params.date);
      res.json(entry || null);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch entry" });
    }
  });

  app.put("/api/dailyamount/entry/:date", async (req, res) => {
    if (!validateDaPin(req, res)) return;
    try {
      const date = req.params.date;
      const n = (v: any) => Number(v) || 0;
      const entry = await storage.upsertDailyEntry({
        date,
        openingBalance: n(req.body.openingBalance),
        notes10: n(req.body.notes10),
        notes20: n(req.body.notes20),
        notes50: n(req.body.notes50),
        notes100: n(req.body.notes100),
        notes200: n(req.body.notes200),
        notes500: n(req.body.notes500),
        coins: n(req.body.coins),
        bobSaving: n(req.body.bobSaving),
        bobCurrent: n(req.body.bobCurrent),
        hdfc: n(req.body.hdfc),
        kotak: n(req.body.kotak),
        au: n(req.body.au),
        sbi: n(req.body.sbi),
        aepsBob: n(req.body.aepsBob),
        aepsFino: n(req.body.aepsFino),
        aepsPayworld: n(req.body.aepsPayworld),
        aepsDigipay: n(req.body.aepsDigipay),
      });
      res.json(entry);
    } catch (err) {
      res.status(500).json({ message: "Failed to save entry" });
    }
  });

  app.get("/api/dailyamount/transactions/:date", async (req, res) => {
    if (!validateDaPin(req, res)) return;
    try {
      const txs = await storage.getDailyTransactions(req.params.date);
      res.json(txs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/dailyamount/transactions", async (req, res) => {
    if (!validateDaPin(req, res)) return;
    try {
      const { date, type, amount, note } = req.body;
      if (!date || !type || !amount) return res.status(400).json({ message: "Missing fields" });
      const tx = await storage.createDailyTransaction({
        date,
        type,
        amount: Number(amount) || 0,
        note: note || "",
      });
      res.json(tx);
    } catch (err: any) {
      console.error("[dailyamount] createDailyTransaction error:", err?.message || err);
      res.status(500).json({ message: err?.message || "Failed to add transaction" });
    }
  });

  app.delete("/api/dailyamount/transactions/:id", async (req, res) => {
    if (!validateDaPin(req, res)) return;
    try {
      await storage.deleteDailyTransaction(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  app.get("/api/dailyamount/history", async (req, res) => {
    if (!validateDaPin(req, res)) return;
    try {
      const history = await storage.getDailyHistory();
      res.json(history);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  return httpServer;
}
