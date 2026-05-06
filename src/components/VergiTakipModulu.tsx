import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Save,
  RefreshCw,
  Calendar,
  FileText,
  ChevronRight,
  ChevronLeft,
  Info,
  Bot,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile, VergiTakipData } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

interface VergiTakipModuluProps {
  profile: CompanyProfile;
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Define state omit to match new VergiTakipData fields
type FormDataFields = Omit<VergiTakipData, 'id' | 'firma_id' | 'ay' | 'yil' | 'created_at' | 'updated_at' | 'ownerId'>;

export const VergiTakipModulu: React.FC<VergiTakipModuluProps> = ({ profile }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<VergiTakipData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'current' | 'future' | 'settings'>('current');

  // Initial Form State
  const initialFormData: FormDataFields = {
    kdv2Borc: 0,
    kdv1Borc: 0,
    muhtasarBorc: 0,
    stopajBorc: 0,
    sgkBorc: 0,
    kvGvBorc: 0,
    damgaVergisi: 0,
    duzeltmeBorcu: 0,
    digerBorc: 0,
    alinabilecekIadeTutarı: 0,
    oncekiDonemKalanIade: 0,
    cariDonemIadeHakki: 0,
    kdvIadesi: 0,
    indirilecekKdv: 0,
    hesaplananKdv: 0,
    ithaldKdv: 0,
    devredenKdv: 0,
    satisFaturaMatrahi: 0,
    alisTeVkifatliMatrahi: 0,
    alisTevsizMatrahi: 0,
    gelecekKdv1: 0,
    gelecekKdv2: 0,
    gelecekMuhtasar: 0,
    gelecekStopaj: 0,
    gelecekGeciciVergi: 0,
    gelecekKurumlarVergisi: 0,
    gelecekSgk: 0,
    gelecekDamga: 0,
    gelecekDuzeltme: 0,
    gelecekDigerBorclar: 0,
    gelecekMuhtemelIade: 0,
    kdvOrani: 20,
    tevkifatPay: 5,
    tevkifatPayda: 10,
    devredenBorc: 0,
    kalanIadeTutari: 0
  };

  const [formData, setFormData] = useState<FormDataFields>(initialFormData);

  // Fetch Records
  useEffect(() => {
    if (!profile.id) return;

    const q = query(
      collection(db, 'vergi_takip'),
      where('firma_id', '==', profile.id),
      where('ownerId', '==', auth.currentUser?.uid),
      orderBy('yil', 'desc'),
      orderBy('ay', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VergiTakipData[];
      setRecords(fetchedRecords);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vergi_takip');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile.id]);

  // Update Form when month/year or records change
  useEffect(() => {
    const currentRecord = records.find(r => r.ay === selectedMonth + 1 && r.yil === selectedYear);
    
    if (currentRecord) {
      setFormData({
        kdv2Borc: currentRecord.kdv2Borc || 0,
        kdv1Borc: currentRecord.kdv1Borc || 0,
        muhtasarBorc: currentRecord.muhtasarBorc || 0,
        stopajBorc: currentRecord.stopajBorc || 0,
        sgkBorc: currentRecord.sgkBorc || 0,
        kvGvBorc: currentRecord.kvGvBorc || 0,
        damgaVergisi: currentRecord.damgaVergisi || 0,
        duzeltmeBorcu: currentRecord.duzeltmeBorcu || 0,
        digerBorc: currentRecord.digerBorc || 0,
        alinabilecekIadeTutarı: currentRecord.alinabilecekIadeTutarı || 0,
        oncekiDonemKalanIade: currentRecord.oncekiDonemKalanIade || 0,
        cariDonemIadeHakki: currentRecord.cariDonemIadeHakki || 0,
        kdvIadesi: currentRecord.kdvIadesi || 0,
        indirilecekKdv: currentRecord.indirilecekKdv || 0,
        hesaplananKdv: currentRecord.hesaplananKdv || 0,
        ithaldKdv: currentRecord.ithaldKdv || 0,
        devredenKdv: currentRecord.devredenKdv || 0,
        satisFaturaMatrahi: currentRecord.satisFaturaMatrahi || 0,
        alisTeVkifatliMatrahi: currentRecord.alisTeVkifatliMatrahi || 0,
        alisTevsizMatrahi: currentRecord.alisTevsizMatrahi || 0,
        gelecekKdv1: currentRecord.gelecekKdv1 || 0,
        gelecekKdv2: currentRecord.gelecekKdv2 || 0,
        gelecekMuhtasar: currentRecord.gelecekMuhtasar || 0,
        gelecekStopaj: currentRecord.gelecekStopaj || 0,
        gelecekGeciciVergi: currentRecord.gelecekGeciciVergi || 0,
        gelecekKurumlarVergisi: currentRecord.gelecekKurumlarVergisi || 0,
        gelecekSgk: currentRecord.gelecekSgk || 0,
        gelecekDamga: currentRecord.gelecekDamga || 0,
        gelecekDuzeltme: currentRecord.gelecekDuzeltme || 0,
        gelecekDigerBorclar: currentRecord.gelecekDigerBorclar || 0,
        gelecekMuhtemelIade: currentRecord.gelecekMuhtemelIade || 0,
        kdvOrani: currentRecord.kdvOrani || 20,
        tevkifatPay: currentRecord.tevkifatPay || 5,
        tevkifatPayda: currentRecord.tevkifatPayda || 10,
        devredenBorc: currentRecord.devredenBorc || 0,
        kalanIadeTutari: currentRecord.kalanIadeTutari || 0
      });
    } else {
      // Find previous month's data for carryover
      let prevMonth = selectedMonth - 1;
      let prevYear = selectedYear;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
      }
      
      const prevRecord = records.find(r => r.ay === prevMonth + 1 && r.yil === prevYear);
      
      if (prevRecord) {
        const prevCalc = calculateOutputs(prevRecord as any);
        setFormData({
          ...initialFormData,
          kdvOrani: prevRecord.kdvOrani || 20,
          tevkifatPay: prevRecord.tevkifatPay || 5,
          tevkifatPayda: prevRecord.tevkifatPayda || 10,
          devredenBorc: prevCalc.mahsupSonrasiKalanBorc,
          devredenKdv: prevCalc.sonrakiAyDevredenKdv,
          oncekiDonemKalanIade: prevCalc.kalanIade
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [selectedMonth, selectedYear, records]);

  // Calculation Logic
  const calculateOutputs = (data: FormDataFields) => {
    // Toplam Mevcut İade Hakkı
    const toplamIadeHakki = data.oncekiDonemKalanIade + data.cariDonemIadeHakki + data.alinabilecekIadeTutarı;

    // Toplam Cari Dönem Borçları
    const cariDonemBorclari = (data.kdv2Borc || 0) + (data.kdv1Borc || 0) + (data.muhtasarBorc || 0) + 
                             (data.stopajBorc || 0) + (data.sgkBorc || 0) + (data.kvGvBorc || 0) + 
                             (data.damgaVergisi || 0) + (data.duzeltmeBorcu || 0) + (data.digerBorc || 0);

    // Toplam Dönem Borcu (Devreden dahil)
    const toplamBorcYukumlulugu = (data.devredenBorc || 0) + cariDonemBorclari;

    // KDV Durumu
    const toplamIndirim = (data.devredenKdv || 0) + (data.ithaldKdv || 0) + (data.indirilecekKdv || 0);
    const odenenKdv1 = Math.max(0, (data.hesaplananKdv || 0) - toplamIndirim);
    const sonrakiAyDevredenKdv = Math.max(0, toplamIndirim - (data.hesaplananKdv || 0));

    // Mahsup Planı
    let kalanIade = toplamIadeHakki;
    
    const mahsup1_kdv2 = Math.min(kalanIade, (data.kdv2Borc || 0));
    kalanIade -= mahsup1_kdv2;
    
    const mahsup2_kdv1 = Math.min(kalanIade, (data.kdv1Borc || 0));
    kalanIade -= mahsup2_kdv1;
    
    const mahsup3_muhtasar_stopaj = Math.min(kalanIade, (data.muhtasarBorc || 0) + (data.stopajBorc || 0));
    kalanIade -= mahsup3_muhtasar_stopaj;
    
    const mahsup4_sgk = Math.min(kalanIade, (data.sgkBorc || 0));
    kalanIade -= mahsup4_sgk;
    
    const mahsup5_kvgv = Math.min(kalanIade, (data.kvGvBorc || 0));
    kalanIade -= mahsup5_kvgv;

    const mahsup6_others = Math.min(kalanIade, (data.damgaVergisi || 0) + (data.duzeltmeBorcu || 0) + (data.digerBorc || 0));
    kalanIade -= mahsup6_others;

    const mahsup7_prev_debt = Math.min(kalanIade, (data.devredenBorc || 0));
    kalanIade -= mahsup7_prev_debt;

    const toplamMahsup = toplamIadeHakki - kalanIade;
    const mahsupSonrasiKalanBorc = Math.max(0, toplamBorcYukumlulugu - toplamMahsup);

    // Açık Analizi & Fatura Önerisi
    const acik = mahsupSonrasiKalanBorc;
    
    // Configurable rates
    const kdvOrani = (data.kdvOrani || 20) / 100;
    const tevkifatOrani = (data.tevkifatPay || 5) / (data.tevkifatPayda || 10);
    const iadeCarsi = kdvOrani * tevkifatOrani; // %20 * 5/10 = 0.10

    const gerekliSatisMatrahi = acik > 0 ? acik / iadeCarsi : 0;
    const gerekliSatisKdv = gerekliSatisMatrahi * kdvOrani;
    const gerekliSatisFatura = gerekliSatisMatrahi + gerekliSatisKdv;

    // KDV Devri Yeterliliği
    const kdvDevriYeterliMi = sonrakiAyDevredenKdv >= gerekliSatisKdv;
    const kdvDevriAcigi = Math.max(0, gerekliSatisKdv - sonrakiAyDevredenKdv);
    const tevkifatsizAlisMatrahi = kdvDevriAcigi / kdvOrani;
    const tevkifatsizAlisFaturası = tevkifatsizAlisMatrahi * (1 + kdvOrani);

    // Gelecek Dönem Analizi
    const gelecekDonemBorclari = (data.gelecekKdv1 || 0) + (data.gelecekKdv2 || 0) + (data.gelecekMuhtasar || 0) + 
                                (data.gelecekStopaj || 0) + (data.gelecekGeciciVergi || 0) + (data.gelecekKurumlarVergisi || 0) +
                                (data.gelecekSgk || 0) + (data.gelecekDamga || 0) + (data.gelecekDuzeltme || 0) + (data.gelecekDigerBorclar || 0);
    
    const gelecekDonemAcik = Math.max(0, (gelecekDonemBorclari + mahsupSonrasiKalanBorc) - (kalanIade + (data.gelecekMuhtemelIade || 0)));

    return {
      toplamIadeHakki,
      cariDonemBorclari,
      toplamBorcYukumlulugu,
      toplamIndirim,
      odenenKdv1,
      sonrakiAyDevredenKdv,
      toplamMahsup,
      kalanIade,
      mahsupSonrasiKalanBorc,
      acik,
      gerekliSatisMatrahi,
      gerekliSatisKdv,
      gerekliSatisFatura,
      kdvDevriYeterliMi,
      kdvDevriAcigi,
      tevkifatsizAlisMatrahi,
      tevkifatsizAlisFaturası,
      gelecekDonemBorclari,
      gelecekDonemAcik,
      mahsuplar: {
        kdv2: mahsup1_kdv2,
        kdv1: mahsup2_kdv1,
        muhtasar_stopaj: mahsup3_muhtasar_stopaj,
        sgk: mahsup4_sgk,
        kvgv: mahsup5_kvgv,
        diger: mahsup6_others,
        devreden: mahsup7_prev_debt
      }
    };
  };

  const outputs = useMemo(() => calculateOutputs(formData), [formData]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = async () => {
    if (!profile.id || !auth.currentUser) return;
    setIsSaving(true);

    try {
      const existingRecord = records.find(r => r.ay === selectedMonth + 1 && r.yil === selectedYear);
      const dataToSave = {
        firma_id: profile.id,
        ownerId: auth.currentUser.uid,
        ay: selectedMonth + 1,
        yil: selectedYear,
        ...formData,
        updated_at: serverTimestamp()
      };

      if (existingRecord?.id) {
        await updateDoc(doc(db, 'vergi_takip', existingRecord.id), dataToSave);
      } else {
        await addDoc(collection(db, 'vergi_takip'), {
          ...dataToSave,
          created_at: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'vergi_takip');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-kilim-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Month Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-kilim-blue/10 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-kilim-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-kilim-blue-dark">KDV İade Durumu & Vergi Planlama</h2>
            <p className="text-xs text-slate-500">Gelişmiş Tevkifatlı İade Analizi ve Borç Mahsup Planı</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-kilim-blue/20"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-kilim-blue/20"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-kilim-blue text-white rounded-xl font-bold hover:bg-kilim-blue/90 transition-all shadow-md disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Verileri Kaydet
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveSubTab('current')}
          className={`pb-3 px-6 text-sm font-bold transition-all border-b-2 ${activeSubTab === 'current' ? 'border-kilim-blue text-kilim-blue' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Cari Dönem Verileri
        </button>
        <button 
          onClick={() => setActiveSubTab('future')}
          className={`pb-3 px-6 text-sm font-bold transition-all border-b-2 ${activeSubTab === 'future' ? 'border-kilim-blue text-kilim-blue' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Gelecek Dönem Tahminleri (Opsiyonel)
        </button>
        <button 
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 px-6 text-sm font-bold transition-all border-b-2 ${activeSubTab === 'settings' ? 'border-kilim-blue text-kilim-blue' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Oran Ayarları
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Dynamic Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <AnimatePresence mode="wait">
            {activeSubTab === 'current' && (
              <motion.div 
                key="current"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="glass-card p-6 bg-white">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <Calendar className="w-4 h-4 text-kilim-blue" />
                    Cari Dönem Borçları
                  </h3>
                  <div className="space-y-3">
                    <InputGroup label="KDV 2 Borcu" value={formData.kdv2Borc} onChange={(v) => handleInputChange('kdv2Borc', v)} />
                    <InputGroup label="KDV 1 Borcu" value={formData.kdv1Borc} onChange={(v) => handleInputChange('kdv1Borc', v)} />
                    <InputGroup label="Muhtasar Borcu" value={formData.muhtasarBorc || 0} onChange={(v) => handleInputChange('muhtasarBorc', v)} />
                    <InputGroup label="Stopaj Borcu" value={formData.stopajBorc} onChange={(v) => handleInputChange('stopajBorc', v)} />
                    <InputGroup label="SGK Borcu" value={formData.sgkBorc} onChange={(v) => handleInputChange('sgkBorc', v)} />
                    <InputGroup label="Geçici / Kurumlar Vergi" value={formData.kvGvBorc} onChange={(v) => handleInputChange('kvGvBorc', v)} />
                    <InputGroup label="Damga Vergisi" value={formData.damgaVergisi || 0} onChange={(v) => handleInputChange('damgaVergisi', v)} />
                    <InputGroup label="Düzeltme / Diğer" value={formData.digerBorc} onChange={(v) => handleInputChange('digerBorc', v)} />
                  </div>
                </div>

                <div className="glass-card p-6 bg-white">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2 text-kilim-blue">
                    <TrendingUp className="w-4 h-4" />
                    KDV İade Hakkı Detayları
                  </h3>
                  <div className="space-y-3">
                    <InputGroup label="Önceki Dönemden Sarkan İade" value={formData.oncekiDonemKalanIade} onChange={(v) => handleInputChange('oncekiDonemKalanIade', v)} highlight />
                    <InputGroup label="Cari Dönem İade Dosyası" value={formData.alinabilecekIadeTutarı} onChange={(v) => handleInputChange('alinabilecekIadeTutarı', v)} highlight />
                    <InputGroup label="Bu Aya Sarkan KDV/Tevkifat" value={formData.cariDonemIadeHakki} onChange={(v) => handleInputChange('cariDonemIadeHakki', v)} />
                  </div>
                </div>

                <div className="glass-card p-6 bg-white">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FileText className="w-4 h-4 text-kilim-blue" />
                    Dönem KDV Özeti
                  </h3>
                  <div className="space-y-3">
                    <InputGroup label="Önceki Aydan Devreden KDV" value={formData.devredenKdv} onChange={(v) => handleInputChange('devredenKdv', v)} disabled />
                    <InputGroup label="İndirilecek KDV" value={formData.indirilecekKdv} onChange={(v) => handleInputChange('indirilecekKdv', v)} />
                    <InputGroup label="Hesaplanan KDV" value={formData.hesaplananKdv} onChange={(v) => handleInputChange('hesaplananKdv', v)} />
                    <InputGroup label="İthalde Ödenen KDV" value={formData.ithaldKdv} onChange={(v) => handleInputChange('ithaldKdv', v)} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'future' && (
              <motion.div 
                key="future"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="glass-card p-6 bg-white">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Gelecek Dönem Borç Tahminleri
                  </h3>
                  <div className="space-y-3">
                    <InputGroup label="Muhtemel KDV 1" value={formData.gelecekKdv1 || 0} onChange={(v) => handleInputChange('gelecekKdv1', v)} />
                    <InputGroup label="Muhtemel KDV 2" value={formData.gelecekKdv2 || 0} onChange={(v) => handleInputChange('gelecekKdv2', v)} />
                    <InputGroup label="Muhtemel Muhtasar / Stopaj" value={(formData.gelecekMuhtasar || 0) + (formData.gelecekStopaj || 0)} onChange={(v) => handleInputChange('gelecekMuhtasar', v)} />
                    <InputGroup label="Muhtemel SGK" value={formData.gelecekSgk || 0} onChange={(v) => handleInputChange('gelecekSgk', v)} />
                    <InputGroup label="Muhtemel Geçici / Kurumlar" value={formData.gelecekGeciciVergi || 0} onChange={(v) => handleInputChange('gelecekGeciciVergi', v)} />
                    <InputGroup label="Muhtemel Diğer Borçlar" value={formData.gelecekDigerBorclar || 0} onChange={(v) => handleInputChange('gelecekDigerBorclar', v)} />
                    <div className="border-t pt-3 mt-3">
                      <InputGroup label="Beklenen Yeni İade Hakkı" value={formData.gelecekMuhtemelIade || 0} onChange={(v) => handleInputChange('gelecekMuhtemelIade', v)} highlight />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="glass-card p-6 bg-white">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <RefreshCw className="w-4 h-4 text-kilim-blue" />
                    Firma Parametreleri
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">KDV Oranı (%)</label>
                      <select 
                        value={formData.kdvOrani || 20}
                        onChange={(e) => handleInputChange('kdvOrani', e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                      >
                        <option value={1}>%1</option>
                        <option value={10}>%10</option>
                        <option value={20}>%20</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tevkifat Oranı (Pay / Payda)</label>
                      <div className="flex gap-2">
                        <select 
                          value={formData.tevkifatPay || 5}
                          onChange={(e) => handleInputChange('tevkifatPay', e.target.value)}
                          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                        >
                          {[1, 2, 3, 4, 5, 7, 9].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="flex items-center text-slate-400 font-bold">/</div>
                        <select 
                          value={formData.tevkifatPayda || 10}
                          onChange={(e) => handleInputChange('tevkifatPayda', e.target.value)}
                          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                        >
                          <option value={10}>10</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 italic">
                        Şu anki ayar: {formData.tevkifatPay}/{formData.tevkifatPayda} Tevkifat
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Calculations & Intelligence */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <ResultCard label="Mevcut Toplam İade" value={formatCurrency(outputs.toplamIadeHakki)} icon={ArrowUpRight} color="text-emerald-600" bg="bg-emerald-50" />
             <ResultCard label="Toplam Borç Yükü" value={formatCurrency(outputs.toplamBorcYukumlulugu)} icon={ArrowDownRight} color="text-rose-600" bg="bg-rose-50" />
             <ResultCard label="Toplam Mahsup" value={formatCurrency(outputs.toplamMahsup)} icon={CheckCircle2} color="text-blue-600" bg="bg-blue-50" />
             <ResultCard label="Kalan Ödeme (Nakit)" value={formatCurrency(outputs.mahsupSonrasiKalanBorc)} icon={AlertTriangle} color={outputs.mahsupSonrasiKalanBorc > 0 ? "text-amber-600" : "text-emerald-600"} bg={outputs.mahsupSonrasiKalanBorc > 0 ? "bg-amber-50" : "bg-emerald-50"} />
          </div>

          {/* Business Analysis Section */}
          <div className="glass-card p-8 bg-slate-900 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Bot className="w-40 h-40" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-kilim-blue-light/20 rounded-xl flex items-center justify-center border border-kilim-blue-light/30">
                  <Calculator className="w-6 h-6 text-kilim-blue-light" />
                </div>
                <h3 className="text-xl font-black tracking-tight">Finansal Karar Destek Analizi</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cari Dönem Soruları */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-kilim-blue-light rounded-full"></span>
                    Cari Dönem Analizi
                  </h4>
                  
                  <div className="space-y-4">
                    <AnalysisItem 
                      question="İade borçlarımıza yetiyor mu?"
                      answer={outputs.toplamIadeHakki >= outputs.toplamBorcYukumlulugu ? "Evet, iade tüm mali yükümlülükleri karşılıyor." : "Hayır, borçları kapatmak için ek iadeye veya nakit ödemeye ihtiyaç var."}
                      status={outputs.toplamIadeHakki >= outputs.toplamBorcYukumlulugu ? 'success' : 'error'}
                    />
                    
                    <AnalysisItem 
                      question="Eksik kalan mahsup tutarı nedir?"
                      answer={outputs.mahsupSonrasiKalanBorc > 0 ? `Kapatılamayan borç tutarı: ${formatCurrency(outputs.mahsupSonrasiKalanBorc)}` : "Tüm borçlar mahsup edilmiştir."}
                      status={outputs.mahsupSonrasiKalanBorc > 0 ? 'warning' : 'success'}
                    />

                    <AnalysisItem 
                      question="Borçları kapatmak için ne kadar fatura kesilmeli?"
                      answer={outputs.gerekliSatisFatura > 0 ? `Yaklaşık ${formatCurrency(outputs.gerekliSatisFatura)} tutarında (${formData.tevkifatPay}/${formData.tevkifatPayda} tevkifatlı) fatura kesilmesi durumunda borçlar iade ile kapanacaktır.` : "Ek fatura kesilmesine ihtiyaç yoktur."}
                      status={outputs.gerekliSatisFatura > 0 ? 'info' : 'success'}
                    />
                  </div>
                </div>

                {/* KDV Devri ve Alış Soruları */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    KDV Devri & Alış İhtiyacı
                  </h4>

                  <div className="space-y-4">
                    <AnalysisItem 
                      question="Mevcut KDV devri bu fatura için yeterli mi?"
                      answer={outputs.kdvDevriYeterliMi ? "Evet, KDV devriniz kesilecek fatura için yeterlidir." : `Hayır, ${formatCurrency(outputs.kdvDevriAcigi)} KDV devri eksiğiniz bulunmaktadır.`}
                      status={outputs.kdvDevriYeterliMi ? 'success' : 'error'}
                    />

                    <AnalysisItem 
                      question="KDV ödemesi çıkmaması için ne kadar alış yapılmalı?"
                      answer={outputs.tevkifatsizAlisFaturası > 0 ? `KDV devrini tamamlamak için ${formatCurrency(outputs.tevkifatsizAlisFaturası)} tutarında (%${formData.kdvOrani}) tevkifatsız alış faturası gereklidir.` : "Mevcut KDV devri yeterlidir, ek alış faturasına gerek yoktur."}
                      status={outputs.tevkifatsizAlisFaturası > 0 ? 'warning' : 'success'}
                    />

                    <AnalysisItem 
                      question="Gelecek dönem borçları için iade yeterli mi?"
                      answer={outputs.gelecekDonemAcik > 0 ? `Gelecek dönemde muhtemel ${formatCurrency(outputs.gelecekDonemAcik)} ek finansman veya iade ihtiyacı oluşacaktır.` : "Tahmini verilere göre gelecek dönem iade ve devirleri borçları karşılamaktadır."}
                      status={outputs.gelecekDonemAcik > 0 ? 'warning' : 'success'}
                    />
                  </div>
                </div>
              </div>

              {/* Action Recommendation */}
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-start gap-4">
                <Info className="w-6 h-6 text-kilim-blue-light flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <p className="text-sm font-bold">Stratejik Planlama Notu</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {outputs.acik > 0 
                      ? `${formData.tevkifatPay}/${formData.tevkifatPayda} tevkifat oranı ve %${formData.kdvOrani} KDV ile yaptığımız simülasyona göre, dönemi borçsuz kapatmak için ${formatCurrency(outputs.gerekliSatisFatura)} tutarında fatura planlaması yapmanız önerilir. Eğer KDV devriniz yetmiyorsa, ${formatCurrency(outputs.tevkifatsizAlisFaturası)} tutarında mal/hizmet alımı yaparak devri güçlendirmeniz vergi yükünü minimize edecektir.`
                      : "Bu dönem mali yapınız dengeli görünmektedir. Mevcut iade haklarınızı kullanarak nakit çıkışı yapmadan borçlarınızı mahsup edebilirsiniz. Gelecek dönem tahminlerinizi girdiğinizde planlamayı bir adım öteye taşıyabiliriz."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 bg-white">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Özet KDV Durumu
              </h3>
              <div className="space-y-3">
                <DataRow label="Önceki Aydan Devir" value={formatCurrency(formData.devredenKdv || 0)} />
                <DataRow label="Toplam İndirimler" value={formatCurrency(outputs.toplamIndirim)} />
                <DataRow label="Hesaplanan KDV" value={formatCurrency(formData.hesaplananKdv || 0)} />
                <div className="border-t pt-2 mt-2">
                  <DataRow label="Sonraki Aya Devreden KDV" value={formatCurrency(outputs.sonrakiAyDevredenKdv)} color="text-emerald-600" highlight />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 bg-white">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FileText className="w-4 h-4 text-kilim-blue" />
                Mahsup Dökümü
              </h3>
              <div className="space-y-2">
                <MahsupRow label="KDV 2 Mahsubu" value={outputs.mahsuplar.kdv2} />
                <MahsupRow label="KDV 1 Mahsubu" value={outputs.mahsuplar.kdv1} />
                <MahsupRow label="Muhtasar & Stopaj" value={outputs.mahsuplar.muhtasar_stopaj} />
                <MahsupRow label="SGK Mahsubu" value={outputs.mahsuplar.sgk} />
                <MahsupRow label="KV / GV Mahsubu" value={outputs.mahsuplar.kvgv} />
                <MahsupRow label="Önceki Ay Borç Mahsubu" value={outputs.mahsuplar.devreden} />
                <div className="border-t pt-2 mt-2 flex justify-between font-black text-blue-600">
                  <span>Toplam Mahsup Uygulanan</span>
                  <span>{formatCurrency(outputs.toplamMahsup)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const AnalysisItem = ({ question, answer, status }: { question: string, answer: string, status: 'success' | 'warning' | 'error' | 'info' }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-bold text-slate-500">{question}</p>
    <div className="flex gap-2">
       {status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />}
       {status === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />}
       {status === 'error' && <XCircle className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />}
       {status === 'info' && <Info className="w-3 h-3 text-kilim-blue-light flex-shrink-0 mt-0.5" />}
       <p className={`text-xs font-medium leading-relaxed ${status === 'error' ? 'text-rose-200' : 'text-slate-200'}`}>{answer}</p>
    </div>
  </div>
);

const InputGroup = ({ label, value, onChange, highlight = false, disabled = false }: { label: string, value: number, onChange: (v: string) => void, highlight?: boolean, disabled?: boolean }) => (
  <div className={`p-3 rounded-xl border transition-all ${highlight ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'} ${disabled ? 'opacity-60 bg-slate-100' : ''}`}>
    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
    <div className="relative">
      <input 
        type="number" 
        value={value === 0 ? '' : value} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-transparent text-sm font-black text-slate-800 outline-none pr-6"
        placeholder="0.00"
      />
      <span className="absolute right-0 top-0 text-[10px] font-bold text-slate-400">₺</span>
    </div>
  </div>
);

const ResultCard = ({ label, value, icon: Icon, color, bg }: { label: string, value: string, icon: any, color: string, bg: string }) => (
  <div className={`p-6 rounded-3xl ${bg} border border-white shadow-sm`}>
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <p className={`text-xl font-black ${color}`}>{value}</p>
  </div>
);

const DataRow = ({ label, value, highlight = false, color = "text-slate-700" }: { label: string, value: string, highlight?: boolean, color?: string }) => (
  <div className={`flex justify-between items-center py-2 ${highlight ? 'bg-slate-50 px-2 rounded-lg border border-slate-100' : ''}`}>
    <span className="text-xs font-bold text-slate-500">{label}</span>
    <span className={`text-sm font-black ${color}`}>{value}</span>
  </div>
);

const MahsupRow = ({ label, value }: { label: string, value: number }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs text-slate-500">{label}</span>
    <span className={`text-xs font-bold ${value > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
      {value > 0 ? value.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + " ₺" : "-"}
    </span>
  </div>
);
