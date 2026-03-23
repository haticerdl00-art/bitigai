import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  AlertTriangle, 
  CheckCircle2,
  Settings2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCalendarItems, CalendarItem } from '../utils/calendarUtils';

type BeratPreference = 'aylik' | 'gecici';

export const CalendarModule = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 3)); // Starting at March 2026 as per user context
  const [beratPreference, setBeratPreference] = useState<BeratPreference>(() => {
    const saved = localStorage.getItem('berat_preference');
    return (saved as BeratPreference) || 'aylik';
  });

  const handleSetBeratPreference = (pref: BeratPreference) => {
    setBeratPreference(pref);
    localStorage.setItem('berat_preference', pref);
  };

  const calendarItems = useMemo(() => {
    return getCalendarItems(currentDate, beratPreference);
  }, [currentDate, beratPreference]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const monthName = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-kilim-blue-dark flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-kilim-blue" />
            Akıllı Mali Takvim
          </h1>
          <p className="text-slate-500">VUK M.18 uyumlu, dinamik tarih ve tatil hesaplamalı otomasyon.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 font-semibold text-slate-700 min-w-[140px] text-center">
            {monthName}
          </span>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              Takvim Ayarları
            </h3>
            
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Berat Yükleme Tercihi</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSetBeratPreference('aylik')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    beratPreference === 'aylik' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Aylık
                </button>
                <button
                  onClick={() => handleSetBeratPreference('gecici')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    beratPreference === 'gecici' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Geçici
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  <strong>VUK M.18:</strong> Sürelerin son günü tatile rastlarsa, tatili takip eden ilk iş günü mesai saati bitimine kadar uzar.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-4">Özet İstatistik</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Toplam İşlem</span>
                <span className="font-bold text-slate-900">{calendarItems.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Kritik Günler</span>
                <span className="font-bold text-rose-600">
                  {calendarItems.filter(i => i.criticalNote.includes('Hafta sonu') || i.criticalNote.includes('tatil')).length}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-1/3"></div>
              </div>
              <p className="text-[10px] text-slate-400 text-center italic">
                Veriler güncel mevzuat takvimine göre anlık hesaplanmaktadır.
              </p>
            </div>
          </div>
        </div>

        {/* Calendar List */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="popLayout">
            {calendarItems.length > 0 ? (
              calendarItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card overflow-hidden group hover:border-emerald-200 transition-colors"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className={`
                      md:w-32 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-100
                      ${item.type === 'tax' ? 'bg-amber-50/30' : 
                        item.type === 'sgk' ? 'bg-blue-50/30' : 
                        item.type === 'berat' ? 'bg-emerald-50/30' : 'bg-slate-50/30'}
                    `}>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {item.date.toLocaleString('tr-TR', { month: 'short' })}
                      </span>
                      <span className="text-3xl font-black text-slate-800 leading-none my-1">
                        {item.date.getDate()}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {item.date.toLocaleString('tr-TR', { weekday: 'long' })}
                      </span>
                    </div>

                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                              item.type === 'tax' ? 'bg-amber-100 text-amber-700' :
                              item.type === 'sgk' ? 'bg-blue-100 text-blue-700' :
                              item.type === 'berat' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {item.type === 'tax' ? 'Vergi' : 
                               item.type === 'sgk' ? 'SGK' : 
                               item.type === 'berat' ? 'E-Defter' : 'Yasal'}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              23:59'a kadar
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            <span className="font-bold text-slate-700">📝 İçerik:</span> {item.description}
                          </p>
                          <div className="flex items-start gap-2 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                            <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-emerald-800">
                              <span className="font-bold">💡 Kritik Not:</span> {item.criticalNote}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-rose-800 leading-relaxed">
                            <span className="font-bold">⚠️ Yasal Uyarı:</span> {item.legalWarning}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Bu ay için kayıt bulunamadı</h3>
                <p className="text-slate-500 max-w-xs">Seçili ayda herhangi bir vergi veya bildirim yükümlülüğü görünmüyor.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
