import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  List, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Lightbulb, 
  Download, 
  Target, 
  AlertCircle,
  CheckCircle2, 
  DollarSign, 
  Info,
  ChevronRight,
  Filter,
  RefreshCw,
  Wallet,
  Coins,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  setDoc,
  deleteDoc, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface OfficeExpenseEntry {
  id: string;
  tur: 'gelir' | 'gider';
  kat: string;
  aciklama: string;
  tutar: number;
  tarih: string;
  createdAt?: any;
}

const GIDER_KATS = [
  'Kira',
  'İşyeri Aidatı',
  'Oda Aidatı',
  'Elektrik',
  'Doğalgaz',
  'Su',
  'İnternet',
  'Telefon',
  'Maaş',
  'Market',
  'Yemek',
  'Vergi',
  'SGK',
  'Sarf Malzeme',
  'Kırtasiye',
  'Yazılım',
  'Bakım Onarım',
  'Ulaşım',
  'Diğer'
];

const GELIR_KATS = [
  'Danışmanlık',
  'Muhasebe hizmeti',
  'Vergi beyannamesi',
  'SGK hizmeti',
  'Denetim',
  'Proje geliri',
  'Diğer gelir'
];

export const OfisGiderTakip: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'giris' | 'liste' | 'ozet' | 'analiz'>('giris');
  const [entries, setEntries] = useState<OfficeExpenseEntry[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // New entry form state
  const [tur, setTur] = useState<'gelir' | 'gider'>('gider');
  const [kat, setKat] = useState(GIDER_KATS[0]);
  const [aciklama, setAciklama] = useState('');
  const [tutar, setTutar] = useState<string>('');
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [formMsg, setFormMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Filters state
  const [filtreAy, setFiltreAy] = useState<string>('all');
  const [filtreTur, setFiltreTur] = useState<string>('all');
  const [filtreKat, setFiltreKat] = useState<string>('all');

  // Summary and analytics selected month
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Update default category when type transitions
  useEffect(() => {
    setKat(tur === 'gider' ? GIDER_KATS[0] : GELIR_KATS[0]);
  }, [tur]);

  // Sync auth and Firestore subscription
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setEntries([]);
        setBudgets({});
        setLoading(false);
        return;
      }

      const userId = user.uid;

      // 1. Subscribe to entries list
      const entriesRef = collection(db, 'users', userId, 'office_exp_entries');
      const qEntries = query(entriesRef);
      const unsubscribeEntries = onSnapshot(qEntries, (snapshot) => {
        const data: OfficeExpenseEntry[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            tur: docData.tur || 'gider',
            kat: docData.kat || 'Diğer',
            aciklama: docData.aciklama || '',
            tutar: Number(docData.tutar) || 0,
            tarih: docData.tarih || '',
            createdAt: docData.createdAt
          });
        });
        
        // Sort client-side by date description (newest first)
        data.sort((a, b) => b.tarih.localeCompare(a.tarih) || (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setEntries(data);
        setLoading(false);
      }, (error) => {
        console.error("Firestore Entries fetch error:", error);
        setLoading(false);
      });

      // 2. Subscribe to budget goals limits
      const budgetsDocRef = doc(db, 'users', userId, 'settings', 'office_exp_budgets');
      const unsubscribeBudgets = onSnapshot(budgetsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setBudgets(docSnap.data() as Record<string, number>);
        } else {
          setBudgets({});
        }
      }, (error) => {
        console.error("Firestore Budgets fetch error:", error);
      });

      return () => {
        unsubscribeEntries();
        unsubscribeBudgets();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  // Set selected month to current month initially
  useEffect(() => {
    const defaultM = new Date().toISOString().substring(0, 7);
    setSelectedMonth(defaultM);
  }, []);

  const formatPara = (n: number) => {
    return '₺' + Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getMonthYearString = (dateStr: string) => {
    return dateStr ? dateStr.substring(0, 7) : '';
  };

  const getMonthLabel = (myStr: string) => {
    if (!myStr) return '—';
    const [yil, m] = myStr.split('-');
    const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const idx = parseInt(m, 10) - 1;
    return `${aylar[idx]} ${yil}`;
  };

  // Extract unique months list
  const uniqueMonths = React.useMemo(() => {
    const list = [...new Set(entries.map(e => getMonthYearString(e.tarih)))];
    const cur = new Date().toISOString().substring(0, 7);
    if (!list.includes(cur)) {
      list.push(cur);
    }
    return list.sort().reverse();
  }, [entries]);

  // Filter entries list
  const filteredEntries = React.useMemo(() => {
    return entries.filter(e => {
      const entryMonth = getMonthYearString(e.tarih);
      if (filtreAy !== 'all' && entryMonth !== filtreAy) return false;
      if (filtreTur !== 'all' && e.tur !== filtreTur) return false;
      if (filtreKat !== 'all' && e.kat !== filtreKat) return false;
      return true;
    });
  }, [entries, filtreAy, filtreTur, filtreKat]);

  // Current month simple stats
  const currentMonthStats = React.useMemo(() => {
    const cur = new Date().toISOString().substring(0, 7);
    const list = entries.filter(e => getMonthYearString(e.tarih) === cur);
    const gelir = list.filter(e => e.tur === 'gelir').reduce((sum, e) => sum + e.tutar, 0);
    const gider = list.filter(e => e.tur === 'gider').reduce((sum, e) => sum + e.tutar, 0);
    return {
      gelir,
      gider,
      net: gelir - gider
    };
  }, [entries]);

  // Selected Month Summary stats
  const selectedMonthStats = React.useMemo(() => {
    const list = entries.filter(e => getMonthYearString(e.tarih) === selectedMonth);
    const gelir = list.filter(e => e.tur === 'gelir').reduce((sum, e) => sum + e.tutar, 0);
    const gider = list.filter(e => e.tur === 'gider').reduce((sum, e) => sum + e.tutar, 0);
    
    const categoryTotals: Record<string, { total: number; type: 'gelir' | 'gider' }> = {};
    list.forEach(e => {
      if (!categoryTotals[e.kat]) {
        categoryTotals[e.kat] = { total: 0, type: e.tur };
      }
      categoryTotals[e.kat].total += e.tutar;
    });

    const sortedExpenses = Object.entries(categoryTotals)
      .filter(([_, data]) => data.type === 'gider')
      .map(([kat, data]) => ({ category: kat, value: data.total }))
      .sort((a, b) => b.value - a.value);

    const sortedIncomes = Object.entries(categoryTotals)
      .filter(([_, data]) => data.type === 'gelir')
      .map(([kat, data]) => ({ category: kat, value: data.total }))
      .sort((a, b) => b.value - a.value);

    return {
      gelir,
      gider,
      net: gelir - gider,
      sortedExpenses,
      sortedIncomes
    };
  }, [entries, selectedMonth]);

  // Calculate trends for the last 6 months
  const chartData = React.useMemo(() => {
    const today = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    return months.map(m => {
      const list = entries.filter(e => getMonthYearString(e.tarih) === m);
      const Gelir = list.filter(e => e.tur === 'gelir').reduce((sum, e) => sum + e.tutar, 0);
      const Gider = list.filter(e => e.tur === 'gider').reduce((sum, e) => sum + e.tutar, 0);
      return {
        name: getMonthLabel(m).replace(' ' + today.getFullYear(), ''),
        Gelir,
        Gider,
        Net: Gelir - Gider
      };
    });
  }, [entries]);

  // Handle add record
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    const numTutar = parseFloat(tutar);
    if (!tarih) {
      setFormMsg({ text: 'Lütfen geçerli bir tarih seçin.', isError: true });
      return;
    }
    if (isNaN(numTutar) || numTutar <= 0) {
      setFormMsg({ text: 'Lütfen sıfırdan büyük geçerli bir tutar girin.', isError: true });
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setFormMsg({ text: 'Oturum açık değil, kayıt eklenemez.', isError: true });
      return;
    }

    try {
      const entriesRef = collection(db, 'users', currentUser.uid, 'office_exp_entries');
      await addDoc(entriesRef, {
        tur,
        kat,
        aciklama: aciklama.trim(),
        tutar: numTutar,
        tarih,
        createdAt: serverTimestamp()
      });

      setFormMsg({ text: '✓ Kayıt başarıyla eklendi.', isError: false });
      setAciklama('');
      setTutar('');
      // Smooth reset after 2 seconds
      setTimeout(() => setFormMsg(null), 3000);
    } catch (err: any) {
      console.error("Error creating entry:", err);
      setFormMsg({ text: 'Kayıt sırasında bir hata oluştu.', isError: true });
    }
  };

  // Handle delete record
  const handleDeleteEntry = async (id: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

    try {
      const entryRef = doc(db, 'users', currentUser.uid, 'office_exp_entries', id);
      await deleteDoc(entryRef);
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  // Update category budget targets
  const handleUpdateBudget = async (category: string, value: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const limit = parseFloat(value) || 0;
    const newBudgets = { ...budgets, [category]: limit };

    setBudgets(newBudgets);

    try {
      const budgetsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'office_exp_budgets');
      await setDoc(budgetsDocRef, newBudgets, { merge: true });
    } catch (err) {
      console.error("Error saving budget goal:", err);
    }
  };

  // Export filtered list to CSV format
  const handleExportCSV = () => {
    const headers = ['Tarih', 'Tür', 'Kategori', 'Açıklama', 'Tutar (TL)'];
    const rows = filteredEntries.map(e => [
      e.tarih,
      e.tur === 'gelir' ? 'Gelir' : 'Gider',
      e.kat,
      e.aciklama || '',
      e.tutar.toFixed(2)
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'muhasebe_ofisi_gider_raporu.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-kilim-blue-pale rounded-2xl flex items-center justify-center border border-kilim-blue/10">
            <Coins className="w-6 h-6 text-kilim-blue" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-kilim-blue-dark tracking-tight">Ofis Gelir & Gider Yönetimi</h1>
            <p className="text-xs text-slate-500">Mali müşavir ofis bütçe dengesi, tasarruf önerileri ve gider kontrol paneli.</p>
          </div>
        </div>

        {/* Dynamic Badge */}
        <div className={`px-4 py-2 rounded-2xl text-xs font-black border flex items-center gap-2 ${
          currentMonthStats.net >= 0 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
            : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${currentMonthStats.net >= 0 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
          <span>Bu Ay Durumu: {currentMonthStats.net >= 0 ? 'Pozitif (Kar)' : 'Negatif Akış (Devir Açığı)'}</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-1">
        <button
          onClick={() => setActiveTab('giris')}
          className={`flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'giris' 
              ? 'border-kilim-blue text-kilim-blue font-black' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Plus className="w-4 h-4" />
          Kayıt Ekle
        </button>
        <button
          onClick={() => setActiveTab('liste')}
          className={`flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'liste' 
              ? 'border-kilim-blue text-kilim-blue font-black' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <List className="w-4 h-4" />
          Tüm Kayıtlar
        </button>
        <button
          onClick={() => setActiveTab('ozet')}
          className={`flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'ozet' 
              ? 'border-kilim-blue text-kilim-blue font-black' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Aylık Özet & Trend
        </button>
        <button
          onClick={() => setActiveTab('analiz')}
          className={`flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'analiz' 
              ? 'border-kilim-blue text-kilim-blue font-black' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Bot className="w-4 h-4" />
          Hedefler & Zeki Analiz
        </button>
      </div>

      {/* Sub Modules Content */}
      <div className="min-h-[50vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-kilim-blue animate-spin" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Veriler Yükleniyor...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'giris' && (
              <motion.div
                key="giris"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Left side quick metrics cards */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Wallet className="w-4 h-4 text-kilim-blue" />
                      Bu Ayın Ofis Hesap Dengesi
                    </h3>

                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center justify-between text-emerald-600 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Toplam Gelir</span>
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-black text-emerald-800">{formatPara(currentMonthStats.gelir)}</p>
                      </div>

                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <div className="flex items-center justify-between text-rose-600 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Toplam Gider</span>
                          <TrendingDown className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-black text-rose-800">{formatPara(currentMonthStats.gider)}</p>
                      </div>

                      <div className={`p-4 rounded-2xl border ${
                        currentMonthStats.net >= 0 
                          ? 'bg-blue-50 border-blue-100 text-blue-800' 
                          : 'bg-amber-50 border-amber-100 text-amber-800'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Net Ofis Bakiyesi</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            currentMonthStats.net >= 0 ? 'bg-blue-100' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {currentMonthStats.net >= 0 ? 'Sürdürülebilir' : 'Finansal Açık'}
                          </span>
                        </div>
                        <p className="text-xl font-black">{formatPara(currentMonthStats.net)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main input form */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                    <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                      <Plus className="w-5 h-5 text-kilim-blue" />
                      Yeni Gelir veya Gider Kaydı
                    </h3>

                    <form onSubmit={handleAddEntry} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Record Type Dropdown */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">İşlem Türü</label>
                          <select
                            value={tur}
                            onChange={(e) => setTur(e.target.value as 'gelir' | 'gider')}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors cursor-pointer"
                          >
                            <option value="gider">Ofis Gideri</option>
                            <option value="gelir">Ofis Geliri</option>
                          </select>
                        </div>

                        {/* Category Dropdown */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase font-black">Kategori</label>
                          <select
                            value={kat}
                            onChange={(e) => setKat(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors cursor-pointer"
                          >
                            {tur === 'gider' ? (
                              GIDER_KATS.map(k => <option key={k} value={k}>{k}</option>)
                            ) : (
                              GELIR_KATS.map(k => <option key={k} value={k}>{k}</option>)
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Tutar Entry */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Tutar (TL)</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={tutar}
                              onChange={(e) => setTutar(e.target.value)}
                              className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors"
                              required
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₺</span>
                          </div>
                        </div>

                        {/* Tarih Selection */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Tarih</label>
                          <div className="relative">
                            <input
                              type="date"
                              value={tarih}
                              onChange={(e) => setTarih(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors cursor-pointer"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Description input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Açıklama (Detay)</label>
                        <input
                          type="text"
                          placeholder="Örn: Ofis aidat/elektrik veya danışmanlık hizmet bedeli..."
                          value={aciklama}
                          onChange={(e) => setAciklama(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors"
                        />
                      </div>

                      {/* Display Submit & Messages */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-6">
                        <p className="text-xs text-slate-400 font-medium">Lütfen verilerin doğruluğunu kontrol edip kaydedin.</p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAciklama('');
                              setTutar('');
                              setFormMsg(null);
                            }}
                            className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-500 hover:bg-slate-50 transition-colors"
                          >
                            Temizle
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-3 bg-kilim-blue text-white rounded-xl text-xs font-extrabold hover:bg-kilim-blue-dark transition-all shadow-md flex items-center gap-2 focus:ring-2 focus:ring-kilim-blue/30"
                          >
                            <Plus className="w-4 h-4" />
                            Kaydet
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {formMsg && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className={`p-4 rounded-xl border text-xs font-bold leading-relaxed flex items-center gap-2 ${
                              formMsg.isError 
                                ? 'bg-rose-50 border-rose-100 text-rose-700' 
                                : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            }`}
                          >
                            {formMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            <span>{formMsg.text}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  </div>

                  {/* Son 5 Islem List */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                      <List className="w-4 h-4 text-slate-400" />
                      Son Eklenen 5 Hareket
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="pb-3 font-bold">Tarih</th>
                            <th className="pb-3 font-bold">Kategori</th>
                            <th className="pb-3 font-bold">Açıklama</th>
                            <th className="pb-3 font-bold">Tür</th>
                            <th className="pb-3 text-right font-bold">Tutar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                          {entries.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 font-medium italic">
                                Henüz hiçbir gelir veya gider kaydı bulunmuyor.
                              </td>
                            </tr>
                          ) : (
                            entries.slice(0, 5).map((e) => (
                              <tr key={e.id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-semibold text-slate-500">{e.tarih}</td>
                                <td className="py-3 font-extrabold text-slate-700">{e.kat}</td>
                                <td className="py-3 text-slate-400 max-w-[150px] truncate">{e.aciklama || '—'}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                    e.tur === 'gelir' 
                                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                      : 'bg-rose-50 border-rose-100 text-rose-600'
                                  }`}>
                                    {e.tur === 'gelir' ? 'Gelir' : 'Gider'}
                                  </span>
                                </td>
                                <td className={`py-3 text-right font-black ${
                                  e.tur === 'gelir' ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                  {e.tur === 'gelir' ? '+' : '-'}{formatPara(e.tutar)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'liste' && (
              <motion.div
                key="liste"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Advanced Filtering Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Filter className="w-4 h-4 text-kilim-blue" />
                    Kayıtları Filtrele & Raporla
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Period selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Dönem Seçimi (Ay/Yıl)</label>
                      <select
                        value={filtreAy}
                        onChange={(e) => setFiltreAy(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors cursor-pointer"
                      >
                        <option value="all">Tüm Dönemler</option>
                        {uniqueMonths.map(m => (
                          <option key={m} value={m}>{getMonthLabel(m)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Type Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">İşlem Türü</label>
                      <select
                        value={filtreTur}
                        onChange={(e) => setFiltreTur(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors cursor-pointer"
                      >
                        <option value="all">Hepsi (Gelir + Gider)</option>
                        <option value="gelir">Yalnızca Gelirler</option>
                        <option value="gider">Yalnızca Giderler</option>
                      </select>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase font-black">Kategori</label>
                      <select
                        value={filtreKat}
                        onChange={(e) => setFiltreKat(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors cursor-pointer"
                      >
                        <option value="all">Tüm Kategoriler</option>
                        {[...GIDER_KATS, ...GELIR_KATS].map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex border-t border-slate-100 pt-4 items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">Toplam <span className="font-bold text-slate-700">{filteredEntries.length}</span> kayıt listelendi.</p>
                    <button
                      onClick={handleExportCSV}
                      disabled={filteredEntries.length === 0}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Excel / CSV Olarak İndir
                    </button>
                  </div>
                </div>

                {/* Table list */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="pb-3 font-bold">Tarih</th>
                          <th className="pb-3 font-bold">Tür</th>
                          <th className="pb-3 font-bold">Kategori</th>
                          <th className="pb-3 font-bold">Açıklama</th>
                          <th className="pb-3 text-right font-bold">Tutar</th>
                          <th className="pb-3 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredEntries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 font-medium italic">
                              Seçili filtrelemeye uygun herhangi bir kayıt bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          filteredEntries.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50/50 group transition-colors">
                              <td className="py-4 font-bold text-slate-500 whitespace-nowrap">{e.tarih}</td>
                              <td className="py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                  e.tur === 'gelir' 
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                    : 'bg-rose-50 border-rose-100 text-rose-600'
                                  }`}>
                                  {e.tur === 'gelir' ? 'Gelir' : 'Gider'}
                                </span>
                              </td>
                              <td className="py-4 font-black text-slate-700 whitespace-nowrap">{e.kat}</td>
                              <td className="py-4 text-slate-500 max-w-xs truncate" title={e.aciklama}>
                                {e.aciklama || <span className="text-slate-300">Detay yok</span>}
                              </td>
                              <td className={`py-4 text-right font-black whitespace-nowrap ${
                                e.tur === 'gelir' ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {e.tur === 'gelir' ? '+' : '-'}{formatPara(e.tutar)}
                              </td>
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => handleDeleteEntry(e.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded whitespace-nowrap"
                                  title="Sil"
                                >
                                  <Trash2 className="w-4 h-4 ml-auto" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'ozet' && (
              <motion.div
                key="ozet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Month Picker for Summary */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-kilim-blue" />
                    <span className="text-sm font-extrabold text-slate-700">Analiz Dönemi Seçin:</span>
                  </div>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors cursor-pointer"
                  >
                    {uniqueMonths.map(m => (
                      <option key={m} value={m}>{getMonthLabel(m)}</option>
                    ))}
                  </select>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Toplam Ofis Geliri</p>
                    <p className="text-xl font-black text-emerald-600">{formatPara(selectedMonthStats.gelir)}</p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Toplam Ofis Gideri</p>
                    <p className="text-xl font-black text-rose-600">{formatPara(selectedMonthStats.gider)}</p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ofis Net Kar / Zarar</p>
                    <p className={`text-xl font-black ${selectedMonthStats.net >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                      {selectedMonthStats.net >= 0 ? '+' : ''}{formatPara(selectedMonthStats.net)}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ofis Kar Oranı</p>
                    <p className={`text-xl font-black ${selectedMonthStats.net >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                      {selectedMonthStats.gelir > 0 
                        ? `${((selectedMonthStats.net / selectedMonthStats.gelir) * 100).toFixed(1)}%` 
                        : '—'
                      }
                    </p>
                  </div>
                </div>

                {/* Graphic trends inside Recharts */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-kilim-blue" />
                    Son 6 Aylık Finansal Ofis Trendi
                  </h3>

                  <div className="w-full h-80 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${v.toLocaleString('tr-TR')}`} />
                        <Tooltip 
                          formatter={(value: any) => [formatPara(Number(value)), '']}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                          labelStyle={{ fontWeight: 'black', color: '#1e293b', fontSize: '11px', marginBottom: '4px' }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Bar dataKey="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Bar dataKey="Gider" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Detailed category distribution bars lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 font-black text-rose-600">
                      <TrendingDown className="w-4 h-4" />
                      Giderlerin Kategori Dağılımı
                    </h3>

                    {selectedMonthStats.sortedExpenses.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium italic py-8 text-center">Bu ay kaydedilmiş bir gider bulunmuyor.</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedMonthStats.sortedExpenses.map(({ category, value }) => {
                          const pct = selectedMonthStats.gider > 0 ? (value / selectedMonthStats.gider) * 100 : 0;
                          return (
                            <div key={category} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-600 font-bold">{category}</span>
                                <span className="text-slate-400 font-bold">{formatPara(value)} ({pct.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 font-black text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                      Gelirlerin Kategori Dağılımı
                    </h3>

                    {selectedMonthStats.sortedIncomes.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium italic py-8 text-center">Bu ay kaydedilmiş bir gelir bulunmuyor.</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedMonthStats.sortedIncomes.map(({ category, value }) => {
                          const pct = selectedMonthStats.gelir > 0 ? (value / selectedMonthStats.gelir) * 100 : 0;
                          return (
                            <div key={category} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-600 font-bold">{category}</span>
                                <span className="text-slate-400 font-bold">{formatPara(value)} ({pct.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analiz' && (
              <motion.div
                key="analiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* AI / Consultant Decision Support Analizi */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Bot className="w-40 h-40" />
                  </div>

                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                        <Coins className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">Akıllı Finansal Karar Desteği</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Deficiency evaluation */}
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 bg-kilim-red rounded-full" />
                          Mevcut Açık ve Risk Analizi
                        </h4>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Bu Ayki Açık Tutarı</span>
                            <div className="flex items-center gap-2">
                              {currentMonthStats.net >= 0 ? (
                                <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Açık bulunmuyor, ofis bu ay karda!
                                </p>
                              ) : (
                                <p className="text-xl font-black text-rose-400">
                                  {formatPara(Math.abs(currentMonthStats.net))}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Sürdürülebilirlik Puanı</span>
                            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  currentMonthStats.net >= 0 ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ 
                                  width: `${
                                    currentMonthStats.net >= 0 
                                      ? Math.min(100, 75 + (currentMonthStats.net / (currentMonthStats.gelir || 1)) * 25) 
                                      : Math.max(20, 100 - (Math.abs(currentMonthStats.net) / (currentMonthStats.gider || 1)) * 100)
                                  }%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Strategic Recommendations to close the gap */}
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                          Açık Nasıl Kapatılır / Kar Nasıl Artırılır?
                        </h4>

                        <div className="space-y-3 pl-1">
                          <div className="flex items-start gap-2.5 text-xs">
                            <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-slate-300 leading-relaxed font-medium">
                              <span className="text-white font-bold">Upsell / Ek Hizmet Modeli:</span> Mevcut müşterilere standard muhasebenin yanı sıra vergi risk analizi, SGK teşvik danışmanlığı veya GEKSİS raporlaması teklif edin.
                            </p>
                          </div>
                          
                          {selectedMonthStats.sortedExpenses.length > 0 && (
                            <div className="flex items-start gap-2.5 text-xs">
                              <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <p className="text-slate-300 leading-relaxed font-medium">
                                <span className="text-white font-bold">Odaklı Gider Tasarrufu:</span> En büyük gider kaleminiz olan <span className="text-rose-400 font-bold">{selectedMonthStats.sortedExpenses[0].category}</span> harcamasını %12 oranında düşürün. Bu durum bütçede anında <span className="text-emerald-400 font-bold">{formatPara(selectedMonthStats.sortedExpenses[0].value * 0.12)}</span> doğrudan tasarruf sağlayacaktır.
                              </p>
                            </div>
                          )}

                          <div className="flex items-start gap-2.5 text-xs">
                            <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-slate-300 leading-relaxed font-medium">
                              <span className="text-white font-bold">Nakit Döngüsü Hızlandırma:</span> Cari tahsilatları gecikmeye düşmeden takip edin. Her ayın ilk haftası düzenli limit hatırlatmaları nakit dengesini %30 iyileştirir.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Practical savings advice card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Info className="w-4 h-4 text-emerald-600" />
                    Muhasebe Ofisi Tasarruf Tavsiyeleri
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                      <p className="text-xs font-bold text-slate-700">Yazılım Lisansları Optimizasyonu</p>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">Muhasebe bülten ve yazılım paket lisanslarını yıllık taahhütlerle peşin ödeme yöntemiyle %20 daha avantajlı satın alabilirsiniz.</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                      <p className="text-xs font-bold text-slate-700">Akıllı Enerji Tüketimi</p>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">Isınma, klima ve aydınlatma giderleri için termostat kullanımı ve mesai dışı otomatik kapanma ile faturaları %15 hafifletin.</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                      <p className="text-xs font-bold text-slate-700">Kırtasiye ve Dijitalleşme</p>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">Müşterilerden gelen kağıt evrakları OCR kullanarak dijitale aktarın. Kağıt ve kartuş sarfiyatını minimize edin.</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                      <p className="text-xs font-bold text-slate-700">Kira ve Hizmet Müzakeresi</p>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">Uzun dönemli kontratlar veya ortak ofis çözümleri ile kira maliyetlerini optimize edin.</p>
                    </div>
                  </div>
                </div>

                {/* Category Budgets Limitation Settings */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                      <Target className="w-5 h-5 text-kilim-blue" />
                      Gider Limit Hedefleri
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Kategori bazlı aylık bütçe/limit hedefleri belirleyerek harcamalarınızı limit sınırları içerisinde tutun.</p>
                  </div>

                  <div className="space-y-4">
                    {GIDER_KATS.map(katName => {
                      const limitVal = budgets[katName] || 0;
                      // Current month actual gasto
                      const cur = new Date().toISOString().substring(0, 7);
                      const actualGasto = entries
                        .filter(e => getMonthYearString(e.tarih) === cur && e.tur === 'gider' && e.kat === katName)
                        .reduce((sum, e) => sum + e.tutar, 0);

                      const pct = limitVal > 0 ? (actualGasto / limitVal) * 100 : 0;
                      const barColorClass = pct > 100 ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500';
                      const textColorClass = pct > 100 ? 'text-rose-600' : pct > 80 ? 'text-amber-600' : 'text-emerald-600';

                      return (
                        <div key={katName} className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <span className="font-extrabold text-slate-700 sm:w-32">{katName}</span>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-bold">Harç Limit:</span>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={limitVal || ''}
                                  placeholder="Sınır Belirle (₺)"
                                  onChange={(e) => handleUpdateBudget(katName, e.target.value)}
                                  className="w-32 pl-3 pr-6 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-kilim-blue"
                                />
                                <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400">₺</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 font-bold">Gerçekleşen: {formatPara(actualGasto)}</span>
                              {limitVal > 0 && (
                                <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full border ${barColorClass}/10 ${textColorClass}`}>
                                  {pct.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>

                          {limitVal > 0 && (
                            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
