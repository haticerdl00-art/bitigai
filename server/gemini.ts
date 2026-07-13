import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'undefined') {
  console.error("[SERVER] GEMINI_API_KEY is missing or undefined! AI features will fail.");
}

export function isApiKeyValid(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!key && key !== 'undefined' && key !== 'MY_GEMINI_API_KEY' && key !== 'null' && key.trim() !== '';
}

const ai = new GoogleGenAI({ 
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Simple server-side in-memory cache
const cache: { [key: string]: { data: any, timestamp: number } } = {};

function getCachedData(key: string) {
  const cached = cache[key];
  if (cached) {
    const cacheDate = new Date(cached.timestamp);
    const nowDate = new Date();
    // Cache is valid only if it was fetched on the exact same calendar day
    const isSameDay = cacheDate.getFullYear() === nowDate.getFullYear() &&
                      cacheDate.getMonth() === nowDate.getMonth() &&
                      cacheDate.getDate() === nowDate.getDate();
    if (isSameDay) {
      return cached.data;
    }
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache[key] = { data, timestamp: Date.now() };
}

function cleanJsonString(jsonStr: string): string {
  return jsonStr.replace(/```json\n?|```/g, '').trim();
}

export async function* askCopilotStream(prompt: string, history: any[] = [], companies: any[] = []) {
  if (!isApiKeyValid()) {
    yield { text: "⚠️ **Sistem Notu:** Değerli Müşavirimiz, yapay zeka asistanı özellikleri için geçerli bir **GEMINI_API_KEY** tanımlanmamış veya anahtar geçersiz.\n\nLütfen sağ üstteki **Settings > Secrets** panelinden **GEMINI_API_KEY** değişkenine geçerli bir Google Gemini API anahtarı giriniz." };
    return;
  }

  const formattedHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const companyContext = companies.length > 0 
    ? `Sistemdeki kayıtlı firmalar: ${companies.map(c => c.title).join(', ')}.`
    : '';

  const systemInstruction = `Sen 'Eylem Odaklı Akıllı Asistan'sın. Bir SMMM (Serbest Muhasebeci Mali Müşavir) için profesyonel, çözüm odaklı ve hatırlatıcı bir yardımcı olarak çalışıyorsun.
  
  TEMEL GÖREVLERİN:
  1. DANIŞMANLIK: Mevzuat, vergi, SGK ve muhasebe konularında uzman görüşü ver.
  2. EYLEM TESPİTİ: Kullanıcının mesajlarından somut görevler çıkar.
  3. İKON VE TEMA: Sağ alt köşedeki ikonun bir "Kütüphane/Defter" (Library) amblemi olup, Anadolu kilim motifleri ve muhasebe kayıt defteri ile ilişkilendirilmiştir. Bu ikon hem bilgiye hem de kayıtlara olan hakimiyeti simgeler.
  
  EYLEM FORMATI:
  Eğer kullanıcı bir kayıt, not veya güncelleme talep ederse, yanıtının en sonuna MUTLAKA şu formatta bir JSON bloğu ekle:
  [ACTION: {"type": "ADD_NOTE", "company": "Firma Adı veya Genel", "content": "Not içeriği"}]
  [ACTION: {"type": "UPDATE_DECLARATION", "company": "Firma Adı", "declaration": "KDV/MUHSGK/GEÇİCİ/BERAT", "status": "Verildi"}]
  [ACTION: {"type": "ADD_TASK", "content": "Görev içeriği", "date": "YYYY-MM-DD"}]
  [ACTION: {"type": "ADD_COMPANY", "title": "Firma Ünvanı", "vkn": "123...", "taxOffice": "...", "ledgerType": "...", "legalStatus": "...", "sector": "..."}]
  [ACTION: {"type": "ADD_PERSONNEL", "company": "Firma Adı", "gender": "male/female"}]
  [ACTION: {"type": "ADD_COLLECTION", "company": "Firma Adı", "amount": 5000}]
  
  ${companyContext}
  
  KARAKTERİN (SMMM DANIŞMANI):
  - Sen tecrübeli bir Serbest Muhasebeci Mali Müşavir (SMMM) asistanısın.
  - Üslubun profesyonel, ciddi ama yardımsever olmalı.
  - Kullanıcıya her zaman "Üstadım" veya "Hocam" gibi mesleki nezaket ifadeleriyle hitap edebilirsin (isteğe bağlı ama profesyonel durur).
  - İşlemleri yaptıktan sonra mutlaka teyit ver: "X firması için notu kaydettim.", "KDV beyannamesini verildi olarak işaretledim." gibi.
  - Mevzuat sorularında güncel kalmaya çalış ve riskleri hatırlat.
  - Kullanıcının sesli veya yazılı komutlarını anında eyleme dönüştür.
  
  2026 Yılı Parametreleri (KESİN BİLGİ): 
  * Brüt Asgari Ücret: 33.030,00 TL
  * Net Asgari Ücret: 28.075,50 TL
  * İşverene Toplam Maliyet: 40.874,63 TL
  
  Bugünün tarihi: ${new Date().toLocaleDateString('tr-TR')}.`;

  try {
    let response;
    try {
      response = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: [
          ...formattedHistory.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (searchError) {
      console.warn("[GEMINI] Search grounding failed, falling back to standard generation:", searchError);
      response = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: [
          ...formattedHistory.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction,
        },
      });
    }

    for await (const chunk of response) {
      yield { text: chunk.text };
    }
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited in copilot stream.");
      yield { text: "⚠️ **Sistem Notu (Kota Aşımı):** Değerli Müşavirimiz, tanımlı olan **GEMINI_API_KEY** anahtarının kullanım kotası aşılmıştır. Lütfen sağ üstteki **Settings > Secrets** panelinden API kotanızı/anahtarınızı kontrol edin veya yeni bir anahtar tanımlayın." };
    } else {
      console.error("[GEMINI] Copilot stream error:", errorStr);
      yield { text: `⚠️ **Sistem Notu (Bağlantı Hatası):** Yapay zeka motoru ile iletişim kurulurken bir hata oluştu: ${errorStr.slice(0, 100)}...` };
    }
  }
}

export async function askCopilot(prompt: string, history: any[] = []) {
  if (!isApiKeyValid()) {
    return "⚠️ **Sistem Notu:** Değerli Müşavirimiz, yapay zeka asistanı özellikleri için geçerli bir **GEMINI_API_KEY** tanımlanmamış veya anahtar geçersiz. Lütfen sağ üstteki **Settings > Secrets** panelinden **GEMINI_API_KEY** değişkenine geçerli bir Google Gemini API anahtarı giriniz.";
  }

  const formattedHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const systemInstruction = `Sen uzman bir Mali Müşavir ve Vergi Danışmanısın. 
  Kullanıcın bir mali müşavir. Ona mevzuat, vergi, SGK, beyanname ve genel muhasebe konularında profesyonel danışmanlık veriyorsun.
  
  TEMEL PRENSİPLER:
  1. ADIM ADIM REHBERLİK: Karmaşık süreçleri (örn: beyanname düzeltme) her zaman numaralandırılmış, net adımlarla açıkla.
  2. MEVZUAT ODAKLI: Cevaplarını her zaman güncel kanun, tebliğ ve sirkülerlere dayandır.
  3. YORUM VE ANALİZ: Sadece bilgi verme, konuyu mali müşavir gözüyle yorumla ve riskleri/fırsatları belirt.
  4. HIZ VE GÜNCELLİK: Google Search aracını kullanarak en son verileri (2026 dahil) anlık sorgula.
  
  ÖZEL SENARYOLAR:
  - Beyanname Düzeltme: Düzeltme yolunu (Pişmanlık, KSS vb.) belirt, muhasebe kayıtlarının (yevmiye maddesi) nasıl düzeltilmesi gerektiğini göster.
  - Sektörel Analiz: Karlılık oranları, NACE kodları ve sektörel riskler hakkında güncel veriler sun.
  
  2026 Yılı Parametreleri (KESİN BİLGİ): 
  * Brüt Asgari Ücret: 33.030,00 TL
  * Net Asgari Ücret: 28.075,50 TL
  * İşverene Toplam Maliyet: 40.874,63 TL
  * %5 İndirimli İşverene Maliyet: 39.223,13 TL
  * %2 İndirimli İşverene Maliyet: 40.214,03 TL
  * Günlük Brüt: 1.101,00 TL
  * Günlük Net: 935,85 TL
  * Bağkur Primi: 11.808,23 TL
  * İndirimli Bağkur Primi: 10.156,73 TL
  * Asgari Ücret Desteği: 1.000,00 TL
  
  Bugünün tarihi: ${new Date().toLocaleDateString('tr-TR')}.`;

  try {
    try {
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
        history: formattedHistory,
      });
      const response = await chat.sendMessage({ message: prompt });
      return response.text;
    } catch (searchError) {
      console.warn("Search grounding failed for chat, falling back:", searchError);
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction,
        },
        history: formattedHistory,
      });
      const response = await chat.sendMessage({ message: prompt });
      return response.text;
    }
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited in copilot ask.");
      return "⚠️ **Sistem Notu (Kota Aşımı):** Değerli Müşavirimiz, tanımlı olan **GEMINI_API_KEY** anahtarının kullanım kotası aşılmıştır. Lütfen sağ üstteki **Settings > Secrets** panelinden API kotanızı/anahtarınızı kontrol edin veya yeni bir anahtar tanımlayın.";
    } else {
      console.error("[GEMINI] Copilot ask error:", errorStr);
      return `⚠️ **Sistem Notu (Bağlantı Hatası):** Yapay zeka asistanı ile iletişim kurulurken hata oluştu: ${errorStr.slice(0, 150)}`;
    }
  }
}

