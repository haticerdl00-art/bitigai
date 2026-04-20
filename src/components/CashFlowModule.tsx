import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  ChevronRight,
  ChevronLeft,
  Download,
  Filter,
  RefreshCw,
  FileSearch,
  ShieldAlert,
  FileText,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Calculator,
  Search,
  Building2,
  Bot
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  Cell,
  BarChart,
  Bar,
  PieChart,
  Pie
} from 'recharts';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile, MizanData } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { VergiTakipModulu } from './VergiTakipModulu';

import { analyzeFinancialStatements } from '../services/geminiService';

interface CashFlowModuleProps {
  profile: CompanyProfile;
  companies: CompanyProfile[];
  onSelectCompany: (company: CompanyProfile) => void;
}

export const CashFlowModule: React.FC<CashFlowModuleProps> = ({ profile, companies, onSelectCompany }) => {
  const [activeTab, setActiveTab] = useState<'kdv-refund' | 'mali-tablo'>('mali-tablo');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('6ay');
  const [mizanUploaded, setMizanUploaded] = useState(false);
  const [isMizanAnalyzing, setIsMizanAnalyzing] = useState(false);
  const [maliTabloReport, setMaliTabloReport] = useState<string | null>(null);
  const [maliTabloChartData, setMaliTabloChartData] = useState<any | null>(null);
  const [isMaliTabloAnalyzing, setIsMaliTabloAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [mizanData, setMizanData] = useState<MizanData | null>(null);

  useEffect(() => {
    if (!profile.id || !auth.currentUser) return;

    const mizanRef = doc(db, 'companies', profile.id, 'mizan', 'current');
    const unsubscribe = onSnapshot(mizanRef, (doc) => {
      if (doc.exists()) {
        setMizanData(doc.data() as MizanData);
        setMizanUploaded(true);
      } else {
        setMizanData(null);
        setMizanUploaded(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `companies/${profile.id}/mizan/current`);
    });

    return () => unsubscribe();
  }, [profile.id]);

  const currentLiquidity = useMemo(() => {
    if (mizanData) {
      return mizanData.summary.totalCash + mizanData.summary.totalBank;
    }
    return MIZAN_DATA.cash + MIZAN_DATA.bank;
  }, [mizanData]);

  if (profile.id === '0') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 bg-white rounded-3xl p-12 shadow-sm border border-slate-100">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-12 h-12 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Firma Seçilmedi</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Finansal analiz ve nakit akış projeksiyonu oluşturabilmek için lütfen sol menüden veya üst panelden bir firma seçiniz.
          </p>
        </div>
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 max-w-md">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800 text-left">
            Firma seçimi yapıldıktan sonra mizan, gelir tablosu ve bilanço verilerinizi yükleyerek yapay zeka destekli analizleri başlatabilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  const receivablesTotal = useMemo(() => {
    if (mizanData) return mizanData.summary.totalReceivables;
    return 460000;
  }, [mizanData]);

  const payablesTotal = useMemo(() => {
    if (mizanData) return mizanData.summary.totalPayables;
    return 246500;
  }, [mizanData]);

  const dynamicProjectionData = useMemo(() => {
    if (!mizanData) return PROJECTION_DATA;
    // Simple dynamic projection based on mizan
    return PROJECTION_DATA.map((d, i) => {
      if (i === 0) {
        return { ...d, inflow: mizanData.summary.totalReceivables / 3, outflow: mizanData.summary.totalPayables / 3 };
      }
      return d;
    });
  }, [mizanData]);

  const dynamicCumulativeData = useMemo(() => {
    let current = currentLiquidity;
    return dynamicProjectionData.map(d => {
      current += (d.inflow - d.outflow);
      return { month: d.month, total: current };
    });
  }, [currentLiquidity, dynamicProjectionData]);

  const handleMizanUpload = (e?: React.ChangeEvent<HTMLInputElement>) => {
    setIsMizanAnalyzing(true);
    setTimeout(() => {
      setIsMizanAnalyzing(false);
      setMizanUploaded(true);
    }, 2500);
  };

  const handleMaliTabloAnalyze = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsMaliTabloAnalyzing(true);
    try {
      const filePromises = uploadedFiles.map(async (file) => {
        return new Promise<{ data: string, mimeType: string, name: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({
              data: base64,
              mimeType: file.type || 'application/pdf',
              name: file.name
            });
          };
          reader.readAsDataURL(file);
        });
      });

      const processedFiles = await Promise.all(filePromises);
      const result = await analyzeFinancialStatements(processedFiles, profile);
      
      if (result && typeof result === 'object' && 'report' in result) {
        setMaliTabloReport(result.report || "Analiz raporu oluşturulamadı.");
        setMaliTabloChartData(result.chartData);
      } else {
        setMaliTabloReport(result || "Analiz raporu oluşturulamadı.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setMaliTabloReport("Analiz sırasında bir hata oluştu. Lütfen dosyalarınızın okunabilir olduğundan emin olun.");
    } finally {
      setIsMaliTabloAnalyzing(false);
    }
  };

  const renderKdvRefundAnalysis = () => (
    <VergiTakipModulu profile={profile} />
  );

  const renderMaliTabloAnalizi = () => (
    <div className="space-y-8">
      <div className="glass-card p-6 border-t-4 border-t-kilim-blue bg-white">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-kilim-blue/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-kilim-blue" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-kilim-blue-dark">Mizan & Mali Tablo Analizi</h3>
              <p className="text-xs text-slate-500">Firma: <span className="font-bold">{profile.title}</span> | Mizan, Gelir Tablosu ve Bilanço Analizi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {maliTabloReport && (
              <button 
                onClick={() => {
                  setMaliTabloReport(null);
                  setMaliTabloChartData(null);
                  setUploadedFiles([]);
                  setShowUpload(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Raporu Sıfırla
              </button>
            )}
            <button 
              onClick={() => setShowUpload(!showUpload)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                showUpload ? 'bg-kilim-red text-white' : 'bg-kilim-blue text-white shadow-lg shadow-kilim-blue/20'
              }`}
              title="Belge Yükleme Panelini Aç/Kapat"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${showUpload ? 'rotate-90' : ''}`} />
              {showUpload ? 'Kapat' : 'Belge Yükle'}
            </button>
          </div>
        </div>

        {showUpload && (
          <div id="upload-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 scroll-mt-20">
            <div className="lg:col-span-5 space-y-6">
              <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center relative group hover:border-kilim-blue/30 transition-colors">
                <input 
                  type="file" 
                  multiple
                  accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-kilim-blue" />
                </div>
                <h4 className="font-bold text-slate-800">Belgeleri Sürükleyin veya Seçin</h4>
                <p className="text-xs text-slate-500 mt-2">
                  Mizan, Gelir Tablosu, Bilanço vb. <br />
                  PDF, Excel veya Görsel formatları desteklenir.
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yüklenen Belgeler ({uploadedFiles.length})</p>
                    <button 
                      onClick={() => setUploadedFiles([])}
                      className="text-[10px] font-bold text-rose-500 hover:underline"
                    >
                      Tümünü Temizle
                    </button>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm group">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-kilim-blue" />
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{f.name}</span>
                        </div>
                        <button 
                          onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} 
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={async () => {
                  await handleMaliTabloAnalyze();
                  setShowUpload(false);
                }}
                disabled={isMaliTabloAnalyzing || uploadedFiles.length === 0}
                className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 ${
                  uploadedFiles.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse' : 'bg-kilim-blue text-white'
                }`}
              >
                {isMaliTabloAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    Analizi Başlat
                  </>
                )}
              </button>
            </div>

            <div className="lg:col-span-7 p-8 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                <FileSearch className="w-10 h-10 text-slate-300" />
              </div>
              <div className="max-w-sm">
                <h4 className="text-lg font-bold text-slate-800">Kapsamlı Analiz Akışı</h4>
                <p className="text-sm text-slate-500 mt-2">
                  Önce mizanınızdaki teknik eksiklikleri ve düzeltilmesi gereken yerleri saptıyoruz. Ardından mali tablolarınızı (Gelir Tablosu, Bilanço) analiz ederek rasyolarınızı yorumluyoruz.
                </p>
              </div>
            </div>
          </div>
        )}

        {!maliTabloReport && !showUpload && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-kilim-blue/5 rounded-full flex items-center justify-center">
              <FileSearch className="w-12 h-12 text-kilim-blue/30" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-800">Analiz Başlatılmadı</h4>
                <p className="text-slate-500 max-w-md">
                  Mali tablo analizini başlatmak için yukarıdaki "Belge Yükle" butonuna dokunarak belgelerinizi sisteme aktarın.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowUpload(true);
                  setTimeout(() => {
                    document.getElementById('upload-panel')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="flex items-center gap-3 px-8 py-4 bg-kilim-blue text-white rounded-2xl font-bold hover:bg-kilim-blue/90 transition-all shadow-xl shadow-kilim-blue/20 mx-auto"
              >
                <Upload className="w-5 h-5" />
                Belge Yüklemeyi Başlat
              </button>
            </div>
          </div>
        )}
          {maliTabloReport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
            id="analysis-report-container"
          >
            {/* Infographic Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Likidite Oranları</h5>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maliTabloChartData?.liquidity || [
                      { name: 'Cari', value: 1.8 },
                      { name: 'Asit', value: 1.2 },
                      { name: 'Nakit', value: 0.4 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis fontSize={9} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px' }} />
                      <Bar dataKey="value" fill="#1B4F8A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gider Dağılımı</h5>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={maliTabloChartData?.expenses || [
                          { name: 'Pazarlama', value: 400 },
                          { name: 'Yönetim', value: 300 },
                          { name: 'Finansman', value: 200 },
                          { name: 'Diğer', value: 100 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {['#1B4F8A', '#2E6DB4', '#8B1A1A', '#C9A227'].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Karlılık Trendi</h5>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={maliTabloChartData?.profitability || [
                      { month: 'Oca', kar: 100 },
                      { month: 'Şub', kar: 120 },
                      { month: 'Mar', kar: 110 },
                      { month: 'Nis', kar: 150 },
                      { month: 'May', kar: 180 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis fontSize={9} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="kar" stroke="#1B4F8A" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Borç Yapısı</h5>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maliTabloChartData?.debtStructure || [
                      { name: 'Kısa V.', value: 65 },
                      { name: 'Uzun V.', value: 25 },
                      { name: 'Özkaynak', value: 10 }
                    ]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" fontSize={9} axisLine={false} tickLine={false} width={50} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px' }} />
                      <Bar dataKey="value" fill="#8B1A1A" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-kilim-blue/10 rounded-xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-kilim-blue" />
                  </div>
                  <h4 className="font-black text-kilim-blue-dark m-0 uppercase tracking-tight">Yapay Zeka Analiz Raporu</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={async (e) => {
                      const btn = e.currentTarget;
                      const originalText = btn.innerHTML;
                      btn.disabled = true;
                      btn.innerHTML = '<span class="animate-spin">⌛</span> PDF Hazırlanıyor...';
                      
                      try {
                        // Capture the main container which holds both charts and the report text
                        const element = document.getElementById('analysis-report-container');
                        if (!element) return;

                        const canvas = await html2canvas(element, {
                          scale: 2,
                          useCORS: true,
                          backgroundColor: '#ffffff'
                        });
                        
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = pdf.internal.pageSize.getHeight();
                        
                        const imgProps = pdf.getImageProperties(imgData);
                        const imgWidth = pdfWidth - 20; // 10mm margins
                        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                        
                        let heightLeft = imgHeight;
                        let position = 10;

                        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                        heightLeft -= (pdfHeight - 20);

                        while (heightLeft >= 0) {
                          position = heightLeft - imgHeight;
                          pdf.addPage();
                          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                          heightLeft -= pdfHeight;
                        }

                        pdf.save(`Tam_Analiz_Raporu_${profile.title.replace(/\s+/g, '_')}.pdf`);
                      } catch (err) {
                        console.error("PDF Export Error:", err);
                        alert("Rapor indirilirken bir hata oluştu. Lütfen tekrar deneyin.");
                      } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    Tüm Raporu İndir (PDF)
                  </button>
                  <button 
                    onClick={() => {
                      setMaliTabloReport(null);
                      setMaliTabloChartData(null);
                      setUploadedFiles([]);
                      setShowUpload(true);
                    }} 
                    className="flex items-center gap-2 px-3 py-1.5 bg-kilim-red/10 text-kilim-red rounded-lg text-xs font-bold hover:bg-kilim-red/20 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Yeni Analiz Başlat
                  </button>
                </div>
              </div>
              <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                {maliTabloReport}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 bg-white min-h-screen p-6 rounded-3xl">
      {/* Company Selector & Header */}
      <div className="glass-card p-6 border-b-4 border-kilim-blue bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-kilim-blue/10 rounded-2xl flex items-center justify-center shadow-inner">
              <Building2 className="w-8 h-8 text-kilim-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-kilim-blue-dark tracking-tight">Finansal Durum & Analiz</h1>
              <p className="text-sm text-slate-500 font-medium">Mizan, Nakit Akışı ve KDV İade Yönetimi</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <select 
                value={profile.id}
                onChange={(e) => {
                  const selected = companies.find(c => c.id === e.target.value);
                  if (selected) onSelectCompany(selected);
                }}
                className="pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-kilim-blue focus:border-transparent transition-all appearance-none cursor-pointer min-w-[240px]"
              >
                <option value="0" disabled>Firma Seçiniz...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
              </div>
            </div>

            <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
              <Download className="w-4 h-4" />
              Genel Raporu İndir
            </button>
            <button 
              onClick={() => {
                setMizanUploaded(false);
                setMizanData(null);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Verileri Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-100 rounded-2xl w-fit shadow-inner">
        <button 
          onClick={() => setActiveTab('mali-tablo')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'mali-tablo' 
              ? 'bg-white text-kilim-blue shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Mizan & Mali Tablo Analizi
        </button>
        <button 
          onClick={() => setActiveTab('kdv-refund')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'kdv-refund' 
              ? 'bg-white text-kilim-blue shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          KDV İade Durumu Analizi
          <span className="w-2 h-2 bg-kilim-green rounded-full animate-pulse"></span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'kdv-refund' ? renderKdvRefundAnalysis() : 
           renderMaliTabloAnalizi()}
        </motion.div>
      </AnimatePresence>

      {/* AI Advisor Warnings (Danışman) */}
      <AnimatePresence>
        {mizanData && (mizanData.summary.highCashRisk || mizanData.summary.adatRisk131 || mizanData.summary.adatRisk331) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-24 right-8 z-[60] max-w-sm"
          >
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-kilim-red/20 overflow-hidden">
              <div className="bg-kilim-red p-3 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-sm">AI Denetim Uyarısı</span>
              </div>
              <div className="p-4 space-y-3">
                {mizanData.summary.highCashRisk && (
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <p className="text-xs text-slate-700">
                      <span className="font-bold text-rose-600">100 Kasa Hesabı:</span> Bakiye çok yüksek ({mizanData.summary.totalCash.toLocaleString('tr-TR')} ₺). Adatlandırma ve vergi inceleme riski mevcut!
                    </p>
                  </div>
                )}
                {(mizanData.summary.adatRisk131 || mizanData.summary.adatRisk331) && (
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-slate-700">
                      <span className="font-bold text-amber-600">131/331 Hesaplar:</span> Ortaklarla olan borç/alacak ilişkisinde adat hesaplama zorunluluğu doğabilir.
                    </p>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => alert('AI Danışman detaylı raporu hazırlanıyor...')}
                    className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors"
                  >
                    DETAYLI ANALİZ İSTE
                  </button>
                </div>
              </div>
            </div>
            {/* Speech Bubble Tail */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-kilim-red/20 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Mock Data for Charts (Keep them outside or move inside useMemo if needed)
const MIZAN_DATA = {
  cash: 45000,
  bank: 125000,
  receivables: [
    { id: 1, name: 'ABC Teknoloji', amount: 85000, dueDate: '2026-03-15', status: 'vadesi-gecmis' },
    { id: 2, name: 'XYZ Lojistik', amount: 120000, dueDate: '2026-04-10', status: 'bekliyor' },
    { id: 3, name: 'Global Gıda', amount: 45000, dueDate: '2026-03-25', status: 'bekliyor' },
    { id: 4, name: 'Delta İnşaat', amount: 210000, dueDate: '2026-05-05', status: 'bekliyor' },
  ],
  payables: [
    { id: 1, name: 'EnerjiSA', amount: 12000, dueDate: '2026-03-20' },
    { id: 2, name: 'Turkcell', amount: 4500, dueDate: '2026-03-22' },
    { id: 3, name: 'Ofis Kira (Mart)', amount: 25000, dueDate: '2026-03-05' },
    { id: 4, name: 'Hammadde Tedarikçisi A', amount: 150000, dueDate: '2026-04-15' },
    { id: 5, name: 'Yazılım Lisansları', amount: 35000, dueDate: '2026-05-20' },
  ],
  personnel: {
    monthlyNet: 180000,
    monthlySGK: 65000,
    monthlyTax: 15000,
  },
  taxes: {
    vat: { amount: 42000, dueDate: '2026-03-26' },
    withholding: { amount: 18000, dueDate: '2026-03-26' },
    provisional: { amount: 75000, dueDate: '2026-05-17' },
  }
};

const PROJECTION_DATA = [
  { month: 'Mart', inflow: 130000, outflow: 329500, balance: -199500, status: 'danger' },
  { month: 'Nisan', inflow: 245000, outflow: 260000, balance: -15000, status: 'warning' },
  { month: 'Mayıs', inflow: 380000, outflow: 450000, balance: -70000, status: 'danger' },
  { month: 'Haziran', inflow: 420000, outflow: 280000, balance: 140000, status: 'success' },
  { month: 'Temmuz', inflow: 350000, outflow: 270000, balance: 80000, status: 'success' },
  { month: 'Ağustos', inflow: 400000, outflow: 290000, balance: 110000, status: 'success' },
];

const CUMULATIVE_DATA = [
  { month: 'Mart', total: 170000 - 199500 },
  { month: 'Nisan', total: -29500 - 15000 },
  { month: 'Mayıs', total: -44500 - 70000 },
  { month: 'Haziran', total: -114500 + 140000 },
  { month: 'Temmuz', total: 25500 + 80000 },
  { month: 'Ağustos', total: 105500 + 110000 },
];
