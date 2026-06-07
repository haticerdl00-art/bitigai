import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  FileSpreadsheet, 
  AlertTriangle, 
  TrendingUp, 
  HelpCircle, 
  ArrowUpDown, 
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  where,
  getDocs,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { CompanyProfile, VehicleRecord, MonthlyReconciliation } from '../types';

interface AracKdvTakipModuleProps {
  profile: CompanyProfile;
}

const DEFAULT_VEHICLES = (companyId: string): Omit<VehicleRecord, 'id'>[] => [
  {
    companyId,
    plaka: '38 PC 374',
    eskiPlaka: '',
    plakaDegistiMi: false,
    alisNoter: 'KAYSERİ 10.NOTERLİĞİ',
    alisTarihi: '2020-10-12',
    alisBelgeTuru: 'Fatura',
    alisBelgeNo: '247',
    alisTutari: 150000,
    satisNoter: '',
    satisTarihi: '',
    satisBelgeNo: '',
    satisTutari: 0,
    faturaTuru: 'kar-10',
    not: '',
    satildi: false,
    giderPusulasiDuzenlendi: false,
    faturaKesildi: false
  },
  {
    companyId,
    plaka: '38 AGC 535',
    eskiPlaka: '',
    plakaDegistiMi: false,
    alisNoter: 'KAYSERİ 10.NOTERLİĞİ',
    alisTarihi: '2024-03-05',
    alisBelgeTuru: 'Fatura',
    alisBelgeNo: 'TME2024000000061',
    alisTutari: 358288,
    satisNoter: '',
    satisTarihi: '',
    satisBelgeNo: '',
    satisTutari: 0,
    faturaTuru: 'kar-10',
    not: '',
    satildi: false,
    giderPusulasiDuzenlendi: false,
    faturaKesildi: false
  },
  {
    companyId,
    plaka: '58 ET 855',
    eskiPlaka: '',
    plakaDegistiMi: false,
    alisNoter: 'KAYSERİ 10.NOTERLİĞİ',
    alisTarihi: '2024-03-05',
    alisBelgeTuru: 'Fatura',
    alisBelgeNo: 'TME2024000000060',
    alisTutari: 368524.80,
    satisNoter: 'KAYSERİ 10.NOTERLİĞİ',
    satisTarihi: '2026-04-20',
    satisBelgeNo: 'GKA2026000000013',
    satisTutari: 400000,
    faturaTuru: 'kar-10',
    not: '',
    satildi: true,
    giderPusulasiDuzenlendi: false,
    faturaKesildi: true
  },
  {
    companyId,
    plaka: '38 AHM 872',
    eskiPlaka: '',
    plakaDegistiMi: false,
    alisNoter: 'KAYSERİ 10.NOTERLİĞİ',
    alisTarihi: '2024-07-11',
    alisBelgeTuru: 'Gider Pusulası',
    alisBelgeNo: '6832',
    alisTutari: 500000,
    satisNoter: 'KAYSERİ 12.NOTERLİĞİ',
    satisTarihi: '2026-03-04',
    satisBelgeNo: 'GKA2026000000008',
    satisTutari: 515000,
    faturaTuru: 'kar-10',
    not: '',
    satildi: true,
    giderPusulasiDuzenlendi: true,
    faturaKesildi: true
  },
  {
    companyId,
    plaka: '58 FN 613',
    eskiPlaka: '',
    plakaDegistiMi: false,
    alisNoter: 'KAYSERİ 10.NOTERLİĞİ',
    alisTarihi: '2024-07-24',
    alisBelgeTuru: 'Gider Pusulası',
    alisBelgeNo: '6833',
    alisTutari: 300000,
    satisNoter: 'KAYSERİ 10.NOTERLİĞİ',
    satisTarihi: '2026-05-05',
    satisBelgeNo: 'GKT2026000000003',
    satisTutari: 325000,
    faturaTuru: 'kar-10',
    not: '',
    satildi: true,
    giderPusulasiDuzenlendi: true,
    faturaKesildi: true
  },
  {
    companyId,
    plaka: '38 AND 559',
    eskiPlaka: '01 L 8355',
    plakaDegistiMi: true,
    alisNoter: 'ADANA-CEYHAN 3.NOTERLİĞİ',
    alisTarihi: '2025-02-25',
    alisBelgeTuru: 'Fatura',
    alisBelgeNo: 'M012025000000002',
    alisTutari: 320000,
    satisNoter: 'KAYSERİ 10.NOTERLİĞİ',
    satisTarihi: '2026-02-20',
    satisBelgeNo: 'GKA2026000000004',
    satisTutari: 330000,
    faturaTuru: 'kar-20',
    not: 'ESKİ PLAKA:01 L 8355 KARA %20 KDV UYGULANMIŞ ÇEKME BELGELİ',
    satildi: true,
    giderPusulasiDuzenlendi: false,
    faturaKesildi: true
  },
  {
    companyId,
    plaka: '38 AND 695',
    eskiPlaka: '',
    plakaDegistiMi: false,
    alisNoter: 'ADANA 6.NOTERLİĞİ',
    alisTarihi: '2025-02-25',
    alisBelgeTuru: 'Gider Pusulası',
    alisBelgeNo: '6844',
    alisTutari: 340000,
    satisNoter: 'KAYSERİ 10.NOTERLİĞİ',
    satisTarihi: '2026-02-20',
    satisBelgeNo: 'GKA2026000000005',
    satisTutari: 435000,
    faturaTuru: 'kar-10',
    not: 'ÇEKME BELGELİ',
    satildi: true,
    giderPusulasiDuzenlendi: true,
    faturaKesildi: true
  },
  {
    companyId,
    plaka: '42 AG 196',
    eskiPlaka: '',
    plakaDegistiMi: false,
    alisNoter: '',
    alisTarihi: '2025-03-25',
    alisBelgeTuru: 'Gider Pusulası',
    alisBelgeNo: '6848',
    alisTutari: 511840,
    satisNoter: 'KAYSERİ 10.NOTERLİĞİ',
    satisTarihi: '2026-02-02',
    satisBelgeNo: 'GKA2026000000001',
    satisTutari: 525000,
    faturaTuru: 'kar-10',
    not: '',
    satildi: true,
    giderPusulasiDuzenlendi: true,
    faturaKesildi: true
  }
];