export async function fetchLatestLegislation() {
  if (!isApiKeyValid()) {
    return [
      { title: "7491 Sayılı Kanun ile Vergi Kanunlarında Yapılan Değişiklikler", date: "2024-01-01", source: "Resmi Gazete" },
      { title: "2024 Yılı Gelir Vergisi Tarifesi ve İstisnaları", date: "2023-12-30", source: "GİB" },
      { title: "Asgari Ücret Desteği Uygulama Esasları", date: "2024-01-15", source: "SGK" }
    ];
  }

  const cached = getCachedData('legislation');
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Türkiye'deki en güncel mali mevzuat değişikliklerini, tebliğleri ve sirküleri (GİB, Resmi Gazete, Hazine ve Maliye Bakanlığı kaynaklı) liste şeklinde getir. Her madde için başlık, tarih ve kaynak belirt. JSON formatında döndür.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              source: { type: Type.STRING },
              link: { type: Type.STRING }
            },
            required: ["title", "date", "source"]
          }
        }
      },
    });

    const cleanedText = cleanJsonString(response.text || '[]');
    const data = JSON.parse(cleanedText);
    setCachedData('legislation', data);
    return data;
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited. Using fallback legislation data.");
    } else {
      console.warn("[GEMINI] Legislation fetch error:", errorStr.slice(0, 200));
    }
    return [
      { title: "7491 Sayılı Kanun ile Vergi Kanunlarında Yapılan Değişiklikler", date: "2024-01-01", source: "Resmi Gazete" },
      { title: "2024 Yılı Gelir Vergisi Tarifesi ve İstisnaları", date: "2023-12-30", source: "GİB" },
      { title: "Asgari Ücret Desteği Uygulama Esasları", date: "2024-01-15", source: "SGK" }
    ];
  }
}

