import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  Share2, 
  Download, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Globe, 
  MessageCircle,
  X,
  Layout,
  Maximize2,
  Copy,
  Sparkles,
  FileType,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Target,
  AlertTriangle,
  ArrowRightCircle,
  Briefcase,
  Zap,
  RefreshCw,
  Clipboard,
  HelpCircle,
  Award,
  ListOrdered,
  Calendar,
  Check,
  Flame,
  Maximize,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  TableProperties
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { analyzeDocumentForContent } from '../services/geminiService';
import { UserProfile } from '../types';

type ContentLayoutType = 'bento-board' | 'process-flow' | 'classic-banner';
type ThemeType = 'kilim' | 'indigo' | 'neon' | 'smarag' | 'sunset' | 'ocean';

interface AnalysisResult {
  hapNot: string[];
  ozet: string;
  onemliKavramlar: { kavram: string; aciklama: string }[];
  tarihler: { tarih: string; onem: string }[];
  sartlar: string[];
  surecAşamalari: { adim: number; baslik: string; aciklama: string }[];
  kazanimlar: string[];
  infografik: {
    baslik: string;
    kapsam: string[];
    avantajlar: string[];
    kritikSinirlar: string[];
    yapilmasiGerekenler: string[];
    gorselTema?: ThemeType;
  };
}

const THEMES: Record<ThemeType, any> = {
  kilim: {
    name: 'Anadolu Kilimi',
    bg: 'bg-[#FAF6F0]',
    canvasBg: '#FAF6F0',
    title: 'text-[#0D2D52]',
    primary: 'text-[#8B1A1A]',
    accentBg: 'bg-[#8B1A1A]/5',
    accentBorder: 'border-[#8B1A1A]/20',
    headerBg: 'bg-[#0D2D52]',
    headerText: 'text-white',
    badge: 'bg-[#8B1A1A] text-white',
    card: 'bg-white border border-[#EFEAE2]',
    text: 'text-slate-700',
    muted: 'text-slate-400',
    brandColor: '#8B1A1A',
    borderColor: '#EFEAE2'
  },
  indigo: {
    name: 'Mali Gece',
    bg: 'bg-slate-50',
    canvasBg: '#F8FAFC',
    title: 'text-[#1E1B4B]',
    primary: 'text-[#4338CA]',
    accentBg: 'bg-[#4338CA]/10',
    accentBorder: 'border-[#4338CA]/20',
    headerBg: 'bg-[#1E1B4B]',
    headerText: 'text-white',
    badge: 'bg-[#4338CA] text-white',
    card: 'bg-white border border-slate-200',
    text: 'text-slate-700',
    muted: 'text-slate-400',
    brandColor: '#4338CA',
    borderColor: '#E2E8F0'
  },
  neon: {
    name: 'Neon Tekno',
    bg: 'bg-zinc-950',
    canvasBg: '#09090B',
    title: 'text-[#A3E635]',
    primary: 'text-[#A3E635]',
    accentBg: 'bg-[#A3E635]/10',
    accentBorder: 'border-[#A3E635]/30',
    headerBg: 'bg-[#18181B]',
    headerText: 'text-[#A3E635]',
    badge: 'bg-[#A3E635] text-black',
    card: 'bg-zinc-900/60 border border-zinc-800',
    text: 'text-zinc-300',
    muted: 'text-zinc-500',
    brandColor: '#A3E635',
    borderColor: '#27272A'
  },
  smarag: {
    name: 'Zümrüt Yeşili',
    bg: 'bg-emerald-50/30',
    canvasBg: '#F0FDF4',
    title: 'text-[#064E3B]',
    primary: 'text-[#059669]',
    accentBg: 'bg-[#059669]/10',
    accentBorder: 'border-[#059669]/20',
    headerBg: 'bg-[#064E3B]',
    headerText: 'text-white',
    badge: 'bg-[#059669] text-white',
    card: 'bg-white border border-emerald-100',
    text: 'text-slate-700',
    muted: 'text-slate-500',
    brandColor: '#059669',
    borderColor: '#DCFCE7'
  },
  sunset: {
    name: 'Altın Günbatımı',
    bg: 'bg-orange-50/20',
    canvasBg: '#FFF7ED',
    title: 'text-[#7C2D12]',
    primary: 'text-[#EA580C]',
    accentBg: 'bg-[#EA580C]/10',
    accentBorder: 'border-[#EA580C]/20',
    headerBg: 'bg-[#7C2D12]',
    headerText: 'text-white',
    badge: 'bg-[#EA580C] text-white',
    card: 'bg-white border border-orange-100',
    text: 'text-slate-700',
    muted: 'text-slate-400',
    brandColor: '#EA580C',
    borderColor: '#FFEDD5'
  },
  ocean: {
    name: 'Turkuaz Dalga',
    bg: 'bg-[#F0F9FF]',
    canvasBg: '#F0F9FF',
    title: 'text-[#0C4A6E]',
    primary: 'text-[#0284C7]',
    accentBg: 'bg-[#0284C7]/10',
    accentBorder: 'border-[#0284C7]/20',
    headerBg: 'bg-[#0C4A6E]',
    headerText: 'text-white',
    badge: 'bg-[#0284C7] text-white',
    card: 'bg-white border border-sky-100',
    text: 'text-slate-700',
    muted: 'text-slate-400',
    brandColor: '#0284C7',
    borderColor: '#E0F2FE'
  }
};

