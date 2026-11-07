process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { analyzeFinancialDocuments } from "./services/geminiService";

async function startServer() {
  const app = express();
  const PORT = 3020;

  // Middleware for parsing JSON with a larger limit to handle base64 PDFs
  app.use(express.json({ limit: "150mb" }));
  app.use(express.urlencoded({ limit: "150mb", extended: true }));

  // API Route for PDF financial analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { files } = req.body;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "Nessun file fornito per l'analisi." });
      }
      
      console.log(`Ricevuta richiesta di analisi per ${files.length} file...`);
      const result = await analyzeFinancialDocuments(files);
      res.json(result);
    } catch (error: any) {
      console.error("Errore durante l'analisi dei documenti:", error);
      res.status(500).json({ 
        error: error?.message || "Si è verificato un errore durante l'elaborazione dei documenti con l'IA." 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 24620 } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Errore durante l'avvio del server:", err);
});
