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

  // New Analysis States
  const [analizTipi, setAnalizTipi] = useState<'aylik' | 'yillik' | 'ozel'>('aylik');
  const [analizYil, setAnalizYil] = useState<string>(new Date().getFullYear().toString());
  const [analizBaslangic, setAnalizBaslangic] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [analizBitis, setAnalizBitis] = useState<string>(new Date().toISOString().split('T')[0]);
  const [seciliKategoriler, setSeciliKategoriler] = useState<string[]>([...GIDER_KATS, ...GELIR_KATS]);

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

  // Extract unique years list
  const uniqueYears = React.useMemo(() => {
    const years = [...new Set(entries.map(e => e.tarih.substring(0, 4)))];
    const curYear = new Date().getFullYear().toString();
    if (!years.includes(curYear)) {
      years.push(curYear);
    }
    return years.sort().reverse();
  }, [entries]);

  // Dynamic Analyzed Entries based on Period & Selected Categories
  const analizEdilenKayitlar = React.useMemo(() => {
    return entries.filter(e => {
      // 1. Category Filter
      if (!seciliKategoriler.includes(e.kat)) return false;

      // 2. Period Filter
      if (analizTipi === 'aylik') {
        return getMonthYearString(e.tarih) === selectedMonth;
      } else if (analizTipi === 'yillik') {
        return e.tarih.startsWith(analizYil);
      } else if (analizTipi === 'ozel') {
        return e.tarih >= analizBaslangic && e.tarih <= analizBitis;
      }
      return true;
    });
  }, [entries, analizTipi, selectedMonth, analizYil, analizBaslangic, analizBitis, seciliKategoriler]);

  // Dynamic Analyzed Stats
  const analizStats = React.useMemo(() => {
    const gelir = analizEdilenKayitlar.filter(e => e.tur === 'gelir').reduce((sum, e) => sum + e.tutar, 0);
    const gider = analizEdilenKayitlar.filter(e => e.tur === 'gider').reduce((sum, e) => sum + e.tutar, 0);
    const net = gelir - gider;

    const categoryTotals: Record<string, { total: number; type: 'gelir' | 'gider' }> = {};
    analizEdilenKayitlar.forEach(e => {
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
      net,
      sortedExpenses,
      sortedIncomes
    };
  }, [analizEdilenKayitlar]);

  // Dynamic Analyzed Chart Data
  const analizChartData = React.useMemo(() => {
    if (analizTipi === 'yillik') {
      const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      const mLabels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      return months.map((m, idx) => {
        const prefix = `${analizYil}-${m}`;
        const list = analizEdilenKayitlar.filter(e => e.tarih.startsWith(prefix));
        const Gelir = list.filter(e => e.tur === 'gelir').reduce((sum, e) => sum + e.tutar, 0);
        const Gider = list.filter(e => e.tur === 'gider').reduce((sum, e) => sum + e.tutar, 0);
        return {
          name: mLabels[idx],
          Gelir,
          Gider,
          Net: Gelir - Gider
        };
      });
    } else if (analizTipi === 'aylik') {
      const weeks = [
        { name: '1. Hafta (1-7)', start: 1, end: 7 },
        { name: '2. Hafta (8-14)', start: 8, end: 14 },
        { name: '3. Hafta (15-21)', start: 15, end: 21 },
        { name: '4. Hafta (22+)', start: 22, end: 31 }
      ];
      return weeks.map(w => {
        const list = analizEdilenKayitlar.filter(e => {
          const entryMonth = getMonthYearString(e.tarih);
          if (entryMonth !== selectedMonth) return false;
          const dayNum = parseInt(e.tarih.split('-')[2], 10) || 1;
          return dayNum >= w.start && dayNum <= w.end;
        });
        const Gelir = list.filter(e => e.tur === 'gelir').reduce((sum, e) => sum + e.tutar, 0);
        const Gider = list.filter(e => e.tur === 'gider').reduce((sum, e) => sum + e.tutar, 0);
        return {
          name: w.name,
          Gelir,
          Gider,
          Net: Gelir - Gider
        };
      });
    } else {
      const startMonth = analizBaslangic.substring(0, 7);
      const endMonth = analizBitis.substring(0, 7);
      if (startMonth === endMonth) {
        const weeks = [
          { name: '1. Hafta (1-7)', start: 1, end: 7 },
          { name: '2. Hafta (8-14)', start: 8, end: 14 },
          { name: '3. Hafta (15-21)', start: 15, end: 21 },
          { name: '4. Hafta (22+)', start: 22, end: 31 }
        ];
        return weeks.map(w => {
          const list = analizEdilenKayitlar.filter(e => {
            const dayNum = parseInt(e.tarih.split('-')[2], 10) || 1;
            return dayNum >= w.start && dayNum <= w.end;
          });
          const Gelir = list.filter(e => e.tur === 'gelir').reduce((sum, e) => sum + e.tutar, 0);
          const Gider = list.filter(e => e.tur === 'gider').reduce((sum, e) => sum + e.tutar, 0);
          return {
            name: w.name,
            Gelir,
            Gider,
            Net: Gelir - Gider
          };
        });
      } else {
        const monthsInPeriod: string[] = [];
        const cur = new Date(analizBaslangic);
        const end = new Date(analizBitis);
        while (cur <= end) {
          const my = cur.toISOString().substring(0, 7);
          if (!monthsInPeriod.includes(my)) {
            monthsInPeriod.push(my);
          }
          cur.setMonth(cur.getMonth() + 1);
        }
        return monthsInPeriod.map(m => {
          const list = analizEdilenKayitlar.filter(e => getMonthYearString(e.tarih) === m);
          const Gelir = list.filter(e => e.tur === 'gelir').reduce((sum, e) => sum + e.tutar, 0);
          const Gider = list.filter(e => e.tur === 'gider').reduce((sum, e) => sum + e.tutar, 0);
          return {
            name: getMonthLabel(m),
            Gelir,
            Gider,
            Net: Gelir - Gider
          };
        });
      }
    }
  }, [analizTipi, analizYil, selectedMonth, analizBaslangic, analizBitis, analizEdilenKayitlar]);

  // Dynamic Rule-Based Recommendations based on selection
  const zekiOneriler = React.useMemo(() => {
    const list: { title: string; desc: string; type: 'warning' | 'tip' | 'info' | 'success'; potentialSavings?: number }[] = [];

    const totalGelir = analizStats.gelir;
    const totalGider = analizStats.gider;
    const netKar = totalGelir - totalGider;
    const karOrani = totalGelir > 0 ? (netKar / totalGelir) * 100 : 0;

    if (totalGelir === 0 && totalGider === 0) {
      list.push({
        title: "Analiz Verisi Yok",
        desc: "Seçilen tarih aralığında ve kategorilerde henüz herhangi bir gelir/gider hareketi bulunamadı.",
        type: 'info'
      });
      return list;
    }

    if (netKar < 0) {
      list.push({
        title: "Mali Denge Uyarısı: Dönem Net Zararı",
        desc: `Seçilen kapsamda ofisiniz ${formatPara(Math.abs(netKar))} tutarında zarar etmiştir. Gelir kalemlerini artırıcı önlemler alınmalı veya gider kalemleri optimize edilmelidir.`,
        type: 'warning'
      });
    } else if (karOrani < 20) {
      list.push({
        title: "Düşük Karlılık Seviyesi",
        desc: `Ofis net kâr oranınız %${karOrani.toFixed(1)} düzeyinde seyrediyor. Verimli bir mali yapı için kâr marjının en az %35 hedefine yaklaştırılması gerekir.`,
        type: 'warning'
      });
    } else {
      list.push({
        title: "Güçlü Finansal Sürdürülebilirlik",
        desc: `Tebrikler! Seçilen kapsamda %${karOrani.toFixed(1)} kâr marjı ile çok sağlıklı ve sürdürülebilir bir ofis bütçesi yönetiyorsunuz.`,
        type: 'success'
      });
    }

    // Category specific savings dynamically
    analizStats.sortedExpenses.forEach(({ category, value }) => {
      if (category === 'Kira' && value > 0) {
        list.push({
          title: "Kira Maliyeti Optimizasyonu",
          desc: "Kira gideri en yüksek harcama gruplarından biridir. Stopaj indirimleri, paylaşımlı ofis entegrasyonları veya yıllık peşin ödeme protokolleri ile %10 maliyet tasarrufu hedeflenebilir.",
          type: 'tip',
          potentialSavings: value * 0.10
        });
      }
      else if ((category === 'Elektrik' || category === 'Doğalgaz' || category === 'Su') && value > 0) {
        list.push({
          title: `${category} Giderlerinde Yeşil Ofis Dönüşümü`,
          desc: "Akıllı ısıtma sistemleri, LED dönüşümleri ve çalışma saatleri dışındaki otomatik priz kilitleri faturaları doğrudan %15 hafifletecektir.",
          type: 'tip',
          potentialSavings: value * 0.15
        });
      }
      else if ((category === 'Market' || category === 'Yemek') && value > 0) {
        list.push({
          title: `Yemek / İaşe Harcamalarında Vergi Muafiyetleri`,
          desc: "Personel yemek giderlerinde Sodexo/Multinet gibi kupon sağlayıcıların yasal gelir vergisi ve SGK istisna sınırlarından tam olarak yararlandığınızdan emin olun. Bu bütçede %12 oranında vergi tasarrufu sağlayabilirsiniz.",
          type: 'tip',
          potentialSavings: value * 0.12
        });
      }
      else if ((category === 'Kırtasiye' || category === 'Sarf Malzeme') && value > 0) {
        list.push({
          title: "Dijital Ofis & Kağıtsız Arşiv Dönüşümü",
          desc: "Kırtasiye ve sarf malzemelerinde toplu alım anlaşmaları yapın veya tamamen e-arşiv, dijital imza ve OCR tabanlı iş akışlarına geçerek masrafları %30 düşürün.",
          type: 'tip',
          potentialSavings: value * 0.30
        });
      }
      else if (category === 'Yazılım' && value > 0) {
        list.push({
          title: "Yazılım Lisans ve Paket Denetimi",
          desc: "Aktif olarak kullanılmayan yedek bulut, bülten abonelikleri ve mükerrer program lisanslarını sonlandırın. Yıllık abonelik taahhütleri ile %20 peşin alım indirimi yakalayabilirsiniz.",
          type: 'tip',
          potentialSavings: value * 0.20
        });
      }
      else if (category === 'Ulaşım' && value > 0) {
        list.push({
          title: "Ulaşım ve Kurye Bütçesi Kontrolü",
          desc: "Fiziki evrak gönderimleri yerine KEP ve e-Tebligat sistemlerinin aktif kullanımı, müşteri ziyaretlerinde ise online görüşmelerin artırılması ulaşım bütçesini %25 oranında optimize eder.",
          type: 'tip',
          potentialSavings: value * 0.25
        });
      }
      else if ((category === 'Vergi' || category === 'SGK') && value > 0) {
        list.push({
          title: "SGK / Vergi Teşvik Kanalları",
          desc: "Ofis personelleri için %5'lik düzenli ödeme teşviki ve ilave istihdam teşviklerinin tam uygulandığından emin olun. Bu durum vergi ve SGK yükünüzü %8 azaltabilir.",
          type: 'tip',
          potentialSavings: value * 0.08
        });
      }
      else if (category === 'Maaş' && value > 0) {
        list.push({
          title: "Personel ve İstihdam Teşvik Modelleri",
          desc: "İŞKUR İşbaşı Eğitim Programları ve üniversite stajyer işbirlikleri kapsamında ek personel maliyetlerini devlet destekleri ile optimize edin.",
          type: 'info'
        });
      }
    });

    if (analizStats.sortedIncomes.length > 0) {
      list.push({
        title: "Gelir Artırıcı Katma Değer Hizmetler",
        desc: `En önemli ciro kaynağınız olan ${analizStats.sortedIncomes[0].category} kapsamında müşterilerinize özel ek mali kontrol raporlamaları veya vergi check-up paketleri sunarak tahsilat tutarlarınızı %15 büyütebilirsiniz.`,
        type: 'success'
      });
    }

    return list;
  }, [analizStats, formatPara]);

  // Compatibility mappings
  const selectedMonthStats = analizStats;
  const chartData = analizChartData;

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
          Gelir & Gider Analizi
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
          Zeki Analiz & Öneriler
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
          <div className="space-y-6">
            {/* Shared Filters Panel for Analytical Views */}
            {(activeTab === 'ozet' || activeTab === 'analiz') && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-kilim-blue" />
                    <h3 className="font-extrabold text-slate-800 text-sm">Gelişmiş Analiz ve Optimizasyon Parametreleri</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase text-kilim-blue bg-kilim-blue/10 px-3 py-1 rounded-full w-max">
                    Seçili Kalem & Tarih Analizi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Period Type Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">1. Analiz Zaman Dilimi</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAnalizTipi('aylik')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          analizTipi === 'aylik'
                            ? 'bg-kilim-blue text-white border-kilim-blue shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        Aylık
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnalizTipi('yillik')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          analizTipi === 'yillik'
                            ? 'bg-kilim-blue text-white border-kilim-blue shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        Yıllık
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnalizTipi('ozel')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          analizTipi === 'ozel'
                            ? 'bg-kilim-blue text-white border-kilim-blue shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        Tarih Arası
                      </button>
                    </div>
                  </div>

                  {/* Period selection inputs */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">2. Dönem Seçimi</label>
                    {analizTipi === 'aylik' && (
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors cursor-pointer"
                      >
                        {uniqueMonths.map(m => (
                          <option key={m} value={m}>{getMonthLabel(m)}</option>
                        ))}
                      </select>
                    )}
                    {analizTipi === 'yillik' && (
                      <select
                        value={analizYil}
                        onChange={(e) => setAnalizYil(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-kilim-blue transition-colors cursor-pointer"
                      >
                        {uniqueYears.map(y => (
                          <option key={y} value={y}>{y} Yılı</option>
                        ))}
                      </select>
                    )}
                    {analizTipi === 'ozel' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={analizBaslangic}
                          onChange={(e) => setAnalizBaslangic(e.target.value)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-kilim-blue cursor-pointer"
                        />
                        <input
                          type="date"
                          value={analizBitis}
                          onChange={(e) => setAnalizBitis(e.target.value)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-kilim-blue cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Fast category helpers */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">3. Hızlı Kalem İşlemleri</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSeciliKategoriler([...GIDER_KATS, ...GELIR_KATS])}
                        className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-extrabold text-slate-600 transition-all text-center"
                      >
                        Tümünü Seç
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeciliKategoriler([])}
                        className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-extrabold text-rose-600 transition-all text-center"
                      >
                        Temizle
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeciliKategoriler(GIDER_KATS)}
                        className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-extrabold text-rose-600 transition-all text-center"
                      >
                        Sadece Gider
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeciliKategoriler(GELIR_KATS)}
                        className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-extrabold text-emerald-600 transition-all text-center"
                      >
                        Sadece Gelir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Category select checklist with grouped badges */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Analiz Edilecek Özel Kalemler (Gider / Gelir)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Gelir Kalemleri Checklist */}
                    <div className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Gelir Kalemleri</span>
                      <div className="flex flex-wrap gap-2">
                        {GELIR_KATS.map(katName => {
                          const isSelected = seciliKategoriler.includes(katName);
                          return (
                            <button
                              type="button"
                              key={katName}
                              onClick={() => {
                                if (isSelected) {
                                  setSeciliKategoriler(seciliKategoriler.filter(k => k !== katName));
                                } else {
                                  setSeciliKategoriler([...seciliKategoriler, katName]);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold border flex items-center gap-1.5 transition-all ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                                  : 'bg-white text-slate-400 border-slate-200/60 hover:border-slate-300'
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              {katName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Gider Kalemleri Checklist */}
                    <div className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Gider Kalemleri</span>
                      <div className="flex flex-wrap gap-2">
                        {GIDER_KATS.map(katName => {
                          const isSelected = seciliKategoriler.includes(katName);
                          return (
                            <button
                              type="button"
                              key={katName}
                              onClick={() => {
                                if (isSelected) {
                                  setSeciliKategoriler(seciliKategoriler.filter(k => k !== katName));
                                } else {
                                  setSeciliKategoriler([...seciliKategoriler, katName]);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold border flex items-center gap-1.5 transition-all ${
                                isSelected
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                                  : 'bg-white text-slate-400 border-slate-200/60 hover:border-slate-300'
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-500' : 'bg-slate-300'}`} />
                              {katName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                {/* Grid stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Seçili Kapsam Geliri</p>
                    <p className="text-xl font-black text-emerald-600">{formatPara(analizStats.gelir)}</p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Seçili Kapsam Gideri</p>
                    <p className="text-xl font-black text-rose-600">{formatPara(analizStats.gider)}</p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kapsam Net Kar / Zarar</p>
                    <p className={`text-xl font-black ${analizStats.net >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                      {analizStats.net >= 0 ? '+' : ''}{formatPara(analizStats.net)}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ofis Kar Marjı</p>
                    <p className={`text-xl font-black ${analizStats.net >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                      {analizStats.gelir > 0 
                        ? `${((analizStats.net / analizStats.gelir) * 100).toFixed(1)}%` 
                        : '—'
                      }
                    </p>
                  </div>
                </div>

                {/* Graphic trends inside Recharts */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-kilim-blue" />
                    {analizTipi === 'aylik' && "Seçilen Ayın Haftalık Finansal Dağılımı"}
                    {analizTipi === 'yillik' && "Seçilen Yılın Aylık Finansal Trendi"}
                    {analizTipi === 'ozel' && "Belirli Tarih Aralığı Finansal Dağılımı"}
                  </h3>

                  <div className="w-full h-80 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analizChartData}
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
                      Giderlerin Kategori Dağılımı (Kapsam)
                    </h3>

                    {analizStats.sortedExpenses.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium italic py-8 text-center">Bu kriterlerde gider kaydı bulunmuyor.</p>
                    ) : (
                      <div className="space-y-4">
                        {analizStats.sortedExpenses.map(({ category, value }) => {
                          const pct = analizStats.gider > 0 ? (value / analizStats.gider) * 100 : 0;
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
                      Gelirlerin Kategori Dağılımı (Kapsam)
                    </h3>

                    {analizStats.sortedIncomes.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium italic py-8 text-center">Bu kriterlerde gelir kaydı bulunmuyor.</p>
                    ) : (
                      <div className="space-y-4">
                        {analizStats.sortedIncomes.map(({ category, value }) => {
                          const pct = analizStats.gelir > 0 ? (value / analizStats.gelir) * 100 : 0;
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
                      <div>
                        <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">Akıllı Finansal Karar Desteği</h2>
                        <p className="text-[11px] text-slate-400 font-medium">Seçili filtre kapsamı temel alınarak oluşturulan zeki mali analiz tablosu</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Financial evaluation */}
                      <div className="space-y-6 border-r border-slate-800/80 pr-0 md:pr-8">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 bg-kilim-blue rounded-full" />
                          Kapsam Performans Özeti
                        </h4>

                        <div className="space-y-5">
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Kapsam Dönem Dengesi</span>
                            <div className="flex items-center gap-2">
                              {analizStats.net >= 0 ? (
                                <p className="text-lg font-black text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-5 h-5" />
                                  Kâr Durumu: {formatPara(analizStats.net)}
                                </p>
                              ) : (
                                <p className="text-lg font-black text-rose-400 flex items-center gap-1.5">
                                  <AlertCircle className="w-5 h-5" />
                                  Bütçe Açığı: {formatPara(Math.abs(analizStats.net))}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                              <span>Sürdürülebilirlik Endeksi</span>
                              <span className="text-white">
                                {analizStats.gelir > 0 
                                  ? `${Math.max(0, Math.min(100, Math.round(70 + (analizStats.net / analizStats.gelir) * 30)))}%` 
                                  : '0%'
                                }
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  analizStats.net >= 0 ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ 
                                  width: `${
                                    analizStats.gelir > 0
                                      ? Math.max(10, Math.min(100, Math.round(70 + (analizStats.net / analizStats.gelir) * 30)))
                                      : 10
                                  }%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Strategic Recommendations to close the gap */}
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                          Doğrudan Stratejik Aksiyonlar
                        </h4>

                        <div className="space-y-3 pl-1">
                          <div className="flex items-start gap-2.5 text-xs">
                            <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-slate-300 leading-relaxed font-medium">
                              <span className="text-white font-bold">Upsell / Katma Değerli Danışmanlık:</span> Müşterilerinize sadece rutin beyanname vermenin ötesinde, mevzuat ve teşvik bülteni gibi butik danışmanlık paketleri sunun.
                            </p>
                          </div>
                          
                          {analizStats.sortedExpenses.length > 0 && (
                            <div className="flex items-start gap-2.5 text-xs">
                              <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <p className="text-slate-300 leading-relaxed font-medium">
                                <span className="text-white font-bold">Surgical Gider Tasarrufu:</span> Kapsamda en çok harcama yapılan <span className="text-rose-400 font-bold">{analizStats.sortedExpenses[0].category}</span> kalemini %12 oranında optimize ederseniz bütçenizde anında <span className="text-emerald-400 font-bold">{formatPara(analizStats.sortedExpenses[0].value * 0.12)}</span> doğrudan tasarruf alanı açılır.
                              </p>
                            </div>
                          )}

                          <div className="flex items-start gap-2.5 text-xs">
                            <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-slate-300 leading-relaxed font-medium">
                              <span className="text-white font-bold">Nakit Akışı Otomasyonu:</span> Tahsilat gecikmelerini önlemek adına banka entegrasyonu ve otomatik mail/sms limit hatırlatmalarını devreye alın.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Intelligent Dynamic Optimization Suggestions */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      Yapay Zeka Destekli Optimizasyon Önerileri
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Seçtiğiniz bütçe kalemleri ve tarih performansına göre hesaplanan akıllı tasarruf ve mali gelişim yönergeleri.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {zekiOneriler.map((oneri, index) => {
                      const colorClass = 
                        oneri.type === 'warning' 
                          ? 'border-rose-100 bg-rose-50/50 text-rose-800' 
                          : oneri.type === 'success'
                          ? 'border-emerald-100 bg-emerald-50/50 text-emerald-800'
                          : oneri.type === 'tip'
                          ? 'border-amber-100 bg-amber-50/50 text-amber-800'
                          : 'border-slate-100 bg-slate-50 text-slate-800';

                      const iconColor = 
                        oneri.type === 'warning' 
                          ? 'text-rose-500' 
                          : oneri.type === 'success'
                          ? 'text-emerald-500'
                          : oneri.type === 'tip'
                          ? 'text-amber-500'
                          : 'text-slate-500';

                      return (
                        <div key={index} className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${colorClass}`}>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-current" />
                              <h4 className="text-xs font-black tracking-tight">{oneri.title}</h4>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{oneri.desc}</p>
                          </div>

                          {oneri.potentialSavings && oneri.potentialSavings > 0 && (
                            <div className="pt-2 border-t border-dashed border-current/10 flex items-center justify-between text-xs font-black">
                              <span>Hedeflenen Potansiyel Tasarruf:</span>
                              <span className={iconColor}>{formatPara(oneri.potentialSavings)}</span>
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
          </div>
        )}
      </div>
    </div>
  );
};
