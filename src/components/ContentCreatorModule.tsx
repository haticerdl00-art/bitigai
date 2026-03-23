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
  CheckCircle2,
  X,
  Layout,
  Maximize2,
  Copy,
  Sparkles,
  FileType,
  AlertCircle,
  CheckCircle,
  Wallet,
  ShieldCheck,
  Target,
  AlertTriangle,
  ArrowRightCircle,
  Briefcase,
  Zap,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { analyzeDocumentForContent } from '../services/geminiService';

type ContentType = 'hap-not' | 'ozet' | 'afis';
type FormatType = 'square' | 'horizontal';

interface AnalysisResult {
  hapNot: string[];
  ozet: string;
  infografik: {
    baslik: string;
    kapsam: string[];
    avantajlar: string[];
    kritikSinirlar: string[];
    yapilmasiGerekenler: string[];
  };
}

export const ContentCreatorModule = () => {
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeType, setActiveType] = useState<ContentType>('afis');
  const [activeFormat, setActiveFormat] = useState<FormatType>('square');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setFile(droppedFile);
      setManualText(droppedFile.name);
      await startAnalysis(droppedFile);
    }
  };

  // Profile integration
  const profile = JSON.parse(localStorage.getItem('user_profile_v2') || '{"fullName": "Hatice Erdal", "username": "Mali Müşavir"}');

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setManualText(selectedFile.name); // Show file name in text area
      await startAnalysis(selectedFile);
    }
  };

  const startAnalysis = async (selectedFile?: File) => {
    setAnalysisResult(null);
    setIsAnalyzing(true);
    setLoadingStep('Belge Okunuyor...');
    
    try {
      setTimeout(() => setLoadingStep('Veriler Analiz Ediliyor...'), 1500);
      setTimeout(() => setLoadingStep('İçerik Tasarlanıyor...'), 3000);

      let result;
      if (selectedFile) {
        const base64 = await fileToBase64(selectedFile);
        result = await analyzeDocumentForContent(base64, selectedFile.type);
      } else {
        result = await analyzeDocumentForContent(undefined, undefined, manualText);
      }
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Analiz edilirken bir hata oluştu.");
    } finally {
      setIsAnalyzing(false);
      setLoadingStep('');
    }
  };

  const handleShare = async (platform: string) => {
    if (!analysisResult) return;

    const signature = `\n\n*SMMM Hatice ERDAL*\n_BİTİG AI Analizidir_`;
    
    // Always download first as per user request
    await handleDownloadPoster(showPosterModal ? 'poster-modal-content' : 'poster-preview');
    
    alert('Afişiniz cihazınıza başarıyla indirildi. Şimdi WhatsApp\'ı açıp galeriden bu görseli seçerek paylaşabilirsiniz.');

    if (platform === 'whatsapp') {
      const text = activeType === 'hap-not' 
        ? "📌 HAP NOTLAR:\n" + analysisResult.hapNot.join('\n') 
        : activeType === 'ozet' 
          ? "📄 YÖNETİCİ ÖZETİ:\n" + analysisResult.ozet 
          : `🎨 ${analysisResult.infografik.baslik}`;
      
      const waMessage = `${text}${signature}\n\n(Lütfen az önce indirilen görseli galerinizden seçerek paylaşın)`;
      window.open(`https://wa.me/?text=${encodeURIComponent(waMessage)}`, '_blank');
    }
    
    setShowShareMenu(false);
  };

  const handleDownloadPoster = async (elementId: string = 'poster-preview') => {
    if (typeof html2canvas === 'undefined') {
      alert('Görsel oluşturma modülü yükleniyor, lütfen tekrar deneyin');
      return;
    }

    const posterElement = document.getElementById(elementId);
    if (!posterElement) return;

    try {
      const canvas = await html2canvas(posterElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF6F0',
        logging: false,
        width: posterElement.scrollWidth,
        height: posterElement.scrollHeight,
        windowWidth: posterElement.scrollWidth,
        windowHeight: posterElement.scrollHeight,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById(elementId);
          if (el) {
            el.style.borderRadius = '0';
            
            // Fix oklch colors for html2canvas compatibility
            const allElements = el.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const element = allElements[i] as HTMLElement;
              const style = window.getComputedStyle(element);
              
              // Helper to convert oklch to rgb if needed
              // Since we can't easily parse oklch in JS without a library,
              // we'll just force important elements to have explicit hex/rgb styles
              // if they are known to use Tailwind's default palette.
              
              // A more generic approach: if the computed style contains "oklch", 
              // we try to set it to something safe or just let the browser handle the conversion
              // by setting the style property directly (which often forces a conversion in the computed style)
              
              const properties = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'columnRuleColor', 'textDecorationColor'];
              properties.forEach(prop => {
                const value = (style as any)[prop];
                if (value && value.includes('oklch')) {
                  // If it's oklch, we try to set it to a safe fallback or just use the current value
                  // but forced to a standard format if possible.
                  // Actually, setting it to itself sometimes forces the browser to resolve it to RGB in the clone.
                  element.style[prop as any] = value;
                }
              });
            }
          }
        }
      });
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      
      // Create hidden link for forced download
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = dataUrl;
      link.download = 'BITIG_AFIS.png';
      document.body.appendChild(link);
      
      try {
        link.click();
        // Small delay before removing
        setTimeout(() => document.body.removeChild(link), 100);
      } catch (clickError) {
        // Fallback: Open in new tab if blocked
        console.warn('Download blocked, opening in new tab');
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`
            <html>
              <body style="margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#1a1a1a; color:white; font-family:sans-serif;">
                <p style="margin:20px; font-weight:bold;">Afiş Hazır! Görsele sağ tıklayıp "Resmi Farklı Kaydet" diyerek indirebilirsiniz.</p>
                <img src="${dataUrl}" style="max-width:90%; max-height:80vh; box-shadow:0 20px 50px rgba(0,0,0,0.5); border-radius:10px;" />
                <button onclick="window.close()" style="margin-top:30px; padding:12px 24px; background:#B22222; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Kapat</button>
              </body>
            </html>
          `);
        } else {
          alert('İndirme engellendi. Lütfen pop-up engelleyicinizi kontrol edin veya görseli sağ tıklayıp kaydedin.');
        }
      }
    } catch (error) {
      console.error('Poster indirme hatası:', error);
      alert('Poster indirilirken bir hata oluştu.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const highlightImportant = (text: string) => {
    if (!text) return text;
    const regex = /(\d+[\d.,]*\s?(?:TL|%|€|\$|Adet|Gün|Ay|Yıl)?)|(\d{2}[./]\d{2}[./]\d{4})/g;
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.match(regex)) {
        return <span key={i} className="text-[#8B1A1A] font-black font-serif">{part}</span>;
      }
      return part;
    });
  };
  const renderPosterContent = (isModal: boolean = false) => {
    if (!analysisResult) return null;
    const id = isModal ? 'poster-modal-content' : 'poster-preview';
    
    return (
      <div 
        id={id}
        className={`bg-[#FAF6F0] font-boho h-full flex flex-col relative overflow-hidden ${isModal ? 'w-[1080px] h-[1080px]' : ''}`}
        style={isModal ? { width: activeFormat === 'square' ? '1080px' : '1920px', height: activeFormat === 'square' ? '1080px' : '1080px' } : {}}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(27,79,138,0.05)] rounded-bl-[100px] -z-0" />
        <div className="absolute bottom-20 left-0 w-24 h-24 bg-[rgba(139,26,26,0.05)] rounded-tr-[80px] -z-0" />

        {/* Header Strip */}
        <div className="bg-[#0D2D52] py-5 px-10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-[#B22222]" />
            </div>
            <span className="text-[11px] font-black text-[rgba(255,255,255,0.9)] uppercase tracking-[0.4em]">BİTİG AI ANALİZİ</span>
          </div>
          <div className="text-[9px] font-bold text-[rgba(255,255,255,0.4)] tracking-widest uppercase">
            {new Date().toLocaleDateString('tr-TR')}
          </div>
        </div>

        <div className="flex-1 p-10 flex flex-col justify-center relative z-10">
          <div className="mb-10">
            <h3 className="text-4xl font-black text-[#0D2D52] leading-[1.1] tracking-tighter max-w-[90%]">
              {analysisResult.infografik.baslik}
            </h3>
            <div className="w-20 h-1.5 bg-[#8B1A1A] mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[rgba(255,255,255,0.6)] backdrop-blur-sm p-5 rounded-3xl border border-white space-y-3" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[rgba(27,79,138,0.1)] rounded-xl">
                  <Briefcase className="w-4 h-4 text-[#1B4F8A]" />
                </div>
                <span className="text-[11px] font-black text-[#0D2D52] uppercase tracking-widest">KAPSAM</span>
              </div>
              <ul className="space-y-2">
                {analysisResult.infografik.kapsam.map((item, i) => (
                  <li key={i} className="text-[12px] font-bold text-[#475569] leading-snug flex gap-2">
                    <span className="text-[#1B4F8A]">•</span>
                    <span>{highlightImportant(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[rgba(255,255,255,0.6)] backdrop-blur-sm p-5 rounded-3xl border border-white space-y-3" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#ecfdf5] rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                </div>
                <span className="text-[11px] font-black text-[#047857] uppercase tracking-widest">AVANTAJLAR</span>
              </div>
              <ul className="space-y-2">
                {analysisResult.infografik.avantajlar.map((item, i) => (
                  <li key={i} className="text-[12px] font-bold text-[#475569] leading-snug flex gap-2">
                    <span className="text-[#10b981]">•</span>
                    <span>{highlightImportant(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[rgba(255,255,255,0.6)] backdrop-blur-sm p-5 rounded-3xl border border-white space-y-3" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[rgba(139,26,26,0.1)] rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-[#8B1A1A]" />
                </div>
                <span className="text-[11px] font-black text-[#8B1A1A] uppercase tracking-widest">KRİTİK SINIRLAR</span>
              </div>
              <ul className="space-y-2">
                {analysisResult.infografik.kritikSinirlar.map((item, i) => (
                  <li key={i} className="text-[12px] font-black text-[#8B1A1A] leading-snug flex gap-2">
                    <span className="text-[rgba(139,26,26,0.5)]">•</span>
                    <span>{highlightImportant(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[rgba(255,255,255,0.6)] backdrop-blur-sm p-5 rounded-3xl border border-white space-y-3" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[rgba(27,79,138,0.1)] rounded-xl">
                  <ArrowRightCircle className="w-4 h-4 text-[#1B4F8A]" />
                </div>
                <span className="text-[11px] font-black text-[#0D2D52] uppercase tracking-widest">ADIMLAR</span>
              </div>
              <ul className="space-y-2">
                {analysisResult.infografik.yapilmasiGerekenler.map((item, i) => (
                  <li key={i} className="text-[12px] font-bold text-[#475569] leading-snug flex gap-2">
                    <span className="text-[#1B4F8A]">•</span>
                    <span>{highlightImportant(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Signature Strip */}
        <div className="bg-white border-t border-[#f1f5f9] py-6 px-10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0D2D52] rounded-xl flex items-center justify-center" style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#0D2D52] tracking-widest leading-none">BİTİG AI</span>
              <span className="text-[7px] font-bold text-[#94a3b8] uppercase tracking-tighter mt-1">Geleceğin Mali Müşaviri</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[12px] font-black text-[#0D2D52] leading-tight italic">* SMMM Hatice ERDAL</p>
              <p className="text-[9px] font-black text-[#8B1A1A] uppercase tracking-widest italic">* BİTİG AI Analizidir</p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm" style={{ background: 'linear-gradient(to bottom right, #0D2D52, #1B4F8A)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              HE
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!analysisResult) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={() => {
                setFile(null);
                setAnalysisResult(null);
                setManualText('');
              }}
              className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:text-kilim-red hover:border-kilim-red transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              YENİ ANALİZ
            </button>
          </div>
        </div>

        <div className="relative group">
          <div 
            id="poster-preview"
            className={`bg-white border-2 border-[rgba(27,79,138,0.1)] rounded-3xl overflow-hidden transition-all duration-500 w-full ${activeFormat === 'square' ? 'aspect-square' : 'aspect-video'}`}
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            {/* Content Preview Area */}
            <div className={`h-full flex flex-col justify-between ${activeType === 'afis' ? 'bg-[#FAF6F0] font-boho' : 'bg-gradient-to-br from-white to-[rgba(235,242,250,0.3)] p-8 font-serif'}`}>
              
              {activeType === 'afis' ? (
                // Professional Infographic Design
                <div className="h-full flex flex-col relative">
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(27,79,138,0.05)] rounded-bl-[100px] -z-0" />
                  <div className="absolute bottom-20 left-0 w-24 h-24 bg-[rgba(139,26,26,0.05)] rounded-tr-[80px] -z-0" />

                  {/* Header Strip */}
                  <div className="bg-[#0D2D52] py-5 px-10 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-[#B22222]" />
                      </div>
                      <span className="text-[11px] font-black text-[rgba(255,255,255,0.9)] uppercase tracking-[0.4em]">BİTİG AI ANALİZİ</span>
                    </div>
                    <div className="text-[9px] font-bold text-[rgba(255,255,255,0.4)] tracking-widest uppercase">
                      {new Date().toLocaleDateString('tr-TR')}
                    </div>
                  </div>

                  <div className="flex-1 p-10 flex flex-col justify-center relative z-10">
                    <div className="mb-10">
                      <motion.h3 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-black text-[#0D2D52] leading-[1.1] tracking-tighter max-w-[90%]"
                      >
                        {analysisResult.infografik.baslik}
                      </motion.h3>
                      <div className="w-20 h-1.5 bg-[#8B1A1A] mt-4 rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Kapsam */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[rgba(255,255,255,0.6)] backdrop-blur-sm p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white shadow-sm space-y-2 sm:space-y-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 sm:p-2 bg-[rgba(27,79,138,0.1)] rounded-xl">
                            <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-[#1B4F8A]" />
                          </div>
                          <span className="text-[9px] sm:text-[11px] font-black text-[#0D2D52] uppercase tracking-widest">KAPSAM</span>
                        </div>
                        <ul className="space-y-1 sm:space-y-2">
                          {analysisResult.infografik.kapsam.map((item, i) => (
                            <li key={i} className="text-[10px] sm:text-[12px] font-bold text-[#475569] leading-snug flex gap-2">
                              <span className="text-[#1B4F8A]">•</span>
                              <span>{highlightImportant(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>

                      {/* Avantajlar */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[rgba(255,255,255,0.6)] backdrop-blur-sm p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white shadow-sm space-y-2 sm:space-y-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 sm:p-2 bg-[#ecfdf5] rounded-xl">
                            <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-[#059669]" />
                          </div>
                          <span className="text-[9px] sm:text-[11px] font-black text-[#047857] uppercase tracking-widest">AVANTAJLAR</span>
                        </div>
                        <ul className="space-y-1 sm:space-y-2">
                          {analysisResult.infografik.avantajlar.map((item, i) => (
                            <li key={i} className="text-[10px] sm:text-[12px] font-bold text-[#475569] leading-snug flex gap-2">
                              <span className="text-[#10b981]">•</span>
                              <span>{highlightImportant(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>

                      {/* Kritik Sınırlar */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[rgba(255,255,255,0.6)] backdrop-blur-sm p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white shadow-sm space-y-2 sm:space-y-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 sm:p-2 bg-[rgba(139,26,26,0.1)] rounded-xl">
                            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-[#8B1A1A]" />
                          </div>
                          <span className="text-[9px] sm:text-[11px] font-black text-[#8B1A1A] uppercase tracking-widest">KRİTİK SINIRLAR</span>
                        </div>
                        <ul className="space-y-1 sm:space-y-2">
                          {analysisResult.infografik.kritikSinirlar.map((item, i) => (
                            <li key={i} className="text-[10px] sm:text-[12px] font-black text-[#8B1A1A] leading-snug flex gap-2">
                              <span className="text-[rgba(139,26,26,0.5)]">•</span>
                              <span>{highlightImportant(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>

                      {/* Yapılması Gerekenler */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-[rgba(255,255,255,0.6)] backdrop-blur-sm p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white shadow-sm space-y-2 sm:space-y-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 sm:p-2 bg-[rgba(27,79,138,0.1)] rounded-xl">
                            <ArrowRightCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#1B4F8A]" />
                          </div>
                          <span className="text-[9px] sm:text-[11px] font-black text-[#0D2D52] uppercase tracking-widest">ADIMLAR</span>
                        </div>
                        <ul className="space-y-1 sm:space-y-2">
                          {analysisResult.infografik.yapilmasiGerekenler.map((item, i) => (
                            <li key={i} className="text-[10px] sm:text-[12px] font-bold text-[#475569] leading-snug flex gap-2">
                              <span className="text-[#1B4F8A]">•</span>
                              <span>{highlightImportant(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    </div>
                  </div>

                  {/* Footer Signature Strip */}
                  <div className="bg-white border-t border-[#f1f5f9] py-6 px-10 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0D2D52] rounded-xl flex items-center justify-center shadow-lg" style={{ boxShadow: '0 10px 15px -3px rgba(27,79,138,0.2)' }}>
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#0D2D52] tracking-widest leading-none">BİTİG AI</span>
                        <span className="text-[7px] font-bold text-[#94a3b8] uppercase tracking-tighter mt-1">Geleceğin Mali Müşaviri</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[11px] font-black text-[#0D2D52] leading-tight italic">
                          * SMMM Hatice ERDAL / * BİTİG AI Analizidir
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg" style={{ background: 'linear-gradient(to bottom right, #0D2D52, #1B4F8A)', boxShadow: '0 10px 15px -3px rgba(27,79,138,0.2)' }}>
                        HE
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Standard Text Previews
                <div className="h-full flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#8B1A1A]" />
                        <span className="text-[10px] font-black text-[#1B4F8A] uppercase tracking-[0.3em]">BİTİG AI ANALİZİ</span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black leading-tight text-[#0D2D52]">
                      {activeType === 'hap-not' ? 'Mevzuat Değişikliği Hap Notu' : 'Finansal Yönetici Özeti'}
                    </h3>
                    
                    <div className="space-y-4">
                      {activeType === 'hap-not' ? (
                        <ul className="space-y-3">
                          {analysisResult.hapNot.map((note, idx) => (
                            <motion.li 
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-start gap-3"
                            >
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#8B1A1A] shrink-0" />
                              <p className="text-sm text-[#475569] font-medium leading-relaxed">{note}</p>
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-[#475569] leading-relaxed font-medium">
                          {analysisResult.ozet}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[rgba(27,79,138,0.1)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0D2D52] text-white flex items-center justify-center font-black text-sm">
                        HE
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#0D2D52] italic">* SMMM Hatice ERDAL / * BİTİG AI Analizidir</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Share Panel */}
          <div className="mt-8 flex items-center justify-center">
            <button 
              onClick={() => handleShare('whatsapp')}
              className="flex items-center gap-3 px-12 py-4 bg-kilim-red text-white font-black rounded-2xl shadow-xl shadow-kilim-red/20 hover:bg-kilim-red-light transition-all active:scale-95 group"
            >
              <Share2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              TEK TIKLA PAYLAŞ
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full space-y-8 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-kilim-blue-dark tracking-tighter">İçerik Üretici & Paylaşım</h2>
        <p className="text-slate-500 font-medium">Dosyalarınızı analiz edin, profesyonel içeriklere dönüştürün ve anında paylaşın.</p>
      </div>

      {!analysisResult && !isAnalyzing ? (
        <div className="w-full space-y-6">
          {/* Unified Modern Input Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative transition-all duration-300 group
              bg-[#FAF6F0] border-2 border-dashed rounded-[3rem] p-12 text-center
              ${isDragging ? 'border-[#1B4F8A] bg-[#1B4F8A]/5 scale-[1.01]' : 'border-[#1B4F8A]/20 hover:border-[#1B4F8A]/40 hover:bg-[#1B4F8A]/5'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm cursor-pointer transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}
              >
                <Upload className="w-8 h-8 text-[#1B4F8A]" />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-[#0D2D52]">Dosya Seç veya Sürükle</h3>
                  <p className="text-xs font-bold text-[#A89080] uppercase tracking-widest">Veya metninizi aşağıya yapıştırın</p>
                </div>

                <textarea 
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Analiz edilecek metni buraya yazın veya yapıştırın..."
                  className="w-full min-h-[150px] p-6 bg-white/50 border border-[#1B4F8A]/10 rounded-2xl focus:border-[#1B4F8A] focus:ring-0 transition-all resize-none font-medium text-[#2C1810] placeholder-[#A89080]/60 text-center"
                />
              </div>
            </div>

            {file && (
              <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-bold border border-emerald-100">
                <CheckCircle className="w-3 h-3" />
                {file.name}
              </div>
            )}
          </motion.div>

          <button 
            onClick={() => startAnalysis()}
            disabled={!manualText.trim() && !file}
            className="w-full py-6 bg-[#1B4F8A] text-white font-black rounded-3xl shadow-xl shadow-[#1B4F8A]/20 hover:bg-[#2E6DB4] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl"
          >
            <Sparkles className="w-6 h-6" />
            ANALİZİ BAŞLAT
          </button>

          <div className="flex items-center justify-center gap-8 pt-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <FileText className="w-4 h-4" /> PDF
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <FileText className="w-4 h-4" /> DOCX
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <ImageIcon className="w-4 h-4" /> JPEG
            </div>
          </div>
        </div>
      ) : isAnalyzing ? (
        <div className="py-20 text-center space-y-10">
          <div className="relative w-40 h-40 mx-auto">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-[6px] border-kilim-blue/5 border-t-kilim-blue border-r-kilim-red rounded-full shadow-2xl"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-6 border-[6px] border-kilim-red/5 border-t-kilim-red rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-kilim-red animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-kilim-blue-dark">{loadingStep || 'AI Analiz Ediyor...'}</h3>
            <p className="text-base text-slate-400 font-medium max-w-md mx-auto">Verileriniz güvenli bir şekilde işleniyor ve profesyonel çıktılara dönüştürülüyor.</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <motion.div 
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-3 h-3 bg-kilim-blue rounded-full" 
            />
            <motion.div 
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              className="w-3 h-3 bg-kilim-red rounded-full" 
            />
            <motion.div 
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              className="w-3 h-3 bg-emerald-500 rounded-full" 
            />
          </div>
        </div>
      ) : (
        renderPreview()
      )}

      {/* Share Menu Pop-up */}
      <AnimatePresence>
        {showShareMenu && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareMenu(false)}
              className="absolute inset-0 bg-kilim-blue-dark/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-kilim-blue-dark">Hızlı Paylaş</h3>
                  <button onClick={() => setShowShareMenu(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleShare('whatsapp')}
                    className="flex flex-col items-center gap-3 p-6 bg-emerald-50 rounded-3xl hover:bg-emerald-100 transition-all group"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700">WhatsApp</span>
                  </button>

                  <button 
                    onClick={() => handleShare('instagram')}
                    className="flex flex-col items-center gap-3 p-6 bg-rose-50 rounded-3xl hover:bg-rose-100 transition-all group"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Instagram className="w-6 h-6 text-rose-500" />
                    </div>
                    <span className="text-xs font-bold text-rose-700">Instagram</span>
                  </button>

                  <button 
                    onClick={() => handleShare('linkedin')}
                    className="flex flex-col items-center gap-3 p-6 bg-blue-50 rounded-3xl hover:bg-blue-100 transition-all group"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Linkedin className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-blue-700">LinkedIn</span>
                  </button>

                  <button 
                    onClick={() => handleShare('website')}
                    className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-3xl hover:bg-slate-100 transition-all group"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Globe className="w-6 h-6 text-slate-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Web Siteme Ekle</span>
                  </button>
                </div>

                <div className="pt-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Marka İmzası Eklendi</p>
                  <p className="text-[11px] text-kilim-blue font-medium mt-1">Hatice Erdal - Mali Müşavir</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Poster Full Size Modal */}
      <AnimatePresence>
        {showPosterModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPosterModal(false)}
              className="absolute inset-0 bg-kilim-blue-dark/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl h-full flex flex-col gap-6"
            >
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                    <ImageIcon className="w-6 h-6 text-kilim-red-light" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Afiş Önizleme</h3>
                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Yüksek Çözünürlüklü Tasarım</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPosterModal(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 overflow-auto p-8 flex items-center justify-center bg-slate-900/50">
                   <div className="shadow-2xl scale-[0.6] sm:scale-100 origin-center">
                    {renderPosterContent(true)}
                   </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-white/60 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    1080 x 1080 Optimized
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Print Ready
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadPoster('poster-modal-content')}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-kilim-red text-white font-black rounded-3xl shadow-2xl shadow-kilim-red/40 hover:bg-kilim-red-light transition-all active:scale-95"
                >
                  <Download className="w-6 h-6" />
                  HEMEN İNDİR (PNG)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
