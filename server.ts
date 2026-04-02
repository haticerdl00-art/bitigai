import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import xml2js from 'xml2js';
const { parseStringPromise } = xml2js;

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
      console.log(`${req.method} ${req.url}`);
    }
    next();
  });

  // --- API ROUTES ---

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Bildirim Sayacı Endpoint
  const notificationHandler = (req: express.Request, res: express.Response) => {
    console.log('Serving notification count...');
    res.json({ count: 5 });
  };

  app.get('/api/notifications/count', notificationHandler);
  app.get('/api/notifications/count/', notificationHandler);

  // Market Data Endpoint (TCMB & Gold)
  const marketHandler = async (req: express.Request, res: express.Response) => {
    console.log('Market pulse request received');
    const fallbackData = {
      currencies: [
        { label: 'Dolar', value: '32.15', change: 0.12, unit: 'TL' },
        { label: 'Euro', value: '34.85', change: -0.05, unit: 'TL' }
      ],
      gold: [
        { label: 'Gram Altın', value: '2450.00', change: 0.45, unit: 'TL' },
        { label: 'Çeyrek Altın', value: '4020.00', change: 0.32, unit: 'TL' }
      ],
      bist: { value: '9150.00', change: 1.25 },
      stocks: [
        { name: 'THY', change: 2.1 },
        { name: 'Aselsan', change: -0.8 },
        { name: 'Erdemir', change: 1.2 },
        { name: 'Tüpraş', change: 0.5 },
        { name: 'Koç Hol.', change: -1.1 },
        { name: 'Sabancı', change: 0.9 },
        { name: 'Garanti', change: 1.8 },
        { name: 'İş Bankası', change: -0.4 },
      ]
    };

    try {
      const fetchWithTimeout = async (url: string, options: any = {}, timeout = 5000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, { 
            ...options, 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              ...options.headers
            }
          });
          return response;
        } finally {
          clearTimeout(timeoutId);
        }
      };

      // Fetch in parallel
      const [tcmbRes, gpRes] = await Promise.allSettled([
        fetchWithTimeout('https://www.tcmb.gov.tr/kurlar/today.xml', { headers: { 'Accept': 'application/xml' } }),
        fetchWithTimeout('https://api.genelpara.com/embed/para-birimleri.json')
      ]);

      let currencies = [...fallbackData.currencies];
      let gold = [...fallbackData.gold];
      let bist = { ...fallbackData.bist };

      // Process TCMB
      if (tcmbRes.status === 'fulfilled' && tcmbRes.value.ok) {
        try {
          const xml = await tcmbRes.value.text();
          const result = await parseStringPromise(xml);
          const currencyList = result?.Tarih_Date?.Currency;
          if (Array.isArray(currencyList)) {
            const usd = currencyList.find((c: any) => c?.$?.CurrencyCode === 'USD');
            const eur = currencyList.find((c: any) => c?.$?.CurrencyCode === 'EUR');
            if (usd && eur) {
              currencies = [
                { 
                  label: 'Dolar', 
                  value: usd.BanknoteSelling?.[0] || usd.ForexSelling?.[0] || '0.00', 
                  change: 0.05, 
                  unit: 'TL' 
                },
                { 
                  label: 'Euro', 
                  value: eur.BanknoteSelling?.[0] || eur.ForexSelling?.[0] || '0.00', 
                  change: -0.02, 
                  unit: 'TL' 
                }
              ];
            }
          }
        } catch (err) {
          console.error('TCMB Parse Error:', err);
        }
      }

      // Process GenelPara
      if (gpRes.status === 'fulfilled' && gpRes.value.ok) {
        try {
          const gpData = await gpRes.value.json();
          if (gpData) {
            const parseVal = (key: string, fallback: string) => gpData[key]?.satis?.replace(',', '.') || fallback;
            const parseChange = (key: string) => parseFloat(gpData[key]?.degisim?.replace(',', '.') || '0');
            
            gold = [
              { label: 'Gram Altın', value: parseVal('GA', fallbackData.gold[0].value), change: parseChange('GA'), unit: 'TL' },
              { label: 'Çeyrek Altın', value: parseVal('C', fallbackData.gold[1].value), change: parseChange('C'), unit: 'TL' }
            ];
            bist = {
              value: parseVal('BIST100', fallbackData.bist.value),
              change: parseChange('BIST100')
            };
          }
        } catch (err) {
          console.error('GenelPara Parse Error:', err);
        }
      }

      res.setHeader('Content-Type', 'application/json');
      res.json({ currencies, gold, bist, stocks: fallbackData.stocks });
    } catch (error) {
      console.error('Market data general error:', error);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(fallbackData);
      }
    }
  };

  app.get('/api/market/pulse', marketHandler);
  app.get('/api/market/pulse/', marketHandler);

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
