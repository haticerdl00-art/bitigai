import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Info,
  ArrowRight,
  ShieldAlert,
  Zap,
  TrendingUp,
  Search,
  Target,
  Activity,
  Plus,
  Trash2,
  Edit2,
  Save,
  X as CloseIcon,
  Building2,
  Calculator,
  RefreshCw,
  Sparkles,
  FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile } from '../types';
import { fetchSGKParameters, generateIncentiveReport } from '../services/geminiService';
import Markdown from 'react-markdown';

interface SGKModuleProps {
  profile: CompanyProfile;
}

// ─────────────────────────────────────────────
// TEŞVİK TANIMLARI (Merkezi Liste)
// ─────────────────────────────────────────────
const TESVIK_LISTESI = [
  {
    id: '5510',
    kod: "5510",
    baslik: "5510 Sayılı Kanun (%5 İndirim)",
    renk: "#10b981", // basari
    aciklama: "Borçsuzluk şartı sağlandığında tüm personel için geçerlidir.",
    sartlar: ["Vergi/SGK borcu olmamalı", "MPHB zamanında verilmeli"],
    kontrol: (f: CompanyProfile, params: any, hasDebt: boolean) => {
      const amountPerWorker = params.incentives.find((i: any) => i.id === '5510')?.amountPerWorker || 1651.50;
      const totalAmount = f.hrProfile.totalWorkers * amountPerWorker;
      return {
        uygun: !hasDebt,
        durum: hasDebt ? 'Riskli' : 'Uygun',
        amount: totalAmount,
        not: hasDebt ? '361 hesabındaki borç nedeniyle bu indirim yanabilir!' : 'Tüm personel için uygulanabilir.'
      };
    }
  },
  {
    id: '6111',
    kod: "6111",
    baslik: "6111 Sayılı Kanun (Genç & Kadın İstihdamı)",
    renk: "#10b981", // basari
    aciklama: "18–29 yaş erkek veya 18+ yaş kadın çalışanlar için prim desteği.",
    sartlar: ["Son 6 ay ortalamasına ilave olmalı", "Çalışan 18-29 yaş erkek veya 18+ kadın olmalı"],
    kontrol: (f: CompanyProfile, params: any) => {
      const femaleWorkers = f.hrProfile.femaleWorkers;
      const amountPerWorker = params.incentives.find((i: any) => i.id === '6111')?.amountPerWorker || 6800;
      const totalAmount = femaleWorkers * amountPerWorker;
      return {
        uygun: femaleWorkers > 0,
        durum: 'Önerilen',
        amount: totalAmount,
        not: femaleWorkers > 0 ? `${femaleWorkers} kadın çalışanınız için en yüksek avantajı sağlar.` : 'Uygun personel bulunamadı.'
      };
    }
  },
  {
    id: '4857',
    kod: "4857",
    baslik: "4857/14. Madde (Engelli Teşviki)",
    renk: "#f59e0b", // uyari
    aciklama: "Engelli kontenjanı kapsamında tam prim desteği.",
    sartlar: ["Engelli raporu sisteme işlenmiş olmalı", "Kontenjan dahilinde olmalı", "Borçsuzluk şartı"],
    kontrol: (f: CompanyProfile, params: any) => {
      const disabledWorkers = f.hrProfile.personnelGroups.disabled;
      const totalWorkers = f.hrProfile.totalWorkers;
      const amountPerWorker = params.incentives.find((i: any) => i.id === '4857')?.amountPerWorker || 6800;
      const totalAmount = disabledWorkers * amountPerWorker;
      
      let status = 'Aktif';
      let note = 'Engelli kontenjanı kapsamında tam prim desteği.';
      
      if (totalWorkers >= 50) {
        const quota = Math.round(totalWorkers * 0.03);
        status = 'Zorunlu';
        note = `${totalWorkers} çalışan — %3 kota zorunlu (${quota} kişi). ${disabledWorkers > 0 ? 'Mevcut engelli istihdamı ile destek hakkı var.' : 'Kontenjan açığı bulunuyor.'}`;
      }

      return {
        uygun: disabledWorkers > 0 || totalWorkers >= 50,
        durum: status,
        amount: totalAmount,
        not: note
      };
    }
  },
  {
    id: '17103',
    kod: "17103",
    baslik: "17103 Sayılı Kanun (İmalat & Bilişim)",
    renk: "#f59e0b", // uyari
    aciklama: "İmalat veya bilişim sektöründe ilave istihdam için prim desteği.",
    sartlar: ["Sektör: İmalat veya Teknoloji/Bilişim", "İlave istihdam şartı", "Süre: 12 ay"],
    kontrol: (f: CompanyProfile, params: any) => {
      const isEligibleSector = ['İmalat', 'Teknoloji', 'Bilişim'].includes(f.sector || '');
      const amountPerWorker = params.incentives.find((i: any) => i.id === '17103')?.amountPerWorker || 3200;
      const totalAmount = f.hrProfile.totalWorkers * amountPerWorker; // Potential gain assuming all are additional
      return {
        uygun: isEligibleSector,
        durum: 'Önerilen',
        amount: totalAmount,
        not: isEligibleSector ? 'Sektörel avantaj kapsamında ilave istihdam için başvurulabilir.' : 'Sektör uyumlu değil.'
      };
    }
  },
  {
    id: '27103',
    kod: "27103",
    baslik: "27103 Sayılı Kanun (İlave İstihdam)",
    renk: "#64748b", // slate
    aciklama: "İlave istihdam edilen her bir sigortalı için sağlanan prim desteği.",
    sartlar: ["İlave istihdam şartı", "Ortalama sigortalı sayısına ilave", "Borçsuzluk"],
    kontrol: (f: CompanyProfile, params: any) => {
      const amountPerWorker = params.incentives.find((i: any) => i.id === '27103')?.amountPerWorker || 4500;
      return {
        uygun: true,
        durum: 'Bilgi',
        amount: f.hrProfile.totalWorkers * amountPerWorker,
        not: 'İlave istihdam edilen her bir sigortalı için sağlanan prim desteği.'
      };
    }
  },
  {
    id: '3294',
    kod: "3294",
    baslik: "3294 Sayılı Kanun (Sosyal Yardım Alanlar)",
    renk: "#64748b", // slate
    aciklama: "Sosyal yardım alanların istihdamı halinde sağlanan prim desteği.",
    sartlar: ["Sosyal yardım alıyor olması", "İşkur kaydı", "İlave istihdam"],
    kontrol: (f: CompanyProfile, params: any) => {
      const amountPerWorker = params.incentives.find((i: any) => i.id === '3294')?.amountPerWorker || 5200;
      return {
        uygun: true,
        durum: 'Bilgi',
        amount: f.hrProfile.totalWorkers * amountPerWorker,
        not: 'Sosyal yardım alanların istihdamı halinde sağlanan prim desteği.'
      };
    }
  },
  {
    id: 'minwage',
    kod: "ASG",
    baslik: "Asgari Ücret Desteği (2026)",
    renk: "#3b82f6", // bilgi
    aciklama: "Günlük 33,33 TL üzerinden tüm personel için hesaplanır.",
    sartlar: ["Otomatik uygulanır", "Bildirim süresinde yapılmalı"],
    kontrol: (f: CompanyProfile) => {
      const amount = f.hrProfile.totalWorkers * 1000;
      return {
        uygun: true,
        durum: 'Otomatik',
        amount: amount,
        not: 'Günlük 33,33 TL üzerinden tüm personel için hesaplanır.'
      };
    }
  }
];

