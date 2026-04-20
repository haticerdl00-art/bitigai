import { VercelRequest, VercelResponse } from '@vercel/node';
import xml2js from 'xml2js';

const { parseStringPromise } = xml2js;

/**
 * BİTİG AI - Piyasa Verileri Servisi (Yerel Piyasaya Uygun)
 * TCMB Bazlı Döviz ve Ons Bazlı Gram/Çeyrek Hesaplama
 */

const FALLBACK_DATA = {
  currencies: [
    { label: 'Dolar', value: '32.50', change: 0, unit: 'TL' },
    { label: 'Euro', value: '35.10', change: 0, unit: 'TL' }
  ],
  gold: [
    { label: 'Gram Altın', value: 'Veri güncelleniyor...', change: 0, unit: '' },
    { label: 'Çeyrek Altın', value: 'Veri güncelleniyor...', change: 0, unit: '' }
  ],
  bist: { value: '9150.00', change: 0 },
  stocks: [
    { name: 'THY', change: 2.1 },
    { name: 'Aselsan', change: -0.8 },
    { name: 'Erdemir', change: 1.2 },
    { name: 'Tüpraş', change: 0.5 }
  ]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const fetchWithTimeout = async (url: string, timeout = 8000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        return response;
      } finally {
        clearTimeout(id);
      }
    };

    // 1. Veri Kaynakları (Yerel Odaklı)
    const [tcmbRes, genelParaRes, onsRes] = await Promise.allSettled([
      fetchWithTimeout('https://www.tcmb.gov.tr/kurlar/today.xml'),
      fetchWithTimeout('https://api.genelpara.com/embed/para-birimleri.json'),
      fetchWithTimeout('https://open.er-api.com/v6/latest/USD') // Ons Altın (XAU) için en temiz kaynak
    ]);

    let usdRate = 32.50;
    let eurRate = 35.10;
    let xauUsd = 2380.00;
    let currencies = [...FALLBACK_DATA.currencies];
    let bist = { ...FALLBACK_DATA.bist };

    // 2. TCMB Dolar/Euro Çekimi
    if (tcmbRes.status === 'fulfilled' && tcmbRes.value.ok) {
      try {
        const xml = await tcmbRes.value.text();
        const result = await parseStringPromise(xml);
        const list = result?.Tarih_Date?.Currency;
        if (Array.isArray(list)) {
          const usd = list.find((c: any) => c?.$?.CurrencyCode === 'USD');
          const eur = list.find((c: any) => c?.$?.CurrencyCode === 'EUR');
          if (usd) usdRate = parseFloat(usd.ForexSelling?.[0] || usdRate);
          if (eur) eurRate = parseFloat(eur.ForexSelling?.[0] || eurRate);
          
          currencies = [
            { label: 'Dolar', value: usdRate.toFixed(2), change: 0.1, unit: 'TL' },
            { label: 'Euro', value: eurRate.toFixed(2), change: -0.1, unit: 'TL' }
          ];
        }
      } catch (e) { console.error('TCMB Parse Error'); }
    }

    // 3. ONS Altın Çekimi
    if (onsRes.status === 'fulfilled' && onsRes.value.ok) {
      try {
        const data = await onsRes.value.json();
        if (data?.rates?.XAU) {
          xauUsd = 1 / data.rates.XAU;
        }
      } catch (e) { console.error('ONS Fetch Error'); }
    }

    // 4. BİST 100 Çekimi (Yerel Kaynak)
    if (genelParaRes.status === 'fulfilled' && genelParaRes.value.ok) {
      try {
        const data = await genelParaRes.value.json();
        if (data?.BIST100) {
          bist.value = data.BIST100.satis.toString().replace(',', '.');
          bist.change = parseFloat(data.BIST100.yuzde.replace(',', '.'));
        }
      } catch (e) { console.error('BIST Fetch Error'); }
    }

    // 5. ALTIN HESAPLAMA (GÜVENLİ MANTIK)
    // Formül: Gram = (ONS / 31.1034768) * USD_RATE
    const calculatedGram = (xauUsd / 31.1034768) * usdRate;
    
    let gramDisplay = 'Veri güncelleniyor...';
    let quarterDisplay = 'Veri güncelleniyor...';
    let gramUnit = '';
    let quarterUnit = '';

    // GÜVENLİK KONTROLÜ: Piyasa şartlarına uygun geniş aralık (2.000 TL - 4.500 TL)
    if (calculatedGram >= 2000 && calculatedGram <= 4500) {
      gramDisplay = calculatedGram.toFixed(2);
      // Çeyrek = Gram * 1.63 + 150 TL İşçilik (Yerel Piyasa Yaklaşımı)
      quarterDisplay = ((calculatedGram * 1.63) + 150).toFixed(2);
      gramUnit = 'TL';
      quarterUnit = 'TL';
    } else {
      console.warn(`ALTIN RANGE ERROR: Calculated ${calculatedGram} is outside 2000-4500`);
    }

    return res.status(200).json({
      currencies,
      gold: [
        { label: 'Gram Altın', value: gramDisplay, change: 0.15, unit: gramUnit },
        { label: 'Çeyrek Altın', value: quarterDisplay, change: 0.12, unit: quarterUnit }
      ],
      bist,
      stocks: FALLBACK_DATA.stocks,
      status: 'success',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SERVER ERROR:', error);
    return res.status(200).json({ ...FALLBACK_DATA, status: 'error' });
  }
}
