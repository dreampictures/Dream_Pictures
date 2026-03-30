import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { db, pool } from "./db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure required tables exist (safe to run on every startup)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "daily_entries" (
      "id" serial PRIMARY KEY NOT NULL,
      "date" text NOT NULL UNIQUE,
      "opening_balance" real NOT NULL DEFAULT 0,
      "notes_10" real NOT NULL DEFAULT 0,
      "notes_20" real NOT NULL DEFAULT 0,
      "notes_50" real NOT NULL DEFAULT 0,
      "notes_100" real NOT NULL DEFAULT 0,
      "notes_200" real NOT NULL DEFAULT 0,
      "notes_500" real NOT NULL DEFAULT 0,
      "coins" real NOT NULL DEFAULT 0,
      "bob_saving" real NOT NULL DEFAULT 0,
      "bob_current" real NOT NULL DEFAULT 0,
      "hdfc" real NOT NULL DEFAULT 0,
      "kotak" real NOT NULL DEFAULT 0,
      "au" real NOT NULL DEFAULT 0,
      "sbi" real NOT NULL DEFAULT 0,
      "aeps_bob" real NOT NULL DEFAULT 0,
      "aeps_fino" real NOT NULL DEFAULT 0,
      "aeps_payworld" real NOT NULL DEFAULT 0,
      "aeps_digipay" real NOT NULL DEFAULT 0,
      "updated_at" timestamp DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "daily_transactions" (
      "id" serial PRIMARY KEY NOT NULL,
      "date" text NOT NULL,
      "type" text NOT NULL,
      "amount" real NOT NULL DEFAULT 0,
      "note" text NOT NULL DEFAULT '',
      "created_at" timestamp DEFAULT now()
    );
  `);
  log("Database tables verified");

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
