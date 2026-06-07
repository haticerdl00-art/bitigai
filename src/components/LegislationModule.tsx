import React, { useState, useEffect } from 'react';
import { 
  Gavel, 
  AlertCircle, 
  TrendingUp, 
  Filter, 
  Search, 
  Building2, 
  ChevronDown, 
  ChevronUp,
  ShieldCheck,
  Cpu,
  Trophy,
  Scale,
  Zap,
  Clock,
  ArrowRight,
  FileText,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile } from '../types';
import { MEVZUAT_DATA, LegislationItem } from '../data/legislationData';

interface LegislationModuleProps {
  profile?: CompanyProfile;
  companies?: CompanyProfile[];
}

const turConfig = {
  "VERGİ": { color: "text-blue-600", bg: "bg-blue-50", icon: Scale },
  "SGK": { color: "text-emerald-600", bg: "bg-emerald-50", icon: ShieldCheck },
  "E-DÖNÜŞÜM": { color: "text-purple-600", bg: "bg-purple-50", icon: Cpu },
  "TEŞVİK": { color: "text-orange-600", bg: "bg-orange-50", icon: Trophy },
  "İŞ HUKUKU": { color: "text-cyan-600", bg: "bg-cyan-50", icon: Gavel }
};

// Taslak/Simüle Edilen Yeni Kanun Detayları
const SIMULATED_LAW_DRAFT: LegislationItem = {
  id: 7530,
  tarih: "07.06.2026", // Today's simulated date
  baslik: "7530 Sayılı Mükellef Yatırım Teşvikleri ve Enflasyon Düzeltmesi Kanunu",
  kaynak: "Resmi Gazete (No: 7530)",
  tur: "VERGİ",
  etki: "YÜKSEK",
  ozet: "7530 Sayılı Kanun ve buna bağlı Genel Tebliğ kapsamında; tüm bilanço esasına tabi sermaye şirketleri (LTD ve AŞ) için enflasyon düzeltmesi işlemlerinde özel tevsik muafiyetleri ve amortisman kolaylıkları getirilmiştir. Yatırım teşvik belgesine sahip imalat, ihracat ve teknoloji firmaları, aldıkları yeni makine-teçhizat için %100'e varan hızlandırılmış amortisman ve KDV iadesi haklarından doğrudan yararlanabilecektir.",
  eslestir: (f: CompanyProfile) => {
    const nedenler: string[] = [];
    if (f.legalStatus === 'LTD' || f.legalStatus === 'AŞ') {
      nedenler.push("Sermaye şirketi (LTD/AŞ) — Enflasyon düzeltmesi işlemlerinde özel kolaylaştırılmış amortisman katsayılarından yararlanabilir.");
    }
    if (f.sector === "Teknoloji" || f.sector === "İmalat" || f.sector === "Yazılım / Teknoloji" || f.isExporter) {
      nedenler.push("Yatırım Teşviki Kapsamında — İmalat, teknoloji ve ihracat altyapısındaki yatırımlar için %100 hızlandırılmış amortisman ve KDV iade imkanı.");
    }
    return {
      eslesti: nedenler.length > 0,
      nedenler
    };
  }
};