export const ContentCreatorModule = ({ user }: { user: UserProfile | null }) => {
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Custom Visual State
  const [layoutStyle, setLayoutStyle] = useState<ContentLayoutType>('bento-board');
  const [activeThemeKey, setActiveThemeKey] = useState<ThemeType>('kilim');
  const [activeTableTab, setActiveTableTab] = useState<'all' | 'summary' | 'glossary' | 'timeline' | 'rules' | 'steps' | 'gains'>('all');
  
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg'>('png');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile metadata
  const profile = user || { fullName: "Hatice Erdal", username: "hatice", title: "Mali Müşavir" };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processSelectedFile(droppedFile);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const processSelectedFile = async (selectedFile: File) => {
    setFile(selectedFile);
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (fileType === 'csv' || fileType === 'txt') {
      setLoadingStep('Metin Dosyası Okunuyor...');
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        setManualText(text);
        setIsAnalyzing(false);
        await startAnalysis(undefined, text);
      };
      reader.readAsText(selectedFile);
    } else {
      await startAnalysis(selectedFile);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processSelectedFile(selectedFile);
    }
  };

  const handleClipboardPaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setManualText(clipboardText);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        alert("Pano boş veya izin verilmedi. Boş alana tıklayarak CTRL+V tuşuyla yapıştırabilirsiniz.");
      }
    } catch (err) {
      alert("Pano okuma izni alınamadı. Lütfen doğrudan klavyenizden CTRL+V ile yapıştırın.");
    }
  };

  const startAnalysis = async (selectedFile?: File, directText?: string) => {
    setAnalysisResult(null);
    setIsAnalyzing(true);
    setLoadingStep('Belge Okunuyor ve Ayıklanıyor...');
    
    try {
      setTimeout(() => setLoadingStep('Yapay Zeka Yapısal Analiz Başlatıyor... En Boy Rasyoları ve Tarihler Hesaplanıyor...'), 1500);
      setTimeout(() => setLoadingStep('Grafik Taslakları ve Özet Tablo Hücreleri Dolduruluyor...'), 3200);

      let result;
      const finalRawText = directText || manualText;

      if (selectedFile) {
        const base64 = await fileToBase64(selectedFile);
        result = await analyzeDocumentForContent(base64, selectedFile.type);
      } else {
        result = await analyzeDocumentForContent(undefined, undefined, finalRawText);
      }

      setAnalysisResult(result);
      if (result?.infografik?.gorselTema && THEMES[result.infografik.gorselTema as ThemeType]) {
        setActiveThemeKey(result.infografik.gorselTema as ThemeType);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Belge analiz edilirken bir hata oluştu. Lütfen kopyalama yöntemini veya PDF içeriğini kontrol edin.");
    } finally {
      setIsAnalyzing(false);
      setLoadingStep('');
    }
  };

  const highlightNumbers = (text: string) => {
    if (!text) return text;
    const regex = /(\d+[\d.,]*\s?(?:TL|%|€|\$|Adet|Gün|Ay|Yıl|Kişi|Kat)?)|(\d{2}[./]\d{2}[./]\d{4})/g;
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.match(regex)) {
        return <span key={i} className="text-kilim-red font-black font-mono underline decoration-dotted">{part}</span>;
      }
      return part;
    });
  };

  const handleShare = async (platform: string) => {
    if (!analysisResult) return;

    const signature = `\n\n*SMMM ${profile.fullName}*\n_BİTİG AI Akıllı Analiz Çıktısı_`;
    const text = activeTableTab === 'summary' 
      ? "📄 YÖNETİCİ ÖZETİ:\n" + analysisResult.ozet
      : `🎨 ${analysisResult.infografik.baslik}\n\nİçerik özeti, görsel infografik ve önemli şartlar sistemde oluşturulmuştur.`;
    
    const fullMessage = `${text}${signature}`;
    
    // Auto-download current display
    await handleDownloadPoster(showPosterModal ? 'poster-modal-content' : 'poster-preview', downloadFormat);
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
    } else if (platform === 'instagram') {
      alert("Afişiniz cihazınıza indirildi. Instagram'ı açarak galeriden bu görseli seçebilirsiniz.");
      window.open('https://www.instagram.com/', '_blank');
    } else if (platform === 'linkedin') {
      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
      window.open(shareUrl, '_blank');
    } else if (platform === 'twitter') {
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}`;
      window.open(tweetUrl, '_blank');
    } else {
      navigator.clipboard.writeText(fullMessage);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    
    setShowShareMenu(false);
  };

  const handleDownloadPoster = async (elementId: string = 'poster-preview', format: 'png' | 'jpeg' = 'png') => {
    const posterElement = document.getElementById(elementId);
    if (!posterElement) return;

    try {
      const canvas = await html2canvas(posterElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: THEMES[activeThemeKey].canvasBg,
        logging: false,
        width: posterElement.scrollWidth,
        height: posterElement.scrollHeight,
      });
      
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mimeType, 0.9);
      
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = dataUrl;
      link.download = `BITIG_INFOGRAFIK_${layoutStyle.toUpperCase()}.${format}`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    } catch (error) {
      console.error('Poster indirme hatası:', error);
      alert('İndirilirken bir hata oluştu. Tarayıcı izinlerini kontrol edin veya tam ekrandan indirin.');
    }
  };

  // Safe Fallback Helpers
  const getSafeData = () => {
    if (!analysisResult) return null;
    return {
      ozet: analysisResult.ozet || "İçerik özetlenemedi.",
      hapNot: analysisResult.hapNot || [],
      onemliKavramlar: analysisResult.onemliKavramlar || [
        { kavram: "Mevzuat Konusu", aciklama: "Eklenen belgenin içerdiği temel düzenleme ve kanun hükmü." }
      ],
      tarihler: analysisResult.tarihler || [],
      sartlar: analysisResult.sartlar || analysisResult.infografik?.kritikSinirlar || ["Gereklikler belirtilmemiştir."],
      surecAşamalari: analysisResult.surecAşamalari || [
        { adim: 1, baslik: "Uygulama", aciklama: "Düzenlemenin detaylarını gözden geçirin." }
      ],
      kazanimlar: analysisResult.kazanimlar || analysisResult.infografik?.avantajlar || ["Etkin bilgi edinme."]
    };
  };

  const safeData = getSafeData();

  // Color theme generator helper for infographic canvas elements
  const activeClr = THEMES[activeThemeKey];

  const renderActiveInfographicContent = () => {
    if (!analysisResult || !safeData) return null;

    if (layoutStyle === 'classic-banner') {
      return (
        <div className="h-full flex flex-col justify-between py-6 px-8 relative" style={{ color: activeClr.brandColor }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 shrink-0" style={{ borderColor: activeClr.borderColor }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-kilim-red" />
              <span className="text-[10px] font-black tracking-[0.25em] uppercase">BİTİG AI İNOGRAFİK</span>
            </div>
            <span className="text-[9px] font-mono opacity-60 uppercase">{new Date().toLocaleDateString('tr-TR')}</span>
          </div>

          {/* Main Title */}
          <div className="my-6">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight" style={{ color: activeClr.brandColor }}>
              {analysisResult.infografik?.baslik || "YASAL DÜZENLEME BİLME REHBERİ"}
            </h1>
            <div className="w-16 h-1 mt-2 rounded-full" style={{ backgroundColor: activeClr.brandColor }} />
          </div>

          {/* Dynamic Grid Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-auto pr-1">
            {/* Kapsam */}
            <div className={`p-4 rounded-2xl ${activeClr.card} space-y-2`}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> KAPSAM & ALAN
              </h3>
              <ul className="space-y-1.5">
                {(analysisResult.infografik?.kapsam || []).map((item, i) => (
                  <li key={i} className="text-xs font-bold leading-normal flex items-start gap-1.5 opacity-90">
                    <span className="mt-1">•</span>
                    <span>{highlightNumbers(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Avantajlar */}
            <div className={`p-4 rounded-2xl ${activeClr.card} space-y-2`}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> AVANTAJ & KAZANIM
              </h3>
              <ul className="space-y-1.5">
                {(analysisResult.infografik?.avantajlar || safeData.kazanimlar || []).map((item, i) => (
                  <li key={i} className="text-xs font-bold leading-normal flex items-start gap-1.5 text-emerald-800 opacity-95">
                    <span className="mt-1">✓</span>
                    <span>{highlightNumbers(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kritik Sınırlar */}
            <div className={`p-4 rounded-2xl ${activeClr.card} space-y-2`}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> ŞART VE LİMİTLER
              </h3>
              <ul className="space-y-1.5">
                {(analysisResult.infografik?.kritikSinirlar || safeData.sartlar || []).map((item, i) => (
                  <li key={i} className="text-xs font-bold leading-normal flex items-start gap-1.5 text-rose-800 opacity-95">
                    <span className="mt-1">!</span>
                    <span>{highlightNumbers(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Yapılması Gerekenler */}
            <div className={`p-4 rounded-2xl ${activeClr.card} space-y-2`}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <ArrowRightCircle className="w-4 h-4" /> AKSİYON PLANI
              </h3>
              <ul className="space-y-1.5">
                {(analysisResult.infografik?.yapilmasiGerekenler || []).map((item, i) => (
                  <li key={i} className="text-xs font-bold leading-normal flex items-start gap-1.5 opacity-90">
                    <span className="mt-1">→</span>
                    <span>{highlightNumbers(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="flex items-center justify-between border-t pt-4 mt-4 shrink-0" style={{ borderColor: activeClr.borderColor }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white" style={{ background: `linear-gradient(135deg, ${activeClr.brandColor}, #000)` }}>
                HE
              </div>
              <span className="text-[10px] font-bold">SM** Hatice ERDAL</span>
            </div>
            <span className="text-[9px] font-black tracking-widest italic opacity-70">BİTİG AI ANALİZİ</span>
          </div>
        </div>
      );
    }

    if (layoutStyle === 'process-flow') {
      return (
        <div className="h-full flex flex-col justify-between py-6 px-8 relative" style={{ color: activeClr.brandColor }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 shrink-0" style={{ borderColor: activeClr.borderColor }}>
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-kilim-red" />
              <span className="text-[10px] font-black tracking-[0.25em] uppercase">SÜREÇ VE İŞ AKIŞ ŞEMASI</span>
            </div>
            <span className="text-[9px] font-mono opacity-60 uppercase">OTOMATİK YOL HARİTASI</span>
          </div>

          {/* Title Area */}
          <div className="my-5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug" style={{ color: activeClr.brandColor }}>
              {analysisResult.infografik?.baslik || "İŞLEM SÜREÇ AŞAMALARI"}
            </h1>
            <p className="text-[10px] font-medium opacity-70 mt-1">Belge içeriğinden kurgulanan sıralı eylem ve uyum planı.</p>
          </div>

          {/* Pipeline */}
          <div className="flex-1 flex flex-col justify-center space-y-4 my-2 overflow-auto pr-1">
            {safeData.surecAşamalari.map((step, idx) => (
              <div key={idx} className="flex gap-4 items-start relative group">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white" style={{ backgroundColor: activeClr.brandColor }}>
                    {step.adim || idx + 1}
                  </div>
                  {idx !== safeData.surecAşamalari.length - 1 && (
                    <div className="w-0.5 h-12 border-dashed border-l-2 mt-1 opacity-45" style={{ borderColor: activeClr.brandColor }} />
                  )}
                </div>
                <div className={`flex-1 p-3.5 rounded-2xl ${activeClr.card}`}>
                  <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-2" style={{ color: activeClr.brandColor }}>
                    {step.baslik}
                  </h4>
                  <p className="text-[11px] font-bold opacity-80 mt-1 leading-normal">
                    {highlightNumbers(step.aciklama)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Process Footer */}
          <div className="flex items-center justify-between border-t pt-4 mt-3 shrink-0" style={{ borderColor: activeClr.borderColor }}>
            <span className="text-[9px] font-black uppercase">Etkin SMMM İş Süreç Yönetimi</span>
            <div className="text-right">
              <p className="text-[10px] font-black italic">Hatice ERDAL</p>
              <p className="text-[8px] font-black opacity-65">BİTİG AI SMMM ÇÖZÜMLERİ</p>
            </div>
          </div>
        </div>
      );
    }

    // Default: bento-board
    return (
      <div className="h-full flex flex-col justify-between p-6 relative" style={{ color: activeClr.brandColor }}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] font-black tracking-widest uppercase">BENTO ANALİZ MATRİSİ</span>
          </div>
          <span className="text-[8px] font-bold opacity-60">{new Date().toLocaleDateString('tr-TR')}</span>
        </div>

        {/* Bento Content Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-auto pr-1">
          {/* Header & Executive Summary Block (Spans 2 columns) */}
          <div className={`md:col-span-2 p-5 rounded-2.5xl ${activeClr.card} flex flex-col justify-between space-y-3 shadow-sm`}>
            <div>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: `${activeClr.brandColor}1A` }}>
                Erişilebilir Mali Bilgi
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight mt-2" style={{ color: activeClr.brandColor }}>
                {analysisResult.infografik?.baslik || "Yasa Değişikliği ve Uyumluluk"}
              </h2>
            </div>
            <p className="text-[11px] font-semibold italic leading-relaxed opacity-90 border-l-2 pl-3" style={{ borderColor: activeClr.brandColor }}>
              "{safeData.ozet.slice(0, 190)}..."
            </p>
          </div>

          {/* Quick Dates Box */}
          <div className={`p-4 rounded-2.5xl bg-gradient-to-br from-indigo-50/10 to-indigo-950/5 border border-indigo-200/20 text-indigo-900 flex flex-col justify-between`}>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
                <Calendar className="w-3.5 h-3.5" /> KRİTİK TARİHLER
              </h4>
              <div className="space-y-2 mt-3 max-h-[140px] overflow-auto">
                {safeData.tarihler.length > 0 ? (
                  safeData.tarihler.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="text-left">
                      <p className="text-xs font-black text-indigo-800">{item.tarih}</p>
                      <p className="text-[10px] font-bold text-indigo-600/80 leading-tight">{item.onem}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-semibold text-slate-400">Belgede belirli bir tarih bulunamadı, genel hükümler geçerlidir.</p>
                )}
              </div>
            </div>
            <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest pt-2">Zamanlılık Raporu</div>
          </div>

          {/* Conditions Columns */}
          <div className={`p-4 rounded-2.5xl ${activeClr.card} space-y-2`}>
            <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" /> ŞARTLAR & LİMİTLER
            </h4>
            <div className="space-y-1.5 max-h-[180px] overflow-auto">
              {safeData.sartlar.slice(0, 4).map((cond, i) => (
                <p key={i} className="text-[11px] font-semibold leading-snug text-rose-950">
                  • {highlightNumbers(cond)}
                </p>
              ))}
            </div>
          </div>

          {/* Gains Columns */}
          <div className={`p-4 rounded-2.5xl ${activeClr.card} space-y-2`}>
            <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
              <Award className="w-3.5 h-3.5" /> KAZANDIRAN HAKLAR
            </h4>
            <div className="space-y-1.5 max-h-[180px] overflow-auto">
              {safeData.kazanimlar.slice(0, 4).map((gain, i) => (
                <p key={i} className="text-[11px] font-bold leading-snug text-slate-600">
                  <span className="text-emerald-500 mr-1">✓</span> {highlightNumbers(gain)}
                </p>
              ))}
            </div>
          </div>

          {/* Steps Columns */}
          <div className={`p-4 rounded-2.5xl ${activeClr.card} space-y-2`}>
            <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5" /> AKSİYON ADIMLARI
            </h4>
            <div className="space-y-1.5 max-h-[180px] overflow-auto">
              {(analysisResult.infografik?.yapilmasiGerekenler || []).slice(0, 4).map((act, i) => (
                <p key={i} className="text-[11px] font-semibold leading-snug text-slate-700">
                  <span className="font-mono text-[10px] font-black text-slate-400">0{i+1}.</span> {highlightNumbers(act)}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Brand strip */}
        <div className="flex items-center justify-between border-t border-slate-100/50 pt-3 mt-4 shrink-0">
          <span className="text-[9px] font-bold opacity-60 uppercase">BİTİG AI SMMM Ortaklığı</span>
          <span className="text-[10px] font-black tracking-tight italic" style={{ color: activeClr.brandColor }}>Hatice Erdal • Mali Müşavir</span>
        </div>
      </div>
    );
  };

  const renderSummaryTable = () => {
    if (!analysisResult || !safeData) return null;

    const sections = {
      summary: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="w-2 h-2 rounded-full bg-[#1B4F8A]"></span>
            <h4 className="text-sm font-black text-kilim-blue-dark">YÖNETİCİ VE MEVZUAT ÖZETİ</h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium bg-amber-50/40 p-4 rounded-2xl border border-amber-200/50 italic">
            "{safeData.ozet}"
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {safeData.hapNot.map((note, idx) => (
              <div key={idx} className="p-3.5 bg-white border border-slate-100 rounded-2xl flex items-start gap-2.5">
                <div className="mt-1 w-2 h-2 rounded-full bg-kilim-red shrink-0" />
                <p className="text-xs font-bold text-slate-600 leading-relaxed">{note}</p>
              </div>
            ))}
          </div>
        </div>
      ),
      glossary: (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-600"></span>
              <h4 className="text-sm font-black text-slate-800">ÖNEMLİ KAVRAMLAR SÖZLÜĞÜ</h4>
            </div>
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded">Mali Terminoloji</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {safeData.onemliKavramlar.map((gloss, idx) => (
              <div key={idx} className="p-4 bg-violet-50/20 border border-violet-100 rounded-2xl space-y-1">
                <span className="text-xs font-black text-violet-850 uppercase tracking-tight block">
                  {gloss.kavram}
                </span>
                <p className="text-xs text-slate-600 leading-normal font-semibold">
                  {gloss.aciklama}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
      timeline: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <h4 className="text-sm font-black text-slate-800">KRİTİK TARİHLER & GEÇERLİLİK TAKVİMİ</h4>
          </div>
          {safeData.tarihler.length > 0 ? (
            <div className="space-y-3">
              {safeData.tarihler.map((time, idx) => (
                <div key={idx} className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-black text-indigo-900">{time.tarih}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 text-left sm:text-right">{time.onem}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 font-semibold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Belge içeriğinde spesifik/belirli bir işlem tarihi veya süre barajı bulunmamaktadır.
            </div>
          )}
        </div>
      ),
      rules: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            <h4 className="text-sm font-black text-slate-800">UYULMASI ZORUNLU KANUNİ ŞARTLAR & LİMİTLER</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {safeData.sartlar.map((rule, idx) => (
              <div key={idx} className="p-4 bg-rose-50/20 border border-rose-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <h5 className="text-xs font-black text-rose-950 uppercase tracking-tight">Kural / Sınır #{idx+1}</h5>
                  <p className="text-xs text-slate-755 font-bold leading-relaxed mt-1">{highlightNumbers(rule)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      steps: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="w-2 h-2 rounded-full bg-slate-800"></span>
            <h4 className="text-sm font-black text-slate-800">ATILACAK PRATİK ADIMLAR & UYGULAMA PLANI</h4>
          </div>
          <div className="space-y-3">
            {safeData.surecAşamalari.map((step, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs shrink-0">
                  {step.adim || idx+1}
                </div>
                <div>
                  <h5 className="text-sm font-black text-slate-850 uppercase">{step.baslik}</h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold mt-1">{highlightNumbers(step.aciklama)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      gains: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <h4 className="text-sm font-black text-slate-800">SAĞLANACAK MADDİ & İDARİ KAZANIMLAR</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {safeData.kazanimlar.map((gain, idx) => (
              <div key={idx} className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <Award className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-950 font-bold leading-normal">{highlightNumbers(gain)}</p>
              </div>
            ))}
          </div>
        </div>
      )
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <TableProperties className="w-5 h-5 text-kilim-blue" />
          <h3 className="text-lg font-black text-kilim-blue-dark">1. ÖZET BİLGİ TABLO RAPORU</h3>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-200">
          {[
            { id: 'all', label: 'TÜMÜ' },
            { id: 'summary', label: 'Özet' },
            { id: 'glossary', label: 'Sözlük' },
            { id: 'timeline', label: 'Tarihler' },
            { id: 'rules', label: 'Kurallar' },
            { id: 'steps', label: 'Aksiyom' },
            { id: 'gains', label: 'Kazanım' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTableTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTableTab === tab.id 
                  ? 'bg-kilim-blue text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Render Area */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[300px]">
          {activeTableTab === 'all' ? (
            <div className="space-y-10 divide-y divide-slate-100">
              {sections.summary}
              <div className="pt-8">{sections.glossary}</div>
              <div className="pt-8">{sections.timeline}</div>
              <div className="pt-8">{sections.rules}</div>
              <div className="pt-8">{sections.steps}</div>
              <div className="pt-8">{sections.gains}</div>
            </div>
          ) : (
            sections[activeTableTab]
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8 pb-20">
      {/* Banner / Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-kilim-blue-dark tracking-tighter">
          Yapay Zeka <span className="text-kilim-red">İçerik Üretici & İnfografik</span> Paneli
        </h2>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto text-sm">
          Firma tebliğleri, resmi genelgeler, nakit tabloları, PDF, Word, Excel, JPG veya CSV gibi mali dökümanları yükleyin ya da kopyalayın. Saniyeler içinde özet tabloya ve profesyonel bir görsel infografiğe dönüştürün!
        </p>
      </div>

      {!analysisResult && !isAnalyzing ? (
        <div className="w-full space-y-6 max-w-4xl mx-auto">
          {/* Unified Modern Input Area */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative transition-all duration-300 group
              bg-[#FAF6F0] border-2 border-dashed rounded-[3rem] p-10 text-center
              ${isDragging ? 'border-kilim-blue bg-kilim-blue/5 scale-[1.01]' : 'border-kilim-blue/25 hover:border-kilim-blue/50 hover:bg-[#FAF6F0]/80'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png"
            />
            
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm cursor-pointer hover:scale-105 transition-transform duration-300"
              >
                <Upload className="w-7 h-7 text-kilim-blue" />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-kilim-blue-dark">Belge Sürükle veya Dosya Seç</h3>
                  <p className="text-[10px] font-black text-[#A89080] uppercase tracking-[0.2em] flex items-center justify-center gap-1">
                    PDF • WORD • EXCEL • CSV • TXT • JPG • JPEG • PNG
                  </p>
                </div>

                <div className="relative max-w-2xl mx-auto">
                  <textarea 
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Veyahut kopyaladığınız uzun tebliğ, sirküler ve mevzuat metnini doğrudan buraya yapıştırın (CTRL+V)..."
                    className="w-full min-h-[160px] p-5 bg-white border border-slate-200 rounded-2xl focus:border-kilim-blue focus:ring-0 transition-all font-semibold text-slate-800 placeholder-[#A89080]/50 text-center text-sm"
                  />
                  
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClipboardPaste}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-kilim-blue-dark font-black rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 shadow-sm transition-all"
                      title="Sistem panosundaki metni yapıştırır"
                    >
                      <Clipboard className="w-3.5 h-3.5" /> Metni Yapıştır
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {file && (
              <div className="absolute top-6 right-6 flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                {file.name}
              </div>
            )}
          </motion.div>

          <button 
            onClick={() => startAnalysis()}
            disabled={!manualText.trim() && !file}
            className="w-full py-5 bg-kilim-blue text-white font-black rounded-2.5xl shadow-xl shadow-kilim-blue/15 hover:bg-kilim-blue-dark transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-lg"
          >
            <Sparkles className="w-5 h-5 text-kilim-red" />
            İÇERİĞİ ANALİZ ET VE MODELLE
          </button>

          {/* Guidelines info card to ensure they know they can paste from word/excel */}
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/50 flex gap-3 text-left">
            <HelpCircle className="w-5 h-5 text-[#8B1A1A] shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-slate-600 leading-normal">
              <strong className="text-[#8B1A1A]">Püf Noktası:</strong> Word & Excel dökümanlarınızın içindeki karmaşık tabloları ve yazıları <strong className="text-indigo-800">Copy + Paste (Metin Yapıştırma)</strong> yöntemiyle yukarıdaki geniş alana aktararak inanılmaz başarılı ve yapısal rasyoları tam olan infografikler üretebilirsiniz!
            </p>
          </div>
        </div>
      ) : isAnalyzing ? (
        <div className="py-20 text-center space-y-10 max-w-md mx-auto">
          <div className="relative w-36 h-36 mx-auto">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-[5px] border-kilim-blue/5 border-t-kilim-blue border-r-kilim-red rounded-full shadow-xl"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-5 border-[5px] border-kilim-red/5 border-t-kilim-red rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-kilim-red animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-kilim-blue-dark">{loadingStep || 'AI Analiz Ediyor...'}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Özet Tablo ve Grafik Tasarımı İşleniyor...</p>
          </div>
        </div>
      ) : (
        /* Results View */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left"
        >
          {/* LEFT: Özet Bilgi Tablosu (Spans 7 columns on large screens) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => {
                  setFile(null);
                  setAnalysisResult(null);
                  setManualText('');
                }}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:border-kilim-red hover:text-kilim-red text-slate-500 font-black rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" /> YENİ BELGE YÜKLE
              </button>

              <div className="font-bold text-xs text-slate-400 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-500" /> Yapılandırılmış Çıktı Hazır
              </div>
            </div>

            {renderSummaryTable()}
          </div>

          {/* RIGHT: Visual Infographic Canvas (Spans 5 columns on large screens) */}
          <div className="lg:col-span-5 space-y-6 sticky top-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-kilim-red" />
              <h3 className="text-lg font-black text-kilim-blue-dark">2. ÖZELLEŞTİRİLEBİLİR İNOGRAFİK</h3>
            </div>

            {/* Visual Customization Tools */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              {/* Layout Switcher */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Afiş Şablon Biçimi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bento-board', label: 'Bento Grid', icon: Layout },
                    { id: 'process-flow', label: 'Yol Haritası', icon: ListOrdered },
                    { id: 'classic-banner', label: 'Klasik Afiş', icon: ImageIcon }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setLayoutStyle(style.id as ContentLayoutType)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[10px] font-black gap-1 transition-all ${
                        layoutStyle === style.id 
                          ? 'border-kilim-blue bg-kilim-blue/5 text-kilim-blue-dark' 
                          : 'border-slate-100 hover:border-slate-200 text-slate-400'
                      }`}
                    >
                      <style.icon className="w-4 h-4" />
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renklendirme & Stil Paleti</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(THEMES) as ThemeType[]).map(themeKey => (
                    <button
                      key={themeKey}
                      onClick={() => setActiveThemeKey(themeKey)}
                      className={`py-2 px-1.5 rounded-xl border text-[9px] font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                        activeThemeKey === themeKey 
                          ? 'border-slate-900 bg-slate-950 text-white shadow-sm' 
                          : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-slate-50/50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: THEMES[themeKey].brandColor }} />
                      <span className="truncate">{THEMES[themeKey].name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Downloads Row */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <div className="flex items-center gap-1.5 p-0.5 bg-slate-50 rounded-xl">
                  <button 
                    onClick={() => setDownloadFormat('png')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${downloadFormat === 'png' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    PNG
                  </button>
                  <button 
                    onClick={() => setDownloadFormat('jpeg')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${downloadFormat === 'jpeg' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    JPEG
                  </button>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsFullScreen(true)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
                    title="Afiş Tam Ekran"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => handleDownloadPoster('poster-preview', downloadFormat)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/10"
                  >
                    <Download className="w-4 h-4" /> İndir ({downloadFormat.toUpperCase()})
                  </button>
                </div>
              </div>
            </div>

            {/* Infographic Frame Block */}
            <div className="relative group">
              <div 
                id="poster-preview"
                className="rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 w-full aspect-square border-2"
                style={{ 
                  backgroundColor: activeClr.canvasBg, 
                  borderColor: `${activeClr.brandColor}1C`,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' 
                }}
              >
                {renderActiveInfographicContent()}
              </div>

              {/* Action buttons inside interactive block */}
              <div className="mt-4 flex items-center justify-center">
                <button 
                  onClick={() => setShowShareMenu(true)}
                  className="flex items-center gap-2 px-10 py-4 bg-kilim-red text-white font-black rounded-2xl shadow-xl shadow-kilim-red/15 hover:bg-kilim-red-light transition-all active:scale-95 text-sm"
                >
                  <Share2 className="w-5 h-5" /> SOSYAL MEDYADA PAYLAŞ
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Share POP-UP */}
      <AnimatePresence>
        {showShareMenu && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareMenu(false)}
              className="absolute inset-0 bg-kilim-blue-dark/50 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="space-y-6 text-center">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-lg font-black text-kilim-blue-dark">Görsel Paylaşım Ağı</h3>
                  <button onClick={() => setShowShareMenu(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleShare('whatsapp')}
                    className="flex flex-col items-center gap-2 p-3.5 bg-emerald-50 rounded-2xl hover:bg-emerald-100/80 transition-all text-xs font-bold text-emerald-800"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-600" /> WhatsApp
                  </button>
                  <button 
                    onClick={() => handleShare('instagram')}
                    className="flex flex-col items-center gap-2 p-3.5 bg-rose-50 rounded-2xl hover:bg-rose-100/80 transition-all text-xs font-bold text-rose-800"
                  >
                    <Instagram className="w-5 h-5 text-rose-600" /> Instagram
                  </button>
                  <button 
                    onClick={() => handleShare('linkedin')}
                    className="flex flex-col items-center gap-2 p-3.5 bg-indigo-50 rounded-2xl hover:bg-indigo-100/80 transition-all text-xs font-bold text-indigo-800"
                  >
                    <Linkedin className="w-5 h-5 text-indigo-600" /> LinkedIn
                  </button>
                  <button 
                    onClick={() => handleShare('twitter')}
                    className="flex flex-col items-center gap-2 p-3.5 bg-slate-50 rounded-2xl hover:bg-slate-100/80 transition-all text-xs font-bold text-slate-800"
                  >
                    <Twitter className="w-5 h-5 text-slate-700" /> Twitter (X)
                  </button>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Marka İmzası Dahil Edildi</p>
                  <p className="text-xs font-bold text-kilim-blue mt-0.5">SMMM {profile.fullName}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN DYNAMIC INFOGRAPHIC PREVIEW */}
      <AnimatePresence>
        {isFullScreen && (
          <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-xl aspect-square rounded-3xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: activeClr.canvasBg }}
            >
              <button 
                onClick={() => setIsFullScreen(false)}
                className="absolute top-4 right-4 z-50 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div id="poster-modal-content" className="w-full h-full">
                {renderActiveInfographicContent()}
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                <button 
                  onClick={() => handleDownloadPoster('poster-modal-content', downloadFormat)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xl flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> YÜKSEK ÇÖZÜNÜRLÜKTE İNDİR ({downloadFormat.toUpperCase()})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