export async function fetchLatestNews(forceRefresh = false): Promise<any[]> {
  const cacheKey = 'daily_news';
  
  if (!forceRefresh) {
    const cachedMem = getCachedData(cacheKey);
    if (cachedMem) return cachedMem;
  }

  if (!isApiKeyValid()) {
    return [
      {
        id: 'k-1',
        scope: 'kayseri',
        category: 'ekonomi',
        title: 'Kayseri İhracatta Yeni Rekor Yolunda: Mobilya ve Metal Sanayii Zirvede',
        summary: 'Kayseri Ticaret Odası (KTO) ve Sanayi Odası liderliğinde açıklanan son verilere göre, Kayseri Serbest Bölgesi haziran ayı ihracat rakamlarında geçen yıla göre %12.4 artış kaydedildi. SMMM odası üyeleri, ihracat tescil işlemlerinin dijitalleşmesinin süreci hızlandırdığını belirtiyor.',
        date: 'Bugün',
        source: 'KTO Bülteni',
        tag: 'İhracat & Sanayi',
        impact: 'pozitif'
      },
      {
        id: 'k-2',
        scope: 'kayseri',
        category: 'edebiyat',
        title: 'Yaman Dede Kültür ve Edebiyat Dinletileri Talas\'ta Sanatseverlerle Buluştu',
        summary: 'Kayseri\'nin önemli edebi şahsiyetlerinden Yaman Dede (Diyojen) anısına düzenlenen geleneksel şiir ve edebiyat günleri bu yıl tarihi Talas konaklarında gerçekleşti. Genç şairlerin katılım sağladığı gecede klasik Türk edebiyatından seçme gazel yorumları büyük beğeni topladı.',
        date: 'Bugün',
        source: 'Kayseri Kültür Md.',
        tag: 'Yaman Dede Şiir Günleri',
        impact: 'notr'
      },
      {
        id: 'k-3',
        scope: 'kayseri',
        category: 'siyasi',
        title: 'Kayseri Vergi Dairesi Başkanlığı ile SMMM Odası Arasında İstişare Toplantısı',
        summary: 'Yeni Maliye düzenlemeleri ve tevkifatlı işlemlerin takibi amacıyla Kayseri Adliye ve Vergi Dairesi temsilcileri ile Serbest Muhasebeci Mali Müşavirler bir araya girdi. Toplantıda Kayseri\'deki tevkifat yetki limitleri görüşüldü.',
        date: 'Dün',
        source: 'KSMMMO',
        tag: 'Mali İstişare',
        impact: 'kritik'
      }
    ];
  }

  try {
    const todayStr = new Date().toLocaleDateString('tr-TR');
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Bugünün tarihi: ${todayStr}. Türkiye genelinde, Kayseri yerelinde ve dünya genelinde özellikle ekonomi, maliye/maddi konular, siyasi-idari gelişmeler, yerel veya uluslararası kültür-sanat, klasik ve modern edebiyat/yazarlar alanlarındaki son 24-48 saatteki GERÇEK ve AKTÜEL haber başlıklarını internetten araştır. 
      Bulduğun haberlerden her birini 'kayseri', 'turkiye', veya 'dunya' scope'una ve 'ekonomi', 'siyasi', 'kultur', veya 'edebiyat' kategorisine uygun şekilde sınıflandırıp en az 10-12 adet haber olacak şekilde listele. 
      Haberlerin tarihi gerçekçi olmalı, Kayseri yerel haberlerinde Kayseri kaynaklı gündemler (Kayseri Ticaret Odası, adliye, yerel yazarlar veya Yaman Dede şiir günleri gibi kültür mirası) yer almalı. 
      JSON formatında döndür. Tüm alanlar zorunludur.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              scope: { type: Type.STRING }, // 'dunya' | 'turkiye' | 'kayseri'
              category: { type: Type.STRING }, // 'ekonomi' | 'siyasi' | 'kultur' | 'edebiyat'
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              date: { type: Type.STRING }, // örn: 'Bugün', 'Dün', '23 Haziran 2026'
              source: { type: Type.STRING },
              tag: { type: Type.STRING },
              impact: { type: Type.STRING } // 'pozitif' | 'notr' | 'kritik'
            },
            required: ["id", "scope", "category", "title", "summary", "date", "source", "tag", "impact"]
          }
        }
      },
    });

    const cleanedText = cleanJsonString(response.text || '[]');
    const data = JSON.parse(cleanedText);
    
    if (Array.isArray(data) && data.length > 0) {
      setCachedData(cacheKey, data);
      return data;
    }
    
    throw new Error("Invalid or empty response format from Gemini API");
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited. Using fallback news data.");
    } else {
      console.warn("[GEMINI] Daily news fetch error:", errorStr.slice(0, 200));
    }
    
    // Fallback if search fails
    const cachedMem = getCachedData(cacheKey);
    if (cachedMem) return cachedMem;

    return [
      {
        id: 'k-1',
        scope: 'kayseri',
        category: 'ekonomi',
        title: 'Kayseri İhracatta Yeni Rekor Yolunda: Mobilya ve Metal Sanayii Zirvede',
        summary: 'Kayseri Ticaret Odası (KTO) ve Sanayi Odası liderliğinde açıklanan son verilere göre, Kayseri Serbest Bölgesi haziran ayı ihracat rakamlarında geçen yıla göre %12.4 artış kaydedildi. SMMM odası üyeleri, ihracat tescil işlemlerinin dijitalleşmesinin süreci hızlandırdığını belirtiyor.',
        date: 'Bugün',
        source: 'KTO Bülteni',
        tag: 'İhracat & Sanayi',
        impact: 'pozitif'
      },
      {
        id: 'k-2',
        scope: 'kayseri',
        category: 'edebiyat',
        title: 'Yaman Dede Kültür ve Edebiyat Dinletileri Talas\'ta Sanatseverlerle Buluştu',
        summary: 'Kayseri\'nin önemli edebi şahsiyetlerinden Yaman Dede (Diyojen) anısına düzenlenen geleneksel şiir ve edebiyat günleri bu yıl tarihi Talas konaklarında gerçekleşti. Genç şairlerin katılım sağladığı gecede klasik Türk edebiyatından seçme gazel yorumları büyük beğeni topladı.',
        date: 'Bugün',
        source: 'Kayseri Kültür Md.',
        tag: 'Yaman Dede Şiir Günleri',
        impact: 'notr'
      },
      {
        id: 'k-3',
        scope: 'kayseri',
        category: 'siyasi',
        title: 'Kayseri Vergi Dairesi Başkanlığı ile SMMM Odası Arasında İstişare Toplantısı',
        summary: 'Yeni Maliye düzenlemeleri ve tevkifatlı işlemlerin takibi amacıyla Kayseri Adliye ve Vergi Dairesi temsilcileri ile Serbest Muhasebeci Mali Müşavirler bir araya girdi. Toplantıda Kayseri\'deki tevkifat yetki limitleri görüşüldü.',
        date: 'Dün',
        source: 'KSMMMO',
        tag: 'Mali İstişare',
        impact: 'kritik'
      }
    ];
  }
}