export const SGKModule: React.FC<SGKModuleProps> = ({ profile }) => {
  // Current date info based on metadata (2026-03-03)
  const currentDate = new Date('2026-03-03');
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  
  const currentMonthIndex = currentDate.getMonth();
  const currentMonthName = monthNames[currentMonthIndex];
  const prevMonthName = monthNames[currentMonthIndex === 0 ? 11 : currentMonthIndex - 1];
  const currentYear = currentDate.getFullYear();

  const [activeTab, setActiveTab] = useState<'incentives'>('incentives');
  const [mizanUploaded, setMizanUploaded] = useState(false);
  const [isMizanAnalyzing, setIsMizanAnalyzing] = useState(false);
  const [hasMizanDebt, setHasMizanDebt] = useState(false);
  const [sgkParams, setSgkParams] = useState<any>(null);
  const [isParamsLoading, setIsParamsLoading] = useState(true);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const downloadIskurTemplate = () => {
    const data = [
      ["TC Kimlik No", "Ad Soyad", "Öğrenim Durumu", "Meslek Kodu", "Çalışılan Gün Sayısı", "Brüt Ücret"],
      ["12345678901", "Örnek Çalışan", "Lisans", "2411.02", "30", "33030.00"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "İşgücü Çizelgesi");
    XLSX.writeFile(wb, "iskur_isgucu_cizelgesi_taslak.xlsx");
  };

  useEffect(() => {
    const loadParams = async () => {
      setIsParamsLoading(true);
      const params = await fetchSGKParameters();
      if (params) {
        setSgkParams(params);
      }
      setIsParamsLoading(false);
    };
    loadParams();
  }, []);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Use the parameters from our smart calculation (which includes fallbacks)
      const paramsToUse = calculateSmartIncentives.params;
      const report = await generateIncentiveReport(profile, paramsToUse);
      setAiReport(report);
    } catch (error) {
      console.error("Report generation failed:", error);
      setAiReport("Rapor oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleMizanCheck = () => {
    setIsMizanAnalyzing(true);
    setTimeout(() => {
      setIsMizanAnalyzing(false);
      setMizanUploaded(true);
      // Simulate finding a debt in 361 account for demo purposes
      setHasMizanDebt(true);
    }, 2000);
  };

  const deadlines = [
    { task: 'Şubat Ayı MPHB (SGK+Vergi)', date: '26 Mart', status: 'Kritik Eşik', color: 'text-rose-600', bg: 'bg-rose-50' },
    { task: 'Şubat Ayı SGK Ödemesi', date: '31 Mart', status: 'Bekliyor', color: 'text-amber-600', bg: 'bg-amber-50' },
    { task: 'İŞKUR Çizelgesi Girişi', date: '31 Mart', status: 'Bekliyor', color: 'text-amber-600', bg: 'bg-amber-50' },
    { task: 'Eksik Gün Bildirimleri', date: '26 Mart', status: 'Kritik', color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const calculateSmartIncentives = useMemo(() => {
    const totalWorkers = profile.hrProfile.totalWorkers;
    const retiredWorkers = profile.hrProfile.personnelGroups.retired;
    
    const incentives: any[] = [];
    let totalPotentialGain = 0;

    // Use dynamic parameters if available, else fallback to defaults
    const params = sgkParams || {
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

    // Calculate incentives from the central list
    TESVIK_LISTESI.forEach(t => {
      const res = t.kontrol(profile, params, hasMizanDebt);
      if (res.uygun) {
        incentives.push({
          id: t.id,
          name: t.baslik,
          amount: res.amount,
          status: res.durum,
          desc: res.not,
          conditions: t.sartlar
        });
        if (res.durum !== 'Riskli') {
          totalPotentialGain += res.amount;
        }
      }
    });

    // SGDP - Retired (Special case as it's not a standard incentive but a cost management)
    if (retiredWorkers > 0) {
      const perWorkerSGDP = 3200;
      const totalSGDP = retiredWorkers * perWorkerSGDP;
      incentives.push({
        id: 'sgdp',
        name: 'Sosyal Güvenlik Destek Primi (SGDP)',
        amount: totalSGDP,
        status: 'Bilgi',
        desc: `${retiredWorkers} emekli çalışanınız için SGDP maliyet yönetimi aktiftir.`,
        conditions: ['Emekli çalışan bildirimi doğru yapılmalı']
      });
    }

    return { incentives, totalPotentialGain, params };
  }, [profile, hasMizanDebt, sgkParams]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header with Dynamic Time Analysis */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-kilim-blue-dark flex items-center gap-2">
            <Users className="w-8 h-8 text-kilim-blue" />
            SGK Otomasyon & Teşvik Merkezi
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> <strong>İşlem Ayı:</strong> {currentMonthName} {currentYear}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> <strong>Beyan Ayı:</strong> {prevMonthName} {currentYear}</span>
          </div>
        </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-[10px] font-bold mt-2">
              <AlertTriangle className="w-3 h-3" />
              Kritik Eşik: MPHB Bildirimi için son 23 gün!
            </div>
          </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-full md:w-fit">
        <button
          onClick={() => setActiveTab('incentives')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'incentives' 
              ? 'bg-white text-kilim-blue shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Teşvik Uyumluluk Raporu
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'incentives' && (
          <motion.div
            key="incentives"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* 🤖 Akıllı SGK Teşvik Optimizasyonu */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kazanç Özeti */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-kilim-blue-dark text-white p-8 rounded-3xl shadow-xl border border-kilim-blue/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-kilim-blue/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-kilim-blue/30 transition-all" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-kilim-blue rounded-xl flex items-center justify-center mb-6 shadow-lg">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-[10px] font-bold text-kilim-blue-light uppercase tracking-widest mb-2">Maksimum Kazanç</p>
                    <h3 className="text-4xl font-black mb-2 text-blue-400">₺{(calculateSmartIncentives.totalPotentialGain || 0).toLocaleString('tr-TR')}</h3>
                    <p className="text-[10px] text-kilim-blue-light/60 italic">2026 Mevzuatına Göre Analiz Edildi</p>
                  </div>
                </div>

                {/* Risk Analizi */}
                <div className={`p-6 rounded-3xl border ${hasMizanDebt ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasMizanDebt ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {hasMizanDebt ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${hasMizanDebt ? 'text-rose-900' : 'text-emerald-900'}`}>Risk Analizi</h4>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">361 Hesap Kontrolü</p>
                    </div>
                  </div>
                  
                  {hasMizanDebt ? (
                    <div className="space-y-3">
                      <p className="text-xs text-rose-700 leading-relaxed font-medium">Mizanda ödenmemiş borç tespit edildi. %5 indirim risk altında!</p>
                      <div className="p-3 bg-white/50 rounded-xl border border-rose-200">
                        <p className="text-[10px] text-rose-600 font-bold">Tahmini Kayıp: ₺{(profile.hrProfile.totalWorkers * 1651.50).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 font-medium">Borç kaydı bulunamadı. Teşvikleriniz güvende.</p>
                  )}
                  
                  {!mizanUploaded && !hasMizanDebt && (
                    <button 
                      onClick={handleMizanCheck}
                      disabled={isMizanAnalyzing}
                      className="w-full mt-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isMizanAnalyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                      MİZAN KONTROLÜ YAP
                    </button>
                  )}
                </div>
              </div>

              {/* Teşvik Detayları */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Uyumlu Teşvikler</h4>
                    <span className="text-[10px] font-bold text-slate-400">{calculateSmartIncentives.incentives.length} Aktif Madde</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {calculateSmartIncentives.incentives.map((inc) => (
                      <div key={inc.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            inc.status === 'Önerilen' ? 'bg-emerald-50 text-emerald-600' :
                            inc.status === 'Riskli' ? 'bg-rose-50 text-rose-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{inc.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{inc.desc}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">₺{(inc.amount || 0).toLocaleString('tr-TR')}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            inc.status === 'Önerilen' ? 'bg-emerald-100 text-emerald-700' :
                            inc.status === 'Riskli' ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{inc.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hap Notlar */}
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                  <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Operasyonel Notlar
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex gap-3">
                      <div className="w-1 h-full bg-amber-400 rounded-full" />
                      <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                        Şubat ayı 28 gün! Eksik günü olmayan personeli 30 gün üzerinden bildirmeyi unutma.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-1 h-full bg-rose-400 rounded-full" />
                      <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                        İşe giriş/çıkışlarda 10 günlük bildirim süresine dikkat!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

      {/* AI Incentive Report Modal */}
      <AnimatePresence>
        {aiReport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-kilim-blue text-white">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <h3 className="text-xl font-bold">AI Teşvik ve Destek Analiz Raporu</h3>
                </div>
                <button onClick={() => setAiReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="markdown-body">
                  <Markdown>{aiReport}</Markdown>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setAiReport(null)}
                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 📢 AYIN KRİTİK NOTU */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 glass-card overflow-hidden border-l-4 border-l-amber-500"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-kilim-blue-light/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-kilim-blue" />
              </div>
              <h3 className="text-lg font-bold text-kilim-blue-dark uppercase tracking-tight">📢 AYIN KRİTİK NOTU ({currentMonthName} 2026)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Gün Hesaplama Kuralları
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-slate-600 list-disc pl-4">
                    <li><strong>Şubat Ayı (28 Gün):</strong> Eksik günü olmayan personel <strong>30 gün</strong> üzerinden bildirilir.</li>
                    <li><strong>Eksik Gün Varsa:</strong> Formül <code>28 - Eksik Gün</code> şeklinde uygulanır.</li>
                    <li><strong>31 Çeken Aylar:</strong> Eksik gün yoksa 30, varsa 31 gün üzerinden hesaplama yapılır.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="font-bold text-rose-900 text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    Yasal Süre & İPC Uyarıları
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-rose-800 list-disc pl-4">
                    <li><strong>İşe Giriş:</strong> En geç çalışmaya başlamadan 1 gün önce.</li>
                    <li><strong>İşten Çıkış:</strong> Ayrılış tarihinden itibaren en geç 10 gün içinde.</li>
                    <li><strong>Süre Aşımı:</strong> Her bir bildirim için asgari ücret tutarında İPC riski!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 📅 YAKLAŞAN SON TARİHLER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4 glass-card p-6"
        >
          <h3 className="font-bold text-kilim-blue-dark mb-4 flex items-center gap-2 uppercase text-sm tracking-wider">
            <Calendar className="w-5 h-5 text-kilim-blue" />
            📅 Yaklaşan Son Tarihler
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-3 py-2">İşlem</th>
                  <th className="px-3 py-2">Son Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deadlines.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 font-medium text-slate-700">{item.task}</td>
                    <td className="px-3 py-3">
                      <span className={`font-bold ${item.color}`}>{item.date}</span>
                      <div className="text-[9px] opacity-60 uppercase">{item.status}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* 🔔 Yasal Uyarı & Notlar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-12"
        >
          <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
            <h4 className="text-sm font-bold text-rose-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> 🔔 Yasal Uyarı & Notlar
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <li className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <p className="text-[11px] text-rose-900 leading-tight"><strong>Resmi Tatil Mesaisi:</strong> Bayramlarda çalışılan her gün için personele <strong>+1 tam yevmiye</strong> (toplam 2) ödenmelidir.</p>
              </li>
              <li className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <p className="text-[11px] text-rose-900 leading-tight"><strong>Hafta Tatili:</strong> 6 gün çalışan işçinin 7. gün 24 saat kesintisiz dinlenme hakkı vardır. Çalıştırılırsa mesai hesaplanır.</p>
              </li>
              <li className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <p className="text-[11px] text-rose-900 leading-tight"><strong>Normal Çalışma:</strong> Haftalık süre 45 saattir. Aşan her saat <strong>%50 zamlı</strong> ödenir.</p>
              </li>
            </ul>
          </div>
        </motion.div>


        {/* 📋 İŞKUR VE DİĞER BİLDİRİMLER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-12 glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-kilim-blue-light/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-kilim-blue" />
            </div>
            <h3 className="text-lg font-bold text-kilim-blue-dark uppercase tracking-tight">📋 İŞKUR VE PERİYODİK BİLDİRİMLER</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">İŞKUR Aylık İşgücü Çizelgesi</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">10 ve üzeri işçi çalıştıran işletmeler için son gün <strong>31 Mart</strong>. Sisteme girilmeyen çizelgeler ileride teşvik yasaklılığına yol açabilir.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Engelli/Eski Hükümlü Kontenjanı</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">50 ve üzeri çalışanı olan işyerlerinde %3 engelli istihdam zorunluluğunu Mart ayı bordrosu öncesi kontrol edin.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl text-white">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Stratejist Notu</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "Mart ayı, yılın ilk çeyreğinin kapandığı aydır. Bu dönemde yapılacak hatalı bir SGK meslek kodu bildirimi veya eksik gün nedeni, ileride yapılacak bir denetimde 5 yıllık geriye dönük İPC riski oluşturabilir. Özellikle '01-İstirahat' kodlu eksik günlerde vizite sistemindeki onayları kontrol etmeyi unutmayın."
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )}

  </AnimatePresence>
</div>
  );
};
