import React, { useMemo } from 'react';
import { 
  Calendar, 
  Gavel, 
  Bell, 
  TrendingUp, 
  MessageSquare, 
  FileSpreadsheet, 
  ChevronRight,
  RefreshCw,
  Users,
  Building2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchLatestLegislation } from '../services/geminiService';
import { UserProfile, ModuleId } from '../types';
import { TasksModule } from './TasksModule';
import { MarketPulse } from './MarketPulse';
import { getCalendarItems } from '../utils/calendarUtils';

interface DashboardProps {
  user: UserProfile | null;
  onNavigate?: (moduleId: any) => void;
}

export const Dashboard = ({ user, onNavigate }: DashboardProps) => {
  const [legislation, setLegislation] = React.useState<{title: string, date: string, source: string, link?: string, impact?: string}[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'bugun' | 'yaklasan'>('bugun');

  const today = useMemo(() => new Date(), []);
  
  const dynamicDeadlines = useMemo(() => {
    const items = getCalendarItems(today);
    return items.map(item => {
      const diffTime = item.date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let durum = 'BEKLIYOR';
      let color = 'blue';
      
      if (diffDays === 0) {
        durum = 'SON GÜN';
        color = 'rose';
      } else if (diffDays < 0) {
        durum = 'GEÇMİŞ';
        color = 'slate';
      } else if (diffDays <= 3) {
        durum = 'KRİTİK';
        color = 'rose';
      } else if (diffDays <= 7) {
        durum = 'YAKLAŞIYOR';
        color = 'amber';
      }

      return {
        ...item,
        durum,
        color,
        diffDays,
        tur: item.type.toUpperCase()
      };
    });
  }, [today]);

  const bugunReminders = dynamicDeadlines.filter(r => 
    r.date.getDate() === today.getDate() && 
    r.date.getMonth() === today.getMonth() && 
    r.date.getFullYear() === today.getFullYear()
  );

  const yaklasanReminders = dynamicDeadlines.filter(r => r.date > today && (
    r.date.getDate() !== today.getDate() || 
    r.date.getMonth() !== today.getMonth() || 
    r.date.getFullYear() !== today.getFullYear()
  ));

  const mockData = {
    stats: [
      { id: 'mevzuat', label: "Yeni Mevzuat", deger: "3", alt: "Bu hafta", renk: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" },
      { id: 'evrak', label: "Bekleyen Evrak", deger: "12", alt: "Teslim edilmedi", renk: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
      { id: 'musteri', label: "Aktif Müşteri", deger: "45", alt: "Toplam firma", renk: "text-kilim-blue", bg: "bg-blue-50", border: "border-blue-200" },
      { id: 'verimlilik', label: "Ofis Verimliliği", deger: "%88", alt: "Hedef: %85", renk: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
    ]
  };

  React.useEffect(() => {
    const loadLegislation = async () => {
      try {
        const data = await fetchLatestLegislation();
        setLegislation(data);
      } catch (error) {
        console.error("Failed to load legislation:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLegislation();
  }, []);

  const turRengi = (tur: string) => {
    if (tur === "TAX" || tur === "VERGİ") return "bg-blue-100 text-blue-700";
    if (tur === "SGK") return "bg-emerald-100 text-emerald-700";
    if (tur === "BERAT" || tur === "E-DEFTER") return "bg-purple-100 text-purple-700";
    return "bg-slate-100 text-slate-700";
  };

  const allDeadlines = activeTab === "bugun" ? bugunReminders : yaklasanReminders;

  const approachingCount = dynamicDeadlines.filter(d => d.diffDays >= 0 && d.diffDays <= 5).length;

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 md:px-0">
      {/* Header Section with Elegant Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl tracking-tighter leading-tight text-[#1e3a8a]">
            <span className="font-light">Hoş geldiniz,</span> <span className="font-bold">{user?.fullName || 'Hatice Hanım'}</span>
          </h1>
          
          <p className="text-[11px] font-medium text-slate-400/80">
            {today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}, {today.toLocaleDateString('tr-TR', { weekday: 'long' })}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <div className="px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-rose-700">Takvimde {approachingCount} adet beyanname süresi yaklaşıyor</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">Piyasalar Pozitif seyrediyor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Pulse Section */}
      <MarketPulse />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockData.stats.map((stat) => (
          <div key={stat.id} className={`p-6 bg-white border border-kilim-blue/5 rounded-3xl shadow-sm hover:shadow-md hover:border-kilim-blue/20 transition-all group`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-black ${stat.renk}`}>{stat.deger}</p>
              <p className="text-[10px] text-slate-400 font-medium">{stat.alt}</p>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                className={`h-full ${stat.renk.replace('text-', 'bg-')}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deadlines Section */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-kilim-blue-dark text-sm">Mali Takvim & Beyannameler</h3>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Kritik İşlem Takibi</p>
                </div>
              </div>
              
              <div className="flex bg-slate-50 p-1 rounded-xl self-start sm:self-auto">
                <button 
                  onClick={() => setActiveTab('bugun')}
                  className={`px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all ${activeTab === 'bugun' ? 'bg-white text-kilim-blue shadow-sm' : 'text-slate-400'}`}
                >
                  BUGÜN
                </button>
                <button 
                  onClick={() => setActiveTab('yaklasan')}
                  className={`px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all ${activeTab === 'yaklasan' ? 'bg-white text-kilim-blue shadow-sm' : 'text-slate-400'}`}
                >
                  YAKLAŞAN
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {allDeadlines.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium italic">Kritik son tarih bulunamadı. Her şey yolunda!</p>
                </div>
              ) : (
                allDeadlines.map((item) => (
                  <div key={item.id} className="p-5 flex items-center gap-5 hover:bg-slate-50/50 transition-colors group">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border-2 ${
                      item.color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-600' : 
                      item.color === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                      item.color === 'slate' ? 'bg-slate-50 border-slate-100 text-slate-400' :
                      'bg-blue-50 border-blue-100 text-blue-600'
                    }`}>
                      {item.date.getDate() === today.getDate() && item.date.getMonth() === today.getMonth() ? (
                        <>
                          <span className="text-lg font-black leading-none">⏰</span>
                          <span className="text-[9px] font-bold uppercase mt-1">23:59</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-black leading-none">{item.date.getDate()}</span>
                          <span className="text-[9px] font-bold uppercase mt-1">{item.date.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${turRengi(item.tur)}`}>{item.tur}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.color === 'rose' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>{item.durum}</span>
                      </div>
                      <p className="font-bold text-slate-800 truncate group-hover:text-kilim-blue transition-colors">{item.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">🏢 Tüm Firmalar</span>
                        {item.diffDays > 0 && <span className="text-[10px] text-rose-500 font-bold">⏳ {item.diffDays} gün kaldı</span>}
                      </div>
                    </div>
                    
                    <button className="p-2 text-slate-300 hover:text-kilim-blue transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Tasks Module */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-kilim-blue-dark text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-kilim-blue" />
                Günlük Görevler
              </h3>
            </div>
            <TasksModule />
          </div>
        </div>
      </div>

    </div>
  );
};
