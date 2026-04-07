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

  const renderProjection = () => (
    <div className="space-y-8">
      {!mizanUploaded ? (
        <div className="glass-card p-12 text-center border-2 border-dashed border-kilim-blue-light/30 bg-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-kilim-blue-light/10 text-kilim-blue rounded-full text-[10px] font-bold border border-kilim-blue-light/20">
              <RefreshCw className="w-3 h-3 animate-spin" />
              AI PROFIL AKTİF: {profile.title}
            </div>
          </div>
          
          <div className="max-w-xl mx-auto space-y-6">
            <div className="w-20 h-20 bg-kilim-blue-light/10 rounded-3xl flex items-center justify-center mx-auto rotate-3 shadow-inner">
              <FileText className="w-10 h-10 text-kilim-blue" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">Mizan Verisini Yükleyin</h2>
              <p className="text-slate-500">
                Yapay zeka, <span className="font-bold text-slate-700">{profile.title}</span> firmasına ait 
                <span className="font-bold text-slate-700"> {profile.hrProfile.totalWorkers} çalışan</span> ve 
                <span className="font-bold text-slate-700"> {profile.ledgerType}</span> bilgilerini mizanla birleştirerek 6 aylık yol haritası çıkaracaktır.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Defter Türü</p>
                <p className="text-xs font-bold text-slate-700">{profile.ledgerType}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Personel</p>
                <p className="text-xs font-bold text-slate-700">{profile.hrProfile.totalWorkers} Kişi</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Vergi Statüsü</p>
                <p className="text-xs font-bold text-slate-700">{profile.legalStatus}</p>
              </div>
            </div>

            <label className="w-full py-4 bg-kilim-blue text-white rounded-2xl font-bold hover:bg-kilim-blue/90 transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50">
              {isMizanAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Belgeler Analiz Ediliyor (Data Fusion)...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Belge Yükle
                </>
              )}
              <input 
                type="file" 
                className="hidden" 
                onChange={handleMizanUpload} 
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
                disabled={isMizanAnalyzing}
              />
            </label>
            <p className="text-[10px] text-slate-400">Desteklenen formatlar: .pdf, .doc, .xls, .xlsx, .csv, .jpg (Mizan, Beyanname ve Faturalar)</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Mevcut Nakit (100+102)', value: currentLiquidity.toLocaleString('tr-TR') + ' ₺', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Beklenen Tahsilat (120)', value: receivablesTotal.toLocaleString('tr-TR') + ' ₺', icon: ArrowUpRight, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Ödenecek Borçlar (320)', value: payablesTotal.toLocaleString('tr-TR') + ' ₺', icon: ArrowDownRight, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Net Nakit Pozisyonu', value: (currentLiquidity + receivablesTotal - payablesTotal).toLocaleString('tr-TR') + ' ₺', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl ${stat.bg} border border-white shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Inflow vs Outflow */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-kilim-blue-dark flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-kilim-blue" />
                  Nakit Giriş vs Çıkış Projeksiyonu
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Giriş</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div> Çıkış</span>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicProjectionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [value.toLocaleString('tr-TR') + ' ₺']}
                    />
                    <Bar dataKey="inflow" fill="#1B4F8A" radius={[4, 4, 0, 0]} barSize={32} />
                    <Bar dataKey="outflow" fill="#2E6DB4" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Chart: Cumulative Cash Balance */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-kilim-blue-dark flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5 text-kilim-blue" />
                  Kümülatif Nakit Dengesi (Trend)
                </h3>
                <span className="text-xs text-slate-500 italic">Banka + Kasa + Beklenen Net Akış</span>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicCumulativeData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [value.toLocaleString('tr-TR') + ' ₺', 'Kümülatif Bakiye']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#1B4F8A" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      dot={{ r: 4, fill: '#1B4F8A', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line type="monotone" dataKey={() => 0} stroke="#cbd5e1" strokeDasharray="5 5" dot={false} activeDot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Analysis & Table Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cash Flow Table */}
            <div className="lg:col-span-2 glass-card overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">📅 3 Aylık Detaylı Nakit Akış Tablosu</h3>
                <button className="text-xs text-emerald-600 font-semibold hover:underline">Tümünü Gör</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-kilim-blue-pale text-kilim-blue-dark font-bold">
                    <tr>
                      <th className="px-6 py-4">Kalem</th>
                      <th className="px-6 py-4">Mart 2026</th>
                      <th className="px-6 py-4">Nisan 2026</th>
                      <th className="px-6 py-4">Mayıs 2026</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-kilim-blue-pale/50">
                      <td className="px-6 py-4 font-semibold text-kilim-blue-dark">NAKİT GİRİŞLERİ</td>
                      <td className="px-6 py-4 font-bold">130.000 ₺</td>
                      <td className="px-6 py-4 font-bold">245.000 ₺</td>
                      <td className="px-6 py-4 font-bold">380.000 ₺</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 pl-10 text-slate-600">Ticari Tahsilatlar (120)</td>
                      <td className="px-6 py-4">130.000 ₺</td>
                      <td className="px-6 py-4">245.000 ₺</td>
                      <td className="px-6 py-4">380.000 ₺</td>
                    </tr>
                    <tr className="bg-kilim-blue-pale/30">
                      <td className="px-6 py-4 font-semibold text-kilim-blue-dark">NAKİT ÇIKIŞLARI</td>
                      <td className="px-6 py-4 font-bold">329.500 ₺</td>
                      <td className="px-6 py-4 font-bold">260.000 ₺</td>
                      <td className="px-6 py-4 font-bold">450.000 ₺</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 pl-10 text-slate-600">Personel (Maaş+SGK+MHT)</td>
                      <td className="px-6 py-4">260.000 ₺</td>
                      <td className="px-6 py-4">260.000 ₺</td>
                      <td className="px-6 py-4">260.000 ₺</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 pl-10 text-slate-600">Tedarikçi Ödemeleri (320)</td>
                      <td className="px-6 py-4">12.000 ₺</td>
                      <td className="px-6 py-4">0 ₺</td>
                      <td className="px-6 py-4">115.000 ₺</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 pl-10 text-slate-600">Vergi Ödemeleri (KDV+Geçici)</td>
                      <td className="px-6 py-4">57.500 ₺</td>
                      <td className="px-6 py-4">0 ₺</td>
                      <td className="px-6 py-4">75.000 ₺</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="px-6 py-4">NET DÖNEM BAKİYESİ</td>
                      <td className="px-6 py-4 text-rose-600">-199.500 ₺</td>
                      <td className="px-6 py-4 text-rose-600">-15.000 ₺</td>
                      <td className="px-6 py-4 text-rose-600">-70.000 ₺</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Analysis "Hap Analiz" */}
            <div className="space-y-6">
              <div className="glass-card p-6 border-l-4 border-amber-500">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ⚠️ Riskli Dönemler & Uyarılar
                </h3>
                <div className="space-y-4">
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <p className="text-sm font-bold text-rose-800 mb-1">Kritik Nakit Darboğazı: Mart - Mayıs</p>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      {profile.hrProfile.totalWorkers} çalışanınızın maaş yükü ve {profile.legalStatus === 'AŞ' || profile.legalStatus === 'LTD' ? 'Geçici Vergi' : 'Gelir Vergisi'} ödemeleri nedeniyle Mart ayında nakit dengesi [-199.500 ₺] bakiye verebilir.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm font-bold text-amber-800 mb-1">Mayıs Ayı Sınırda!</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Dikkat! {profile.ledgerType === 'E-Defter (Bilanço)' ? '770/760 hesaplarınızın ortalamasına göre' : 'Genel gider trendinize göre'} Mayıs ayında borç ödemeleri yoğunlaşıyor. Net Durum: +15.000 TL - Sınırda!
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 border-l-4 border-kilim-blue">
                <h3 className="font-bold text-kilim-blue-dark flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-kilim-blue" />
                  💡 Stratejik Öneriler
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Nakit akışını dengelemek için 120 hesabındaki yüksek tutarlı alacakların tahsilatını 10 gün öne çekmeniz önerilir. {profile.hrProfile.femaleWorkers > 0 ? 'Kadın istihdamı teşviklerinden (6111) yararlanarak SGK yükünüzü %15 azaltabilirsiniz.' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

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
            <button 
              onClick={() => setShowUpload(!showUpload)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                showUpload ? 'bg-kilim-red text-white' : 'bg-kilim-blue text-white shadow-lg shadow-kilim-blue/20'
              }`}
              title="Belge Yükleme Panelini Aç/Kapat"
            >
              <span className="text-lg">K</span>
              {showUpload ? 'Kapat' : 'Belge Yükle'}
            </button>
          </div>
        </div>

        {showUpload && !maliTabloReport && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center relative group">
                <input 
                  type="file" 
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadedFiles(Array.from(e.target.files));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-kilim-blue" />
                </div>
                <h4 className="font-bold text-slate-800">Belgeleri Yükleyin</h4>
                <p className="text-xs text-slate-500 mt-2">
                  Mizan, Gelir Tablosu, Bilanço vb. <br />
                  Birden fazla dosya seçebilirsiniz.
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Yüklenen Belgeler ({uploadedFiles.length})</p>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-kilim-blue" />
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{f.name}</span>
                      </div>
                      <button onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg">
                        <RefreshCw className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={async () => {
                  await handleMaliTabloAnalyze();
                  setShowUpload(false);
                }}
                disabled={isMaliTabloAnalyzing || uploadedFiles.length === 0}
                className="w-full py-4 bg-kilim-blue text-white rounded-2xl font-bold hover:bg-kilim-blue/90 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
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
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
              <FileSearch className="w-12 h-12 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-slate-800">Analiz Başlatılmadı</h4>
              <p className="text-slate-500 max-w-md">
                Mali tablo analizini başlatmak için yukarıdaki <span className="font-bold text-kilim-blue">K</span> butonuna basarak belgelerinizi yükleyiniz.
              </p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Likidite Oranları</h5>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maliTabloChartData?.liquidity || [
                      { name: 'Cari Oran', value: 1.8, target: 2.0 },
                      { name: 'Asit Test', value: 1.2, target: 1.0 },
                      { name: 'Nakit Oran', value: 0.4, target: 0.2 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1e40af" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Gider Dağılımı</h5>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={maliTabloChartData?.expenses || [
                          { name: 'Pazarlama', value: 400 },
                          { name: 'Yönetim', value: 300 },
                          { name: 'Finansman', value: 200 },
                          { name: 'Ar-Ge', value: 100 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {['#1e40af', '#10b981', '#f59e0b', '#ef4444'].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Karlılık Trendi</h5>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={maliTabloChartData?.profitability || [
                      { month: 'Oca', kar: 100 },
                      { month: 'Şub', kar: 120 },
                      { month: 'Mar', kar: 110 },
                      { month: 'Nis', kar: 150 },
                      { month: 'May', kar: 180 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Line type="monotone" dataKey="kar" stroke="#1e40af" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
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
                    onClick={async () => {
                      const element = document.getElementById('analysis-report-container');
                      if (!element) return;
                      const canvas = await html2canvas(element);
                      const imgData = canvas.toDataURL('image/png');
                      const pdf = new jsPDF('p', 'mm', 'a4');
                      const imgProps = pdf.getImageProperties(imgData);
                      const pdfWidth = pdf.internal.pageSize.getWidth();
                      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                      pdf.save(`Analiz_Raporu_${profile.title}.pdf`);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
                  >
                    <Download className="w-3 h-3" />
                    PDF İndir
                  </button>
                  <button 
                    onClick={async () => {
                      const doc = new Document({
                        sections: [{
                          properties: {},
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: `Mali Tablo Analiz Raporu - ${profile.title}`,
                                  bold: true,
                                  size: 32,
                                }),
                              ],
                            }),
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: maliTabloReport,
                                  size: 24,
                                }),
                              ],
                            }),
                          ],
                        }],
                      });

                      const blob = await Packer.toBlob(doc);
                      saveAs(blob, `Analiz_Raporu_${profile.title}.docx`);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all"
                  >
                    <Download className="w-3 h-3" />
                    Word İndir
                  </button>
                  <button 
                    onClick={() => {
                      setMaliTabloReport(null);
                      setMaliTabloChartData(null);
                      setUploadedFiles([]);
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
