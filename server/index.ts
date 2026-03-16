import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // Protect against malformed percent-encodings in incoming URLs.
  // If a request contains an invalid percent sequence (for example
  // a literal "%VITE_ANALYTICS_ENDPOINT%" left from an un-replaced
  // Vite placeholder), Express' internal decode will throw and the
  // server will return a 500. Normalize such requests to the root
  // so the SPA can handle them client-side instead.
  app.use((req, _res, next) => {
    try {
      // This will throw if req.path contains invalid percent-encoding
      decodeURIComponent(req.path);
      next();
    } catch (err) {
      // Replace the URL with root so static middleware won't try to
      // decode the invalid path and will instead serve index.html
      req.url = "/";
      next();
    }
  });

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
