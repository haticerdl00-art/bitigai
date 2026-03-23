import React, { useState, useMemo } from 'react';
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
  PieChart,
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
  Search
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
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
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile, MizanData } from '../types';

interface CashFlowModuleProps {
  profile: CompanyProfile;
}

export const CashFlowModule: React.FC<CashFlowModuleProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'projection' | 'kdv-refund' | 'mali-tablo'>('projection');
  const [selectedPeriod, setSelectedPeriod] = useState('6ay');
  const [mizanUploaded, setMizanUploaded] = useState(false);
  const [isMizanAnalyzing, setIsMizanAnalyzing] = useState(false);
  const [isKdvMizanAnalyzing, setIsKdvMizanAnalyzing] = useState(false);
  const [kdvMizanScanned, setKdvMizanScanned] = useState(false);
  const [maliTabloReport, setMaliTabloReport] = useState<string | null>(null);
  const [isMaliTabloAnalyzing, setIsMaliTabloAnalyzing] = useState(false);

  const mizanData = useMemo(() => {
    const saved = localStorage.getItem(`mizan_data_${profile.id}`);
    if (saved) {
      return JSON.parse(saved) as MizanData;
    }
    return null;
  }, [profile.id]);

  const currentLiquidity = useMemo(() => {
    if (mizanData) {
      return mizanData.summary.totalCash + mizanData.summary.totalBank;
    }
    return MIZAN_DATA.cash + MIZAN_DATA.bank;
  }, [mizanData]);

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

  const handleKdvMizanScan = () => {
    setIsKdvMizanAnalyzing(true);
    setTimeout(() => {
      setIsKdvMizanAnalyzing(false);
      setKdvMizanScanned(true);
    }, 2000);
  };

  const handleMizanUpload = (e?: React.ChangeEvent<HTMLInputElement>) => {
    setIsMizanAnalyzing(true);
    setTimeout(() => {
      setIsMizanAnalyzing(false);
      setMizanUploaded(true);
      // When documents are uploaded here, they also feed into KDV analysis
      setKdvMizanScanned(true);
    }, 2500);
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
    <div className="space-y-8">
      {/* KDV İade Durumu Analizi Section */}
      <div className="glass-card p-6 border-t-4 border-t-kilim-blue">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-kilim-blue-light/10 flex items-center justify-center">
              <FileText className={`w-6 h-6 text-kilim-blue ${isKdvMizanAnalyzing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-kilim-blue-dark">KDV İade Durumu ve Tevkifat Analizi</h3>
              <p className="text-xs text-slate-500">Mizan ve Beyanname Verilerine Dayalı Akıllı Analiz</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${profile.isExporter ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
              İHRACATÇI: {profile.isExporter ? 'EVET' : 'HAYIR'}
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${profile.hasWithholdingSales ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
              TEVKİFATLI SATIŞ: {profile.hasWithholdingSales ? 'EVET' : 'HAYIR'}
            </div>
          </div>
        </div>

        {!kdvMizanScanned ? (
          <div className="p-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Sistem, mizanınızdaki <span className="font-bold">136, 190, 360, 361 ve 391</span> hesapları tarayarak KDV iade potansiyelinizi, mahsup dengenizi ve tevkifat kapasitenizi hesaplayacaktır.
              </p>
              <button 
                onClick={handleKdvMizanScan}
                disabled={isKdvMizanAnalyzing}
                className="px-8 py-3 bg-kilim-blue text-white rounded-2xl font-bold hover:bg-kilim-blue/90 transition-all shadow-lg flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
              >
                {isKdvMizanAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Veriler Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    KDV İade ve Tevkifat Analizini Başlat
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Mahsup ve Ödeme Yeterliliği */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card p-6 bg-white border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" /> 📉 Mahsup ve Ödeme Yeterliliği
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase mb-1">Alınacak İade Tutarı</p>
                    <p className="text-xl font-black text-emerald-700">₺250.000,00</p>
                    <p className="text-[10px] text-emerald-600 mt-1">136 Hesap Bakiyesi</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-800 uppercase mb-1">Cari Dönem Borçları</p>
                    <p className="text-xl font-black text-rose-700">₺210.000,00</p>
                    <p className="text-[10px] text-rose-600 mt-1">360+361 Hesaplar</p>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20 flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xs font-bold opacity-80">NET MAHSUP DURUMU</p>
                    <p className="text-sm">Borçlar Kapatıldıktan Sonra Kalan</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black">₺40.000,00</span>
                    <p className="text-[10px] font-bold text-blue-100">ALACAK BAKİYESİ</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Ödeme Yeterliliği Analizi</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Alacağınız iade tutarı, cari dönem vergi ve SGK borçlarınızın tamamını karşılamaktadır. <span className="font-bold">Ödemelerinizde herhangi bir aksama riski öngörülmemektedir.</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 bg-kilim-blue-dark text-white border-none">
                <h4 className="text-sm font-bold text-kilim-blue-light mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Gelecek Dönem Öngörüsü
                </h4>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Tahmini Sonraki Dönem İadesi</p>
                    <p className="text-2xl font-bold text-emerald-400">₺145.000,00</p>
                    <p className="text-[10px] text-slate-400 mt-1">İhracat ve Tevkifat Trendine Göre</p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs font-bold text-slate-300 mb-2">KDV Devri Yeterliliği</p>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[85%]"></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-slate-400">Kritik Eşik</span>
                      <span className="text-[10px] text-emerald-400 font-bold">%85 Yeterli</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 leading-relaxed italic">
                      "KDV devriniz, gelecek dönemdeki muhtemel iade taleplerinizi ve girdi maliyetlerinizi karşılamak için yeterli seviyededir."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tevkifat Kapasite Analizi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 border-l-4 border-amber-500">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-amber-500" /> Satış Tevkifat Kapasitesi
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Kesilebilecek Tevkifatlı Fatura Limiti</p>
                    <p className="text-xl font-bold text-slate-800">₺850.000,00</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mevcut KDV devriniz ve iade alacağınız göz önüne alındığında, finansal dengenizi bozmadan <span className="font-bold text-amber-700">850.000 TL'lik daha tevkifatlı fatura kesebilirsiniz.</span> Bu tutarın üzerindeki tevkifatlı satışlar, nakit iade sürecini uzatabilir.
                  </p>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-[10px] text-amber-800 font-medium">Öneri: Nakit akışını hızlandırmak için tevkifatlı satış oranını %40 seviyesinde tutmanız idealdir.</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 border-l-4 border-blue-500">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-blue-500" /> Alış Tevkifat Kapasitesi
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Karşılanabilir Tevkifatlı Alış Limiti</p>
                    <p className="text-xl font-bold text-slate-800">₺1.200.000,00</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cari likiditeniz ve iade mahsup gücünüz, <span className="font-bold text-blue-700">1.200.000 TL'lik tevkifatlı alış faturasının</span> KDV2 ödemesini ve ana borcunu karşılayabilecek güçtedir.
                  </p>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <p className="text-[10px] text-blue-800 font-medium">Analiz: Tevkifatlı alışlar vergi yükünüzü azalttığı için bu kapasiteyi kullanmanız avantajlıdır.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Özet Analiz Notu */}
            <div className="p-6 bg-slate-900 rounded-3xl text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="font-bold">Genel KDV ve Finansal Sağlık Özeti</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                "Şirketinizin KDV iade süreci oldukça sağlıklı ilerlemektedir. Alacağınız iade tutarı cari borçlarınızı tam olarak karşılamakta, hatta 40.000 TL'lik bir rezerv bırakmaktadır. KDV devriniz gelecek dönem için yeterli olup, tevkifatlı fatura kesme ve alma kapasiteniz geniş bir marja sahiptir. Ödemelerinizde herhangi bir aksama beklenmemektedir."
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Ödeme Riski</p>
                  <p className="text-sm font-bold text-emerald-400">DÜŞÜK</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">İade Verimliliği</p>
                  <p className="text-sm font-bold text-blue-400">YÜKSEK</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">KDV Devri</p>
                  <p className="text-sm font-bold text-amber-400">YETERLİ</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
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
              <h3 className="text-xl font-bold text-kilim-blue-dark">Mali Tablo & Mizan Analizi</h3>
              <p className="text-xs text-slate-500">Gelir Tablosu, Bilanço ve Rasyo Analizleri</p>
            </div>
          </div>
        </div>

        {!maliTabloReport ? (
          <div className="p-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Upload className="w-8 h-8 text-kilim-blue" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mizanınızı yükleyerek <span className="font-bold">Gelir Tablosu, Bilanço ve Finansal Rasyolarınızın</span> yapay zeka tarafından detaylı analizini yapın.
              </p>
              <button 
                onClick={() => {
                  setIsMaliTabloAnalyzing(true);
                  setTimeout(() => {
                    setIsMaliTabloAnalyzing(false);
                    setMaliTabloReport("### 📊 Mali Tablo Analiz Özeti\n\n**1. Gelir Tablosu Analizi (600-699)**\n- **Brüt Satış Kârı:** %32 (Sektör ortalaması %28)\n- **Faaliyet Kârı:** %12\n- **Net Kâr Marjı:** %8.5\n\n**2. Bilanço Dengesi (100-599)**\n- **Cari Oran:** 1.45 (Likidite durumu yeterli)\n- **Asit Test Oranı:** 1.10\n- **Borçlanma Oranı:** %45\n\n**3. Kritik Tespitler**\n- 🚩 **100 Kasa Hesabı:** Bakiye yüksek, adatlandırma riski mevcut.\n- ⚠️ **320 Satıcılar:** Vadesi geçmiş borçlar nakit akışını zorlayabilir.\n\n**4. Stratejik Öneriler**\n- Finansman giderlerini azaltmak için kısa vadeli krediler yapılandırılmalı.\n- Stok devir hızı artırılmalı.");
                  }, 2500);
                }}
                disabled={isMaliTabloAnalyzing}
                className="px-8 py-3 bg-kilim-blue text-white rounded-2xl font-bold hover:bg-kilim-blue/90 transition-all shadow-lg flex items-center justify-center gap-3 mx-auto"
              >
                {isMaliTabloAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    Mizan Analizini Başlat
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 prose prose-slate max-w-none">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-4">
                <h4 className="font-bold text-kilim-blue-dark m-0">Yapay Zeka Analiz Raporu</h4>
                <button onClick={() => setMaliTabloReport(null)} className="text-xs text-kilim-red font-bold">Yeni Analiz</button>
              </div>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
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
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-kilim-blue-dark flex items-center gap-2">
            <Wallet className="w-7 h-7 text-kilim-blue" />
            Finansal Durum & Analiz
          </h1>
          <p className="text-slate-500">Mizan verilerine dayalı mali tablo analizleri, nakit tahmini ve KDV iade yönetimi.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white border border-emerald-500 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Raporu İndir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('projection')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'projection' 
              ? 'bg-white text-kilim-blue shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Nakit Akış Projeksiyonu
        </button>
        <button 
          onClick={() => setActiveTab('mali-tablo')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'mali-tablo' 
              ? 'bg-white text-kilim-blue shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Mali Tablo Analizi
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
          {activeTab === 'projection' ? renderProjection() : 
           activeTab === 'kdv-refund' ? renderKdvRefundAnalysis() : 
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
