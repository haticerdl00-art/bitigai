import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseStringPromise } from 'xml2js';

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

  // Bildirim Sayacı Endpoint (Moved to top for priority)
  app.get('/api/notifications/count', (req, res) => {
    console.log('Serving notification count...');
    res.json({ count: 5 });
  });

  // Market Data Endpoint (TCMB & Gold)
  app.get('/api/market/pulse', async (req, res) => {
    // Fallback data in case API fails
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
      // Fetch Market Data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://finans.truncgil.com/today.json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Piyasa verilerine ulaşılamıyor');
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Market data JSON parse error:', parseError);
        return res.json(fallbackData);
      }

      // Helper to parse Truncgil values
      const parseVal = (obj: any, fallback: string) => {
        const val = obj?.Selling?.replace(',', '.') || '0.00';
        return (val === '0.00' || !val) ? fallback : val;
      };
      const parseChange = (obj: any) => parseFloat(obj?.Change?.replace(',', '.') || '0');

      // Check if data has expected keys, otherwise use fallback
      if (!data || !data['USD']) {
        return res.json(fallbackData);
      }

      res.json({
        currencies: [
          { 
            label: 'Dolar', 
            value: parseVal(data['USD'], fallbackData.currencies[0].value), 
            change: parseChange(data['USD']),
            unit: 'TL' 
          },
          { 
            label: 'Euro', 
            value: parseVal(data['EUR'], fallbackData.currencies[1].value), 
            change: parseChange(data['EUR']), 
            unit: 'TL' 
          }
        ],
        gold: [
          { 
            label: 'Gram Altın', 
            value: parseVal(data['Gram Altın'], fallbackData.gold[0].value), 
            change: parseChange(data['Gram Altın']), 
            unit: 'TL' 
          },
          { 
            label: 'Çeyrek Altın', 
            value: parseVal(data['Çeyrek Altın'], fallbackData.gold[1].value), 
            change: parseChange(data['Çeyrek Altın']), 
            unit: 'TL' 
          }
        ],
        bist: {
          value: parseVal(data['BIST 100'], fallbackData.bist.value),
          change: parseChange(data['BIST 100'])
        },
        stocks: fallbackData.stocks
      });
    } catch (error) {
      console.error('Market data fetch error:', error);
      // Return fallback data instead of error to keep UI functional
      res.json(fallbackData);
    }
  });

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
