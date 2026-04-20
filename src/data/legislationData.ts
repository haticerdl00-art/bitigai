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
    ozet: "7491 Sayılı Kanun ile KDV oranlarında önemli düzenlemeler yapıldı. Temel gıda maddeleri ve bazı hizmetlerdeki %10 ve %20'lik oranlar korunurken, ihracat istisnası kapsamı teknoloji ve yazılım hizmetlerini de kapsayacak şekilde genişletildi. Mükelleflerin fatura düzenleme süreçlerinde güncel oranları teyit etmeleri ve ihracatçıların yeni istisna kalemlerini incelemeleri kritik önem taşıyor.",
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
    ozet: "10 ve üzeri çalışanı olan işyerleri için asgari ücret desteği aylık 700 TL'den 1.000 TL'ye yükseltildi. Destekten yararlanma şartı olarak prim borcu bulunmaması ve bildirgelerin süresinde verilmesi gerekiyor. Başvuru süresi 30 Nisan 2026'ya kadar uzatılarak işverenlerin maliyet yükünün hafifletilmesi hedefleniyor.",
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
    ozet: "GİB tarafından yapılan yeni düzenleme ile 2025 yılı brüt satış hasılatı 5 Milyon TL'yi aşan tüm mükellefler için e-defter kullanımı Temmuz 2026 itibariyle zorunlu hale getirildi. Bu kapsama giren firmaların mali mühür/e-imza temini ve yazılım entegrasyonu süreçlerini en geç Haziran sonuna kadar tamamlamaları cezai yaptırımlarla karşılaşmamaları adına kritiktir.",
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
    ozet: "Ticaret Bakanlığı, imalat ve teknoloji odaklı ihracat yapan firmalar için Ar-Ge, tasarım ve yurt dışı pazarlama destek limitlerini %50 oranında artırdı. Özellikle yazılım ve yüksek teknoloji ürünleri ihraç eden firmalar için hibe oranları %75'e kadar çıkabiliyor. Başvuruların DYS üzerinden 31 Mayıs'a kadar yapılması gerekmektedir.",
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
    ozet: "KDV Uygulama Genel Tebliği'nde yapılan değişiklikle, özellikle inşaat ve temizlik hizmetherindeki tevkifat oranları artırıldı. Yapım işlerinde 3/10 olan oran 4/10'a, temizlik hizmetlerinde ise 7/10'dan 9/10'a yükseltildi. Bu değişiklik, firmaların nakit akışını ve iade süreçlerini doğrudan etkileyecektir.",
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
    ozet: "Çalışma ve Sosyal Güvenlik Bakanlığı, 50 ve üzeri çalışanı olan özel sektör işyerlerinde %3 engelli istihdamı zorunluluğuna yönelik denetimlerin dijital veriler üzerinden aylık olarak yapılacağını duyurdu. Kotayı doldurmayan her bir engelli için aylık idari para cezası miktarı 2026 yılı için yeniden değerleme oranında artırıldı.",
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
  {
    id: 7,
    tarih: "20.04.2026",
    baslik: "KDV Beyanname Sürelerinde Kalıcı Değişiklik",
    kaynak: "GİB",
    tur: "VERGİ",
    etki: "YÜKSEK",
    ozet: "GİB tarafından yapılan yeni duyuru ile KDV beyanname verme süreleri kalıcı olarak her ayın 28. gününe sabitlenmiştir. Ayrıca ödeme süreleri de beyanname verme süresinin son gününe kadar uzatılmıştır.",
    eslestir: (f: CompanyProfile) => ({ eslesti: true, nedenler: ["Tüm KDV mükelleflerini etkileyen yapısal değişiklik."] }),
  },
];
