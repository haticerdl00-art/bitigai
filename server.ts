import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import xml2js from 'xml2js';
const { parseStringPromise } = xml2js;

// Import our new serverless handler logic for consistency
import marketHandlerFunction from './api/veriler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Log all requests to debug API issues
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API REQUEST] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    }
    next();
  });

  // --- API ROUTES ---

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Market Data Endpoint (TCMB & Gold)
  async function marketHandler(req: any, res: any) {
    return marketHandlerFunction(req, res);
  }

  app.get('/api/market-data', marketHandler);
  app.get('/api/market-data/', marketHandler);
  app.get('/api/market/pulse', marketHandler);
  app.get('/api/market/pulse/', marketHandler);
  app.get('/api/veriler', (req: any, res: any) => marketHandlerFunction(req, res));

  // Bildirim Sayacı Endpoint
  const notificationHandler = (req: express.Request, res: express.Response) => {
    console.log('Serving notification count...');
    res.json({ count: 5 });
  };

  app.get('/api/notifications/count', notificationHandler);
  app.get('/api/notifications/count/', notificationHandler);

  // OCR Endpoint
  app.post('/api/ocr/process', (req, res) => {
    const { docType } = req.query;
    
    // Mock OCR processing
    setTimeout(() => {
      if (docType === 'mizan') {
        res.json({
          fields: [
            { key: '100 Kasa', value: '450.000,00', confidence: 0.98 },
            { key: '102 Bankalar', value: '1.250.000,00', confidence: 0.95 },
            { key: '120 Alıcılar', value: '850.000,00', confidence: 0.92 },
            { key: '320 Satıcılar', value: '620.000,00', confidence: 0.90 },
            { key: '131 Ortaklardan Alacaklar', value: '150.000,00', confidence: 0.85 },
            { key: '331 Ortaklara Borçlar', value: '0,00', confidence: 0.99 },
          ],
          rawText: "MOCK MIZAN RAW TEXT DATA...",
          sourceId: 'mock-mizan-id'
        });
      } else {
        res.json({
          fields: [
            { key: 'Fatura No', value: 'INV-2024-001', confidence: 0.95 },
            { key: 'Fatura Tarihi', value: '09.03.2026', confidence: 0.88 },
            { key: 'VKN / TC No', value: '1234567890', confidence: 0.92 },
            { key: 'Firma Ünvanı', value: 'BİTİG TEKNOLOJİ A.Ş.', confidence: 0.85 },
            { key: 'Toplam Tutar', value: '1.000,00 TL', confidence: 0.98 },
            { key: 'KDV Tutarı', value: '200,00 TL', confidence: 0.65 },
            { key: 'KDV Dahil Toplam', value: '1.200,00 TL', confidence: 0.90 },
            { key: 'Fatura Tipi', value: 'Alış', confidence: 0.80 },
          ],
          rawText: "MOCK OCR RAW TEXT DATA...",
          sourceId: 'mock-file-id'
        });
      }
    }, 2000);
  });

  // Fiş Aktarım Endpoint
  app.post('/api/fis/create', (req, res) => {
    console.log('Fiş oluşturuluyor:', req.body);
    res.json({ success: true, fisId: 'FIS-' + Math.floor(Math.random() * 10000) });
  });

  // JSON 404 for /api
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.url} not found` });
  });

  // Global API Error Handler
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Error handling for startup
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log('API routes initialized: /api/health, /api/notifications/count, /api/market/pulse');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
