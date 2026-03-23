import { CompanyProfile } from '../types';

export interface LegislationItem {
  id: number;
  tarih: string;
  baslik: string;
  kaynak: string;
  tur: string;
  etki: string;
  ozet: string;
  eslestir: (f: CompanyProfile) => { eslesti: boolean; nedenler: string[] };
}

export const MEVZUAT_DATA: LegislationItem[] = [
  {
    id: 1,
    tarih: "04.03.2026",
    baslik: "7491 Sayılı Kanun – KDV Oranı Değişiklikleri",
    kaynak: "Resmi Gazete",
    tur: "VERGİ",
    etki: "YÜKSEK",
    ozet: "Bazı mal ve hizmetlerde KDV oranları yeniden düzenlendi. İhracat istisnası kapsamı genişletildi. Tüm mükellefleri ilgilendiriyor.",
    eslestir: (f: CompanyProfile) => {
      const nedenler = ["Tüm mükellefler bu düzenlemeden etkilenmektedir."];
      if (f.isExporter) nedenler.push("İhracatçı firma — genişleyen istisna kapsamından doğrudan yararlanabilir.");
      if (f.hasWithholdingSales) nedenler.push("Tevkifatlı satış yapıyor — güncel oranları kontrol edin.");
      return { eslesti: true, nedenler };
    },
  },
  {
    id: 2,
    tarih: "02.03.2026",
    baslik: "SGK Teşvik Genişlemesi – Asgari Ücret Desteği",
    kaynak: "SGK",
    tur: "SGK",
    etki: "YÜKSEK",
    ozet: "10 ve üzeri çalışanı olan işyerleri için asgari ücret desteği kapsamı genişletildi. Başvuru süresi 30 Nisan 2026'ya uzatıldı.",
    eslestir: (f: CompanyProfile) => {
      const totalWorkers = f.hrProfile?.totalWorkers || 0;
      if (totalWorkers < 10) return { eslesti: false, nedenler: [] };
      return {
        eslesti: true,
        nedenler: [
          `${totalWorkers} çalışanı ile kapsam dahilinde (eşik: 10+ çalışan).`,
          "Başvuru süresinin uzatılması firmayı doğrudan ilgilendiriyor.",
        ],
      };
    },
  },
  {
    id: 3,
    tarih: "28.02.2026",
    baslik: "E-Defter Zorunluluk Kapsamı Genişledi",
    kaynak: "GİB",
    tur: "E-DÖNÜŞÜM",
    etki: "ORTA",
    ozet: "Yıllık cirosu 5 milyon TL'yi aşan mükellefler Temmuz 2026'dan itibaren e-deftere geçmek zorunda. Henüz geçiş yapmayan firmalar için aksiyon gerekiyor.",
    eslestir: (f: CompanyProfile) => {
      if (f.ledgerType.includes('E-Defter')) return { eslesti: false, nedenler: [] };
      return {
        eslesti: true,
        nedenler: [
          "Henüz e-defter kullanmıyor — Temmuz 2026'ya kadar geçiş zorunlu.",
          "Geçiş yapılmaması halinde cezai yaptırım uygulanabilir.",
        ],
      };
    },
  },
  {
    id: 4,
    tarih: "20.02.2026",
    baslik: "İhracat Teşviklerinde Yeni Dönem – Destekler Artırıldı",
    kaynak: "Ticaret Bakanlığı",
    tur: "TEŞVİK",
    etki: "YÜKSEK",
    ozet: "İmalat ve teknoloji sektörlerinde faaliyet gösteren ihracatçı firmalar için Ar-Ge ve pazarlama destekleri artırıldı. Son başvuru: 31 Mayıs 2026.",
    eslestir: (f: CompanyProfile) => {
      const sektorUygun = ["Teknoloji", "İmalat", "Tekstil", "Yazılım / Teknoloji"].includes(f.sector || '');
      if (!f.isExporter || !sektorUygun) return { eslesti: false, nedenler: [] };
      return {
        eslesti: true,
        nedenler: [
          `${f.sector} sektöründe faaliyet gösteriyor — kapsam dahilinde.`,
          "İhracatçı firma — artırılan desteklerden yararlanabilir.",
          "Son başvuru tarihi: 31 Mayıs 2026.",
        ],
      };
    },
  },
  {
    id: 5,
    tarih: "15.02.2026",
    baslik: "Tevkifat Uygulama Esasları Güncellendi",
    kaynak: "GİB",
    tur: "VERGİ",
    etki: "ORTA",
    ozet: "Yapım işleri ve hizmet alımlarında tevkifat oranları yeniden belirlendi. İnşaat sektöründe 3/10 oranı 4/10'a çıkarıldı.",
    eslestir: (f: CompanyProfile) => {
      if (!f.hasWithholdingSales) return { eslesti: false, nedenler: [] };
      const insaat = f.sector === "İnşaat";
      return {
        eslesti: true,
        nedenler: [
          "Tevkifatlı satış yapıyor — güncel oranlar uygulanmalı.",
          insaat ? "İnşaat sektörü: 3/10 oranı 4/10'a yükseltildi — fatura düzenlemesi güncellenmeli." : "Uyguladığınız tevkifat oranlarını kontrol edin.",
        ],
      };
    },
  },
  {
    id: 6,
    tarih: "10.02.2026",
    baslik: "50+ Çalışan İşyerlerinde Engelli Kotası Denetimi Artırıldı",
    kaynak: "ÇSGB",
    tur: "İŞ HUKUKU",
    etki: "ORTA",
    ozet: "50 ve üzeri çalışanı olan işyerlerinde %3 engelli istihdamı zorunluluğu denetimi sıkılaştırıldı. Eksik istihdam için ceza miktarları güncellendi.",
    eslestir: (f: CompanyProfile) => {
      const totalWorkers = f.hrProfile?.totalWorkers || 0;
      if (totalWorkers < 50) return { eslesti: false, nedenler: [] };
      return {
        eslesti: true,
        nedenler: [
          `${totalWorkers} çalışanı ile denetim kapsamında (eşik: 50+ çalışan).`,
          `Zorunlu engelli kontenjanı: en az ${Math.ceil(totalWorkers * 0.03)} kişi (%3).`,
          "Denetim sıkılaştırıldı — bordro öncesi kontrol önerilir.",
        ],
      };
    },
  },
];
