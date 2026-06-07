import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'undefined') {
  console.error("GEMINI_API_KEY is missing or undefined! AI features will fail.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Simple in-memory cache
const cache: { [key: string]: { data: any, timestamp: number } } = {};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

function getCachedData(key: string) {
  const cached = cache[key];
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache[key] = { data, timestamp: Date.now() };
}

export async function askCopilotStream(prompt: string, history: { role: 'user' | 'model', text: string }[] = [], companies: any[] = []) {
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
    // Try with search grounding first
    try {
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
          ...formattedHistory.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });
      return response;
    } catch (searchError) {
      console.warn("Search grounding failed, falling back to standard generation:", searchError);
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
          ...formattedHistory.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction,
        },
      });
      return response;
    }
  } catch (error) {
    console.error("Copilot stream error:", error);
    throw error;
  }
}

export async function askCopilot(prompt: string, history: { role: 'user' | 'model', text: string }[] = []) {
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
    // Try with search grounding first
    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
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
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction,
        },
        history: formattedHistory,
      });
      const response = await chat.sendMessage({ message: prompt });
      return response.text;
    }
  } catch (error) {
    console.error("Copilot error:", error);
    throw error;
  }
}

function cleanJsonString(jsonStr: string): string {
  return jsonStr.replace(/```json\n?|```/g, '').trim();
}

export async function fetchLatestLegislation() {
  const cached = getCachedData('legislation');
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
    console.warn("Legislation fetch error (Flash):", error.message || error);
    
    // Final fallback: Return static recent data if AI calls fail
    return [
      { title: "7491 Sayılı Kanun ile Vergi Kanunlarında Yapılan Değişiklikler", date: "2024-01-01", source: "Resmi Gazete" },
      { title: "2024 Yılı Gelir Vergisi Tarifesi ve İstisnaları", date: "2023-12-30", source: "GİB" },
      { title: "Asgari Ücret Desteği Uygulama Esasları", date: "2024-01-15", source: "SGK" }
    ];
  }
}

export async function fetchSGKParameters() {
  const cached = getCachedData('sgk_params');
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
    console.warn("SGK parameters fetch error (Flash):", error.message || error);
    
    // Final fallback: Return 2026 default values
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
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
    console.warn("Incentive report generation error (Flash):", error.message || error);
    return "Rapor oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.";
  }
}

export async function analyzeLegislation(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Aşağıdaki mevzuat değişikliğini analiz et ve bir mali müşavir için özetle. 
    Eski ve yeni durumu karşılaştır. Bu değişikliğin hangi sektörleri etkileyebileceğini belirt.
    
    Metin: ${text}`,
  });
  return response.text;
}

export async function analyzeDocumentForContent(fileData?: string, mimeType?: string, rawText?: string) {
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

  parts.push({
    text: `Sen profesyonel bir içerik üreticisi, grafik tasarımcı ve mali danışman asistanısın. 
          Sana sunulan metni veya belgeyi dikkatle analiz et. 
          SADECE bu metindeki verilere, bilgilere ve gerçek detaylara dayanarak içerik üret. 
          Jenerik veya önceki bilgilerinden bağımsız, sadece bu spesifik içeriğe odaklan.
          
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: parts
    },
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    const text = response.text || '{}';
    const cleanedText = cleanJsonString(text);
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("JSON parse error in analyzeDocumentForContent:", e);
    return {
      hapNot: ["Analiz sırasında bir hata oluştu."],
      ozet: "Belge analiz edilemedi.",
      onemliKavramlar: [{"kavram": "Genel Kapsam", "aciklama": "Belge içeriğinde net bir kavram tespiti yapılamadı."}],
      tarihler: [],
      sartlar: ["Veri bulunamadı."],
      surecAşamalari: [
        {"adim": 1, "baslik": "İnceleme", "aciklama": "Belge içeriğini tekrar gözden geçirin."},
        {"adim": 2, "baslik": "Danışma", "aciklama": "Mali müşavirinize danışarak işlem adımlarını belirleyin."}
      ],
      kazanimlar: ["Bilgi güvenliği ve güncellik."],
      infografik: { 
        baslik: "Belge Analiz Özeti", 
        kapsam: ["Belge içeriği okunamadı"],
        avantajlar: ["Yeniden yükleme yapabilirsiniz"],
        kritikSinirlar: ["Dosya biçimini kontrol ediniz"],
        yapilmasiGerekenler: ["Daha net bir metin kopyalayıp yapıştırınız"],
        gorselTema: "indigo"
      }
    };
  }
}