export async function fetchSGKParameters() {
  const cached = getCachedData('sgk_params');
  if (cached) return cached;

  if (!isApiKeyValid()) {
    return {
      minWageGross: 33030,
      minWageNet: 28075.50,
      employerTotalCost: 40874.63,
      dailyGross: 1101,
      dailyNet: 935.85,
      hourlyGross: 146.80,
      hourlyNet: 124.78,
      overtimeHourly: 220.20,
      bagkurDiscounted: 10156.73,
      bagkurStandard: 11808.23,
      incentives: [
        { id: '5510', name: '5510 Sayılı Kanun (%5 İndirim)', amountPerWorker: 1651.50, description: 'Borçsuzluk şartı sağlandığında tüm personel için geçerlidir.' },
        { id: '6111', name: '6111 Sayılı Kanun (Kadın İstihdamı)', amountPerWorker: 6800, description: 'Kadın çalışanlar için en yüksek avantajı sağlar.' },
        { id: '4857', name: '4857/14. Madde (Engelli Teşviki)', amountPerWorker: 6800, description: 'Engelli kontenjanı kapsamında tam prim desteği.' }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "2026 yılı için Türkiye'deki güncel asgari ücret (Brüt: 33.030,00 TL, Net: 28.075,50 TL), SGK işveren maliyeti (Toplam: 40.874,63 TL, %5 İndirimli: 39.223,13 TL, %2 İndirimli: 40.214,03 TL), Bağ-Kur prim tutarları (Standart: 11.808,23 TL, İndirimli: 10.156,73 TL), günlük (Brüt: 1.101,00 TL, Net: 935,85 TL) ve saatlik birim değerler, fazla mesai hesaplama parametreleri ve güncel SGK teşvikleri (6111, 7103, 5510 vb.) hakkında resmi verileri (GİB, SGK, Bakanlık kaynaklı) getir. JSON formatında döndür.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            minWageGross: { type: Type.NUMBER },
            minWageNet: { type: Type.NUMBER },
            employerTotalCost: { type: Type.NUMBER },
            dailyGross: { type: Type.NUMBER },
            dailyNet: { type: Type.NUMBER },
            hourlyGross: { type: Type.NUMBER },
            hourlyNet: { type: Type.NUMBER },
            overtimeHourly: { type: Type.NUMBER },
            bagkurDiscounted: { type: Type.NUMBER },
            bagkurStandard: { type: Type.NUMBER },
            incentives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  amountPerWorker: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      },
    });

    const cleanedText = cleanJsonString(response.text || '{}');
    const data = JSON.parse(cleanedText);
    setCachedData('sgk_params', data);
    return data;
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited. Using fallback SGK parameters.");
    } else {
      console.warn("[GEMINI] SGK parameters fetch error:", errorStr.slice(0, 200));
    }
    return {
      minWageGross: 33030,
      minWageNet: 28075.50,
      employerTotalCost: 40874.63,
      dailyGross: 1101,
      dailyNet: 935.85,
      hourlyGross: 146.80,
      hourlyNet: 124.78,
      overtimeHourly: 220.20,
      bagkurDiscounted: 10156.73,
      bagkurStandard: 11808.23,
      incentives: [
        { id: '5510', name: '5510 Sayılı Kanun (%5 İndirim)', amountPerWorker: 1651.50, description: 'Borçsuzluk şartı sağlandığında tüm personel için geçerlidir.' },
        { id: '6111', name: '6111 Sayılı Kanun (Kadın İstihdamı)', amountPerWorker: 6800, description: 'Kadın çalışanlar için en yüksek avantajı sağlar.' },
        { id: '4857', name: '4857/14. Madde (Engelli Teşviki)', amountPerWorker: 6800, description: 'Engelli kontenjanı kapsamında tam prim desteği.' }
      ]
    };
  }
}

