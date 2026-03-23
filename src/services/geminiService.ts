import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  try {
    const formattedHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const companyContext = companies.length > 0 
      ? `Sistemdeki kayıtlı firmalar: ${companies.map(c => c.title).join(', ')}.`
      : '';

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        ...formattedHistory.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: `Sen 'Eylem Odaklı Akıllı Asistan'sın. Bir SMMM (Serbest Muhasebeci Mali Müşavir) için profesyonel, çözüm odaklı ve hatırlatıcı bir yardımcı olarak çalışıyorsun.
        
        TEMEL GÖREVLERİN:
        1. DANIŞMANLIK: Mevzuat, vergi, SGK ve muhasebe konularında uzman görüşü ver.
        2. EYLEM TESPİTİ: Kullanıcının mesajlarından somut görevler çıkar.
        
        EYLEM FORMATI:
        Eğer kullanıcı bir kayıt, not veya güncelleme talep ederse, yanıtının en sonuna MUTLAKA şu formatta bir JSON bloğu ekle:
        [ACTION: {"type": "ADD_NOTE", "company": "Firma Adı veya Genel", "content": "Not içeriği"}]
        [ACTION: {"type": "UPDATE_DECLARATION", "company": "Firma Adı", "declaration": "KDV/MUHSGK/GEÇİCİ/BERAT", "status": "Verildi"}]
        [ACTION: {"type": "ADD_TASK", "content": "Görev içeriği", "date": "YYYY-MM-DD"}]
        
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
        
        Bugünün tarihi: ${new Date().toLocaleDateString('tr-TR')}.`,
        tools: [{ googleSearch: {} }],
      },
    });

    return response;
  } catch (error) {
    console.error("Copilot error:", error);
    throw error;
  }
}

export async function askCopilot(prompt: string, history: { role: 'user' | 'model', text: string }[] = []) {
  try {
    const formattedHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `Sen uzman bir Mali Müşavir ve Vergi Danışmanısın. 
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
        
        Bugünün tarihi: ${new Date().toLocaleDateString('tr-TR')}.`,
        tools: [{ googleSearch: {} }],
      },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({ message: prompt });
    return response.text;
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
    text: `Sen profesyonel bir içerik üreticisi ve mali danışman asistanısın. 
          Aşağıda sana sunulan metni veya belgeyi dikkatle analiz et. 
          SADECE bu metindeki verilere ve bilgilere dayanarak içerik üret. 
          Jenerik veya önceki bilgilerinden bağımsız, sadece bu spesifik içeriğe odaklan.
          
          Aşağıdaki 3 farklı formatta içerik üret:
          
          1. HAP NOT: Metindeki en kritik 3-5 maddeyi (bullet points) çıkar. Her madde kısa, öz ve vurucu olmalı.
          2. YÖNETİCİ ÖZETİ: Metnin bütününü özetleyen, anlamlı, akıcı ve profesyonel bir paragraf oluştur. Metindeki gerçek verilere odaklan.
          3. İNFOGRAFİK VERİLERİ: Sosyal medya afişi için metindeki verileri aşağıdaki kategorilere ayırarak özetle:
             - baslik: Afiş için etkileyici, kısa bir başlık.
             - kapsam: Metnin neyi kapsadığını anlatan 1-2 kısa madde.
             - avantajlar: Sağlanan faydalar veya olumlu yönler (2-3 madde).
             - kritikSinirlar: Dikkat edilmesi gereken rakamlar, tarihler veya yasal sınırlar (2-3 madde).
             - yapilmasiGerekenler: Atılması gereken somut adımlar (2-3 madde).
          
          Yanıtını aşağıdaki JSON formatında döndür:
          {
            "hapNot": ["madde 1", "madde 2", ...],
            "ozet": "özet metni...",
            "infografik": {
              "baslik": "Afiş Başlığı",
              "kapsam": ["madde 1", ...],
              "avantajlar": ["madde 1", ...],
              "kritikSinirlar": ["madde 1", ...],
              "yapilmasiGerekenler": ["madde 1", ...]
            }
          }
          
          Sadece JSON döndür.`
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
      infografik: { 
        baslik: "Hata", 
        kapsam: ["Veri yok"],
        avantajlar: ["Veri yok"],
        kritikSinirlar: ["Veri yok"],
        yapilmasiGerekenler: ["Veri yok"]
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
