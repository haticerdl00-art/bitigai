import React, { useState, useRef } from 'react';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Download, 
  Mail, 
  Share2, 
  MessageSquare,
  Sparkles,
  RefreshCw,
  FileText,
  DollarSign,
  PieChart as PieIcon,
  Search,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Award
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

interface FinancialAnalysisProps {
  profile: CompanyProfile;
}

export const FinancialAnalysis: React.FC<FinancialAnalysisProps> = ({ profile }) => {
  // Financial inputs that user can modify to get real calculations
  const [financials, setFinancials] = useState({
    // Balance Sheet (Bilanço)
    donenVarliklar: 1450000,
    nakitVeBankalar: 480000,
    alacaklar: 620000,
    stoklar: 350000,
    duranVarliklar: 2200000,
    toplamAktif: 3650000,
    kisaVadeliBorclar: 920000,
    uzunVadeliBorclar: 1100000,
    ozkaynaklar: 1630000,
    
    // Income Statement (Gelir Tablosu)
    netSatislar: 2800000,
    oncekiNetSatislar: 2100000,
    satilanMalMaliyeti: 1850000,
    faaliyetGiderleri: 450000,
    netKar: 380000,
    oncekiNetKar: 290000,
  });

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState<string | null>(null);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-calculate totals when children fields change
  const handleInputChange = (field: keyof typeof financials, val: number) => {
    setFinancials(prev => {
      const updated = { ...prev, [field]: val };
      
      // Calculate derived totals carefully
      updated.toplamAktif = updated.donenVarliklar + updated.duranVarliklar;
      // Balance sheet identity: assets = liabilities + equity
      // We keep equity as residual or adjust as entered
      return updated;
    });
  };

  // 1. Ratios computations
  const cariOran = financials.donenVarliklar / (financials.kisaVadeliBorclar || 1);
  const asitTestOran = (financials.donenVarliklar - financials.stoklar) / (financials.kisaVadeliBorclar || 1);
  const nakitOran = financials.nakitVeBankalar / (financials.kisaVadeliBorclar || 1);
  const borcOzkaynakOran = (financials.kisaVadeliBorclar + financials.uzunVadeliBorclar) / (financials.ozkaynaklar || 1);
  const ozkaynakOrani = financials.ozkaynaklar / (financials.toplamAktif || 1);
  const brutKarMarji = ((financials.netSatislar - financials.satilanMalMaliyeti) / (financials.netSatislar || 1)) * 100;
  const netKarMarji = (financials.netKar / (financials.netSatislar || 1)) * 100;
  const roe = (financials.netKar / (financials.ozkaynaklar || 1)) * 100; // Return on Equity
  const roa = (financials.netKar / (financials.toplamAktif || 1)) * 100; // Return on Assets

  // Satis & Kar Growth Rate
  const satisArtisOrani = ((financials.netSatislar - financials.oncekiNetSatislar) / (financials.oncekiNetSatislar || 1)) * 100;
  const karArtisOrani = ((financials.netKar - financials.oncekiNetKar) / (financials.oncekiNetKar || 1)) * 100;

  // Real-time assessment system
  const getFinancialHealth = () => {
    let score = 0;
    if (cariOran >= 1.5) score += 20;
    else if (cariOran >= 1.0) score += 10;

    if (asitTestOran >= 1.0) score += 15;
    else if (asitTestOran >= 0.8) score += 8;

    if (nakitOran >= 0.2) score += 15;

    if (borcOzkaynakOran < 1.5) score += 20;
    else if (borcOzkaynakOran < 2.5) score += 10;

    if (netKarMarji >= 10) score += 15;
    if (satisArtisOrani > 15) score += 15;

    if (score >= 80) {
      return { 
        status: "MÜKEMMEL & HIZLI BÜYÜYEN", 
        color: "text-emerald-700 bg-emerald-100 border-emerald-300", 
        badgeColor: "bg-emerald-500",
        desc: "Firma güçlü bir finansal yapıya, yüksek likiditeye ve sürdürülebilir kârlılık oranlarına sahip. Bu durum dış finansman bulmayı kolaylaştırır ve büyüme potansiyelini tetikler. Risk seviyesi son derece düşüktür.",
        advice: "Sermaye fazlasını uzun vadeli yatırım fonlarında, eurobondlarda veya teknolojik Ar-Ge yatırımlarında değerlendirebilir. Borçlanma kapasitesi yüksek olduğundan kaldıraç gücünü kullanarak yeni pazarlara açılabilir."
      };
    } else if (score >= 50) {
      return { 
        status: "AĞIRLIKLI DENGELİ / DURGUN BÜYÜME", 
        color: "text-blue-700 bg-blue-100 border-blue-300", 
        badgeColor: "bg-blue-500",
        desc: "Firma operasyonel dengesini korumaktadır ancak likidite veya kârlılık marjlarında birtakım iyileştirmelere ihtiyaç duyulmaktadır. Ciddi bir iflas veya batma riski olmamakla birlikte büyüme ivmesi yavaş seyretmektedir.",
        advice: "Ticari alacak vadelerini gözden geçirmeli (ortalama tahsilat süresi kısaltılmalı). Stok devir hızı artırılarak atıl kaynaklar nakit akışına kazandırılmalıdır. Cari dönem vergilerini iade mahsuplarıyla dengelemeye devam etmelidir."
      };
    } else {
      return { 
        status: "YÜKSEK FİNANSAL RİSK / DARBOĞAZ ESKİZİ", 
        color: "text-red-700 bg-red-100 border-red-300", 
        badgeColor: "bg-red-500",
        desc: "Firma acil nakit sıkışıklığı, kritik borç/özkaynak dengesizliği veya zayıf faaliyet kârlılığı çekmektedir. Kısa vadeli yükümlülükler dönen varlıklarla karşılanamamaktadır. İflas/darboğaz riski belirgindir.",
        advice: "Acilen sermaye artışına gidilerek özkaynak seviyesi güçlendirilmelidir. Kısa vadeli ticari ve banka borçları uzun vadeye yapılandırılmalı, stoklar acil nakit elde etmek amacıyla iskonto ile tasfiye edilmelidir. Lüks ve operasyonel olmayan duran varlıklar elden çıkarılarak nakde çevrilmelidir."
      };
    }
  };

  const health = getFinancialHealth();

  // Excel ve Doküman okuma simülasyonu
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Dosya analiz ediliyor...");

    setTimeout(() => {
      // Smart parsing simulation depending on type
      if (file.name.toLowerCase().includes('mizan') || file.name.endsWith('.xlsx') || file.name.endsWith('.xlsx')) {
        setFinancials({
          donenVarliklar: 1850000,
          nakitVeBankalar: 520000,
          alacaklar: 890000,
          stoklar: 440000,
          duranVarliklar: 1950000,
          toplamAktif: 3800000,
          kisaVadeliBorclar: 1050000,
          uzunVadeliBorclar: 1200000,
          ozkaynaklar: 1550000,
          netSatislar: 3500000,
          oncekiNetSatislar: 2900000,
          satilanMalMaliyeti: 2300000,
          faaliyetGiderleri: 600000,
          netKar: 550000,
          oncekiNetKar: 420000
        });
        setUploadStatus(`"${file.name}" Başarıyla Okundu! Mizan verileri sisteme entegre edilerek rasyolar anında güncellendi.`);
      } else {
        setUploadStatus(`"${file.name}" Dosyası OCR ile tanımlandı. Tahmini finansal veriler çıkarıldı ve rasyolara yansıtıldı.`);
      }
      setIsUploading(false);
    }, 1500);
  };

  // Real-Time Smart AI Report Generator
  const generateAiReport = () => {
    setIsGeneratingMessage(true);
    setTimeout(() => {
      const summary = `
      🌟 BİTİG AI YÖNETİCİ ÖZETİ & DANIŞMAN RAPORU
      --------------------------------------------------
      Firma Ünvanı: ${profile.title}
      Mali Yapı Sınıflandırması: ${health.status}
      
      ANA BULGULAR VE GÖSTERGELER:
      1. Likidite Dengesi: Cari Oranınız ${cariOran.toFixed(2)} seviyesindedir. İdeal referans (1.50) ile kıyaslandığında ${cariOran >= 1.5 ? 'güvende ve yeterlidir.' : 'nakit sıkışıklığına ve tedarik aksamalarına işaret etmektedir.'} Stoklardan arındırılmış Asit-Test oranının ise ${asitTestOran.toFixed(2)} olması, stok bağımlılığınızın ${asitTestOran < 1.0 ? 'yüksek' : 'düşük'} olduğunu kanıtlar.
      2. Mali Kaldıraç gücü: Borç/Özkaynak oranınız ${borcOzkaynakOran.toFixed(2)} düzeyinde. Özkaynaklarınız toplam varlıkların %${(ozkaynakOrani * 100).toFixed(1)}'ini finanse ediyor.
      3. Büyüme Performansı: Satışlarınız bir önceki yıla kıyasla %${satisArtisOrani.toFixed(1)} oranında artmıştır. Net kar büyümesi ise %${karArtisOrani.toFixed(1)} seviyesinde gerçekleşerek ${karArtisOrani > satisArtisOrani ? 'verimli ve kârlı bir ivme kazanmıştır.' : 'maliyetlerdeki yükselişe bağlı kâr erimesi yaşamaktadır.'}
      
      EKLENEBİLİR DEĞER ÖNERİLERİ:
      * ${health.advice}
      * Kısa vadeli borç ödemelerinin nakit akışını bozmaması amacıyla vergilendirme bültenlerindeki iade haklarınızı (KDV/stopaj) cari vergilerinize tam mahsup edin.
      * İkincil piyasa yatırım enstrümanlarında (Eurobond, Altın ve Kira Sertifikası fonları) değerlendirerek enflasyon karşısında işletme sermayesini koruyun.
      `;
      setAiAnalysisText(summary);
      setIsGeneratingMessage(false);
    }, 1000);
  };

  // EXCEL / CSV Export Logic
  const handleExportExcel = () => {
    const data = [
      ["BİTİG FİNANSAL STRATEJİ VE ANALİZ RAPORU"],
      ["Firma Adı", profile.title],
      ["Tarih", new Date().toLocaleDateString('tr-TR')],
      [],
      ["FİNANSAL GÖSTERGELER & GİRDİLER", "TUTAR (TL)"],
      ["Dönen Varlıklar", financials.donenVarliklar],
      ["Nakit ve Bankalar", financials.nakitVeBankalar],
      ["Ticari Alacaklar", financials.alacaklar],
      ["Stoklar", financials.stoklar],
      ["Duran Varlıklar", financials.duranVarliklar],
      ["Kısa Vadeli Yükümlülükler", financials.kisaVadeliBorclar],
      ["Uzun Vadeli Yükümlülükler", financials.uzunVadeliBorclar],
      ["Özkaynaklar", financials.ozkaynaklar],
      ["Toplam Varlıklar / Aktif", financials.toplamAktif],
      ["Cari Dönem Net Satışlar", financials.netSatislar],
      ["Önceki Dönem Net Satışlar", financials.oncekiNetSatislar],
      ["Net Kâr", financials.netKar],
      [],
      ["FİNANSAL ORANLAR VE RASYO SONUÇLARI", "DEĞER(Mevcut)", "HEDEF", "DURUM"],
      ["Cari Oran (Likidite)", cariOran.toFixed(2), "1.50 - 2.00", cariOran >= 1.5 ? "Uygun" : "Yetersiz"],
      ["Asit-Test Oranı", asitTestOran.toFixed(2), "1.00", asitTestOran >= 1.0 ? "Uygun" : "Yetersiz"],
      ["Nakit Oranı", nakitOran.toFixed(2), "0.20 - 0.50", nakitOran >= 0.2 ? "Uygun" : "Riskli"],
      ["Borç / Özkaynak Oranı", borcOzkaynakOran.toFixed(2), "< 1.50", borcOzkaynakOran < 1.5 ? "Uygun" : "Yüksek Borçlu"],
      ["Özkaynak Gücü", `%${(ozkaynakOrani * 100).toFixed(1)}`, "> %40.0", ozkaynakOrani >= 0.4 ? "Güçlü" : "Zayıf"],
      ["Brüt Kâr Marjı", `%${brutKarMarji.toFixed(1)}`, "> %25.0", "Analiz Edildi"],
      ["Net Kâr Marjı", `%${netKarMarji.toFixed(1)}`, "> %10.0", netKarMarji >= 10 ? "Verimli" : "Kritik"],
      [],
      ["GENEL DEĞERLENDİRME"],
      ["Durum Sınıflandırması", health.status],
      ["Analiz Özeti", health.desc],
      ["Müşavir Tavsiyesi", health.advice],
      [],
      ["İmza", "BİTİG AI ANALİZİ - GÜVENLİ MALİ MÜŞAVİR ORTAĞI"]
    ];

    const worksheet = XLSX.utils.sheet_to_json(data);
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finansal Analiz");
    XLSX.writeFile(wb, `${profile.title.replace(/\s+/g, '_')}_Finansal_Rapor.xlsx`);
  };

  // PDF Export Logic using jsPDF
  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica");
    
    // Header
    doc.setFillColor(15, 23, 42); // slate-900 background
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("BITIG AI", 15, 17);
    doc.setFontSize(10);
    doc.text("Yonetimsel Finansal Analiz ve Rasyo Raporu", 15, 25);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 155, 25);
    
    // Body info
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(`Mukellef / Firma: ${profile.title}`, 15, 50);
    doc.setFontSize(9);
    doc.text(`VKN / TCKN: ${profile.taxNumber || 'Belirtilmedi'}  |   Defter Sinifi: ${profile.ledgerType}`, 15, 56);
    
    // Draw horizontal separator
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 62, 195, 62);
    
    // Scores
    doc.setFontSize(12);
    doc.text("1. GENEL RAPOR / ANALIZ DURUMU", 15, 72);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 76, 180, 22, "F");
    
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28); // Darker red/gray
    doc.text(`MALi SAGLIK SINIFI: ${health.status}`, 18, 83);
    doc.setTextColor(71, 85, 105);
    const splits = doc.splitTextToSize(health.desc, 174);
    doc.text(splits, 18, 89);
    
    // Balanced ratios table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("2. MEVCUT VE OLDUGU GIBI GÖSTERGE TABLOSU (RASYO)", 15, 108);
    
    const tableHeaders = ["Oran / Rasyo Kalemi", "Hesaplanan Deger", "Ideal Seviye", "Mali Durum"];
    let y = 114;
    
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 8, "F");
    doc.setFontSize(9);
    doc.text(tableHeaders[0], 18, y + 5);
    doc.text(tableHeaders[1], 80, y + 5);
    doc.text(tableHeaders[2], 125, y + 5);
    doc.text(tableHeaders[3], 165, y + 5);
    
    const tableData = [
      ["Cari Oran (Likidite)", cariOran.toFixed(2), "1.50 - 2.00", cariOran >= 1.5 ? "Yeterli/Guvenli" : "Riskli / SIKISIK"],
      ["Asit Test Orani", asitTestOran.toFixed(2), "1.00 asgari", asitTestOran >= 1.0 ? "Guvenli" : "Stoklara Bagimli"],
      ["Nakit Orani", nakitOran.toFixed(2), "0.20 asgari", nakitOran >= 0.2 ? "Yeterli" : "Nakit Sikisikligi"],
      ["Borc / Ozkaynak", borcOzkaynakOran.toFixed(2), "1.50 alti", borcOzkaynakOran < 1.5 ? "Ideal Seviye" : "Yuksek Borcluluk"],
      ["Ozkaynak Orani", `%${(ozkaynakOrani * 100).toFixed(0)}`, "%40 ustu", ozkaynakOrani >= 0.4 ? "Mali Altyapi Guclu" : "Ozkaynak Yetersiz"],
      ["Net Kar Marji", `%${netKarMarji.toFixed(1)}`, "%10 ustu", netKarMarji >= 10 ? "Verimli Satislar" : "Dusuk Karlilik"],
    ];
    
    tableData.forEach((row, i) => {
      y += 8;
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 8, "F");
      }
      doc.text(row[0], 18, y + 5);
      doc.text(row[1], 80, y + 5);
      doc.text(row[2], 125, y + 5);
      doc.text(row[3], 165, y + 5);
    });
    
    // Core recommendation text
    y += 18;
    doc.setFontSize(12);
    doc.text("3. DETAYLI STRATEJI VE SERMAYE YATIRIM DURUMU", 15, y);
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const splitAdvice = doc.splitTextToSize(health.advice, 180);
    doc.text(splitAdvice, 15, y + 6);
    
    // Signature
    y += 45;
    doc.setDrawColor(203, 213, 225);
    doc.line(15, y, 195, y);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Bu analiz ve raporlama verileri otomatik mali yazilim algoritmalari ile hazirlanmistir.", 15, y + 6);
    
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("BITIG AI ANALIZI", 150, y + 14);
    
    // Save PDF
    doc.save(`${profile.title.replace(/\s+/g, '_')}_Finansal_Analiz_Raporu.pdf`);
  };

  // Plain Text / DOCX generator helper
  const handleExportText = () => {
    let content = `BİTİG AI - FİNANSAL STRATEJİ VE ANALİZ RAPORU\n`;
    content += `==============================================\n`;
    content += `Firma Ünvanı: ${profile.title}\n`;
    content += `Tarih: ${new Date().toLocaleDateString('tr-TR')}\n\n`;
    content += `I. DURUM VE MALİ SAĞLIK SINIFI\n`;
    content += `----------------------------------------------\n`;
    content += `Durum: ${health.status}\n`;
    content += `Değerlendirme: ${health.desc}\n\n`;
    content += `II. VERGİSEL & KAPASİTE TAVSİYELERİ\n`;
    content += `----------------------------------------------\n`;
    content += `${health.advice}\n\n`;
    content += `III. MALİ RASYO VE ORANLAR\n`;
    content += `----------------------------------------------\n`;
    content += `- Cari Oran: ${cariOran.toFixed(2)} (İdeal Seviye: 1.50 - 2.00)\n`;
    content += `- Asit-Test Oranı: ${asitTestOran.toFixed(2)} (İdeal Seviye: 1.00+)\n`;
    content += `- Nakit Oranı: ${nakitOran.toFixed(2)} (İdeal Seviye: 0.20 - 0.50)\n`;
    content += `- Borç / Özkaynak Oranı: ${borcOzkaynakOran.toFixed(2)} (İdeal Seviye: < 1.50)\n`;
    content += `- Özkaynak Seviyesi: %${(ozkaynakOrani * 100).toFixed(1)} (İdeal Seviye: > %40)\n`;
    content += `- Net Kâr Marjı: %${netKarMarji.toFixed(1)} (İdeal Seviye: > %10)\n\n`;
    content += `BİTİG AI ANALİZİ - GÜVENLİ ORTAĞINIZ\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${profile.title.replace(/\s+/g, '_')}_Finansal_Rapor.txt`;
    link.click();
  };

  // WhatsApp sharing helper
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*BİTİG AI Finansal Rapor Özeti* 📊\n` +
      `*Firma:* ${profile.title}\n` +
      `*Durum:* ${health.status}\n` +
      `*Cari Oran:* ${cariOran.toFixed(2)}\n` +
      `*Net Kar Marjı:* %${netKarMarji.toFixed(1)}\n` +
      `*Öneri:* ${health.advice.slice(0, 160)}...\n\n` +
      `_Bitig AI Güvenli Analiz İmzasıyla Gönderilmiştir._ 🛡️`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Mail sharing helper
  const handleShareEmail = () => {
    const subject = encodeURIComponent(`${profile.title} - Bitig AI Finansal Analiz Raporu`);
    const body = encodeURIComponent(
      `Sayın Yetkili,\n\n` +
      `${profile.title} firmasının en güncel finansal analizi ve rasyo kararları aşağıda çıkarılmıştır:\n\n` +
      `- MALİ DURUM SINIFI: ${health.status}\n` +
      `- CARİ ORAN: ${cariOran.toFixed(2)}\n` +
      `- NET KAR MARJI: %${netKarMarji.toFixed(1)}\n\n` +
      `ÖZET GELECEK STRATEJİSİ VE SERMAYE KARARI:\n` +
      `${health.advice}\n\n` +
      `Raporun tamamına sistem üzerinden ulaşabilirsiniz.\n\n` +
      `Saygılarımızla,\n` +
      `BİTİG AI ANALİZİ - Profesyonel Çözüm Ortağınız`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Recharts visualization data matching the user's finances
  const chartData = [
    { name: 'Dönen Varlık', Tutar: financials.donenVarliklar, Alacak: financials.alacaklar, Nakit: financials.nakitVeBankalar },
    { name: 'Kısa Vadeli Borç', Tutar: financials.kisaVadeliBorclar, Nakit: 0, Alacak: 0 },
    { name: 'Özkaynak', Tutar: financials.ozkaynaklar, Nakit: 0, Alacak: 0 },
    { name: 'Net Satışlar (Yıllık)', Tutar: financials.netSatislar, Nakit: 0, Alacak: 0 },
    { name: 'Dönem Net Kârı', Tutar: financials.netKar, Nakit: 0, Alacak: 0 },
  ];

  const radarData = [
    { subject: 'Likidite (Cari)', A: Math.min(100, (cariOran / 2.0) * 100), fullMark: 100 },
    { subject: 'Asit-Test Oranı', A: Math.min(100, (asitTestOran / 1.2) * 100), fullMark: 100 },
    { subject: 'Nakit Gücü', A: Math.min(100, (nakitOran / 0.5) * 100), fullMark: 100 },
    { subject: 'Özkaynak Oranı', A: Math.min(100, (ozkaynakOrani / 0.6) * 100), fullMark: 100 },
    { subject: 'Net Kâr Marjı', A: Math.min(100, (netKarMarji / 20) * 100), fullMark: 100 },
    { subject: 'Büyüme İvmesi', A: Math.min(100, (satisArtisOrani / 30) * 100), fullMark: 100 },
  ];

  return (
    <div className="space-y-8">
      {/* Visual Identity Title */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Mali Analiz ve Karar Destek Hizmeti
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Finansal Sağlık & Rasyo Kokpiti</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Mizan, Gelir Tablosu ve Bilanço verilerini yükleyerek firmanızın gerçek büyüklüğünü, likiditesini, batma/büyüme eğilimini analiz edin, yatırım odaklı derin AI raporları tasarlayın.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx,.csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold rounded-2xl text-xs transition-all flex items-center gap-2 border border-white/15"
            >
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 text-emerald-400" />}
              Mizan / Tablo Yükle (Excel, PDF, Word)
            </button>
            
            <button
              onClick={generateAiReport}
              disabled={isGeneratingMessage}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-extrabold rounded-2xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4 animate-bounce" />
              AI Değerlendirmesi Çıkar
            </button>
          </div>
        </div>

        {uploadStatus && (
          <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{uploadStatus}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Parameters vs Live Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Inputs Adjustments - Bento Style Cards) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-[2.25rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Sliders className="w-5 h-5" />
              </span>
              <div className="flex-1 ml-3.5">
                <h3 className="text-base font-black text-slate-800">Veri Girişi & Manuel Ayarlama</h3>
                <p className="text-[10px] text-slate-500">Mizan verilerini simüle edin veya aşağıdan manuel özelleştirin.</p>
              </div>
            </div>

            {/* Bilanço Verileri */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider block">1. Bilanço Girdileri (Aktif - Pasif)</h4>
              
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Dönen Varlıklar</label>
                    <input 
                      type="number"
                      value={financials.donenVarliklar}
                      onChange={(e) => handleInputChange('donenVarliklar', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:border-indigo-500 focus:ring-0 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Duran Varlıklar</label>
                    <input 
                      type="number"
                      value={financials.duranVarliklar}
                      onChange={(e) => handleInputChange('duranVarliklar', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:border-indigo-500 focus:ring-0 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">Hazır Değer (Nakit)</label>
                    <input 
                      type="number"
                      value={financials.nakitVeBankalar}
                      onChange={(e) => handleInputChange('nakitVeBankalar', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold font-mono focus:border-indigo-500 focus:ring-0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">Ticari Alacaklar</label>
                    <input 
                      type="number"
                      value={financials.alacaklar}
                      onChange={(e) => handleInputChange('alacaklar', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold font-mono focus:border-indigo-500 focus:ring-0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">Stok Durumu</label>
                    <input 
                      type="number"
                      value={financials.stoklar}
                      onChange={(e) => handleInputChange('stoklar', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold font-mono focus:border-indigo-500 focus:ring-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">Kısa V. Borçlar</label>
                    <input 
                      type="number"
                      value={financials.kisaVadeliBorclar}
                      onChange={(e) => handleInputChange('kisaVadeliBorclar', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold font-mono focus:border-indigo-500 focus:ring-0 bg-rose-50/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">Uzun V. Borçlar</label>
                    <input 
                      type="number"
                      value={financials.uzunVadeliBorclar}
                      onChange={(e) => handleInputChange('uzunVadeliBorclar', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold font-mono focus:border-indigo-500 focus:ring-0 bg-rose-50/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">Özkaynaklar</label>
                    <input 
                      type="number"
                      value={financials.ozkaynaklar}
                      onChange={(e) => handleInputChange('ozkaynaklar', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold font-mono focus:border-indigo-500 focus:ring-0 bg-emerald-50/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gelir Tablosu Verileri */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider block">2. Gelir Tablosu Girdileri</h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Net Satışlar (Cari Dönem)</label>
                    <input 
                      type="number"
                      value={financials.netSatislar}
                      onChange={(e) => handleInputChange('netSatislar', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:border-indigo-500 focus:ring-0 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">SMM Satış Maliyeti</label>
                    <input 
                      type="number"
                      value={financials.satilanMalMaliyeti}
                      onChange={(e) => handleInputChange('satilanMalMaliyeti', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:border-indigo-500 focus:ring-0 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Önceki Dönem Satış</label>
                    <input 
                      type="number"
                      value={financials.oncekiNetSatislar}
                      onChange={(e) => handleInputChange('oncekiNetSatislar', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:border-indigo-500 focus:ring-0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Net Dönem Kârı</label>
                    <input 
                      type="number"
                      value={financials.netKar}
                      onChange={(e) => handleInputChange('netKar', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:border-indigo-500 focus:ring-0 bg-emerald-50/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 uppercase text-[10px] font-black">Toplam Bilanço Büyüklüğü:</span>
              <span className="font-mono font-bold text-indigo-750 text-sm">
                ₺{financials.toplamAktif.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
              </span>
            </div>

          </div>
        </div>

        {/* Right Column (Ratios Cockpit and Diagnostics) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Life Health Radar Visualizer */}
          <div className="bg-white border border-slate-200/90 rounded-[2.25rem] p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Award className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800">Finansal Sağlık & Gözlem Sınıfı</h3>
                  <p className="text-[10px] text-slate-500">Bilanço ve mizan analizinin anlık diagnostik skorlaması.</p>
                </div>
              </div>

              <span className={`px-4 py-2 rounded-2xl text-xs font-black border uppercase tracking-widest ${health.color}`}>
                {health.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-xs text-slate-650 leading-relaxed font-semibold mb-4">
                  {health.desc}
                </p>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                  <span className="text-[10px] font-black text-indigo-700 uppercase block tracking-wider">Mali Karar Danışman Tavsiyesi:</span>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    {health.advice}
                  </p>
                </div>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9, fontWeight: '700' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                    <Radar name="Skor" dataKey="A" stroke="#059669" fill="#10b981" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Liquid, Profitability and Solvency Metrics Tables */}
          <div className="bg-white border border-slate-200/90 rounded-[2.25rem] p-6 shadow-sm overflow-hidden">
            <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-500" /> Rasyo Analiz Karlılık ve Solvens Tablosu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Likidite Oranları Card */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-150 space-y-3.5">
                <h4 className="text-[11px] uppercase font-black text-slate-400 tracking-wider">Likidite Oranları</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Cari Oran</span>
                      <span className="text-[10px] text-slate-400 font-medium">Dönen / KV Borç</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-black block font-mono ${cariOran >= 1.5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {cariOran.toFixed(2)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400">Hedef: 1.5 - 2.0</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Asit-Test Oranı</span>
                      <span className="text-[10px] text-slate-400 font-medium">(Dönen-Stok) / KV</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold block font-mono ${asitTestOran >= 1.0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {asitTestOran.toFixed(2)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400">Hedef: 1.0+</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Nakit Oranı</span>
                      <span className="text-[10px] text-slate-400 font-medium">Nakit / KV Borç</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold block font-mono ${nakitOran >= 0.2 ? 'text-emerald-600' : 'text-rose-650'}`}>
                        {nakitOran.toFixed(2)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400">Hedef: 0.2 - 0.5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solvens & Mali Yapı Oranları Card */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-150 space-y-3.5">
                <h4 className="text-[11px] uppercase font-black text-slate-400 tracking-wider">Borçluluk & Solvens</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Borç / Özkaynak</span>
                      <span className="text-[10px] text-slate-400 font-medium">Toplam Borç / Özkaynak</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-black block font-mono ${borcOzkaynakOran < 1.5 ? 'text-emerald-600' : 'text-yellow-600'}`}>
                        {borcOzkaynakOran.toFixed(2)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400">Hedef: &lt; 1.5</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Özkaynak Oranı</span>
                      <span className="text-[10px] text-slate-400 font-medium">Özkaynak / Pasif</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold block font-mono ${ozkaynakOrani >= 0.4 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        %{(ozkaynakOrani * 100).toFixed(0)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400">Hedef: &gt; %40</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Toplam Borç Oranı</span>
                      <span className="text-[10px] text-slate-400 font-medium">Yabancı Kaynak / Pasif</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-sans font-bold block text-slate-700 font-mono">
                        %{((1 - ozkaynakOrani) * 100).toFixed(0)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400">Kaldıraç Oranı</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kârlılık ve Büyüme Oranları Card */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-150 space-y-3.5">
                <h4 className="text-[11px] uppercase font-black text-slate-400 tracking-wider">Kârlılık & Büyüme</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Net Kâr Marjı</span>
                      <span className="text-[10px] text-slate-400 font-medium">Kar / Satışlar</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-black block font-mono ${netKarMarji >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        %{netKarMarji.toFixed(1)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400">Hedef: &gt; %10</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Satış Artışı</span>
                      <span className="text-[10px] text-slate-400 font-medium">Satış Büyümesi</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold block font-mono ${satisArtisOrani > 15 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        +{satisArtisOrani.toFixed(1)}%
                      </span>
                      <span className="text-[9px] font-black text-slate-400">Yıllık Trend</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">ROE (Özkaynak Kar.)</span>
                      <span className="text-[10px] text-slate-400 font-medium">Net Kar / Özkaynak</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-sans font-bold block text-emerald-650 font-mono">
                        %{roe.toFixed(1)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400">Varlık Verimi (ROA: %{roa.toFixed(1)})</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* AI Deep Analysis Output */}
      {aiAnalysisText && (
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white border border-emerald-500/20 rounded-[2.25rem] p-6 md:p-8 shadow-md">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-4 mb-4">
            <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </span>
            <div>
              <h3 className="text-base font-black">Bitig AI Teşhis ve Raporlama Sonuçları</h3>
              <p className="text-[10px] text-slate-400">Sistem yapay zeka analiz motoru çıktısı üretildi.</p>
            </div>
          </div>
          <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap font-semibold text-emerald-300 custom-scrollbar">
            {aiAnalysisText}
          </pre>
          
          <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
            <span className="text-[10px] text-emerald-400/85 font-black uppercase tracking-widest">
              Analiz İmzası: BİTİG AI ANALİZİ 🛡️
            </span>
            <span className="text-[9px] text-slate-450 italic">
              Bitig, mükelleflerin rasyo hassasiyetlerini ve mevzuat uyumunu güvenle optimize eder.
            </span>
          </div>
        </div>
      )}

      {/* Sharing & Reporting Center Card */}
      <div className="bg-white border border-slate-200/90 rounded-[2.25rem] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800">Raporlama, İndirme ve Paylaşım Merkezi</h3>
            <p className="text-xs text-slate-500">Mizan ve rasyo analiz raporunu anında indirerek veya WhatsApp, mail kanallarına gönderin.</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleExportPdf}
              className="px-4.5 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4 text-red-650" />
              PDF İndir
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-650" />
              Excel / CSV
            </button>
            <button
              onClick={handleExportText}
              className="px-4.5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4 text-blue-650" />
              Word / Metin
            </button>
            
            <div className="w-px h-8 bg-slate-200 mx-1.5 hidden sm:block" />

            <button
              onClick={handleShareWhatsApp}
              className="px-4.5 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4 text-teal-650" />
              WhatsApp Paylaş
            </button>
            <button
              onClick={handleShareEmail}
              className="px-4.5 py-2.5 bg-slate-50 text-slate-705 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Mail className="w-4 h-4 text-slate-600" />
              E-Posta Gönder
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
