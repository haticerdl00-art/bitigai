import React, { useState } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Scale, 
  Calculator,
  ShieldAlert,
  FileText,
  ArrowRight,
  Download,
  Search,
  RefreshCw,
  LayoutGrid,
  ClipboardCheck,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { CompanyProfile } from '../types';

interface UploadedFile {
  name: string;
  type: string;
  data: string | any; // base64 for images/pdf, parsed data for excel
  mimeType: string;
}

interface ProductivityModuleProps {
  profile: CompanyProfile;
}

export const ProductivityModule = ({ profile }: ProductivityModuleProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportA, setReportA] = useState<string | null>(null);
  const [reportB, setReportB] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      const filePromise = new Promise<UploadedFile>((resolve) => {
        reader.onload = (evt) => {
          const result = evt.target?.result;
          if (!result) return;

          if (file.type.includes('sheet') || file.type.includes('excel') || file.name.endsWith('.csv')) {
            const wb = XLSX.read(result, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            resolve({
              name: file.name,
              type: 'excel',
              data: data,
              mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
          } else if (file.type.includes('image') || file.type.includes('pdf')) {
            const base64 = (result as string).split(',')[1];
            resolve({
              name: file.name,
              type: file.type.includes('image') ? 'image' : 'pdf',
              data: base64,
              mimeType: file.type
            });
          } else {
            resolve({
              name: file.name,
              type: 'other',
              data: result,
              mimeType: file.type || 'application/octet-stream'
            });
          }
        };

        if (file.type.includes('sheet') || file.type.includes('excel') || file.name.endsWith('.csv')) {
          reader.readAsBinaryString(file);
        } else {
          reader.readAsDataURL(file);
        }
      });

      newFiles.push(await filePromise);
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const runAnalysis = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3.1-pro-preview";
      
      const parts: any[] = [];
      
      // Add text instructions based on user request
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
          - NACE Kodu: ${profile.naceCode}
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

      // Add file data
      uploadedFiles.forEach(file => {
        if (file.type === 'excel') {
          const summary = (file.data as any[]).slice(0, 200).map(row => row.join(' | ')).join('\n');
          parts.push({ text: `Dosya: ${file.name} (Mizan İçeriği):\n${summary}` });
        } else if (file.type === 'image' || file.type === 'pdf') {
          parts.push({
            inlineData: {
              data: file.data,
              mimeType: file.mimeType
            }
          });
        }
      });

      const result = await ai.models.generateContent({
        model: model,
        contents: [{ parts: parts }],
      });

      const fullText = result.text || "";
      
      // Split the response into Section A and Section B
      const parts_split = fullText.split(/\[BÖLÜM B\]/i);
      let sectionA = parts_split[0].replace(/\[BÖLÜM A\]/i, '').trim();
      let sectionB = parts_split[1] ? parts_split[1].trim() : "Finansal analiz oluşturulamadı.";

      setReportA(sectionA);
      setReportB(sectionB);
    } catch (error) {
      console.error("Analysis failed:", error);
      setReportA("Analiz sırasında bir hata oluştu.");
      setReportB("Lütfen tekrar deneyin.");
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-kilim-blue-dark tracking-tight">Ofis Verimlilik & Denetim Merkezi</h1>
            <p className="text-slate-500 text-sm">Mizan analizi, teknik denetim ve finansal danışmanlık paneli.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Context */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border-kilim-blue-light/30">
            <h3 className="font-bold text-kilim-blue-light mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-kilim-blue" />
              Mizan Yükleme
            </h3>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-emerald-400 transition-colors cursor-pointer relative group">
                <input 
                  type="file" 
                  multiple
                  accept=".xlsx, .xls, .csv, .pdf, .jpg, .jpeg, .png"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-50 transition-colors">
                  <FileSpreadsheet className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">Mizan Dosyasını Seçin</p>
                <p className="text-[10px] text-slate-400 mt-1">Excel veya PDF formatında mizan yükleyebilirsiniz.</p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)}
                        className="p-1 hover:bg-rose-100 rounded-lg text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <RefreshCw className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={runAnalysis}
                disabled={uploadedFiles.length === 0 || isAnalyzing}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  uploadedFiles.length === 0 || isAnalyzing 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-kilim-blue text-white hover:bg-kilim-blue/90 shadow-kilim-blue/20'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    Denetimi Başlat
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="glass-card p-6 bg-kilim-blue-dark text-white border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-kilim-blue-light/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-kilim-blue-light relative z-10">
              <ShieldAlert className="w-5 h-5" />
              Aktif Firma Bağlamı
            </h3>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Ünvan:</span>
                <span className="font-bold text-slate-200 truncate ml-2">{profile.title}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">VKN:</span>
                <span className="font-bold text-slate-200">{profile.taxNumber}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Statü:</span>
                <span className="font-bold text-slate-200">{profile.legalStatus}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">İşçi Sayısı:</span>
                <span className="font-bold text-slate-200">{profile.hrProfile.totalWorkers}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-6 italic leading-relaxed border-t border-slate-800 pt-4">
              "Analizler bu firma verileri temel alınarak yapılmaktadır. Başka firma verileriyle karıştırılmaz."
            </p>
          </div>
        </div>

        {/* Right Column: Split Reports */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card flex-1 p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[600px]"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                  <Search className="w-10 h-10 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-kilim-blue-dark">Denetçi Analiz Yapıyor</h3>
                  <p className="text-slate-500 mt-2 max-w-sm mx-auto">Mizan verileri VUK, SGK ve TTK mevzuatına göre taranıyor, finansal rasyolar hesaplanıyor...</p>
                </div>
                <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden mx-auto">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="h-full bg-emerald-600"
                  />
                </div>
              </motion.div>
            ) : (reportA || reportB) ? (
              <div className="flex flex-col gap-6 h-full">
                {/* Section A: Hata Masası (Top Right) */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 border-l-4 border-l-rose-500 flex-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                        <ClipboardCheck className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-kilim-blue-dark">MÜŞAVİR NOTU (Hata Masası)</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Teknik Denetim & Hata Önleme</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg uppercase">Kritik Kontrol</span>
                  </div>
                  <div className="prose prose-slate max-w-none 
                    prose-p:text-sm prose-p:text-slate-600 prose-p:leading-relaxed
                    prose-strong:text-slate-900 prose-strong:font-bold
                    markdown-body
                  ">
                    <ReactMarkdown>{reportA || ""}</ReactMarkdown>
                  </div>
                </motion.div>

                {/* Section B: Yönetici Paneli (Bottom Right) */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-6 border-l-4 border-l-emerald-500 flex-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-kilim-blue-light/10 flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-kilim-blue" />
                      </div>
                      <div>
                        <h3 className="font-bold text-kilim-blue-dark">MÜŞTERİ SUNUMU (Yönetici Paneli)</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Finansal Analiz & Değer Katma</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-kilim-blue-light/20 text-kilim-blue-dark text-[10px] font-bold rounded-lg uppercase">Finansal Sağlık</span>
                  </div>
                  <div className="prose prose-slate max-w-none 
                    prose-p:text-sm prose-p:text-slate-600 prose-p:leading-relaxed
                    prose-strong:text-slate-900 prose-strong:font-bold
                    markdown-body
                  ">
                    <ReactMarkdown>{reportB || ""}</ReactMarkdown>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="glass-card flex-1 p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[600px]">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                  <LayoutGrid className="w-12 h-12 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-kilim-blue-dark tracking-tight">Merkezi Denetim Motoru Hazır</h3>
                  <p className="text-slate-500 mt-2 max-w-sm mx-auto">Mizan yükleyerek hem teknik hataları hem de finansal rasyoları aynı ekranda analiz edin.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mx-auto">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-left hover:bg-white hover:shadow-md transition-all">
                    <ShieldAlert className="w-6 h-6 text-rose-500 mb-3" />
                    <p className="text-sm font-bold text-slate-800">Hata Masası</p>
                    <p className="text-[11px] text-slate-500 mt-1">Ters bakiyeler, vergi riskleri ve adatlandırma kontrolleri.</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-left hover:bg-white hover:shadow-md transition-all">
                    <TrendingUp className="w-6 h-6 text-emerald-500 mb-3" />
                    <p className="text-sm font-bold text-slate-800">Yönetici Paneli</p>
                    <p className="text-[11px] text-slate-500 mt-1">Kâr marjları, likidite rasyoları ve finansal öneriler.</p>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