export const LegislationModule: React.FC<LegislationModuleProps> = ({ profile, companies = [] }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("TÜMÜ");
  
  // Süreç Aşama Durumu (localStorage tabanlı kalıcılık)
  const [simStage, setSimStage] = useState<number>(() => {
    const saved = localStorage.getItem('7530_legislation_stage');
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    localStorage.setItem('7530_legislation_stage', simStage.toString());
  }, [simStage]);

  // Aşamaya göre birleştirilmiş mevzuat listesi
  // Sadece Aşama 4 olduğunda ana tebliğ listesine tam analizle dahil edilir!
  const allMevzuat = simStage === 4 ? [SIMULATED_LAW_DRAFT, ...MEVZUAT_DATA] : MEVZUAT_DATA;

  const filteredMevzuat = allMevzuat.filter(m => filter === "TÜMÜ" || m.tur === filter);
  const selectedMevzuat = allMevzuat.find(m => m.id === selectedId);

  const matchedCompanies = selectedMevzuat
    ? companies.map(f => ({ company: f, result: selectedMevzuat.eslestir(f) })).filter(e => e.result.eslesti)
    : [];

  const unaffectedCompanies = selectedMevzuat
    ? companies.filter(f => !selectedMevzuat.eslestir(f).eslesti)
    : [];

  // Aşama Bilgileri
  const stages = [
    {
      level: 1,
      title: "Planlama & Sunum",
      statusLabel: "Meclis Komisyonunda Görüşülüyor",
      desc: "Mükellefleri ilgilendiren Enflasyon Düzeltmesi Kolaylıkları ve Yatırım Teşvikleri Kanun Teklifi planlama komisyonuna sunulmuştur ve görüşmeleri sürmektedir.",
      headerText: "📋 Enflasyon Düzeltmesi ve Yatırım Teşvikleri Kanun Teklifi Meclis'te Görüşülüyor.",
      color: "border-amber-400 bg-amber-50/50 text-amber-800",
      accent: "bg-amber-500"
    },
    {
      level: 2,
      title: "Meclis Onayı",
      statusLabel: "Meclis Plan Bütçe Kurulunda Kabul Edildi",
      desc: "Kanun teklifi Türkiye Büyük Millet Meclisi Genel Kurulu tarafından resmen kabul edilmiştir. Cumhurbaşkanlığı onay sürecine aktarılmıştır.",
      headerText: "✅ Enflasyon Düzeltmesi ve Yatırım Teşvikleri Kanun Teklifi Meclis'te Kabul Edildi.",
      color: "border-orange-400 bg-orange-50/50 text-orange-850",
      accent: "bg-orange-500"
    },
    {
      level: 3,
      title: "Resmi Gazete",
      statusLabel: "Resmi Gazete'de Yayınlandı",
      desc: "Onaylanan teklif kanunlaşarak Resmi Gazete mükerrer sayısında 7530 sayılı kanun numarasıyla yayımlanmıştır. Detaylı tebliğ hazırlığı sürmektedir.",
      headerText: "📰 Enflasyon Düzeltmesi ve Yatırım Teşviklerine İlişkin 7530 Sayılı Kanun Resmi Gazete'de Yayınlandı.",
      color: "border-blue-400 bg-blue-50/50 text-blue-900",
      accent: "bg-blue-600"
    },
    {
      level: 4,
      title: "Yürürlük / Tebliğ",
      statusLabel: "Uygulama Süreci Başladı (Tebliğ Portalı)",
      desc: "GİB tarafından ilgili uygulama tebliği ayrıntılarıyla yayımlanmış, aktif yürürlük süreci başlamıştır. Detaylar ve portföy eşleştirme analizimiz listemize eklenmiştir.",
      headerText: "🚀 7530 Sayılı Kanun Uygulama Süreci Başladı. İlgili tebliğ tüm ayrıntıları ve müşteri eşleştirmeleriyle sayfamıza eklenmiştir!",
      color: "border-emerald-500 bg-emerald-50/50 text-emerald-900",
      accent: "bg-emerald-600"
    }
  ];

  const currentStageInfo = stages[simStage - 1];

  return (
    <div className="space-y-8 pb-20">
      
      {/* 🔴 CANLI MECLİS & MEVZUAT SÜREÇ TAKİP MERKEZİ (ÖNERİ LENEN BÖLÜMÜ) */}
      <div className="glass-card overflow-hidden border border-slate-200/80 shadow-md rounded-[2.5rem] bg-white">
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  Günlük Canlı Süreç Akış Takibi (Simülatör)
                </h3>
                <h4 className="text-xl font-bold text-slate-800">
                  TBMM & Resmi Gazete Kanun Yolculuğu
                </h4>
              </div>
            </div>
            
            {/* Simülatör Tuşları */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-2">Aşama Değiştir:</span>
              <button 
                onClick={() => setSimStage(prev => Math.max(1, prev - 1))}
                disabled={simStage === 1}
                className="p-2 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 disabled:opacity-40 transition-all font-bold text-xs flex items-center gap-1"
                title="Önceki Aşamaya Dön"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Geri
              </button>
              <button 
                onClick={() => setSimStage(prev => Math.min(4, prev + 1))}
                disabled={simStage === 4}
                className="py-2 px-3.5 rounded-xl bg-kilim-blue text-white hover:bg-kilim-blue-dark disabled:bg-slate-300 disabled:text-slate-400 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                title="Mevzuat Sürecini İlerlet"
              >
                İlerlet <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {stages.map((stage) => {
              const isActive = simStage === stage.level;
              const isPast = simStage > stage.level;
              return (
                <div 
                  key={stage.level} 
                  onClick={() => setSimStage(stage.level)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    isActive 
                      ? 'border-kilim-blue bg-blue-50/50 ring-4 ring-kilim-blue/5' 
                      : isPast 
                      ? 'border-emerald-200 bg-emerald-50/20 opacity-80' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aşama {stage.level}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-kilim-blue animate-pulse' : isPast ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <h4 className={`text-xs font-black ${isActive ? 'text-kilim-blue-dark' : 'text-slate-700'}`}>{stage.title}</h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{stage.statusLabel}</p>
                </div>
              );
            })}
          </div>

          {/* Dinamik Canlı Duyuru Kutusu (Sayfadaki İlgili Mesajlar) */}
          <div className={`p-5 rounded-3xl border-2 transition-all duration-300 ${currentStageInfo.color}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0 ${currentStageInfo.accent}`}>
                {simStage === 1 && <Clock className="w-5 h-5" />}
                {simStage === 2 && <Gavel className="w-5 h-5" />}
                {simStage === 3 && <FileText className="w-5 h-5" />}
                {simStage === 4 && <Sparkles className="w-5 h-5" />}
              </div>
              <div className="space-y-1.5 flex-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-white border inline-block`}>
                  {currentStageInfo.statusLabel}
                </span>
                <h4 className="text-base font-black leading-snug">
                  {currentStageInfo.headerText}
                </h4>
                <p className="text-xs leading-relaxed opacity-90 max-w-4xl">
                  {currentStageInfo.desc}
                </p>
                
                {simStage < 4 ? (
                  <div className="pt-2 text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> 
                    <span>Mevzuat tebliği henüz yürürlüğe girmediği için aşağıdaki listeye eklenmemiştir. Aşama 4'e ilerletildiğinde tüm müşteri analiziyle eklenecektir.</span>
                  </div>
                ) : (
                  <div className="pt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mevzuat başarıyla yürürlüğe girdi! İpuçları detaylarıyla tebliğ listemize (7530 Sayılı Kanun) eklenmiştir.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h2 className="text-3xl font-bold text-kilim-blue-dark tracking-tight">Mevzuat & Portföy Eşleştirme</h2>
          <p className="text-slate-500 mt-1">Yayınlanan yeni mevzuatların müşteri portföyünüz üzerindeki etkisini anlık analiz edin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {["TÜMÜ", "VERGİ", "SGK", "TEŞVİK"].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === t ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Legislation List */}
        <div className="lg:col-span-7 space-y-4">
          {filteredMevzuat.map((m) => {
            const isSelected = selectedId === m.id;
            const config = turConfig[m.tur as keyof typeof turConfig] || turConfig["VERGİ"];
            const affectedCount = companies.filter(f => m.eslestir(f).eslesti).length;

            return (
              <div key={m.id} className="group">
                <motion.div
                  layout
                  onClick={() => setSelectedId(isSelected ? null : m.id)}
                  className={`glass-card overflow-hidden cursor-pointer transition-all border-2 ${
                    m.id === 7530 
                      ? isSelected 
                        ? 'border-emerald-500 shadow-xl bg-emerald-50/10' 
                        : 'border-emerald-400 bg-emerald-50/5 hover:border-emerald-500' 
                      : isSelected 
                      ? 'border-kilim-blue shadow-xl shadow-kilim-blue/10 bg-blue-50/5' 
                      : 'border-transparent hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="p-5 flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}>
                      <config.icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                          {m.tur}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          m.etki === 'YÜKSEK' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {m.etki} ETKİ
                        </span>
                        {m.id === 7530 && (
                          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full animate-pulse">
                            YENİ TEBLİĞ
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold">{m.tarih}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 leading-snug truncate">{m.baslik}</h3>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <div className="hidden sm:block">
                        <div className={`text-xl font-black ${affectedCount > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                          {affectedCount}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Müşteri</div>
                      </div>
                      <div className={`p-2 rounded-lg transition-transform ${isSelected ? 'rotate-180 bg-slate-100' : 'text-slate-300'}`}>
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 bg-slate-50/50"
                      >
                        <div className="p-5">
                          <div className="flex gap-3 items-start bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                            <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Özet & Analiz</div>
                              <p className="text-sm text-slate-600 leading-relaxed">{m.ozet}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Etkilenen Müşteriler</h4>
                            <button className="text-[10px] font-bold text-emerald-600 hover:underline">Tümüne Bildirim Gönder</button>
                          </div>

                          <div className="space-y-2">
                            {companies.length === 0 ? (
                              <div className="text-center py-6 text-slate-400 text-sm italic">
                                Kayıtlı firma bulunamadı. Lütfen önce firma ekleyiniz.
                              </div>
                            ) : matchedCompanies.length > 0 ? (
                              matchedCompanies.map(({ company, result }) => (
                                <div key={company.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                        {company.title.charAt(0)}
                                      </div>
                                      <span className="text-sm font-bold text-slate-800">{company.title}</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400">{company.sector || company.legalStatus}</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {result.nedenler.map((n, idx) => (
                                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                        {n}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-slate-400 text-sm italic">
                                Bu mevzuat portföyünüzdeki firmaları etkilemiyor.
                              </div>
                            )}
                          </div>

                          {/* Unaffected Companies */}
                          {unaffectedCompanies.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3 flex-wrap">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Etkilenmeyen:</span>
                              {unaffectedCompanies.map(f => (
                                <span key={f.id} className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">
                                  ✓ {f.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Right: Insights & Stats */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 bg-slate-900 text-white border-none relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h4 className="font-bold">Portföy Risk Analizi</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {companies.length > 0 ? (
                  `Portföyünüzdeki ${companies.length} firma için güncel mevzuat taraması yapıldı. ${filteredMevzuat.length} yeni mevzuat başlığı inceleniyor.`
                ) : (
                  "Henüz kayıtlı firma bulunmadığı için analiz yapılamıyor. Lütfen firma ekleyiniz."
                )}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                  <div className="text-2xl font-black text-emerald-400">
                    {companies.length > 0 ? filteredMevzuat.filter(m => m.etki === 'YÜKSEK').length : 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yüksek Etki</div>
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                  <div className="text-2xl font-black text-amber-400">
                    {companies.length > 0 ? filteredMevzuat.filter(m => m.etki === 'ORTA').length : 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orta Etki</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          <div className="glass-card p-6">
            <h4 className="font-bold text-kilim-blue-dark mb-4 text-sm uppercase tracking-wider">Sektörel Dağılım</h4>
            <div className="space-y-4">
              {companies.length > 0 ? (
                Object.entries(companies.reduce((acc, c) => {
                  acc[c.sector || 'Diğer'] = (acc[c.sector || 'Diğer'] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).map(([sector, count]) => (
                  <div key={sector} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">{sector}</span>
                      <span className="text-slate-400">{count} Firma</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-kilim-blue" style={{ width: `${(count / companies.length) * 100}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">Veri bulunamadı.</p>
              )}
            </div>
          </div>

          <div className="glass-card p-6 border-emerald-100 bg-emerald-50/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-slate-800">AI Tavsiyesi</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              {simStage === 4 
                ? `"Yeni yürürlüğe giren 7530 Sayılı Kanun (Yatırım Teşviki ve Enflasyon Düzeltmesi) ile ilgili portföyünüzdeki uyumlu firmalar belirlendi. Doğrudan bilgilendirme bülteni hazırladım."`
                : `"7491 Sayılı Kanun ile ilgili müşterilerinize göndereceğiniz bilgilendirme metni hazırlandı. İhracatçı firmalarınız için özel bir vurgu ekledim. Onayınızla toplu e-posta gönderimi başlatılabilir."`
              }
            </p>
            <button className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-200">
              Bilgilendirme Taslağını Gör
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
