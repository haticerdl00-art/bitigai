import React, { useState } from 'react';
import { 
  Building2, 
  ChevronRight, 
  ArrowRight, 
  Percent, 
  HelpCircle,
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Calculator, 
  ShieldCheck, 
  RefreshCw,
  Info,
  Layers,
  Calendar,
  Sparkles,
  ClipboardCheck,
  Share2,
  FileText,
  Mail,
  Coins
} from 'lucide-react';
import { CompanyProfile } from '../types';

interface VatRefundAnalysisProps {
  profile: CompanyProfile;
}

type IadeTuru = 'KDV' | 'Stopaj' | 'Kurumlar_Vergisi' | 'Gelir_Vergisi' | 'Ithalat_Ihracat';
type IadeYontemi = 'Mahsuben' | 'Nakden';

export const VatRefundAnalysis: React.FC<VatRefundAnalysisProps> = ({ profile }) => {
  // Refund states
  const [kdvDevri, setKdvDevri] = useState(240000); // Current cumulative VAT (KDV Devri)
  const [iadeYontemi, setIadeYontemi] = useState<IadeYontemi>('Mahsuben');
  const [iadeTuru, setIadeTuru] = useState<IadeTuru>('KDV');

  // Offset Timeline Parameters
  const [prevLeftoverTaxes, setPrevLeftoverTaxes] = useState(45000); // Past due unpaid taxes (Nisandan sarkan borçlar)
  const [currentPeriodTaxes, setCurrentPeriodTaxes] = useState(120000); // May liabilities (Mayıs cari borcu)
  const [aprilRefundAmount, setAprilRefundAmount] = useState(95000); // Received refund from April (Nisan ayı iade hakkı)

  // Tevkifat Invoice Calculator Parameters
  const [vatRate, setVatRate] = useState<number>(20); // 1%, 10%, 20%
  const [tevkifatPay, setTevkifatPay] = useState<number>(5); // e.g. 5/10
  const [tevkifatPayda, setTevkifatPayda] = useState<number>(10);

  // 1. Offsetting Logic (Offset timeline: Haziran ayında Mayıs verilir, Nisan iadesine başvurulur)
  // First, April refund is used to pay previous leftover taxes (Nisandan sarkan borçlar)
  const amountToPrevTaxes = Math.min(aprilRefundAmount, prevLeftoverTaxes);
  const remainingRefundAfterPrev = Math.max(0, aprilRefundAmount - prevLeftoverTaxes);
  const remainingPrevTaxesAfterRefund = Math.max(0, prevLeftoverTaxes - aprilRefundAmount);

  // Then remaining refund is used to pay current period taxes (Mayıs ayı cari dönem borçları)
  const amountToCurrentTaxes = Math.min(remainingRefundAfterPrev, currentPeriodTaxes);
  const remainingRefundAfterCurrent = Math.max(0, remainingRefundAfterPrev - currentPeriodTaxes);
  const remainingCurrentTaxesAfterRefund = Math.max(0, currentPeriodTaxes - remainingRefundAfterPrev);

  // Total unpaid liabilities rolling over to next period (Haziran sonrasına sarkan borç)
  const totalRolloverTaxes = remainingPrevTaxesAfterRefund + remainingCurrentTaxesAfterRefund;
  const isRefundSufficient = totalRolloverTaxes === 0;

  // 2. Tevkifatlı Fatura / KDV2 Requirements calculations
  // If unpaid liabilities sarkan is positive, how much KDV withholdings do we need to close the gap?
  // We need withheld VAT = totalRolloverTaxes to fully close the gap.
  // Withheld VAT = Base * VAT_rate% * (tevkifatPay / tevkifatPayda)
  // Base * (vatRate/100) * (tevkifatPay/tevkifatPayda) = totalRolloverTaxes
  // Base = totalRolloverTaxes / [ (vatRate/100) * (tevkifatPay/tevkifatPayda) ]
  
  const selectedTevkifatFactor = (vatRate / 100) * (tevkifatPay / tevkifatPayda);
  const requiredInvoiceBase = selectedTevkifatFactor > 0 ? (totalRolloverTaxes / selectedTevkifatFactor) : 0;
  const calculatedWithheldVat = requiredInvoiceBase * selectedTevkifatFactor;
  const totalInvoiceVat = requiredInvoiceBase * (vatRate / 100);
  const invoiceNetPayableFromCustomer = requiredInvoiceBase + (totalInvoiceVat - calculatedWithheldVat);

  // Is cumulative VAT (KDV devri) sufficient to back this reverse charge invoice?
  // Since we are issuing invoices, we pay/use cumulative VAT if our VAT input was high.
  // To issue this sales with this amount of VAT, does our KDV Devri support it?
  // If we issue requiredInvoiceBase, it utilizes part of our VAT pool.
  const isKdvDevriSufficient = kdvDevri >= (totalInvoiceVat - calculatedWithheldVat);
  const kdvDevriShortage = Math.max(0, (totalInvoiceVat - calculatedWithheldVat) - kdvDevri);

  // If cumulative VAT is insufficient, how much Purchase (Alış) with the same VAT rate is needed?
  // Purchase VAT required = kdvDevriShortage
  // Purchase Base = kdvDevriShortage / (vatRate/100)
  const requiredPurchaseBase = (kdvDevriShortage / (vatRate / 100)) || 0;
  const requiredPurchaseVat = kdvDevriShortage;

  const [copiedNotification, setCopiedNotification] = useState(false);

  // Copy report to clipboard
  const handleCopyReport = () => {
    let text = `🛡️ BİTİG AI - KDV İADE VE MAHSUP KOORDİNASYON RAPORU 🛡️\n`;
    text += `Mükellef: ${profile.title}\n`;
    text += `Tarih: ${new Date().toLocaleDateString('tr-TR')}\n`;
    text += `İade Yöntemi: ${iadeYontemi}  |  İade Türü: ${iadeTuru.replace('_', ' ')}\n`;
    text += `----------------------------------------------------------\n\n`;
    text += `1. MAHSUPLU ÖDEME VE MAHSUP DURUMU\n`;
    text += `- Başvurulan iade tutarı (Nisan): ₺${aprilRefundAmount.toLocaleString('tr-TR')}\n`;
    text += `- Bir önceki dönemden sarkan borçlar (Nisan sonu): ₺${prevLeftoverTaxes.toLocaleString('tr-TR')}\n`;
    text += `- Cari Dönem Borçları (Mayıs ayından doğan): ₺${currentPeriodTaxes.toLocaleString('tr-TR')}\n`;
    text += `- Önceki dönem sarkan borca mahsup edilen: ₺${amountToPrevTaxes.toLocaleString('tr-TR')}\n`;
    text += `- Cari Dönem borcuna mahsup edilen: ₺${amountToCurrentTaxes.toLocaleString('tr-TR')}\n`;
    text += `- Gelecek döneme sarkan / Ödenemeyen Vergi Borcu: ₺${totalRolloverTaxes.toLocaleString('tr-TR')}\n`;
    
    if (isRefundSufficient) {
      text += `🎯 DURUM: İadeniz tüm vergi borçlarınıza tam yetmektedir. Sarkan borç yoktur. Artan devreden iade: ₺${remainingRefundAfterCurrent.toLocaleString('tr-TR')}\n\n`;
    } else {
      text += `⚠️ DURUM: İadeniz borçları kapatmaya YETMEMİŞTİR. Gelecek aya sarkan açık: ₺${totalRolloverTaxes.toLocaleString('tr-TR')}\n\n`;
      text += `2. AÇIĞI KAPATMAK İÇİN TEVKİFATLI FATURA KILAVUZU\n`;
      text += `Vergi açığını kapatabilmek ve cebinizden nakit çıkışını önlemek için kesmeniz gereken tevkifatlı fatura bilgileri:\n`;
      text += `- Seçilen KDV Oranı: %${vatRate}\n`;
      text += `- Tevkifat Oranı: ${tevkifatPay}/${tevkifatPayda}\n`;
      text += `- Kesilmesi Gereken Fatura Matrahı (Taban): ₺${requiredInvoiceBase.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}\n`;
      text += `- Elde Edilecek İade Artışı (Tevkifat Tutarı): ₺${calculatedWithheldVat.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}\n`;
      text += `- Müşteriden Tahsil Edilecek Net Tutar: ₺${invoiceNetPayableFromCustomer.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}\n\n`;

      if (isKdvDevriSufficient) {
        text += `✓ KDV DEVRİ KONTROLÜ: Mevcut ₺${kdvDevri.toLocaleString('tr-TR')} KDV devriniz bu faturayı kesmek için yeterlidir.\n`;
      } else {
        text += `❌ KDV DEVRİ YETERSİZLİĞİ: Bu faturayı düzenlemek için kdv devriniz yetersizdir. Eksik KDV: ₺${kdvDevriShortage.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}\n`;
        text += `Bu açığı kapatmak amacıyla yapmanız önerilen ticari alım (alış fatura) tutarları:\n`;
        text += `- Yapılması gereken Alış Matrahı: ₺${requiredPurchaseBase.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}\n`;
        text += `- Elde edilecek Giriş KDV: ₺${requiredPurchaseVat.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}\n`;
      }
    }
    text += `\n_İmza: BİTİG AI ANALİZİ - GÜVENLİ MÜŞAVİR PLANI_ 🛡️`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Visual Header */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-500/30">
              <Calculator className="w-3.5 h-3.5 text-yellow-400" />
              Süreç Takip & Mahsup Optimizasyonu
            </div>
            <h1 className="text-3xl md:text-3xl font-extrabold tracking-tight">KDV, Stopaj & Vergi İadesi Analiz Modülü</h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Nakit sıkışıklığını engellemek adına dönem iade haklarınızı sarkan ve cari dönem borçlarınızla otomatik mahsuplayın, devir KDV yeterliliğinizi ve tevkifatlı fatura limitlerinizi anında simüle edin.
            </p>
          </div>
        </div>
      </div>

      {/* Main Analysis Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Parameters input & Settings */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-[2.25rem] p-6 shadow-sm space-y-6">
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">İade Parametreleri</h3>
                <p className="text-[10px] text-slate-400">İadenin yapısını, oranlarını ve devretme durumunu belirleyin.</p>
              </div>
            </div>

            {/* Config Selectors */}
            <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">İade Yöntemi</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border">
                  {(['Mahsuben', 'Nakden'] as IadeYontemi[]).map(met => (
                    <button
                      key={met}
                      onClick={() => setIadeYontemi(met)}
                      className={`py-1.5 text-[10px] font-black rounded-lg transition-all ${
                        iadeYontemi === met ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {met}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">İade Türü</label>
                <select
                  value={iadeTuru}
                  onChange={(e) => setIadeTuru(e.target.value as IadeTuru)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 py-1.5 text-xs font-bold text-slate-750"
                >
                  <option value="KDV">KDV İadesi</option>
                  <option value="Stopaj">Stopaj İadesi</option>
                  <option value="Kurumlar_Vergisi">Kurumlar Vergisi</option>
                  <option value="Gelir_Vergisi">Gelir Vergisi</option>
                  <option value="Ithalat_Ihracat">İthalat & İhracat</option>
                </select>
              </div>
            </div>

            {/* Real Inputs */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase flex justify-between">
                  <span>Mevcut Devreden KDV (190)</span>
                  <span className="text-indigo-600 font-bold font-mono">₺{kdvDevri.toLocaleString()}</span>
                </label>
                <input 
                  type="number"
                  value={kdvDevri}
                  onChange={(e) => setKdvDevri(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                  placeholder="KDV Devri Tutarı"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase flex justify-between">
                  <span>Nisan Ayı İade Alacağı (Hakkı)</span>
                  <span className="text-emerald-600 font-bold font-mono">₺{aprilRefundAmount.toLocaleString()}</span>
                </label>
                <input 
                  type="number"
                  value={aprilRefundAmount}
                  onChange={(e) => setAprilRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                  placeholder="Nisan ayı KDV iadesi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase block leading-tight">
                    Nisandan Sarkan Borçlar
                  </label>
                  <input 
                    type="number"
                    value={prevLeftoverTaxes}
                    onChange={(e) => setPrevLeftoverTaxes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono bg-rose-50/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase block leading-tight">
                    Mayıs Dönemi Cari Borç
                  </label>
                  <input 
                    type="number"
                    value={currentPeriodTaxes}
                    onChange={(e) => setCurrentPeriodTaxes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-150 text-[11px] leading-relaxed text-yellow-800 font-medium">
              <Info className="w-3.5 h-3.5 text-yellow-600 inline mr-1 align-text-bottom" />
              Haziran ayı başlarında Mayıs ayı beyannamesini verirken, Nisan ayı iade alacak başvurusu sisteme girilir. İadenizle Mayıs borçlarınızı nakitsiz kapatabilirsiniz.
            </div>

          </div>
        </div>

        {/* Right Side: Offsetting timeline + Tevkifat/Fatura smart wizard */}
        <div className="lg:col-span-8 space-y-6">

          {/* Offsetting Timeline */}
          <div className="bg-white border border-slate-200/90 rounded-[2.25rem] p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Calendar className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800">Vergi Mahsup & Hesaplaşma Akış Haritası</h3>
                  <p className="text-[10px] text-slate-500">Mevcut iade alacaklarının borç önceliğine göre dağılımı.</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                isRefundSufficient ? 'bg-emerald-100 text-emerald-800 border-emerald-250' : 'bg-rose-100 text-rose-800 border-rose-250'
              }`}>
                {isRefundSufficient ? 'TAM KAPSAMA' : 'AÇIK / EKSİK BAKİYE'}
              </span>
            </div>

            {/* Horizontal flow steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              
              {/* Step 1 */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-1 cursor-default hover:bg-slate-100/50 transition-colors">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">ADIM 1: İADE BAKİYESİ</span>
                <p className="text-xs font-bold text-slate-650">KDV/Stopaj İadesi</p>
                <div className="text-base font-black font-mono text-emerald-600">
                  ₺{aprilRefundAmount.toLocaleString('tr-TR')}
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-1 relative cursor-default hover:bg-slate-100/50 transition-colors">
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block">ADIM 2: ÖNCEKİ SARKAN</span>
                <p className="text-xs font-bold text-slate-650">Nisan Ödenmeyen</p>
                <div className="text-sm font-bold font-mono text-slate-700">
                  ₺{prevLeftoverTaxes.toLocaleString('tr-TR')}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold pt-1 border-t border-slate-200 mt-1">
                  Mahsup: -₺{amountToPrevTaxes.toLocaleString('tr-TR')}
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-1 cursor-default hover:bg-slate-100/50 transition-colors">
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block">ADIM 3: CARİ DÖNEM</span>
                <p className="text-xs font-bold text-slate-650">Mayıs Borçları</p>
                <div className="text-sm font-bold font-mono text-slate-700">
                  ₺{currentPeriodTaxes.toLocaleString('tr-TR')}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold pt-1 border-t border-slate-200 mt-1">
                  Mahsup: -₺{amountToCurrentTaxes.toLocaleString('tr-TR')}
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl space-y-1 cursor-default transition-all border border-dashed border-indigo-200 bg-gradient-to-tr from-indigo-50/40 to-white">
                <span className="text-[9px] font-black text-indigo-650 uppercase tracking-widest block">ADIM 4: SONUÇ / DEVİR</span>
                <p className="text-xs font-bold text-slate-650">Gelecek Aya Sarkan</p>
                
                {totalRolloverTaxes > 0 ? (
                  <>
                    <div className="text-base font-black font-mono text-rose-600">
                      ₺{totalRolloverTaxes.toLocaleString('tr-TR')}
                    </div>
                    <span className="text-[9px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500" /> Cebimizden çıkacak vergi!
                    </span>
                  </>
                ) : (
                  <>
                    <div className="text-base font-black font-mono text-emerald-600">
                      ₺0
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                      Artan İade: ₺{remainingRefundAfterCurrent.toLocaleString('tr-TR')}
                    </span>
                  </>
                )}
              </div>

            </div>

          </div>

          {/* Sarkan Borç Açığı Kapama & Tevkifatlı Fatura / KDV2 Calculator */}
          {!isRefundSufficient && (
            <div className="bg-gradient-to-br from-indigo-50/70 to-emerald-50/50 border border-indigo-100 rounded-[2.25rem] p-6 md:p-8 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-150 pb-5">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-indigo-600 text-white rounded-xl">
                    <Percent className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-indigo-950">Açığı Kapatmak İçin KDV2 & Tevkifatlı Satış Planlayıcı</h3>
                    <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Mükellefe verilmesi gereken aksiyon planı.</p>
                  </div>
                </div>

                <span className="text-xs font-bold font-mono text-indigo-900 bg-indigo-100 py-1.5 px-3.5 rounded-full border border-indigo-200">
                  Açık: ₺{totalRolloverTaxes.toLocaleString('tr-TR')}
                </span>
              </div>

              {/* Selector for VAT rates and withholdings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-650 uppercase">Uygulanacak KDV Oranı</label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-205/60 rounded-xl border border-slate-200 bg-slate-100">
                    {[1, 10, 20].map(r => (
                      <button
                        key={r}
                        onClick={() => setVatRate(r)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                          vatRate === r ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        %{r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-650 uppercase">Tevkifat Oranı (Tevkifatlı Satış Oranı)</label>
                  <select
                    value={`${tevkifatPay}/${tevkifatPayda}`}
                    onChange={(e) => {
                      const [p, pd] = e.target.value.split('/').map(Number);
                      setTevkifatPay(p);
                      setTevkifatPayda(pd);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="2/10">2/10 (İşgücü Temini, Temizlik vs.)</option>
                    <option value="3/10">3/10 (Yapım İşleri vs.)</option>
                    <option value="5/10">5/10 (Yemek, Özel Güvenlik vs.)</option>
                    <option value="7/10">7/10 (Fason Tekstil vs.)</option>
                    <option value="9/10">9/10 (Temizlik, Metal, Hurdalar vs.)</option>
                    <option value="10/10">10/10 (Tam Tevkifat)</option>
                  </select>
                </div>
              </div>

              {/* Calculated Outputs Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/80 backdrop-blur border border-slate-150 p-5 rounded-3xl">
                
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Gerekli Minimum Satış</span>
                  <div className="text-lg font-black font-mono text-indigo-950">
                    ₺{requiredInvoiceBase.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold block">Faturalandırılacak Matrah</span>
                </div>

                <div className="space-y-1 text-center md:text-left border-y md:border-y-0 md:border-x border-slate-150 py-3 md:py-0 md:px-4">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Karşı Tarafça Alıkonulacak KDV</span>
                  <div className="text-lg font-black font-mono text-emerald-600">
                    ₺{calculatedWithheldVat.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </div>
                  <span className="text-[9px] text-emerald-650 font-bold block">İadeye Eklenecek Tutar</span>
                </div>

                <div className="space-y-1 text-center md:text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Müşteriden Net Tahsilat</span>
                  <div className="text-lg font-black font-mono text-slate-800">
                    ₺{invoiceNetPayableFromCustomer.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold block">Matrah + Tevkifatsız KDV</span>
                </div>

              </div>

              {/* Cumulative KDV devri validation check */}
              <div className="p-4 bg-white border border-slate-150 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] ont-black font-black uppercase text-slate-450 tracking-wider">Giriş KDV / KDV Devri Yeterlilik Analizi</span>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${
                    isKdvDevriSufficient ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {isKdvDevriSufficient ? 'Devir KDV Yeterli' : 'Devir KDV Yetersiz!'}
                  </span>
                </div>

                {isKdvDevriSufficient ? (
                  <p className="text-xs text-slate-600 font-medium">
                    ✓ Şirketimizin mevcut <b>₺{kdvDevri.toLocaleString()}</b> KDV devri, ₺{requiredInvoiceBase.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} matrahtan doğacak satışı karşılamak için tamamen yeterlidir. Ekstra alış yapmanıza gerek yoktur.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                      ⚠️ Dikkat! Bu faturayı düzenlemek için kdv devriniz <b>₺{kdvDevriShortage.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</b> kadar eksik kalmaktadır. Bu faturayı kesebilmek ve cezalı duruma düşmemek için yapmanız gereken minimum ticari alım (alış):
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 bg-rose-50/50 p-3 rounded-xl border border-rose-150">
                      <div>
                        <span className="text-[9px] font-black text-rose-600 uppercase block">Gerekli Alış Matrahı</span>
                        <span className="text-sm font-extrabold font-mono text-rose-700">
                          ₺{requiredPurchaseBase.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-rose-600 uppercase block">Gerekli Giriş KDV (%{vatRate})</span>
                        <span className="text-sm font-extrabold font-mono text-rose-700">
                          ₺{requiredPurchaseVat.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct print/copy share section */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-100"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Müşteri Aksiyon Raporunu Kopyala
                </button>
              </div>

              {copiedNotification && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border-2 border-emerald-250 rounded-2xl text-xs font-semibold text-center animate-bounce">
                  ✓ Rapor panonuza kopyalandı! Müşterinizle WhatsApp veya mail yoluyla anında paylaşabilirsiniz.
                </div>
              )}

            </div>
          )}

        </div>
      </div>

    </div>
  );
};
