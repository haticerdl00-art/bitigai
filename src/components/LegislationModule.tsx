import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile } from '../types';
import { MEVZUAT_DATA } from '../data/legislationData';

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

export const LegislationModule: React.FC<LegislationModuleProps> = ({ profile, companies = [] }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("TÜMÜ");

  const filteredMevzuat = MEVZUAT_DATA.filter(m => filter === "TÜMÜ" || m.tur === filter);
  const selectedMevzuat = MEVZUAT_DATA.find(m => m.id === selectedId);

  const matchedCompanies = selectedMevzuat
    ? companies.map(f => ({ company: f, result: selectedMevzuat.eslestir(f) })).filter(e => e.result.eslesti)
    : [];

  const unaffectedCompanies = selectedMevzuat
    ? companies.filter(f => !selectedMevzuat.eslestir(f).eslesti)
    : [];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                    isSelected ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-transparent hover:border-slate-200'
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
                      <div className={`p-2 rounded-lg transition-transform ${isSelected ? 'rotate-180 bg-emerald-50 text-emerald-600' : 'text-slate-300'}`}>
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
                                    <span className="text-[10px] font-medium text-slate-400">{company.sector}</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {result.nedenler.map((n, idx) => (
                                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-500">
                                        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
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
                <AlertCircle className="w-5 h-5 text-emerald-400" />
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
                <div className="bg-white/10 p-3 rounded-xl">
                  <div className="text-2xl font-black text-emerald-400">
                    {companies.length > 0 ? filteredMevzuat.filter(m => m.etki === 'YÜKSEK').length : 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Yüksek Etki</div>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <div className="text-2xl font-black text-amber-400">
                    {companies.length > 0 ? filteredMevzuat.filter(m => m.etki === 'ORTA').length : 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Orta Etki</div>
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
                  acc[c.sector] = (acc[c.sector] || 0) + 1;
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
              "7491 Sayılı Kanun ile ilgili müşterilerinize göndereceğiniz bilgilendirme metni hazırlandı. 
              İhracatçı firmalarınız için özel bir vurgu ekledim. Onayınızla toplu e-posta gönderimi başlatılabilir."
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
