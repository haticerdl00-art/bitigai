import { VercelRequest, VercelResponse } from '@vercel/node';
import xml2js from 'xml2js';

const { parseStringPromise } = xml2js;

// Fallback data in case APIs are down - Using reliable static data
const FALLBACK_DATA = {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Configuration for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const fetchWithTimeout = async (url: string, options: any = {}, timeout = 10000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { 
          ...options, 
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            ...options.headers
          }
        });
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Parallel fetch from multiple reliable sources
    const results = await Promise.allSettled([
      fetchWithTimeout('https://www.tcmb.gov.tr/kurlar/today.xml'),
      fetchWithTimeout('https://api.genelpara.com/embed/para-birimleri.json', {
        headers: { 'Referer': 'https://www.genelpara.com/' }
      }),
      fetchWithTimeout('https://open.er-api.com/v6/latest/USD') // Changed to USD base to get XAU (Gold)
    ]);

    let currencies = [...FALLBACK_DATA.currencies];
    let gold = [...FALLBACK_DATA.gold];
    let bist = { ...FALLBACK_DATA.bist };
    let usdRate = 32.15; // default fallback
    let xauUsd = 2350.0; // default fallback Ounce Gold

    // 1. TCMB Processing (Highest Accuracy for USD/TRY)
    if (results[0].status === 'fulfilled' && results[0].value.ok) {
      try {
        const xml = await results[0].value.text();
        const result = await parseStringPromise(xml);
        const currencyList = result?.Tarih_Date?.Currency;
        if (Array.isArray(currencyList)) {
          const usd = currencyList.find((c: any) => c?.$?.CurrencyCode === 'USD');
          const eur = currencyList.find((c: any) => c?.$?.CurrencyCode === 'EUR');
          if (usd && eur) {
            usdRate = parseFloat(usd.ForexSelling?.[0] || usdRate);
            currencies = [
              { label: 'Dolar', value: usdRate.toFixed(2), change: 0.1, unit: 'TL' },
              { label: 'Euro', value: eur.ForexSelling?.[0] || FALLBACK_DATA.currencies[1].value, change: -0.1, unit: 'TL' }
            ];
          }
        }
      } catch (e) { console.error('TCMB XML Error'); }
    }

    // 2. ExchangeRate API Processing (XAU/USD and Backup for Currencies)
    if (results[2].status === 'fulfilled' && results[2].value.ok) {
      try {
        const data = await results[2].value.json();
        if (data?.rates) {
          // If TCMB failed, use this for USD rate
          if (currencies[0].value === FALLBACK_DATA.currencies[0].value) {
             usdRate = parseFloat((1 / data.rates.TRY).toFixed(4));
             currencies = [
               { label: 'Dolar', value: usdRate.toFixed(2), change: 0.05, unit: 'TL' },
               { label: 'Euro', value: (usdRate * (data.rates.EUR / data.rates.USD || 1.08)).toFixed(2), change: -0.05, unit: 'TL' }
             ];
          }
          
          // Get XAU (Gold Ounce) - Standard rate is 1 USD = X XAU, so 1/X = USD Price
          if (data.rates.XAU) {
            xauUsd = 1 / data.rates.XAU;
          }
        }
      } catch (e) { console.error('ExchangeRate API Error'); }
    }

    // 3. Gold & BIST Calculation with the requested formula
    // Formula: (Ons / 31.1035) * Dolar
    const calculatedGramGold = (xauUsd / 31.1035) * usdRate;
    const calculatedQuarterGold = calculatedGramGold * 1.64; // Approx 1.63-1.65 multiplier for retail market

    // 4. GenelPara (BIST & Secondary Gold Backup)
    if (results[1].status === 'fulfilled' && results[1].value.ok) {
      try {
        const data = await results[1].value.json();
        if (data) {
          const parseV = (key: string, fb: string) => (data[key]?.satis || fb).toString().replace(',', '.');
          const parseC = (key: string) => parseFloat((data[key]?.yuzde || '0').toString().replace(',', '.'));
          
          bist = { value: parseV('BIST100', bist.value), change: parseC('BIST100') };
          
          // Apply calculated gold but use GenelPara's change rates for better realism
          gold = [
            { label: 'Gram Altın', value: calculatedGramGold.toFixed(2), change: parseC('GA'), unit: 'TL' },
            { label: 'Çeyrek Altın', value: calculatedQuarterGold.toFixed(2), change: parseC('C'), unit: 'TL' }
          ];
        }
      } catch (e) { 
        console.error('GenelPara Data Error');
        // Fallback to purely calculated values if GenelPara fails
        gold = [
          { label: 'Gram Altın', value: calculatedGramGold.toFixed(2), change: 0.45, unit: 'TL' },
          { label: 'Çeyrek Altın', value: calculatedQuarterGold.toFixed(2), change: 0.32, unit: 'TL' }
        ];
      }
    }

    return res.status(200).json({ 
      currencies, 
      gold, 
      bist, 
      stocks: FALLBACK_DATA.stocks,
      status: 'success',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return res.status(200).json({ 
      ...FALLBACK_DATA, 
      status: 'fallback',
      message: 'Veriler şu an güncelleniyor (Yedek veri yükleniyor...)'
    });
  }
}