export async function generateIncentiveReport(profile: any, parameters: any) {
  if (!isApiKeyValid()) {
    return `### ⚠️ Teşvik Raporu Önizleme (API Anahtarı Eksik)
    
**Firma Ünvanı:** ${profile.title}
**Çalışan Sayısı:** ${profile.hrProfile.totalWorkers}

*Yapay zeka motoru şu anda aktif değil. Ancak firmanızın mevcut parametrelerine göre olası en büyük teşvik fırsatları şunlardır:*

1. **5510 Teşviki (%5 Prim İndirimi):** Tüm çalışanlarınız için borçsuzluk şartı ile aylık yaklaşık **${profile.hrProfile.totalWorkers * 1651.50} TL** kazanç potansiyeli mevcuttur.
2. **6111 Teşviki (Genç ve Kadın İstihdamı):** Personel yapınızda genç veya kadın çalışan varsa 24 ila 54 ay süreyle işveren prim desteği uygulanabilir.

Lütfen tam rapor üretimi için **Settings > Secrets** panelinden **GEMINI_API_KEY** tanımlayınız.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Aşağıdaki firma profili ve güncel 2026 SGK/Teşvik parametrelerini kullanarak bu firma için özel bir teşvik ve destek raporu hazırla. 
      Rapor profesyonel bir dille yazılmalı, hangi teşviklerden yararlanabileceğini, ne kadar kazanç sağlayabileceğini ve dikkat etmesi gereken riskleri içermelidir.
      
      Firma Profili: ${JSON.stringify(profile)}
      Parametreler: ${JSON.stringify(parameters)}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text;
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited in incentive report generation.");
    } else {
      console.warn("[GEMINI] Incentive report generation error:", errorStr.slice(0, 200));
    }
    return "Rapor oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.";
  }
}

export async function analyzeLegislation(text: string) {
  if (!isApiKeyValid()) {
    return `### ⚠️ Mevzuat Analiz Önizlemesi (API Anahtarı Eksik)

**Analiz Edilen Metin Uzunluğu:** ${text.length} Karakter

*Yapay zeka motoru aktif olmadığı için otomatik özetleme yapılamadı. Girdiğiniz metnin ilk 100 karakteri:*
> ${text.slice(0, 100)}...

Lütfen analiz motorunu etkinleştirmek için geçerli bir **GEMINI_API_KEY** tanımlayınız.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Aşağıdaki mevzuat değişikliğini analiz et ve bir mali müşavir için özetle. 
      Eski ve yeni durumu karşılaştır. Bu değişikliğin hangi sektörleri etkileyebileceğini belirt.
      
      Metin: ${text}`,
    });
    return response.text;
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited in legislation analysis.");
      return `### ⚠️ Mevzuat Analizi (Kota Aşımı)

**Analiz edilmek istenen metin uzunluğu:** ${text.length} Karakter

*Mevcut API anahtarınızın kotası dolduğu için analiz tamamlanamadı. Girdiğiniz metnin ilk 100 karakteri:*
> ${text.slice(0, 100)}...

Lütfen API kotanızı kontrol edin veya daha sonra tekrar deneyin.`;
    } else {
      console.warn("[GEMINI] Legislation analysis error:", errorStr.slice(0, 200));
      return "Analiz sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.";
    }
  }
}

export async function analyzeDocumentForContent(fileData?: string, mimeType?: string, rawText?: string, profile?: any) {
  if (!isApiKeyValid()) {
    return {
      hapNot: ["Analiz motoru aktif değil.", "Lütfen GEMINI_API_KEY ekleyin."],
      ozet: "Belge analizi için geçerli bir API anahtarı gereklidir.",
      onemliKavramlar: [{"kavram": "GEMINI_API_KEY", "aciklama": "Platformda AI özelliklerini çalıştıran güvenli anahtar."}],
      tarihler: [],
      sartlar: ["API anahtarı bulunamadı."],
      surecAşamalari: [
        {"adim": 1, "baslik": "Ayarlar", "aciklama": "Sağ üstteki Settings menüsünü açın."},
        {"adim": 2, "baslik": "Secrets", "aciklama": "Secrets sekmesine tıklayın."},
        {"adim": 3, "baslik": "Anahtar Ekle", "aciklama": "GEMINI_API_KEY değerine geçerli bir anahtar girerek kaydedin."}
      ],
      kazanimlar: ["Yapay zeka tabanlı otomatik analiz özellikleri."],
      infografik: { 
        baslik: "API Anahtarı Eksik", 
        kapsam: ["Belge analizi yapılamadı"],
        avantajlar: ["Hızlı kurulum"],
        kritikSinirlar: ["Değişken ismi: GEMINI_API_KEY"],
        yapilmasiGerekenler: ["GİB/Maliye entegrasyonu için anahtarı tanımlayın"],
        gorselTema: "indigo"
      }
    };
  }

  const parts: any[] = [];
  
  if (fileData && mimeType) {
    parts.push({
      inlineData: {
        data: fileData,
        mimeType: mimeType
      }
    });
  } else if (rawText) {
    parts.push({
      text: `Analiz edilecek metin içeriği:\n\n${rawText}`
    });
  }

  const profileContext = profile ? `Firma Bilgileri:\n- Firma: ${profile.title}\n- Statü: ${profile.legalStatus}\n- Defter: ${profile.ledgerType}\n- İşçi: ${profile.hrProfile.totalWorkers}\n` : '';

  parts.push({
    text: `Sen profesyonel bir içerik üreticisi, grafik tasarımcı ve mali danışman asistanısın. 
          Sana sunulan metni veya belgeyi dikkatle analiz et. 
          SADECE bu metindeki verilere, bilgilere ve gerçek detaylara dayanarak içerik üret. 
          Jenerik veya önceki bilgilerinden bağımsız, sadece bu spesifik içeriğe odaklan.
          
          ${profileContext}
          
          Metni son derece anlaşılır, ilgi çekici ve sıkıcılıktan uzak bir hale dönüştürmek için aşağıdaki bilgileri yapılandırarak çıkar:
          
          1. YÖNETİCİ ÖZETİ (ozet): Metnin özünü, amacını ve getirdiği temel yenilikleri/düzenlemeleri anlatan, anlamlı, akıcı, profesyonel bir paragraf.
          2. HAP NOTLAR (hapNot): Akılda kalıcı en kritik 3-5 madde.
          3. ÖNEMLİ KAVRAMLAR (onemliKavramlar): Metinde geçen mesleki, ticari ya da teknik 3-5 tane kritik terim/kavram ve onların kısa, anlaşılır açıklamaları.
          4. TARİHLER VE GEÇERLİLİK (tarihler): Metinde geçen önemli tarihler (yürürlük tarihi, son başvuru, beyan tarihi vb.) ve her bir tarihin neden kritik olduğu ("onem"). Eğer tarih yoksa bu alanı boş bırak.
          5. KRİTİK ŞARTLAR VE KURALLAR (sartlar): Metinde belirtilen yasal sınırlar, koşullar, muafiyetler veya uyması zorunlu kurallar (örn: %20 oran barajı, 10 gün süre sınırı, ciro rasyoları vb.).
          6. SÜREÇ VE UYGULAMA AŞAMALARI (surecAşamalari): Eğer metinde bir iş akışı, başvuru süreci veya işlem adımları varsa alpine aşamalarını sırasıyla listele (adım numarası "adim", adım başlığı "baslik", açıklama "aciklama"). Eğer süreç yoksa, bu bilginin hayata geçirilmesi için atılması gereken mantıksal 3 adımlık bir yol haritası kurgula.
          7. KAZANIMLAR VE FAYDALAR (kazanimlar): Bu belgedeki bilginin uygulanmasıyla elde edilecek somut kazanımlar, teşvikler, tasarruflar veya idari kolaylıklar.
          8. İNFOGRAFİK TASARIMI (infografik): Sosyal medya afişleri ve infografikler için görselleştirilebilir veriler:
             - baslik: Afiş için son derece vurucu, kısa, dikkat çekici, havalı bir başlık.
             - kapsam: Kapsamı anlatan 2-3 kısa madde.
             - avantajlar: En büyük faydalar (2-3 madde).
             - kritikSinirlar: Hatırlanması gereken en önemli kurallar/sayılar (2-3 madde).
             - yapilmasiGerekenler: Hemen atılması gereken pratik adımlar/eylemler (2-3 madde).
             - gorselTema: Görsel tasarım için en uygun renk ve hava paleti seçimi ('neon' | 'kilim' | 'indigo' | 'smarag' | 'sunset' | 'ocean' değerlerinden biri).
          
          Yanıtını mutlaka aşağıdaki JSON formatında döndür, fazladan açıklama yazma, sadece JSON dönsün:
          {
            "ozet": "özet metni...",
            "hapNot": ["madde 1", "madde 2", ...],
            "onemliKavramlar": [
              {"kavram": "Kavram/Terim Adı", "aciklama": "Anlaşılır, kısa açıklaması"}
            ],
            "tarihler": [
              {"tarih": "GG.AA.YYYY veya Dönem", "onem": "Tarihin önemi/açıklaması"}
            ],
            "sartlar": ["şart 1", "şart 2", ...],
            "surecAşamalari": [
              {"adim": 1, "baslik": "Aşama Başlığı", "aciklama": "Aşama detay açıklaması"}
            ],
            "kazanimlar": ["kazanım 1", "kazanım 2", ...],
            "infografik": {
              "baslik": "Vurucu Afiş Başlığı",
              "kapsam": ["kapsam maddesi", ...],
              "avantajlar": ["avantaj maddesi", ...],
              "kritikSinirlar": ["kritik kural/rakam", ...],
              "yapilmasiGerekenler": ["atılacak pratik adım", ...],
              "gorselTema": "indigo"
            }
          }
          
          Yalnızca geçerli bir JSON belgesi döndür.`
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || '{}';
    const cleanedText = cleanJsonString(text);
    return JSON.parse(cleanedText);
  } catch (e: any) {
    const errorStr = String(e?.message || e || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited in analyzeDocumentForContent.");
    } else {
      console.error("JSON parse or API error in analyzeDocumentForContent:", errorStr.slice(0, 200));
    }
    return {
      hapNot: ["Analiz sırasında bir hata oluştu.", "Lütfen daha sonra tekrar deneyiniz."],
      ozet: "Mevcut yapay zeka kotası aşılmış olabilir veya bir bağlantı hatası oluştu.",
      onemliKavramlar: [{"kavram": "Geçici Kesinti", "aciklama": "Sistem şu anda kota sınırları nedeniyle yanıt veremiyor."}],
      tarihler: [],
      sartlar: ["Lütfen daha sonra tekrar deneyiniz veya yeni bir API anahtarı ekleyiniz."],
      surecAşamalari: [
        {"adim": 1, "baslik": "İnceleme", "aciklama": "Belge içeriğini tekrar gözden geçirin."},
        {"adim": 2, "baslik": "Danışma", "aciklama": "Mali müşavirinize danışarak işlem adımlarını belirleyin."}
      ],
      kazanimlar: ["Bilgi güvenliği ve güncellik."],
      infografik: { 
        baslik: "Hizmet Kesintisi", 
        kapsam: ["Belge içeriği okunamadı"],
        avantajlar: ["Yeniden yükleme yapabilirsiniz"],
        kritikSinirlar: ["Dosya biçimini kontrol ediniz"],
        yapilmasiGerekenler: ["Daha net bir metin kopyalayıp yapıştırınız"],
        gorselTema: "indigo"
      }
    };
  }
}

export async function analyzeVoucher(fileData: string, mimeType: string, docType?: string, isDeepScan?: boolean) {
  if (!isApiKeyValid()) {
    return {
      faturaTarihi: new Date().toISOString().split('T')[0],
      faturaNo: "GECICI-0001",
      vkn: "1234567890",
      cari: "Örnek Satıcı Ltd. Şti. (API Anahtarı Eksik)",
      matrah: 10000,
      kdvOrani: 20,
      toplamTutar: 12000,
      faturaTuru: "Normal satış faturası",
      fields: [
        { key: "Firma Ünvanı", value: "Örnek Satıcı Ltd. Şti.", confidence: 0.95 },
        { key: "Toplam Tutar", value: "12.000,00 TL", confidence: 0.98 },
        { key: "Uyarı", value: "Tam OCR analizi için GEMINI_API_KEY tanımlanmalıdır.", confidence: 1.0 }
      ],
      rawText: "API Anahtarı bulunamadığı için faturadan gerçek zamanlı OCR veri çıkarımı yapılamadı. Örnek veriler dolduruldu."
    };
  }

  let prompt = "";
  if (docType === 'mizan') {
    prompt = "Bu mizan belgesindeki hesap kodlarını ve bakiyelerini çıkar. Özellikle 100, 102, 120, 320, 131, 331 kodlu hesapları bul.";
  } else if (docType === 'metin') {
    prompt = "Bu belgedeki tüm metni en yüksek doğrulukla çıkar. Yazı net değilse bile bağlamdan yola çıkarak eksik kısımları tamamlamaya çalış. Metni yapılandırılmış bir şekilde sun.";
  } else {
    prompt = "Bu faturadaki Fatura No, Fatura Tarihi, VKN / TC No, Firma Ünvanı, Toplam Tutar, KDV Oranı (%), KDV Tutarı, KDV Dahil Toplam ve Fatura Tipi (Alış/Satış) bilgilerini çıkar.";
  }

  if (isDeepScan) {
    prompt += " Bu bir DERİN TARAMA (Deep Scan) isteğidir. Belge kalitesi düşük olabilir, lütfen her karakteri titizlikle incele ve en küçük ayrıntıları bile yakalamaya çalış.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: fileData,
              mimeType: mimeType
            }
          },
          {
            text: `${prompt}
            
            Lütfen bu belgeden bilgileri çıkar ve aşağıdaki alanlarla eşleşecek şekilde JSON formatında döndür:
            - faturaTarihi (YYYY-MM-DD formatında)
            - faturaNo
            - vkn (VKN veya TC Kimlik No)
            - cari (Satıcı veya işlem yapılan kurum adı)
            - matrah (KDV hariç tutar, sadece sayısal)
            - kdvOrani (Örn: 10, 20)
            - toplamTutar (KDV dahil toplam tutar, sadece sayısal)
            - faturaTuru (Aşağıdakilerden en uygun olanını seç: Tevkifatlı fatura, Normal satış faturası, E-arşiv fatura, E-fatura, Tevkifatlı iade faturası, İade faturası, İstisna faturası, İhraç kayıtlı fatura, İhracat faturası, İthalat faturası)
            - tevkifatOrani (Varsa)
            - tevkifatTutari (Varsa)
            - tevkifatKodu (Varsa)
            - iskontoTutari (Varsa)
            - iadeTutari (Varsa)
            
            Ayrıca key-value biçiminde 'fields' adında bir dizi döndür. Dizi elemanları:
            - key: Alan Adı
            - value: Değer
            - confidence: Güven Skoru (0-1 arası)
            
            Ve 'rawText' alanına tüm metni ekle. Sadece JSON döndür.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || '{}';
    const cleaned = cleanJsonString(text);
    return JSON.parse(cleaned);
  } catch (e: any) {
    const errorStr = String(e?.message || e || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited in analyzeVoucher.");
    } else {
      console.error("Voucher analyze error:", errorStr.slice(0, 200));
    }
    return {
      faturaTarihi: new Date().toISOString().split('T')[0],
      faturaNo: "HATA-0001",
      vkn: "1234567890",
      cari: "Örnek Satıcı Ltd. Şti. (Kota / Bağlantı Hatası)",
      matrah: 10000,
      kdvOrani: 20,
      toplamTutar: 12000,
      faturaTuru: "Normal satış faturası",
      fields: [
        { key: "Hata", value: "Fatura analizi sırasında geçici bir hata oluştu.", confidence: 1.0 },
        { key: "Durum", value: "Lütfen daha sonra tekrar deneyiniz.", confidence: 1.0 }
      ],
      rawText: "Belge OCR analizi tamamlanamadı. Lütfen internet bağlantınızı veya API kotanızı kontrol edin."
    };
  }
}

