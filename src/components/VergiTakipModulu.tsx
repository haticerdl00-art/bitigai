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
  Info
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

export const VergiTakipModulu: React.FC<VergiTakipModuluProps> = ({ profile }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<VergiTakipData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Omit<VergiTakipData, 'id' | 'firma_id' | 'ay' | 'yil' | 'created_at' | 'ownerId'>>({
    kdv2Borc: 0,
    kdv1Borc: 0,
    stopajBorc: 0,
    sgkBorc: 0,
    kvGvBorc: 0,
    digerBorc: 0,
    kdvIadesi: 0,
    ithaldKdv: 0,
    hesaplananKdv: 0,
    indirilecekKdv: 0,
    satisFaturaMatrahi: 0,
    alisTeVkifatliMatrahi: 0,
    alisTevsizMatrahi: 0,
    devredenBorc: 0,
    devredenKdv: 0
  });

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
        kdv2Borc: currentRecord.kdv2Borc,
        kdv1Borc: currentRecord.kdv1Borc,
        stopajBorc: currentRecord.stopajBorc,
        sgkBorc: currentRecord.sgkBorc,
        kvGvBorc: currentRecord.kvGvBorc,
        digerBorc: currentRecord.digerBorc,
        kdvIadesi: currentRecord.kdvIadesi,
        ithaldKdv: currentRecord.ithaldKdv,
        hesaplananKdv: currentRecord.hesaplananKdv,
        indirilecekKdv: currentRecord.indirilecekKdv,
        satisFaturaMatrahi: currentRecord.satisFaturaMatrahi,
        alisTeVkifatliMatrahi: currentRecord.alisTeVkifatliMatrahi,
        alisTevsizMatrahi: currentRecord.alisTevsizMatrahi,
        devredenBorc: currentRecord.devredenBorc,
        devredenKdv: currentRecord.devredenKdv
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
      
      // If we found a previous record, we need to calculate its outputs to get devreden values
      // But for simplicity in the form, we'll just use the values if they exist, 
      // or wait for the useMemo to provide them if we are creating a new record.
      // Actually, the user wants them "otomatik olarak yeni ayın girdisi olsun".
      
      if (prevRecord) {
        // We need to run the calculation for the prevRecord to get its mahsupSonrasiKalanBorc and sonrakiAyDevredenKdv
        const prevCalc = calculateOutputs(prevRecord);
        setFormData({
          kdv2Borc: 0, kdv1Borc: 0, stopajBorc: 0, sgkBorc: 0, kvGvBorc: 0, digerBorc: 0,
          kdvIadesi: 0, ithaldKdv: 0, hesaplananKdv: 0, indirilecekKdv: 0,
          satisFaturaMatrahi: 0, alisTeVkifatliMatrahi: 0, alisTevsizMatrahi: 0,
          devredenBorc: prevCalc.mahsupSonrasiKalanBorc,
          devredenKdv: prevCalc.sonrakiAyDevredenKdv
        });
      } else {
        setFormData({
          kdv2Borc: 0, kdv1Borc: 0, stopajBorc: 0, sgkBorc: 0, kvGvBorc: 0, digerBorc: 0,
          kdvIadesi: 0, ithaldKdv: 0, hesaplananKdv: 0, indirilecekKdv: 0,
          satisFaturaMatrahi: 0, alisTeVkifatliMatrahi: 0, alisTevsizMatrahi: 0,
          devredenBorc: 0, devredenKdv: 0
        });
      }
    }
  }, [selectedMonth, selectedYear, records]);

  // Calculation Logic (Step 3 in Doc)
  const calculateOutputs = (data: Omit<VergiTakipData, 'id' | 'firma_id' | 'ay' | 'yil' | 'created_at' | 'ownerId'>) => {
    // 3.1 Toplam Dönem Borcu
    const toplamDonemBorcu = data.devredenBorc + data.kdv2Borc + data.kdv1Borc + data.stopajBorc + data.sgkBorc + data.kvGvBorc + data.digerBorc;

    // 3.2 KDV Durumu
    const toplamIndirim = data.devredenKdv + data.ithaldKdv + data.indirilecekKdv;
    const odenenKdv1 = Math.max(0, data.hesaplananKdv - toplamIndirim);
    const sonrakiAyDevredenKdv = Math.max(0, toplamIndirim - data.hesaplananKdv);

    // 3.3 Mahsup Planı (Sıralı)
    const mahsup1_kdv2 = Math.min(data.kdvIadesi, data.kdv2Borc);
    const kalan1 = data.kdvIadesi - mahsup1_kdv2;
    
    const mahsup2_kdv1 = Math.min(kalan1, data.kdv1Borc);
    const kalan2 = kalan1 - mahsup2_kdv1;
    
    const mahsup3_stopaj = Math.min(kalan2, data.stopajBorc);
    const kalan3 = kalan2 - mahsup3_stopaj;
    
    const mahsup4_sgk = Math.min(kalan3, data.sgkBorc);
    const kalan4 = kalan3 - mahsup4_sgk;
    
    const mahsup5_kvgv = Math.min(kalan4, data.kvGvBorc);
    
    const toplamMahsup = mahsup1_kdv2 + mahsup2_kdv1 + mahsup3_stopaj + mahsup4_sgk + mahsup5_kvgv;
    const kalanIade = Math.max(0, data.kdvIadesi - toplamMahsup);
    const mahsupSonrasiKalanBorc = Math.max(0, toplamDonemBorcu - data.kdvIadesi);

    // 3.4 Açık Analizi
    const acik = Math.max(0, mahsupSonrasiKalanBorc - kalanIade); // Note: The doc says acik = mahsupSonrasiKalanBorc - kdvIadesi in 3.4 but then uses acik = toplamDonemBorcu - kdvIadesi in 7. Let's follow the logic of "gap not closed by refund".
    // Actually, 3.4 says acik = Math.max(0, mahsupSonrasiKalanBorc - kdvIadesi). Wait, mahsupSonrasiKalanBorc is already (toplamDonemBorcu - kdvIadesi).
    // Let's re-read 3.4: acik = Math.max(0, mahsupSonrasiKalanBorc - kdvIadesi). This seems redundant if mahsupSonrasiKalanBorc = toplamDonemBorcu - kdvIadesi.
    // Let's use the formula from step 7: acik = Math.max(0, toplamDonemBorcu - kdvIadesi)
    const acikFinal = Math.max(0, toplamDonemBorcu - data.kdvIadesi);

    // 3.5 Kesilmesi Gereken Tevkifatlı Fatura
    const iadeOrani = 0.10; // %20 KDV * %50 Tevkifat
    const gerekliSatisMatrahi = acikFinal / iadeOrani;
    const gerekliSatisKdv = gerekliSatisMatrahi * 0.20;
    const gerekliSatisFatura = gerekliSatisMatrahi + gerekliSatisKdv;

    // 3.6 KDV Devri Yeterliliği
    const kdvDevriAcigi = Math.max(0, gerekliSatisKdv - sonrakiAyDevredenKdv);

    // 3.7 Gereken Tevkifatsız Alış Faturası
    const tevkifatsizMatrah = kdvDevriAcigi / 0.20;
    const tevkifatsizFatura = tevkifatsizMatrah * 1.20;

    return {
      toplamDonemBorcu,
      toplamIndirim,
      odenenKdv1,
      sonrakiAyDevredenKdv,
      mahsup1_kdv2,
      mahsup2_kdv1,
      mahsup3_stopaj,
      mahsup4_sgk,
      mahsup5_kvgv,
      toplamMahsup,
      kalanIade,
      mahsupSonrasiKalanBorc,
      acik: acikFinal,
      gerekliSatisMatrahi,
      gerekliSatisKdv,
      gerekliSatisFatura,
      kdvDevriAcigi,
      tevkifatsizMatrah,
      tevkifatsizFatura
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
            <h2 className="text-xl font-bold text-kilim-blue-dark">Vergi Takip Modülü</h2>
            <p className="text-xs text-slate-500">5/10 Tevkifatlı Firma | Aylık KDV & Vergi Borç Analizi</p>
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
            Kaydet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 bg-white">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
              <Calendar className="w-4 h-4 text-kilim-blue" />
              Dönem Girdileri
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <InputGroup label="KDV 2 Borcu" value={formData.kdv2Borc} onChange={(v) => handleInputChange('kdv2Borc', v)} />
                <InputGroup label="KDV 1 Borcu" value={formData.kdv1Borc} onChange={(v) => handleInputChange('kdv1Borc', v)} />
                <InputGroup label="Stopaj Borcu" value={formData.stopajBorc} onChange={(v) => handleInputChange('stopajBorc', v)} />
                <InputGroup label="SGK Borcu" value={formData.sgkBorc} onChange={(v) => handleInputChange('sgkBorc', v)} />
                <InputGroup label="KV / GV Borcu" value={formData.kvGvBorc} onChange={(v) => handleInputChange('kvGvBorc', v)} />
                <InputGroup label="Diğer Borçlar" value={formData.digerBorc} onChange={(v) => handleInputChange('digerBorc', v)} />
                <div className="border-t pt-4 mt-2">
                  <InputGroup label="KDV İadesi (Hakkı)" value={formData.kdvIadesi} onChange={(v) => handleInputChange('kdvIadesi', v)} highlight />
                  <InputGroup label="İthalde Ödenen KDV" value={formData.ithaldKdv} onChange={(v) => handleInputChange('ithaldKdv', v)} />
                  <InputGroup label="Hesaplanan KDV" value={formData.hesaplananKdv} onChange={(v) => handleInputChange('hesaplananKdv', v)} />
                  <InputGroup label="İndirilecek KDV" value={formData.indirilecekKdv} onChange={(v) => handleInputChange('indirilecekKdv', v)} />
                </div>
                <div className="border-t pt-4 mt-2">
                  <InputGroup label="Devreden Borç (Önceki Ay)" value={formData.devredenBorc} onChange={(v) => handleInputChange('devredenBorc', v)} disabled />
                  <InputGroup label="Devreden KDV (Önceki Ay)" value={formData.devredenKdv} onChange={(v) => handleInputChange('devredenKdv', v)} disabled />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis & Results */}
        <div className="lg:col-span-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard label="Toplam Dönem Borcu" value={formatCurrency(outputs.toplamDonemBorcu)} icon={ArrowDownRight} color="text-rose-600" bg="bg-rose-50" />
            <ResultCard label="Toplam Mahsup" value={formatCurrency(outputs.toplamMahsup)} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
            <ResultCard label="Kalan Borç (Açık)" value={formatCurrency(outputs.acik)} icon={AlertTriangle} color={outputs.acik > 0 ? "text-amber-600" : "text-emerald-600"} bg={outputs.acik > 0 ? "bg-amber-50" : "bg-emerald-50"} />
          </div>

          {/* KDV Analizi & Mahsup Planı */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 bg-white">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                <TrendingUp className="w-4 h-4 text-kilim-blue" />
                KDV Analizi
              </h3>
              <div className="space-y-3">
                <DataRow label="Toplam İndirim" value={formatCurrency(outputs.toplamIndirim)} />
                <DataRow label="Ödenecek KDV 1" value={formatCurrency(outputs.odenenKdv1)} highlight={outputs.odenenKdv1 > 0} />
                <DataRow label="Sonraki Aya Devreden KDV" value={formatCurrency(outputs.sonrakiAyDevredenKdv)} color="text-emerald-600" />
              </div>
            </div>

            <div className="glass-card p-6 bg-white">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FileText className="w-4 h-4 text-kilim-blue" />
                Mahsup Planı (Sıralı)
              </h3>
              <div className="space-y-2">
                <MahsupRow label="KDV 2" value={outputs.mahsup1_kdv2} />
                <MahsupRow label="KDV 1" value={outputs.mahsup2_kdv1} />
                <MahsupRow label="Stopaj" value={outputs.mahsup3_stopaj} />
                <MahsupRow label="SGK" value={outputs.mahsup4_sgk} />
                <MahsupRow label="KV / GV" value={outputs.mahsup5_kvgv} />
                <div className="border-t pt-2 mt-2 flex justify-between font-black text-emerald-600">
                  <span>Toplam Mahsup</span>
                  <span>{formatCurrency(outputs.toplamMahsup)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Açık Analizi & Fatura Hesaplama */}
          <div className="glass-card p-8 bg-slate-900 text-white border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Calculator className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Info className="w-6 h-6 text-kilim-blue-light" />
                  Açık Analizi & Fatura Önerisi
                </h3>
                <div className={`px-4 py-1 rounded-full text-xs font-bold ${outputs.acik > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                  {outputs.acik > 0 ? '⚠ EK FATURA GEREKLİ' : '✔ İADE YETERLİ'}
                </div>
              </div>

              {outputs.acik > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Borçlarınızı iade ile kapatmak için kesilmesi gereken <span className="text-white font-bold">5/10 tevkifatlı</span> fatura tutarı:
                    </p>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Kesilecek Toplam Fatura</p>
                      <p className="text-3xl font-black text-kilim-blue-light">{formatCurrency(outputs.gerekliSatisFatura)}</p>
                      <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                        <span>Matrah: {formatCurrency(outputs.gerekliSatisMatrahi)}</span>
                        <span>KDV (%20): {formatCurrency(outputs.gerekliSatisKdv)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-slate-400 leading-relaxed">
                      KDV devri yeterliliği ve ek alış ihtiyacı:
                    </p>
                    <div className={`p-4 rounded-2xl border ${outputs.kdvDevriAcigi > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] uppercase font-bold">KDV Devri Durumu</p>
                        <span className={`text-[10px] font-bold ${outputs.kdvDevriAcigi > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {outputs.kdvDevriAcigi > 0 ? '⚠ YETERSİZ' : '✔ YETERLİ'}
                        </span>
                      </div>
                      {outputs.kdvDevriAcigi > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-300">Devri artırmak için gereken tevkifatsız alış:</p>
                          <p className="text-xl font-bold text-rose-400">{formatCurrency(outputs.tevkifatsizFatura)}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-400 font-medium">Mevcut KDV devriniz kesilecek fatura için yeterlidir.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-emerald-400">Tebrikler!</h4>
                  <p className="text-slate-400 mt-2">Mevcut iade hakkınız tüm dönem borçlarınızı fazlasıyla karşılamaktadır. Ek fatura kesmenize gerek yoktur.</p>
                </div>
              )}
            </div>
          </div>

          {/* Devre Kapama Bilgisi */}
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-800">Sonraki Aya Aktarılacak Veriler</p>
              <div className="flex gap-6 mt-1">
                <span className="text-[10px] text-blue-600 font-medium">Devreden Borç: {formatCurrency(outputs.mahsupSonrasiKalanBorc)}</span>
                <span className="text-[10px] text-blue-600 font-medium">Devreden KDV: {formatCurrency(outputs.sonrakiAyDevredenKdv)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InputGroup = ({ label, value, onChange, highlight = false, disabled = false }: { label: string, value: number, onChange: (v: string) => void, highlight?: boolean, disabled?: boolean }) => (
  <div className={`p-3 rounded-xl border transition-all ${highlight ? 'bg-kilim-blue-pale/30 border-kilim-blue-light/30' : 'bg-slate-50 border-slate-100'} ${disabled ? 'opacity-60' : ''}`}>
    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
    <div className="relative">
      <input 
        type="number" 
        value={value || ''} 
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
  <div className={`flex justify-between items-center py-2 ${highlight ? 'bg-amber-50 px-2 rounded-lg' : ''}`}>
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