export async function analyzeVoucher(fileData: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: fileData,
            mimeType: mimeType
          }
        },
        {
          text: `Bu bir muhasebe fişi, fatura veya makbuz görselidir. 
          Lütfen bu belgeden aşağıdaki bilgileri çıkar ve JSON formatında döndür.
          Eğer belgede birden fazla fiş/fatura varsa hepsini bir dizi (array) içinde döndür.
          
          İstenen alanlar:
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

          Sadece JSON döndür, başka açıklama yapma.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    const text = response.text || '[]';
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON parse error:", e);
    return [];
  }
}

export async function analyzeFinancialStatements(files: { data: string, mimeType: string, name: string }[], profile: any) {
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
             - Karlılık Oranları (Brüt Satış Kar Marjı, Faaliyet Kar Marjı, Net Kar Oranı, ROE - Özkaynak Karlılığı, ROA - Aktif Karlılığı)
             - Mali Yapı ve Borçlanma Oranları (Finansal Kaldıraç Oranı, Özkaynak/Borç Oranı)
             - Her bir oranı tablo halinde "MEVCUT DURUM - OLMASI GEREKEN İDEAL - DURUM (Yeterli/Yetersiz/Kritik)" şeklinde göster. Sazan/Adat gibi riskleri hesaba kat.
             
          3. 🚨 TEŞHİS: FİRMA BATIYOR MU, BÜYÜYOR MU? (FİNANSAL RİSK ANALİZİ):
             - Altman Z-Skor veya benzeri bir risk yaklaşımıyla firmanın iflas/nakit sıkışıklığı/batma riski var mı, yoksa güçlü bir büyüme evresinde mi net teşhis koy.
             - "BÜYÜYOR", "STABİL", "KRİTİK RİSK", "BATMA RİSKİ/TEHLİKE" etiketlerinden birini seçerek büyük harflerle gerekçelendir.
             
          4. 🎯 STRATEJİK ÖNERİLER VE YOL HARİTASI (NE YAPMALI?):
             - Sermaye Artışı mı yapmalı, yoksa yabancı kaynak/özkaynak dengesini mi düzenlemeli?
             - Kaynaklarını artırmak için alternatif finansman modelleri (ortaklık, leasing, fonlama, teşvikler) ne olmalı?
             
          5. 🛠️ MİZAN TEKNİK DENETİM (HATA MASASI):
             - Ters bakiye veren hesaplar (100 Kasa alacak bakiyesi, 120/320 ters bakiye, vb.)
             - Ortaklardan Alacaklar (131) veya Ortaklara Borçlar (331) hesaplarındaki adatlandırma gereksinimleri ve örtülü kazanç dağıtım riskleri.
             - Dönem sonu fiili/envanter farkları ve düzeltme kayıtları önerileri.
          
          Raporun sonuna mutlaka şu imzayı ekle:
          ---
          **BİTİG AI ANALİZİ**  
          *SMMM Stratejik Karar Destek Raporudur. Yatırım tavsiyesi niteliği taşımayıp mali analiz verilerine dayanmaktadır.*
          
          Yanıtını aşağıdaki JSON formatında döndür:
          {
            "report": "Markdown formatında, başlıkları kalınlaştırılmış, tablolar ve şık listeler barındıran zengin Türkçe analiz raporu...",
            "chartData": {
              "liquidity": [
                { "name": "Cari Oran", "value": 1.4, "target": 2.0 },
                { "name": "Asit Test", "value": 0.9, "target": 1.0 },
                { "name": "Nakit Oran", "value": 0.15, "target": 0.2 }
              ],
              "expenses": [
                { "name": "Satış Pazarlama", "value": 350 },
                { "name": "Genel Yönetim", "value": 250 },
                { "name": "Finansman Gideri", "value": 450 },
                { "name": "Ar-Ge Gideri", "value": 50 }
              ],
              "profitability": [
                { "month": "Oca", "kar": 80 },
                { "month": "Şub", "kar": 95 },
                { "month": "Mar", "kar": 110 },
                { "month": "Nis", "kar": 125 },
                { "month": "May", "kar": 140 }
              ],
              "debtStructure": [
                { "name": "Kısa V. Borçlar", "value": 60 },
                { "name": "Uzun V. Borçlar", "value": 25 },
                { "name": "Özkaynaklar", "value": 15 }
              ]
            }
          }
          Sadece JSON döndür. chartData içindeki değerleri analiz ettiğin mali tablolara göre gerçekçi bir şekilde (örneğin iflas riski olan bir firmada borçları yüksek, karlılığı düşük; büyüyen firmada tam tersi olacak şekilde) hesaplayıp yerleştir.`
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: parts
    },
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    const text = response.text || '{}';
    const cleanedText = cleanJsonString(text);
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("JSON parse error in analyzeFinancialStatements:", e);
    return {
      report: response.text || "Analiz raporu oluşturulamadı.",
      chartData: null
    };
  }
}

export async function analyzeKdvRefundPotential(mizanData: any, manualData: any, profile: any) {
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text;
}