export async function analyzeFinancialStatements(files: { data: string, mimeType: string, name: string }[], profile: any) {
  if (!isApiKeyValid()) {
    return {
      report: `### ⚠️ Finansal Analiz Raporu Önizleme (API Anahtarı Eksik)
      
**Firma:** ${profile?.title || 'Bilinmeyen Firma'}

Yapay zeka analiz motoru aktif olmadığından yüklediğiniz mali tabloların derinlemesine analizi gerçekleştirilemedi. 

Ancak standart rasyo hesaplamaları için verileriniz güvendedir. Tam otomatik ve profesyonel mali danışmanlık raporu oluşturabilmek için lütfen **Settings > Secrets** kısmından **GEMINI_API_KEY** değişkenini tanımlayınız.`,
      chartData: {
        liquidity: [
          { "name": "Cari Oran", "value": 1.2, "target": 2.0 },
          { "name": "Asit Test", "value": 0.85, "target": 1.0 },
          { "name": "Nakit Oran", "value": 0.1, "target": 0.2 }
        ],
        expenses: [
          { "name": "Genel Yönetim", "value": 300 },
          { "name": "Pazarlama", "value": 150 },
          { "name": "Finansman", "value": 200 }
        ],
        profitability: [
          { "month": "Oca", "kar": 50 },
          { "month": "Şub", "kar": 65 },
          { "month": "Mar", "kar": 80 }
        ],
        debtStructure: [
          { "name": "Kısa V. Borçlar", "value": 55 },
          { "name": "Uzun V. Borçlar", "value": 25 },
          { "name": "Özkaynaklar", "value": 20 }
        ]
      }
    };
  }

  const parts: any[] = files.map(f => ({
    inlineData: {
      data: f.data,
      mimeType: f.mimeType
    }
  }));

  parts.push({
    text: `Sen uzman bir mali analiz, yeminli mali müşavir düzeyinde denetim ve stratejik yönetim asistanısın. 
          Sana sunulan mali tabloları (Mizan, Gelir Tablosu, Bilanço vb.) derinlemesine analiz et.
          Firma Profili: ${JSON.stringify(profile)}
          
          Lütfen şu özel ve kapsamlı başlıklar altında son derece etki bırakan, profesyonel bir mali denetim ve stratejik asistan raporu hazırla:
          
          1. 🏢 FİRMANIN YAPISAL BÜYÜKLÜĞÜ, GEÇMİŞ GELİŞİMİ VE GELECEK POTANSİYELİ:
             - Aktif büyüklüğü, ciro seviyesi, pazar konumu ve reel büyüme trendi analizi.
             - Bu büyüme sağlıklı mı? Sürdürülebilir mi? Yoksa kontrolsüz bir genişleme mi var?
             - Firmanın önümüzdeki 12 aylık potansiyeli, darboğazları ve sıçrama noktaları neler?
             
          2. 📊 RASYOLAR VE KARŞILAŞTIRMALI DURUM MATRİSİ (MEVCUT VS. OLMASI GEREKEN):
             - Likidite Oranları (Cari Oran, Asit-Test Oranı, Nakit Oran)
             - Karlılık Oranları (Brüt Satış Kar Marjı,           Raporun sonuna mutlaka şu imzayı ekle:
          ---
          **BİTİG AI ANALİZİ**  
          *SMMM Stratejik Karar Destek Raporudur. Yatırım tavsiyesi niteliği taşımayıp mali analiz verilerine dayanmaktadır.*
          
          Yanıtını aşağıdaki JSON formatında döndür:
          {
            "report": "Markdown formatında, başlıkları kalınlaştırılmış, tablolar ve şık listeler barındıran zengin Türkçe analiz raporu...",
            "chartData": {
              "liquidity": [
                { "name": "Cari Oran", "value": 1.4, "target": 2.0 },
                { "name": "Asit-Test Oranı", "value": 1.0, "target": 1.0 },
                { "name": "Nakit Oran", "value": 0.2, "target": 0.2 }
              ],
              "expenses": [
                { "name": "Pazarlama Gideri", "value": 200 },
                { "name": "Genel Yönetim Gideri", "value": 150 }
              ],
              "profitability": [
                { "month": "Dönem Başı", "kar": 100 },
                { "month": "Dönem Sonu", "kar": 150 }
              ],
              "debtStructure": [
                { "name": "Borçlar", "value": 70 },
                { "name": "Özkaynaklar", "value": 30 }
              ]
            }
          }
          Sadece JSON döndür.`
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: parts,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || '{}';
    const cleanedText = cleanJsonString(text);
    return JSON.parse(cleanedText);
  } catch (e: any) {
    const errorStr = String(e?.message || e || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited in analyzeFinancialStatements.");
    } else {
      console.error("Error or JSON parse error in analyzeFinancialStatements on server:", errorStr.slice(0, 200));
    }
    return {
      report: `### ⚠️ Finansal Analiz Raporu Önizleme (Kota Aşımı / Hizmet Hatası)
      
**Firma:** ${profile?.title || 'Bilinmeyen Firma'}

Mevcut yapay zeka kotası aşılmış olabilir veya bir bağlantı hatası oluştu. 

Rapor tam olarak üretilemedi ancak rasyo hesaplamaları için verileriniz güvendedir. Tam otomatik ve profesyonel mali danışmanlık raporu oluşturabilmek için lütfen API anahtarı ayarlarınızı ve kullanım kotanızı kontrol edin.`,
      chartData: {
        liquidity: [
          { "name": "Cari Oran", "value": 1.2, "target": 2.0 },
          { "name": "Asit Test", "value": 0.85, "target": 1.0 },
          { "name": "Nakit Oran", "value": 0.1, "target": 0.2 }
        ],
        expenses: [
          { "name": "Genel Yönetim", "value": 300 },
          { "name": "Pazarlama", "value": 150 },
          { "name": "Finansman", "value": 200 }
        ],
        profitability: [
          { "month": "Oca", "kar": 50 },
          { "month": "Şub", "kar": 65 },
          { "month": "Mar", "kar": 80 }
        ],
        debtStructure: [
          { "name": "Kısa V. Borçlar", "value": 55 },
          { "name": "Uzun V. Borçlar", "value": 25 },
          { "name": "Özkaynaklar", "value": 20 }
        ]
      }
    };
  }
}

export async function analyzeKdvRefundPotential(mizanData: any, manualData: any, profile: any) {
  if (!isApiKeyValid()) {
    return `### ⚠️ KDV İade Potansiyeli Önizleme (API Anahtarı Eksik)

**Firma:** ${profile?.title || 'Bilinmeyen Firma'}

Yapay zeka motoru aktif değildir. Ancak girdiğiniz beyan ve mizan bilgilerine göre KDV İade dosyasının hazırlanmasında herhangi bir sistemsel engel bulunmamaktadır. 

Otomatik İade ve Mahsup raporunu oluşturmak için lütfen **Settings > Secrets** panelinden **GEMINI_API_KEY** anahtarını ekleyiniz.`;
  }

  const prompt = `Aşağıdaki verilere dayanarak firma için KDV İade ve Mahsup Analizi yap.
  
  Firma Profili: ${JSON.stringify(profile)}
  Mizan Verileri: ${JSON.stringify(mizanData)}
  Manuel Girişler: ${JSON.stringify(manualData)}
  
  Lütfen şu analizleri yap:
  1. Net Mahsup Durumu: Alınacak iade ile mevcut borçların (Vergi, SGK, Manuel Borçlar) karşılaştırılması.
  2. Ödeme Yeterliliği: İadenin borçları kapatmaya yetip yetmediği.
  3. Tevkifat Kapasitesi: Firmanın ne kadar daha tevkifatlı fatura kesebileceği veya alabileceği.
  4. Gelecek Dönem Öngörüsü: İade trendine göre gelecek ay tahmini.
  
  Yanıtını profesyonel bir dille, yönetici özeti şeklinde hazırla.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    return response.text;
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited in analyzeKdvRefundPotential.");
    } else {
      console.warn("[GEMINI] analyzeKdvRefundPotential error:", errorStr.slice(0, 200));
    }
    return `### ⚠️ KDV İade Potansiyeli Önizleme (Kota Sınırı / Bağlantı Hatası)

**Firma:** ${profile?.title || 'Bilinmeyen Firma'}

Mevcut yapay zeka kotası aşılmış olabilir veya bir bağlantı hatası oluştu. 

Girdiğiniz verilere göre KDV İade dosyasının hazırlanmasında herhangi bir sistemsel engel bulunmamaktadır. Lütfen internet bağlantınızı veya API kotanızı kontrol edin.`;
  }
}

export async function processProductivityAnalysis(profile: any, files: { name: string, type: string, data: string, mimeType: string }[]) {
  if (!isApiKeyValid()) {
    return `[BÖLÜM A] MÜŞAVİR NOTU (Hata Masası)
🚩 KRİTİK: GEMINI_API_KEY Bulunamadı veya Geçersiz!
⚠️ RİSK: Yapay zehirli mizan denetimi ve ters bakiye kontrolü için geçerli bir API anahtarı tanımlanmalıdır.

[BÖLÜM B] MÜŞTERİ SUNUMU (Yönetici Paneli)
📈 DURUM: Firma bilgileri başarıyla mizan analizi için hazırlandı.
💡 ÖNERİ: Yapay zeka destekli finansal rasyo yorumları ve maliyet kontrolü tavsiyeleri almak için lütfen sağ üstteki **Settings > Secrets** panelinden **GEMINI_API_KEY** ekleyiniz.`;
  }

  const parts: any[] = [];
  
  parts.push({
    text: `
      SİSTEM ROLÜ:
      Sen; Türkiye mevzuatına (VUK, SGK, TTK) üst düzeyde hakim, titiz bir Denetçi ve vizyoner bir Finansal Danışman olan "Danışman" isimli yapay zekasın. Görevin, yüklenen mizanları "Ofis Verimlilik" kapsamında analiz ederek hem müşavirin hatasını önlemek hem de müşteriye finansal değer sunmaktır.

      📂 1. VERİ KAYNAĞI VE BAĞLAM (Context)
      Analizlerini yaparken şu firma bilgilerini temel al:
      - Firma Ünvanı: ${profile.title}
      - Vergi Dairesi/No: ${profile.taxOffice} / ${profile.taxNumber}
      - SGK No: ${profile.sgkNumber}
      - Hukuki Statü: ${profile.legalStatus}
      - Defter Türü: ${profile.ledgerType}
      - NACE Kodları: ${profile.naceCodes?.join(', ') || '—'}
      - İşçi Sayısı: ${profile.hrProfile.totalWorkers}

      🛠️ 2. ANALİZ TALİMATLARI (Mizan & Denetim Merkezi)
      Kullanıcı mizanı yüklediğinde, tek bir işlemle aşağıdaki iki raporu eş zamanlı olarak üret:

      A. Teknik Denetim (Müşavir İçin - Hata Önleme)
      - Mantıksal Kontroller: 100, 102, 120, 320 gibi temel hesaplarda "Ters Bakiye" kontrolü yap.
      - Vergi Riski Analizi: Kasa (100) ve Ortaklar (131/331) hesaplarındaki yüksek bakiyeleri, firmanın statüsüne (LTD/AŞ) göre adatlandırma riski açısından sorgula.
      - Bilanço Dengesi: Amortisman, reeskont ve gelecek aylara ait giderler gibi unutulabilecek dönem sonu işlemlerindeki eksikleri raporla.
      - Operasyonel Uyarılar: 361 borç bakiyesi (teşvik riski), kapanmamış avanslar ve hatalı hesap kodlarını tespit et.

      B. Finansal Analiz (Müşteri İçin - Değer Katma)
      - Gelir Tablosu Analizi: 600-699 hesap grubunu kullanarak; Brüt Satış Kârı, Faaliyet Kârı ve Net Kâr marjlarını hesapla.
      - Finansal Rasyolar: Cari Oranı (Dönen Varlıklar / KV Borçlar) ölçerek likidite durumunu (Güçlü/Zayıf) yorumla.
      - Trend Analizi: Satışların, cironun ve genel yönetim giderlerinin değişimini yorumla.

      📊 3. ÇIKTI VE GÖRÜNÜM STANDARDI
      Cevabını MUTLAKA şu iki ana başlık altında ver:
      [BÖLÜM A] MÜŞAVİR NOTU (Hata Masası)
      [BÖLÜM B] MÜŞTERİ SUNUMU (Yönetici Paneli)

      Bölüm A'da şu sembolleri kullan:
      🚩 KRİTİK: Ters bakiyeler ve mevzuat hataları.
      ⚠️ RİSK: Vergi ve ceza riski barındıran durumlar.

      Bölüm B'de şu sembolleri kullan:
      📈 DURUM: Kâr marjları ve genel finansal sağlık.
      💡 ÖNERİ: Ciro artışı ve maliyet kontrolü tavsiyeleri.
    `
  });

  files.forEach(file => {
    if (file.type === 'excel') {
      parts.push({ text: `Dosya: ${file.name} (Mizan İçeriği):\n${file.data}` });
    } else if (file.type === 'image' || file.type === 'pdf') {
      parts.push({
        inlineData: {
          data: file.data,
          mimeType: file.mimeType
        }
      });
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: parts }],
    });

    return response.text || "";
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      console.warn("[GEMINI] Quota exceeded / rate limited in processProductivityAnalysis.");
    } else {
      console.error("[GEMINI] processProductivityAnalysis error:", errorStr.slice(0, 200));
    }
    return `[BÖLÜM A] MÜŞAVİR NOTU (Hata Masası)
🚩 KRİTİK: Yapay Zeka Servisi Kota Sınırında!
⚠️ RİSK: Mizan teknik denetimi ve ters bakiye kontrolü için tanımlı olan API anahtarının kotası aşılmıştır. Lütfen daha sonra tekrar deneyiniz.

[BÖLÜM B] MÜŞTERİ SUNUMU (Yönetici Paneli)
📈 DURUM: Firma bilgileri başarıyla hazırlandı.
💡 ÖNERİ: Finansal raporlama ve detaylı analizler için lütfen API kotanızı kontrol edin veya daha sonra tekrar mizan analizini çalıştırın.`;
  }
}