const DEFAULT_RECONCILIATION = (companyId: string): Omit<MonthlyReconciliation, 'id'>[] => [
  { companyId, period: '2026-01', zirveAylikToplam: 0, beyannameAylikToplam: 0, not: 'Ocak Ayı' },
  { companyId, period: '2026-02', zirveAylikToplam: 5160318.79, beyannameAylikToplam: 188478.79, not: 'Şubat Ayı' },
  { companyId, period: '2026-03', zirveAylikToplam: 3516818.18, beyannameAylikToplam: 81818.18, not: 'Mart Ayı' },
  { companyId, period: '2026-04', zirveAylikToplam: 3375047.77, beyannameAylikToplam: 104750.80, not: 'Nisan Ayı' }
];

export const AracKdvTakipModule: React.FC<AracKdvTakipModuleProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'reconciliation'>('inventory');
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [reconciliations, setReconciliations] = useState<MonthlyReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [salesFilter, setSalesFilter] = useState<'all' | 'sold' | 'stock'>('all');
  const [gpFilter, setGpFilter] = useState<'all' | 'done' | 'missing'>('all');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'done' | 'missing'>('all');
  const [plateFilter, setPlateFilter] = useState<'all' | 'changed' | 'original'>('all');
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-02'); // Defaults to Feb 2026 (matching screenshot)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<VehicleRecord> | null>(null);

  // Manual comparison states for selected month
  const [manualZirve, setManualZirve] = useState<string>('');
  const [manualBeyan, setManualBeyan] = useState<string>('');

  useEffect(() => {
    if (!profile.id) return;
    setLoading(true);

    const vRef = collection(db, 'companies', profile.id, 'vehicles');
    const unsubscribeVehicles = onSnapshot(vRef, (snapshot) => {
      const vList: VehicleRecord[] = [];
      snapshot.forEach((doc) => {
        vList.push({ id: doc.id, ...doc.data() } as VehicleRecord);
      });
      // Sort: Newest purchase date first
      vList.sort((a, b) => b.alisTarihi.localeCompare(a.alisTarihi));
      setVehicles(vList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `companies/${profile.id}/vehicles`);
      setLoading(false);
    });

    const rRef = collection(db, 'companies', profile.id, 'reconciliations');
    const unsubscribeRecs = onSnapshot(rRef, (snapshot) => {
      const rList: MonthlyReconciliation[] = [];
      snapshot.forEach((doc) => {
        rList.push({ id: doc.id, ...doc.data() } as MonthlyReconciliation);
      });
      setReconciliations(rList);
    });

    return () => {
      unsubscribeVehicles();
      unsubscribeRecs();
    };
  }, [profile.id]);

  // Sync comparison values when selectedPeriod shifts
  useEffect(() => {
    const rec = reconciliations.find(r => r.period === selectedPeriod);
    if (rec) {
      setManualZirve(rec.zirveAylikToplam.toString());
      setManualBeyan(rec.beyannameAylikToplam.toString());
    } else {
      setManualZirve('');
      setManualBeyan('');
    }
  }, [selectedPeriod, reconciliations]);

  const loadDemoData = async () => {
    if (!profile.id) return;
    try {
      setLoading(true);
      const batch = writeBatch(db);

      // Add default vehicles
      const vehiclesData = DEFAULT_VEHICLES(profile.id);
      for (const item of vehiclesData) {
        const docRef = doc(collection(db, 'companies', profile.id, 'vehicles'));
        batch.set(docRef, { ...item, createdAt: serverTimestamp() });
      }

      // Add default reconciliations
      const recsData = DEFAULT_RECONCILIATION(profile.id);
      for (const item of recsData) {
        const id = `${profile.id}_${item.period}`;
        const docRef = doc(db, 'companies', profile.id, 'reconciliations', id);
        batch.set(docRef, item);
      }

      await batch.commit();
    } catch (err: any) {
      alert('Şablon veri yüklenirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.id || !currentRecord) return;

    try {
      if (currentRecord.id) {
        const ref = doc(db, 'companies', profile.id, 'vehicles', currentRecord.id);
        await updateDoc(ref, {
          ...currentRecord,
          updatedAt: serverTimestamp()
        });
      } else {
        const ref = collection(db, 'companies', profile.id, 'vehicles');
        await addDoc(ref, {
          ...currentRecord,
          companyId: profile.id,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setCurrentRecord(null);
    } catch (err: any) {
      alert('Kayıt kaydedilirken hata oluştu: ' + err.message);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Bu araç kaydını kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'companies', profile.id, 'vehicles', id));
    } catch (err: any) {
      alert('Kayıt silinirken hata oluştu: ' + err.message);
    }
  };

  const handleSaveReconciliation = async () => {
    if (!profile.id) return;
    const zirveVal = parseFloat(manualZirve) || 0;
    const beyanVal = parseFloat(manualBeyan) || 0;
    const id = `${profile.id}_${selectedPeriod}`;
    
    try {
      await updateDoc(doc(db, 'companies', profile.id, 'reconciliations', id), {
        zirveAylikToplam: zirveVal,
        beyannameAylikToplam: beyanVal
      }).catch(async (err) => {
        // Set if doesn't exist
        const ref = doc(db, 'companies', profile.id, 'reconciliations', id);
        await addDoc(collection(db, 'companies', profile.id, 'reconciliations'), {
          id,
          companyId: profile.id,
          period: selectedPeriod,
          zirveAylikToplam: zirveVal,
          beyannameAylikToplam: beyanVal
        });
      });
      alert('Hedef değerleri başarıyla güncellendi.');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Auto-calculated fields for each sale based on tax strategy
  const calculatedSales = useMemo(() => {
    return vehicles.map(v => {
      if (!v.satildi) return null;

      const salesPrice = v.satisTutari || 0;
      const purchasePrice = v.alisTutari || 0;
      const profit = Math.max(0, salesPrice - purchasePrice);

      let matrah20 = 0;
      let kdv20 = 0;
      let matrah10 = 0;
      let kdv10 = 0;
      let ozelMatrah = 0;

      switch (v.faturaTuru) {
        case 'kar-10':
          if (profit > 0) {
            matrah10 = profit / 1.10;
            kdv10 = profit - matrah10;
            ozelMatrah = salesPrice - profit;
          } else {
            ozelMatrah = salesPrice;
          }
          break;
        case 'kar-20':
          if (profit > 0) {
            matrah20 = profit / 1.20;
            kdv20 = profit - matrah20;
            ozelMatrah = salesPrice - profit;
          } else {
            ozelMatrah = salesPrice;
          }
          break;
        case 'tam-10':
          matrah10 = salesPrice / 1.10;
          kdv10 = salesPrice - matrah10;
          break;
        case 'tam-20':
          matrah20 = salesPrice / 1.20;
          kdv20 = salesPrice - matrah20;
          break;
        case 'muaf':
        default:
          ozelMatrah = salesPrice;
          break;
      }

      return {
        ...v,
        matrah20,
        kdv20,
        matrah10,
        kdv10,
        ozelMatrah,
        toplamMatrah: matrah10 + matrah20,
        toplamKdv: kdv10 + kdv20,
        ay: v.satisTarihi ? v.satisTarihi.substring(0, 7) : ''
      };
    }).filter(Boolean);
  }, [vehicles]);

  // Statistics for inventory
  const stats = useMemo(() => {
    const totalCount = vehicles.length;
    const activeVehicles = vehicles.filter(v => !v.satildi);
    const soldVehicles = vehicles.filter(v => v.satildi);
    
    const missingGp = vehicles.filter(v => !v.satildi && v.alisBelgeTuru === 'Gider Pusulası' && !v.giderPusulasiDuzenlendi).length;
    const missingInvoice = soldVehicles.filter(v => !v.faturaKesildi).length;

    // Sum of active period's VAT (Total calculated VAT)
    const activePeriodVat = calculatedSales.reduce((acc, curr) => acc + (curr?.toplamKdv || 0), 0);

    return {
      total: totalCount,
      inStock: activeVehicles.length,
      sold: soldVehicles.length,
      missingGp,
      missingInvoice,
      activePeriodVat
    };
  }, [vehicles, calculatedSales]);

  // Filtering vehicles list
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Search
      const searchStr = `${v.plaka} ${v.eskiPlaka} ${v.alisNoter} ${v.satisNoter} ${v.alisBelgeNo} ${v.satisBelgeNo} ${v.not}`.toLowerCase();
      if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false;

      // Sales status filter
      if (salesFilter === 'sold' && !v.satildi) return false;
      if (salesFilter === 'stock' && v.satildi) return false;

      // Gider pusulasi filter
      if (gpFilter === 'done' && !v.giderPusulasiDuzenlendi) return false;
      if (gpFilter === 'missing' && v.giderPusulasiDuzenlendi) return false;

      // Invoice filter
      if (invoiceFilter === 'done' && !v.faturaKesildi) return false;
      if (invoiceFilter === 'missing' && v.faturaKesildi) return false;

      // Plate changed filter
      if (plateFilter === 'changed' && !v.plakaDegistiMi) return false;
      if (plateFilter === 'original' && v.plakaDegistiMi) return false;

      return true;
    });
  }, [vehicles, searchTerm, salesFilter, gpFilter, invoiceFilter, plateFilter]);

  // Current Month / Period Calculations (VAT Controller)
  const periodSales = useMemo(() => {
    return calculatedSales.filter(s => s?.ay === selectedPeriod);
  }, [calculatedSales, selectedPeriod]);

  const periodTotals = useMemo(() => {
    let rawZirveToplam = 0;
    let rawOzelMatrah = 0;
    let rawMatrah10 = 0;
    let rKdv10 = 0;
    let rawMatrah20 = 0;
    let rKdv20 = 0;

    periodSales.forEach(s => {
      if (!s) return;
      rawOzelMatrah += s.ozelMatrah || 0;
      rawMatrah10 += s.matrah10 || 0;
      rKdv10 += s.kdv10 || 0;
      rawMatrah20 += s.matrah20 || 0;
      rKdv20 += s.kdv20 || 0;
      
      // Zirve monthly totals usually represent the Sum of Matrahs + VAT + Special Base
      rawZirveToplam += (s.ozelMatrah || 0) + (s.matrah10 || 0) + (s.kdv10 || 0) + (s.matrah20 || 0) + (s.kdv20 || 0);
    });

    const totalKdv = rKdv10 + rKdv20;
    const totalMatrah = rawMatrah10 + rawMatrah20;
    const beyanAylikGereken = rawMatrah10 + rawMatrah20; // Beyanname Matrah Toplamı

    return {
      ozelMatrah: rawOzelMatrah,
      matrah10: rawMatrah10,
      kdv10: rKdv10,
      matrah20: rawMatrah20,
      kdv20: rKdv20,
      toplamKdv: totalKdv,
      toplamMatrah: totalMatrah,
      zirveAylikToplamGereken: rawZirveToplam,
      beyanAylikGereken
    };
  }, [periodSales]);

  // Cumulative sums up to selected month
  const cumulativeTotals = useMemo(() => {
    const year = selectedPeriod.substring(0, 4);
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const currentMonthIndex = months.indexOf(selectedPeriod.substring(5, 7));

    let cumulativeZirve = 0;
    let cumulativeBeyan = 0;

    months.forEach((m, idx) => {
      if (idx > currentMonthIndex) return;
      const periodId = `${year}-${m}`;

      // Sum auto calculated values for that month
      const currentPeriodSales = calculatedSales.filter(s => s?.ay === periodId);
      currentPeriodSales.forEach(s => {
        if (!s) return;
        cumulativeZirve += (s.ozelMatrah || 0) + (s.matrah10 || 0) + (s.kdv10 || 0) + (s.matrah20 || 0) + (s.kdv20 || 0);
        cumulativeBeyan += (s.matrah10 || 0) + (s.matrah20 || 0);
      });
    });

    return {
      cumulativeZirve,
      cumulativeBeyan
    };
  }, [calculatedSales, selectedPeriod]);

  // Formatter helpers
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1e3a8a] tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            2. El Araç Alım Satım & Beyanname Kontrolü
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Özel matrah, kâr payı KDV dilimleri ve beyanname mutabakat takip sistemi
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl self-start sm:self-auto shadow-sm">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-white text-kilim-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            ARAÇ ENVANTERİ
          </button>
          <button 
            onClick={() => setActiveTab('reconciliation')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'reconciliation' ? 'bg-white text-kilim-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            BEYANNAME / KDV KONTROLÜ
          </button>
        </div>
      </div>

      {vehicles.length === 0 && !loading && (
        <div className="p-8 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/50 text-center max-w-xl mx-auto space-y-4">
          <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-700">Henüz Kayıtlı Araç Verisi Yok</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            İşletmeniz için ikinci el araç alış, satış, plaka değişimi ve KDV hesaplama verilerini takip etmeye başlamak için yeni kayıt ekleyebilir veya örnek Excel şablonunu hızlıca yükleyebilirsiniz.
          </p>
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => {
                setCurrentRecord({
                  plaka: '',
                  eskiPlaka: '',
                  plakaDegistiMi: false,
                  alisNoter: '',
                  alisTarihi: new Date().toISOString().split('T')[0],
                  alisBelgeTuru: 'Gider Pusulası',
                  alisBelgeNo: '',
                  alisTutari: 0,
                  satisNoter: '',
                  satisTarihi: '',
                  satisBelgeNo: '',
                  satisTutari: 0,
                  faturaTuru: 'kar-10',
                  not: '',
                  satildi: false,
                  giderPusulasiDuzenlendi: false,
                  faturaKesildi: false
                });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-opacity-90 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Manuel Ekle
            </button>
            <button 
              onClick={loadDemoData}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Excel Örneğini Yükle
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-kilim-blue" />
          <span className="text-xs font-medium">Veriler yükleniyor...</span>
        </div>
      )}

      {vehicles.length > 0 && !loading && (
        <>
          {/* Quick Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Stoktaki Araçlar</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-800">{stats.inStock} adet</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">Toplam {stats.total}</span>
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-1.5">
              <span className="text-[10px] text-amber-500 uppercase tracking-wider font-bold">Eksik Gider Pusulası</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-600">{stats.missingGp} adet</span>
                {stats.missingGp > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold animate-pulse">Eksik Var</span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold">Eksiksiz</span>
                )}
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-1.5">
              <span className="text-[10px] text-rose-500 uppercase tracking-wider font-bold">Faturası Bekleyen Satış</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-600">{stats.missingInvoice} adet</span>
                {stats.missingInvoice > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-bold animate-pulse">Eksik Var</span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold">Eksiksiz</span>
                )}
              </div>
            </div>

            <div className="p-5 bg-[#1a4fcf]/5 border border-slate-100 rounded-2xl shadow-sm space-y-1.5">
              <span className="text-[10px] text-[#1a4fcf] uppercase tracking-wider font-bold">Toplam KDV Tutarı</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-[#1a4fcf]">{formatMoney(stats.activePeriodVat)}</span>
                <span className="text-[9px] font-semibold text-slate-400">Genel Satışlar</span>
              </div>
            </div>
          </div>

          {/* Tab 1: Inventory Management */}
          {activeTab === 'inventory' && (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              {/* Filter Bar */}
              <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Plaka, Noter, Belge No, Not Ara..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue transition-all"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Satış Durumu</span>
                    <select 
                      value={salesFilter} 
                      onChange={(e: any) => setSalesFilter(e.target.value)}
                      className="border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-slate-50 text-slate-600"
                    >
                      <option value="all">Tümü</option>
                      <option value="sold">Satılanlar</option>
                      <option value="stock">Stoktakiler</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Gider Pusulası</span>
                    <select 
                      value={gpFilter} 
                      onChange={(e: any) => setGpFilter(e.target.value)}
                      className="border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-slate-50 text-slate-600"
                    >
                      <option value="all">Tümü</option>
                      <option value="done">Düzenlenenler</option>
                      <option value="missing">Eksik Olanlar</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Plaka Değişimi</span>
                    <select 
                      value={plateFilter} 
                      onChange={(e: any) => setPlateFilter(e.target.value)}
                      className="border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-slate-50 text-slate-600"
                    >
                      <option value="all">Tümü</option>
                      <option value="changed">Değişen Plakalar</option>
                      <option value="original">Orijinal Plakalar</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => {
                      setCurrentRecord({
                        plaka: '',
                        eskiPlaka: '',
                        plakaDegistiMi: false,
                        alisNoter: '',
                        alisTarihi: new Date().toISOString().split('T')[0],
                        alisBelgeTuru: 'Gider Pusulası',
                        alisBelgeNo: '',
                        alisTutari: 0,
                        satisNoter: '',
                        satisTarihi: '',
                        satisBelgeNo: '',
                        satisTutari: 0,
                        faturaTuru: 'kar-10',
                        not: '',
                        satildi: false,
                        giderPusulasiDuzenlendi: false,
                        faturaKesildi: false
                      });
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-opacity-90 transition-all flex items-center gap-1.5 mt-3 self-end"
                  >
                    <Plus className="w-4 h-4" /> Yeni Araç Ekle
                  </button>
                </div>
              </div>

              {/* Table List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">SIRA</th>
                      <th className="px-6 py-4">PLAKA / DEĞİŞİM</th>
                      <th className="px-6 py-4">ALIŞ NOTER / TARİH</th>
                      <th className="px-6 py-4">ALIM BELGESİ (G.P. / FT.)</th>
                      <th className="px-6 py-4">ALIŞ TUTARI</th>
                      <th className="px-6 py-4">SATIŞ NOTER / TARİH</th>
                      <th className="px-6 py-4">SATIŞ BELGESİ / FATURA</th>
                      <th className="px-6 py-4">SATIŞ TUTARI</th>
                      <th className="px-6 py-4 text-center">G.P. / FT. DURUMU</th>
                      <th className="px-6 py-4 text-center">İŞLEMLER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredVehicles.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-10 text-center text-slate-400 italic">
                          Filtrelerle eşleşen kayıt bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredVehicles.map((v, idx) => (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-slate-400 text-[10px] tracking-wide font-bold">{idx + 1}</td>
                          <td className="px-6 py-4 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tracking-wide">{v.plaka}</span>
                              {v.satildi ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-bold">Satıldı</span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold">Stokta</span>
                              )}
                            </div>
                            {v.plakaDegistiMi && (
                              <div className="text-[10px] text-slate-400">
                                Eski Plaka: <span className="font-bold text-slate-500">{v.eskiPlaka}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-bold block">{v.alisNoter || '-'}</span>
                            <span className="text-slate-500 text-[10px]">{v.alisTarihi ? new Date(v.alisTarihi).toLocaleDateString('tr-TR') : '-'}</span>
                          </td>
                          <td className="px-6 py-4 space-y-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${v.alisBelgeTuru === 'Gider Pusulası' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                              {v.alisBelgeTuru}
                            </span>
                            {v.alisBelgeNo && <span className="block text-slate-900 font-mono text-[10px] mt-1">No: {v.alisBelgeNo}</span>}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{formatMoney(v.alisTutari)}</td>
                          <td className="px-6 py-4 space-y-0.5">
                            {v.satildi ? (
                              <>
                                <span className="text-[10px] text-slate-400 font-bold block">{v.satisNoter || '-'}</span>
                                <span className="text-slate-500 text-[10px]">{v.satisTarihi ? new Date(v.satisTarihi).toLocaleDateString('tr-TR') : '-'}</span>
                              </>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 space-y-1">
                            {v.satildi ? (
                              <>
                                {v.satisBelgeNo && <span className="block text-slate-900 font-mono text-[10px]">No: {v.satisBelgeNo}</span>}
                                <span className="text-[8px] uppercase font-black tracking-wider bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                                  {v.faturaTuru === 'kar-10' ? 'Kâr %10 KDV' : 
                                   v.faturaTuru === 'kar-20' ? 'Kâr %20 KDV' : 
                                   v.faturaTuru === 'tam-10' ? 'Matrah %10' : 
                                   v.faturaTuru === 'tam-20' ? 'Matrah %20' : 'KDV Muaf'}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {v.satildi ? formatMoney(v.satisTutari) : <span className="text-slate-400 italic font-normal text-[10px]">-</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">G.P.:</span>
                                {v.giderPusulasiDuzenlendi ? (
                                  <span title="Gider pusulası düzenlendi"><CheckCircle className="w-4 h-4 text-emerald-500" /></span>
                                ) : (
                                  <span title="Gider pusulası düzenlenmedi"><XCircle className="w-4 h-4 text-rose-400" /></span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-medium">Ft.:</span>
                                {!v.satildi ? (
                                  <span className="text-[9px] text-slate-400 italic">Gerekmiyor</span>
                                ) : v.faturaKesildi ? (
                                  <span title="Satış faturası kesildi"><CheckCircle className="w-4 h-4 text-emerald-500" /></span>
                                ) : (
                                  <span title="Faturası kesilmedi"><XCircle className="w-4 h-4 text-rose-400" /></span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => {
                                  setCurrentRecord(v);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-kilim-blue hover:bg-slate-100 rounded-lg transition-all"
                                title="Güncelle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteRecord(v.id)}
                                className="p-1.5 text-slate-400 hover:text-[#b01e23] hover:bg-rose-50 rounded-lg transition-all"
                                title="Kayıt Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: VAT Declaration Controller & Matching with Zirve */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              {/* Month / Period Selection Panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">AKSESUAR VE TAKVİM DÖNEMİ</span>
                    <div className="flex items-center gap-2">
                      <select 
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="border border-slate-200 font-extrabold text-[#1e3a8a] py-1 px-3 bg-slate-50 rounded-xl outline-none text-sm transition-all focus:border-kilim-blue"
                      >
                        <option value="2026-01">Ocak 2026</option>
                        <option value="2026-02">Şubat 2026</option>
                        <option value="2026-03">Mart 2026</option>
                        <option value="2026-04">Nisan 2026</option>
                        <option value="2026-05">Mayıs 2026</option>
                        <option value="2026-06">Haziran 2026</option>
                        <option value="2026-07">Temmuz 2026</option>
                        <option value="2026-08">Ağustos 2026</option>
                        <option value="2026-09">Eylül 2026</option>
                        <option value="2026-10">Ekim 2026</option>
                        <option value="2026-11">Kasım 2026</option>
                        <option value="2026-12">Aralık 2026</option>
                      </select>
                      <span className="text-xs bg-slate-100 text-slate-400 font-semibold px-2 py-0.5 rounded-full">
                        {periodSales.length} Satış Bulundu
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-[#1e3a8a]/5 border border-[#1e3a8a]/10 p-3 rounded-2xl">
                    <div className="text-[9px] text-[#1e3a8a] font-bold uppercase">Hesaplanan KDV</div>
                    <div className="text-base font-black text-[#1e3a8a]">{formatMoney(periodTotals.toplamKdv)}</div>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl">
                    <div className="text-[9px] text-emerald-600 font-bold uppercase">Toplam Özel Matrah</div>
                    <div className="text-base font-black text-emerald-600">{formatMoney(periodTotals.ozelMatrah)}</div>
                  </div>
                </div>
              </div>

              {/* Main Auditing Table */}
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    KDV HESABI & ÖZEL MATRAH DAĞILIMI
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[900px]">
                    <thead className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-500 font-bold tracking-wide uppercase">
                      <tr>
                        <th className="px-6 py-4" rowSpan={2}>SATIŞ FATURASI / PLAKA</th>
                        <th className="px-6 py-4 text-center border-l border-slate-200 bg-red-50/30 text-rose-900" colSpan={2}>KDV HESAPLAYARAK BİLDİRİMDE BULUNULACAKLAR (%20)</th>
                        <th className="px-6 py-4 text-center border-l border-slate-200 bg-yellow-50/20 text-yellow-900" colSpan={2}>TEVKİFAT UYGULANMAYAN İŞLEMLER (%10)</th>
                        <th className="px-6 py-4 text-center border-l border-slate-200 bg-emerald-50/20 text-emerald-900">HESAPLAMAKSIZIN BİLDİRİLECEK (ÖZEL MATRAH)</th>
                        <th className="px-6 py-4 border-l border-slate-200" rowSpan={2}>TOPLAM FATURA MATRAHI</th>
                        <th className="px-6 py-4" rowSpan={2}>ZİRVE AYLIK TOPLAM (KDV DAHİL)</th>
                      </tr>
                      <tr className="border-t border-slate-200 text-[9px] text-slate-400">
                        {/* %20 */}
                        <th className="px-4 py-2 border-l border-slate-200 bg-rose-50/20">%20 MATRAH</th>
                        <th className="px-4 py-2 bg-rose-50/20">%20 KDV</th>
                        {/* %10 */}
                        <th className="px-4 py-2 border-l border-slate-200 bg-yellow-50/10">%10 MATRAH</th>
                        <th className="px-4 py-2 bg-yellow-50/10">%10 KDV</th>
                        {/* Özel */}
                        <th className="px-4 py-2 border-l border-slate-200 bg-emerald-50/10">ÖZEL MATRAH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {periodSales.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                            Bu dönemde satılan herhangi bir araç faturası bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        periodSales.map((s, idx) => {
                          if (!s) return null;
                          const currentTotal = (s.ozelMatrah || 0) + (s.matrah10 || 0) + (s.kdv10 || 0) + (s.matrah20 || 0) + (s.kdv20 || 0);
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3.5 space-y-1">
                                <span className="font-mono text-slate-900 block font-bold">{s.satisBelgeNo}</span>
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{s.plaka}</span>
                              </td>
                              
                              {/* %20 Matrah */}
                              <td className="px-4 py-3.5 border-l border-slate-150 bg-rose-50/10 text-rose-950 text-right">
                                {s.matrah20 > 0 ? formatMoney(s.matrah20) : '-'}
                              </td>
                              {/* %20 KDV */}
                              <td className="px-4 py-3.5 bg-rose-50/10 text-rose-950 font-bold text-right">
                                {s.kdv20 > 0 ? formatMoney(s.kdv20) : '-'}
                              </td>

                              {/* %10 Matrah */}
                              <td className="px-4 py-3.5 border-l border-slate-150 bg-yellow-50/5 text-slate-900 text-right">
                                {s.matrah10 > 0 ? formatMoney(s.matrah10) : '-'}
                              </td>
                              {/* %10 KDV */}
                              <td className="px-4 py-3.5 bg-yellow-50/5 text-slate-900 font-bold text-right">
                                {s.kdv10 > 0 ? formatMoney(s.kdv10) : '-'}
                              </td>

                              {/* Özel Matrah */}
                              <td className="px-4 py-3.5 border-l border-slate-150 bg-emerald-50/5 text-slate-900 text-right">
                                {s.ozelMatrah > 0 ? formatMoney(s.ozelMatrah) : '-'}
                              </td>

                              {/* Toplam Fatura Matrahi */}
                              <td className="px-6 py-3.5 border-l border-slate-200 bg-slate-50 font-bold text-right">
                                {formatMoney(s.toplamMatrah)}
                              </td>

                              {/* Toplam (Zirve Aylik) */}
                              <td className="px-6 py-3.5 font-extrabold text-[#111827] text-right">
                                {formatMoney(currentTotal)}
                              </td>
                            </tr>
                          );
                        })
                      )}

                      {/* Summary Row */}
                      {periodSales.length > 0 && (
                        <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-[#111827] text-right">
                          <td className="px-6 py-4 text-left">DÖNEM TOPLAMLARI</td>
                          
                          {/* %20 Totals */}
                          <td className="px-4 py-4 bg-rose-100/50 text-rose-950 border-l border-slate-300">{formatMoney(periodTotals.matrah20)}</td>
                          <td className="px-4 py-4 bg-rose-100/50 text-rose-950">{formatMoney(periodTotals.kdv20)}</td>
                          
                          {/* %10 Totals */}
                          <td className="px-4 py-4 bg-yellow-105 border-l border-slate-300">{formatMoney(periodTotals.matrah10)}</td>
                          <td className="px-4 py-4 bg-yellow-105">{formatMoney(periodTotals.kdv10)}</td>
                          
                          {/* Özel Matrah Totals */}
                          <td className="px-4 py-4 bg-emerald-100/40 border-l border-slate-300">{formatMoney(periodTotals.ozelMatrah)}</td>
                          
                          {/* Combined Base Totals */}
                          <td className="px-6 py-4 bg-slate-200 border-l border-slate-300">{formatMoney(periodTotals.toplamMatrah)}</td>
                          
                          {/* Grand Totals */}
                          <td className="px-6 py-4 bg-slate-200">{formatMoney(periodTotals.zirveAylikToplamGereken)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discrepancy & Auditing Dashboard Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Audit Reconciliation Form */}
                <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-slate-800 text-sm">ZİRVE & BEYANNAME HEDEF DEĞERLERİ</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sistem hesaplamalarının doğruluğunu teyit etmek için muhasebe programınız (Zirve, Lucra vb.) ve tebliğ edilecek KDV Beyannamesindeki aylık toplamları aşağıdaki kutucuklara giriniz:
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Zirve Aylık Kümülatif Toplamı (KDV Dahil)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={manualZirve}
                        onChange={(e) => setManualZirve(e.target.value)}
                        placeholder="Örn: 5160318.79"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue tracking-wide"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">KDV Beyannamesi Aylık Matrah Toplamı</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={manualBeyan}
                        onChange={(e) => setManualBeyan(e.target.value)}
                        placeholder="Örn: 188478.79"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue tracking-wide"
                      />
                    </div>

                    <button 
                      onClick={handleSaveReconciliation}
                      className="w-full py-2 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-opacity-90 transition-all"
                    >
                      Hedef Değerleri Güncelle
                    </button>
                  </div>
                </div>

                {/* Discrepancy Warnings Cards */}
                <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <h4 className="font-bold text-slate-800 text-sm uppercase">SMMM UYUMSUZLUK KONTROLÜ (RECONCILER)</h4>
                    </div>

                    <div className="divide-y divide-slate-100 whitespace-nowrap">
                      {/* Comparison 1: Zirve vs Auto-Calculated */}
                      <div className="py-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">Zirve Mutabakatı</span>
                          <span className="text-[10px] text-slate-400">Zirve programındaki beyan ile ve hesaplanan fatura kümülatif tutarlarının karşılaştırılması</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-500 font-mono text-[11px]">Sistem: {formatMoney(periodTotals.zirveAylikToplamGereken)}</span>
                            <span className="font-semibold text-slate-500 font-mono text-[11px]">Zirve: {manualZirve ? formatMoney(parseFloat(manualZirve)) : '-'}</span>
                          </div>
                          {manualZirve ? (
                            Math.abs(periodTotals.zirveAylikToplamGereken - parseFloat(manualZirve)) < 1 ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full inline-block mt-1">Uyumlu (0 TL Fark)</span>
                            ) : (
                              <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                                Fark var: {formatMoney(periodTotals.zirveAylikToplamGereken - parseFloat(manualZirve))}
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full inline-block mt-1">Hedef girilmedi</span>
                          )}
                        </div>
                      </div>

                      {/* Comparison 2: Beyanname Matrah vs Auto-Calculated Base */}
                      <div className="py-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">Beyanname Matrah Kontrolü</span>
                          <span className="text-[10px] text-slate-400">Beyannamedeki matrah toplamı ile araç kâr payı kümülatif matrahının karşılaştırılması</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-500 font-mono text-[11px]">Sistem: {formatMoney(periodTotals.beyanAylikGereken)}</span>
                            <span className="font-semibold text-slate-500 font-mono text-[11px]">Beyan: {manualBeyan ? formatMoney(parseFloat(manualBeyan)) : '-'}</span>
                          </div>
                          {manualBeyan ? (
                            Math.abs(periodTotals.beyanAylikGereken - parseFloat(manualBeyan)) < 1 ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full inline-block mt-1">Uyumlu (0 TL Fark)</span>
                            ) : (
                              <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                                Fark var: {formatMoney(periodTotals.beyanAylikGereken - parseFloat(manualBeyan))}
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full inline-block mt-1">Hedef girilmedi</span>
                          )}
                        </div>
                      </div>

                      {/* Cumulative controls */}
                      <div className="py-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">Kümülatif Yıllık Beyan (KDV Matrahı)</span>
                          <span className="text-[10px] text-slate-400">Ocak ayından seçilen aya kadar oluşan toplam KDV matrahı</span>
                        </div>
                        <div className="text-right font-black font-mono text-slate-900">
                          {formatMoney(cumulativeTotals.cumulativeBeyan)}
                        </div>
                      </div>

                      <div className="py-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">Kümülatif Yıllık Hasılat (Özel + KDV Dahil)</span>
                          <span className="text-[10px] text-slate-400">Ocak ayından seçilen aya kadar olan toplam ciro tutarı</span>
                        </div>
                        <div className="text-right font-black font-mono text-slate-900">
                          {formatMoney(cumulativeTotals.cumulativeZirve)}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: New / Edit Vehicle Record */}
      <AnimatePresence>
        {isModalOpen && currentRecord && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-[#1e3a8a] text-base">
                    {currentRecord.id ? 'Araç Kaydını Güncelle' : 'Yeni Araç Kaydı Ekle'}
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Araç alış, noter, gider pusulası ve satış parametreleri
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setCurrentRecord(null);
                  }}
                  className="p-1 px-2.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
                >
                  Kapat
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveRecord} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* Section A: Alış Bilgileri */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-1">1. ALIŞ & ARAÇ TANIMLARI</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">PLAKA *</label>
                      <input 
                        type="text" 
                        required
                        value={currentRecord.plaka || ''}
                        onChange={(e) => setCurrentRecord({ ...currentRecord, plaka: e.target.value.toUpperCase() })}
                        placeholder="Örn: 38 AGC 535"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue tracking-wider font-extrabold"
                      />
                    </div>

                    <div className="flex gap-4 items-end pb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={currentRecord.plakaDegistiMi || false}
                          onChange={(e) => setCurrentRecord({ ...currentRecord, plakaDegistiMi: e.target.checked })}
                          className="w-4 h-4 text-kilim-blue border-slate-200 rounded focus:ring-kilim-blue"
                        />
                        <span className="text-xs text-slate-700 font-bold">Plaka Değişti Mi?</span>
                      </label>
                    </div>
                  </div>

                  {currentRecord.plakaDegistiMi && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">ESKİ PLAKA</label>
                      <input 
                        type="text" 
                        value={currentRecord.eskiPlaka || ''}
                        onChange={(e) => setCurrentRecord({ ...currentRecord, eskiPlaka: e.target.value.toUpperCase() })}
                        placeholder="Örn: 01 L 8355"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue tracking-wider font-extrabold"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1 font-semibold">ALIŞ İŞLEMİ YAPILAN NOTER</label>
                      <input 
                        type="text" 
                        value={currentRecord.alisNoter || ''}
                        onChange={(e) => setCurrentRecord({ ...currentRecord, alisNoter: e.target.value.toUpperCase() })}
                        placeholder="Örn: KAYSERİ 10.NOTERLİĞİ"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">ALIŞ TARİHİ</label>
                      <input 
                        type="date" 
                        value={currentRecord.alisTarihi || ''}
                        onChange={(e) => setCurrentRecord({ ...currentRecord, alisTarihi: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">ALIM BELGE TÜRÜ</label>
                      <select 
                        value={currentRecord.alisBelgeTuru || 'Gider Pusulası'}
                        onChange={(e: any) => setCurrentRecord({ ...currentRecord, alisBelgeTuru: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue"
                      >
                        <option value="Gider Pusulası">Gider Pusulası (Şahıstan Alım)</option>
                        <option value="Fatura">Fatura (Vergi Mükellefinden)</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">G.P. / FATURA NO</label>
                      <input 
                        type="text" 
                        value={currentRecord.alisBelgeNo || ''}
                        onChange={(e) => setCurrentRecord({ ...currentRecord, alisBelgeNo: e.target.value })}
                        placeholder="Örn: TME2024000000060"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">ALIŞ TUTARI / MALİYET (TL)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={currentRecord.alisTutari || ''}
                        onChange={(e) => setCurrentRecord({ ...currentRecord, alisTutari: parseFloat(e.target.value) || 0 })}
                        placeholder="Örn: 320000"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input 
                        type="checkbox" 
                        checked={currentRecord.giderPusulasiDuzenlendi || false}
                        onChange={(e) => setCurrentRecord({ ...currentRecord, giderPusulasiDuzenlendi: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-700 font-bold">Gider Pusulası Düzenlendi Mi?</span>
                    </label>
                  </div>

                </div>

                {/* Section B: Satış Bilgileri */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">2. SATIŞ & KDV BEYAN SEÇİMLERİ</h4>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={currentRecord.satildi || false}
                        onChange={(e) => setCurrentRecord({ ...currentRecord, satildi: e.target.checked })}
                        className="w-4 h-4 text-rose-500 border-slate-200 rounded focus:ring-rose-400"
                      />
                      <span className="text-xs text-rose-600 font-black">BU ARAÇ SATILDI</span>
                    </label>
                  </div>

                  {currentRecord.satildi ? (
                    <div className="space-y-3">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">SATIŞ İŞLEMİ YAPILAN NOTER</label>
                          <input 
                            type="text" 
                            value={currentRecord.satisNoter || ''}
                            onChange={(e) => setCurrentRecord({ ...currentRecord, satisNoter: e.target.value.toUpperCase() })}
                            placeholder="Örn: KAYSERİ 10.NOTERLİĞİ"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">SATIŞ TARİHİ</label>
                          <input 
                            type="date" 
                            value={currentRecord.satisTarihi || ''}
                            onChange={(e) => setCurrentRecord({ ...currentRecord, satisTarihi: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">KDV HESAPLAMA METODU</label>
                          <select 
                            value={currentRecord.faturaTuru || 'kar-10'}
                            onChange={(e: any) => setCurrentRecord({ ...currentRecord, faturaTuru: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue"
                          >
                            <option value="kar-10">Kâr (Özel Matrah) Üzerinden %10 KDV</option>
                            <option value="kar-20">Kâr (Özel Matrah) Üzerinden %20 KDV</option>
                            <option value="tam-10">Fatura Tamamı Üzerinden %10 KDV</option>
                            <option value="tam-20">Fatura Tamamı Üzerinden %20 KDV</option>
                            <option value="muaf">KDV'siz / Tamamı Özel Matrah (Muaf)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">SATIŞ FATURA NO</label>
                          <input 
                            type="text" 
                            value={currentRecord.satisBelgeNo || ''}
                            onChange={(e) => setCurrentRecord({ ...currentRecord, satisBelgeNo: e.target.value.toUpperCase() })}
                            placeholder="Örn: GKA2026000000004"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1 font-semibold">SATIŞ BEDELİ (TL)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={currentRecord.satisTutari || ''}
                            onChange={(e) => setCurrentRecord({ ...currentRecord, satisTutari: parseFloat(e.target.value) || 0 })}
                            placeholder="Örn: 330000"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-kilim-blue font-mono font-bold text-[#1e3a8a]"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={currentRecord.faturaKesildi || false}
                            onChange={(e) => setCurrentRecord({ ...currentRecord, faturaKesildi: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500"
                          />
                          <span className="text-xs text-slate-700 font-bold">Satış Faturası Kesildi Mi?</span>
                        </label>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-2 max-w-lg">
                      <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500">
                        Araç şu an işletme stokundadır. Satış işlemi yapıldığında yukarıdaki "BU ARAÇ SATILDI" kutucuğunu işaretleyerek satış faturası, KDV beyan yöntemi ve KDV tutarı hesaplama verilerini girmeye başlayabilirsiniz.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section C: Notes */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-1">3. EK NOT VE BİLGİLER</h4>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">AÇIKLAMA / NOT (Çekme Belgesi, Özel Şartlar vb.)</label>
                    <textarea 
                      value={currentRecord.not || ''}
                      onChange={(e) => setCurrentRecord({ ...currentRecord, not: e.target.value })}
                      rows={2}
                      placeholder="Örn: Eski Plaka 01 L 8355, çekme belgeli, kâr üzerinden KDV tahakkuk..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs answer-none focus:border-kilim-blue resize-none"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setCurrentRecord(null);
                    }}
                    className="px-5 py-2.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-md"
                  >
                    KAYDET VE KAPAT
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
