import path from "path";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Cache control middleware
app.use((req, res, next) => {
  const filepath = req.path;

  // Service worker: always check for updates, no cache
  if (filepath === "/sw.js") {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return next();
  }

  // HTML files: revalidate on each request (check for updates)
  if (filepath.endsWith(".html") || filepath === "/") {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return next();
  }

  // Assets with hash (JS, CSS, images): cache long-term
  if (
    filepath.includes("-") &&
    (filepath.includes(".js") ||
      filepath.includes(".css") ||
      filepath.includes(".woff") ||
      filepath.includes(".woff2") ||
      filepath.includes(".ttf") ||
      filepath.includes(".png") ||
      filepath.includes(".svg") ||
      filepath.includes(".jpg") ||
      filepath.includes(".jpeg"))
  ) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return next();
  }

  // Default: cache for 1 hour
  res.setHeader("Cache-Control", "public, max-age=3600");
  next();
});

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
