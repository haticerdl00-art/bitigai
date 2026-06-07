import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Award, 
  BookOpen, 
  ListOrdered, 
  FileText, 
  Coins, 
  HelpCircle, 
  ArrowRight, 
  Calculator, 
  Info,
  CheckCircle,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface SecurityAsset {
  id: string;
  name: string;
  category: 'Kira Sertifikasi' | 'Eurobond' | 'Yatirim Fonu' | 'Devlet Tahvili';
  quantity: number;
  purchaseDate: string;
  purchasePriceUSD: number; // For Eurobonds
  purchasePriceTL: number;
  purchaseRate: number; // USD/TL rate at purchase
  nominalPrice: number;
  couponAmount: number; // Frequency payments
  couponPeriod: 'Aylik' | '3 Aylik' | '6 Aylik' | 'Yillik' | 'Yok';
  currentPriceUSD?: number;
  currentPriceTL: number;
  currentRate: number; // Current USD/TL rate
  salePriceTL?: number;
  saleRate?: number;
  saleDate?: string;
  isSold: boolean;
}

export const InvestmentFundsTracker: React.FC = () => {
  // Pre-loaded high fidelity real life examples to minimize typing
  const [assets, setAssets] = useState<SecurityAsset[]>([
    {
      id: '1',
      name: 'Hazine Müsteşarlığı Varlık Kiralama Kira Sertifikası (TRD080328T11)',
      category: 'Kira Sertifikasi',
      quantity: 150,
      purchaseDate: '2025-01-15',
      purchasePriceUSD: 0,
      purchasePriceTL: 1000,
      purchaseRate: 1,
      nominalPrice: 1000,
      couponAmount: 85, // Yielding period
      couponPeriod: '6 Aylik',
      currentPriceTL: 1095,
      currentRate: 1,
      isSold: false
    },
    {
      id: '2',
      name: 'T.C. Hazine Eurobond USD (US900123AL40)',
      category: 'Eurobond',
      quantity: 20000, // Nominal Quantity
      purchaseDate: '2025-03-10',
      purchasePriceUSD: 0.94, // Clean price USD
      purchasePriceTL: 31.02, // Price in rate * USD price
      purchaseRate: 33.0, // Alış kuru
      nominalPrice: 1, // Nominal unit per bond of $1
      couponAmount: 725, // $725 coupon payment
      couponPeriod: '6 Aylik',
      currentPriceUSD: 0.98,
      currentPriceTL: 34.3,
      currentRate: 35.0, // Güncel kur
      isSold: false
    }
  ]);

  // Form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<SecurityAsset['category']>('Kira Sertifikasi');
  const [newQty, setNewQty] = useState<number>(100);
  const [newDate, setNewDate] = useState('2026-01-10');
  const [newPurchasePriceTL, setNewPurchasePriceTL] = useState<number>(1000);
  const [newNominal, setNewNominal] = useState<number>(1000);
  const [newCoupon, setNewCoupon] = useState<number>(0);
  const [newCouponPeriod, setNewCouponPeriod] = useState<SecurityAsset['couponPeriod']>('Yok');
  const [newRate, setNewRate] = useState<number>(1.0); // Exchange rate at buy

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newAsset: SecurityAsset = {
      id: Date.now().toString(),
      name: newName,
      category: newCategory,
      quantity: newQty,
      purchaseDate: newDate,
      purchasePriceUSD: newCategory === 'Eurobond' ? (newPurchasePriceTL / (newRate || 1)) : 0,
      purchasePriceTL: newPurchasePriceTL,
      purchaseRate: newRate,
      nominalPrice: newNominal,
      couponAmount: newCoupon,
      couponPeriod: newCouponPeriod,
      currentPriceTL: newPurchasePriceTL * 1.05, // simulated 5% appreciation initially
      currentRate: newRate,
      isSold: false
    };

    setAssets([...assets, newAsset]);
    // reset form fields
    setNewName('');
    setNewQty(100);
    setNewCoupon(0);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  // Sell simulation triggers
  const [sellAssetId, setSellAssetId] = useState<string | null>(null);
  const [sellPriceTL, setSellPriceTL] = useState<number>(1150);
  const [sellRate, setSellRate] = useState<number>(36.0);
  const [sellDate, setSellDate] = useState('2026-06-01');

  const handleApplySell = () => {
    if (!sellAssetId) return;
    setAssets(assets.map(a => {
      if (a.id === sellAssetId) {
        return {
          ...a,
          isSold: true,
          salePriceTL: sellPriceTL,
          saleRate: sellRate,
          saleDate: sellDate
        };
      }
      return a;
    }));
    setSellAssetId(null);
  };

  // 1. Double entry journal details explanation card based on selection
  const [activeKayıtTab, setActiveKayıtTab] = useState<'alis' | 'degerleme' | 'kupon' | 'satis'>('alis');

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-500/30">
              <Coins className="w-3.5 h-3.5 text-teal-400" />
              Fon, Lease & Eurobond Yönetimi
            </div>
            <h1 className="text-3xl md:text-3xl font-extrabold tracking-tight">Yatırım Fonları & Menkul Kıymet Takip Sayfası</h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Eurobond, Özel Sektör Tahvilleri ve Kira Sertifikası (Sukuk) portföyünüzü dilediğiniz döviz kurlarıyla takip edin, kupon ödemelerinizi kaydedin ve döküm VUK muhasebe mizan kayıtlarını öğrenin.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Portfolio Tracking list + Create asset form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Portfolio addition form */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200/90 rounded-[2.25rem] p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="p-2.5 bg-indigo-50 text-indigo-100 rounded-2xl bg-indigo-50 text-indigo-600">
                <Plus className="w-5 h-5 animate-spin-slow" />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Menkul Kıymet Kayıt Formu</h3>
                <p className="text-[10px] text-slate-500">Portföye yeni Eurobond, Fon veya Sukuk tanımlayın.</p>
              </div>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Fon / Senet Adı, İhraççı Kurum</label>
                <input 
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Örn: TRD080328T11 Hazine Kira Sertifikası"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Enstrüman Türü</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as SecurityAsset['category'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="Kira Sertifikasi">Kira Sertifikası (Sukuk)</option>
                    <option value="Eurobond">Eurobond (Dövizli)</option>
                    <option value="Yatirim Fonu">Yatırım Fonu (Filyal)</option>
                    <option value="Devlet Tahvili">Devlet Tahvili / ÖST</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Miktar (Kupür/Adet)</label>
                  <input 
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Birim Alış Maliyeti (Birim/TL)</label>
                  <input 
                    type="number"
                    value={newPurchasePriceTL}
                    onChange={(e) => setNewPurchasePriceTL(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Alış Döviz Kuru</label>
                  <input 
                    type="number"
                    step="0.0001"
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold font-mono bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Nominal İtfa Bedeli (TL)</label>
                  <input 
                    type="number"
                    value={newNominal}
                    onChange={(e) => setNewNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Alış Tarihi</label>
                  <input 
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Dönemsel Kupon Tutarı (TL)</label>
                  <input 
                    type="number"
                    value={newCoupon}
                    onChange={(e) => setNewCoupon(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono bg-emerald-50/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Kupon Sıklığı</label>
                  <select
                    value={newCouponPeriod}
                    onChange={(e) => setNewCouponPeriod(e.target.value as SecurityAsset['couponPeriod'])}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 py-1.5 text-xs font-bold"
                  >
                    <option value="Yok">Yok</option>
                    <option value="Aylik">Aylık</option>
                    <option value="3 Aylik">3 Aylık</option>
                    <option value="6 Aylik">6 Aylık</option>
                    <option value="Yillik">Yıllık</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
              >
                Portföye Yeni Yatırım Ekle
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Securities Portfolio Ledger list */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-[2.25rem] p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500 animate-pulse" /> Aktif Portföy İzleme ve Değer Kazancı Tablosu
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">İşlem yaptığınız tüm kira sertifikaları ve Eurobondların detaylı kâr-zarar dökümü.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500"></span><span className="text-[10px] text-slate-500 font-semibold font-sans">Aktif Değer</span>
                <span className="w-3 h-3 rounded bg-amber-500 ml-2"></span><span className="text-[10px] text-slate-500 font-semibold font-sans">İtfa/Satılan</span>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase text-slate-400">
                    <th className="p-3">Menkul Kıymet & Tür</th>
                    <th className="p-3">Tarih / Döviz Kuru</th>
                    <th className="p-3 text-right">Adet & Nominal</th>
                    <th className="p-3 text-right">Alış Fiyatı (Maliyet)</th>
                    <th className="p-3 text-right">Değerleme / Satış Tutarı</th>
                    <th className="p-3 text-right">Kupon Getirisi</th>
                    <th className="p-3 text-right">Kâr - Zarar Sonucu</th>
                    <th className="p-3 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs font-medium text-slate-755">
                  {assets.map(asset => {
                    // Calculations
                    const totalCost = asset.quantity * asset.purchasePriceTL;
                    const unitPriceUSD = asset.category === 'Eurobond' ? asset.purchasePriceUSD : 0;
                    
                    const currentValueTL = asset.quantity * (asset.category === 'Eurobond' ? ((asset.currentPriceUSD || 0.98) * (asset.currentRate || 35.0)) : asset.currentPriceTL);
                    const appreciation = asset.isSold 
                      ? ((asset.salePriceTL! * asset.quantity) - totalCost)
                      : (currentValueTL - totalCost);
                    
                    const isPositive = appreciation >= 0;
                    const percentage = totalCost > 0 ? (appreciation / totalCost) * 100 : 0;

                    return (
                      <tr key={asset.id} className={`hover:bg-slate-50/50 transition-colors ${asset.isSold ? 'bg-amber-50/20' : 'bg-white'}`}>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block text-[11px] leading-tight mb-1">{asset.name}</span>
                          <div className="flex gap-1.5 items-center">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                              asset.category === 'Kira Sertifikasi' ? 'bg-teal-50 text-teal-705 border border-teal-150' :
                              asset.category === 'Eurobond' ? 'bg-indigo-50 text-indigo-705 border border-indigo-150' :
                              asset.category === 'Yatirim Fonu' ? 'bg-emerald-50 text-emerald-705 border border-emerald-150' :
                              'bg-purple-50 text-purple-705 border border-purple-150'
                            }`}>
                              {asset.category === 'Kira Sertifikasi' ? 'Kira Sertifikası (Sukuk)' : asset.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              Nominal Birim: ₺{asset.nominalPrice.toLocaleString('tr-TR')}
                            </span>
                          </div>
                        </td>
                        
                        <td className="p-3">
                          <div className="space-y-1">
                            <div>
                              <span className="text-slate-400 font-bold text-[10px]">ALAN: </span>
                              <span className="font-bold text-slate-700">{asset.purchaseDate}</span>
                            </div>
                            {asset.purchaseRate > 1 && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                <b>Alış Kuru:</b> ₺{asset.purchaseRate.toFixed(4)}
                              </div>
                            )}
                            
                            {asset.isSold ? (
                              <div className="pt-1 mt-1 border-t border-dashed border-slate-200">
                                <span className="text-amber-600 font-bold text-[10px]">SATAN: </span>
                                <span className="font-black text-amber-800">{asset.saleDate}</span>
                                {asset.saleRate && asset.saleRate > 1 && (
                                  <div className="text-[10px] text-amber-600 font-mono">
                                    <b>Satış Kuru:</b> ₺{asset.saleRate.toFixed(4)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[10px] text-indigo-500 font-semibold italic">
                                Portföyde Tutuluyor
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-right font-mono">
                          <div className="font-extrabold text-slate-800">{asset.quantity.toLocaleString('tr-TR')} Adet</div>
                          <div className="text-[10px] text-slate-400 font-bold">
                            Nominal Top: ₺{(asset.nominalPrice * asset.quantity).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                          </div>
                        </td>

                        <td className="p-3 text-right">
                          <div className="font-mono font-bold text-slate-800">
                            ₺{totalCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-bold font-mono">
                            Birim: ₺{asset.purchasePriceTL.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                          </div>
                          {unitPriceUSD > 0 && (
                            <div className="text-[9.5px] text-indigo-600 font-semibold font-mono">
                              (${unitPriceUSD.toFixed(2)})
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="font-mono font-black text-indigo-950">
                            {asset.isSold 
                              ? `₺${(asset.salePriceTL! * asset.quantity).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}` 
                              : `₺${currentValueTL.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`
                            }
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-bold font-mono">
                            Birim: ₺{asset.isSold 
                              ? asset.salePriceTL!.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) 
                              : (asset.category === 'Eurobond' ? ((asset.currentPriceUSD || 0.98) * (asset.currentRate || 35.0)) : asset.currentPriceTL).toLocaleString('tr-TR', { maximumFractionDigits: 2 })
                            }
                          </div>
                          {asset.isSold ? (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-black rounded text-[9px] uppercase tracking-wider inline-block mt-0.5">
                              İTFA/SATILDI
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded text-[9px] uppercase tracking-wider inline-block mt-0.5">
                              PİYASA DEĞERİ
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right font-mono">
                          <span className="font-extrabold text-emerald-650 block">
                            ₺{asset.couponAmount.toLocaleString('tr-TR')}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">{asset.couponPeriod}</span>
                        </td>

                        <td className="p-3 text-right font-mono font-bold">
                          <div className={`text-sm font-black flex items-center justify-end gap-0.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? '▲' : '▼'} ₺{Math.abs(appreciation).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                          </div>
                          <div className={`text-[10.5px] font-extrabold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? '+' : ''}{percentage.toFixed(2)}%
                          </div>
                          <span className="text-[9px] text-slate-400 block font-semibold">
                            {asset.isSold ? 'Mahsup Kazanç' : 'Dönem Sonu Artış'}
                          </span>
                        </td>

                        <td className="p-3 text-center space-y-2">
                          {!asset.isSold ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSellAssetId(asset.id);
                                setSellPriceTL(asset.currentPriceTL || 1100);
                              }}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-black rounded-xl transition-all block w-full cursor-pointer shadow-sm hover:shadow"
                            >
                              Satış / İtfa
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg border border-slate-200 uppercase inline-block">
                              Kapandı
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all text-center inline-block cursor-pointer"
                            title="Seneti Listeden Kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sell Simulation form inline modal */}
            {sellAssetId && (
              <div className="mt-5 p-5 bg-amber-50/50 rounded-2xl border border-amber-200/90 space-y-3.5">
                <div className="flex justify-between items-center h-6">
                  <h4 className="text-[11px] font-black text-yellow-800 uppercase flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-yellow-750" /> Menkul Kıymet İtfa ve Satış Onay Paneli
                  </h4>
                  <button onClick={() => setSellAssetId(null)} className="text-yellow-705 text-xs font-black">Kapat</button>
                </div>

                <div className="grid grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Satış Birim Fiyatı (TL)</label>
                    <input 
                      type="number"
                      value={sellPriceTL}
                      onChange={(e) => setSellPriceTL(Number(e.target.value))}
                      className="w-full p-2 border border-slate-250 rounded-xl text-xs font-bold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Güncel Döviz Satış Kuru</label>
                    <input 
                      type="number"
                      step="0.0001"
                      value={sellRate}
                      onChange={(e) => setSellRate(Number(e.target.value))}
                      className="w-full p-2 border border-slate-250 rounded-xl text-xs font-bold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Satış / İtfa Tarihi</label>
                    <input 
                      type="date"
                      value={sellDate}
                      onChange={(e) => setSellDate(e.target.value)}
                      className="w-full p-2 border border-slate-250 rounded-xl text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleApplySell}
                  className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-extrabold rounded-xl text-xs"
                >
                  Satış Kaydını Kesinleştir ve Finansallaştır
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* SEC REHBERİ: Turkish GAAP General Ledger T-Account Guides inside ofis/müsavir settings */}
      <div className="bg-white border border-slate-200/90 rounded-[2.25rem] p-6 md:p-8 shadow-sm">
        
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-5">
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-800">Tek Düzen Hesap Planı Birebir Muhasebe Kayıt Rehberi</h3>
            <p className="text-[10px] text-slate-500">Mizan kalemlerinde hata yapmamanız için tam VUK, TMS ve vergilendirme bültenleri kılavuzu.</p>
          </div>
        </div>

        {/* Custom Tab selectors */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {(['alis', 'degerleme', 'kupon', 'satis'] as const).map(tab => {
            const labels = {
              alis: "1. Alış Muhasebe Kaydı",
              degerleme: "2. Dönem Sonu Değerleme",
              kupon: "3. Kupon Ödemesi / Faiz",
              satis: "4. Satış ve İtfa Kar/Zararı"
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveKayıtTab(tab)}
                className={`py-3 px-2 rounded-2xl text-[11px] font-black border uppercase tracking-wider text-center transition-all ${
                  activeKayıtTab === tab 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-100' 
                    : 'bg-slate-50 border-slate-150 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab contents with general ledger details */}
        {activeKayıtTab === 'alis' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="p-5 bg-slate-50 border border-slate-150 rounded-[1.75rem] space-y-4">
              <h4 className="text-xs font-black text-indigo-900 uppercase">A. Özel Sektör Tahvili & Fon Alım Kaydı</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Alınan fonlar mizanlarda geçici yatırım amaçlı ise 11 grubu altında muhasebeleştirilir. En fazla 111 (Özel Sektör Tahvilleri) veya 112 (Kamu Kesimi Tahvilleri) kullanılır.
              </p>

              <div className="border border-slate-150 rounded-2xl overflow-hidden font-mono text-[11px] bg-white">
                <div className="bg-slate-800 text-white p-2.5 font-sans font-extrabold flex justify-between">
                  <span>YEVMİYE KAYDI (Yıllık Kayıt)</span>
                  <span className="text-cyan-300">VUK Uyumlu</span>
                </div>
                <div className="p-3 space-y-2 leading-relaxed">
                  <div className="flex justify-between">
                    <span><b>111 ÖZEL SEKTÖR TAHVİL VE BONOLARI</b></span>
                    <span className="text-emerald-600"><b>100.000 TL</b> (Borç)</span>
                  </div>
                  <div className="pl-6 flex justify-between text-slate-500">
                    <span>111.01 Kira Sertifikası Portföyü</span>
                    <span>100.000 TL</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="pl-8"><b>102 BANKALAR HESABI</b></span>
                    <span className="text-rose-600"><b>100.000 TL</b> (Alacak)</span>
                  </div>
                  <div className="pl-14 flex justify-between text-slate-500">
                    <span>102.01 Vadeli/Vadesiz TL</span>
                    <span>100.000 TL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 font-semibold text-xs text-slate-650">
              <div className="p-4 bg-teal-50/60 border border-teal-150 rounded-2xl">
                <h5 className="font-bold text-teal-850 flex items-center gap-1 mb-1.5 uppercase text-[10px]">
                  <Award className="w-4 h-4 text-teal-600" /> Kira Sertifikası (Sukuk) Stopaj Avantajı
                </h5>
                <p className="leading-relaxed">
                  Yerli özel sektör veya Hazine tarafından ihraç edilen TL cinsi Kira Sertifikalarından (Sukuk) kaynaklanan gelirler için kurumlarda stopaj oranı %0, bireyselde ise stopaj indirimi söz konusudur. Vergi beyannamesi öncesi mükellefinizin muafiyet kodlarını beyannamede işaretlemeyi unutmayın!
                </p>
              </div>

              <div className="p-4 bg-indigo-50/60 border border-indigo-150 rounded-2xl">
                <h5 className="font-bold text-indigo-850 flex items-center gap-1 mb-1.5 uppercase text-[10px]">
                  <Info className="w-4 h-4 text-indigo-600" /> Eurobond Alım Giderleri
                </h5>
                <p className="leading-relaxed">
                  Eurobond alım sırasında oluşan banka komisyonları ve temiz fiyat (clean price) / kirli fiyat (dirty price) farkları doğrudan alış maliyetine eklenmelidir (VUK gereğince maliyet bedeli ile değerleme esası).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeKayıtTab === 'degerleme' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="p-5 bg-slate-50 border border-slate-150 rounded-[1.75rem] space-y-4">
              <h4 className="text-xs font-black text-indigo-900 uppercase">B. Geçici Kıymetlerin Dönem Sonu Kur / Fiyat Değerlemesi</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                VUK Md.279 gereği hisse senetleri dışındaki her türlü menkul kıymetler borsa rayiciyle; borsa rayici yoksa kıymetin vadesine kalan gün hesabına göre iskonto edilerek (reeskont faiziyle) değerlenir. Borsa rayici oluşmuşsa değer artışları gelir tablosunda <b>644</b> hesabında aktarılır.
              </p>

              <div className="border border-slate-150 rounded-2xl overflow-hidden font-mono text-[11px] bg-white">
                <div className="bg-slate-800 text-white p-2.5 font-sans font-extrabold flex justify-between">
                  <span>YEVMİYE KAYDI (Yıl Oranı - Değerleme)</span>
                  <span className="text-cyan-300">VUK Uyumlu</span>
                </div>
                <div className="p-3 space-y-2 leading-relaxed">
                  <div className="flex justify-between">
                    <span><b>111 ÖZEL SEKTÖR TAHVİL VE BONOLARI</b></span>
                    <span className="text-emerald-600"><b>8.500 TL</b> (Borç)</span>
                  </div>
                  <div className="pl-6 flex justify-between text-slate-500">
                    <span>111.02 Eurobond Valör Artış</span>
                    <span>8.500 TL</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="pl-8"><b>644 MENKUL KIYMETLER DEĞER ARTIŞLARI</b></span>
                    <span className="text-emerald-600"><b>8.500 TL</b> (Alacak)</span>
                  </div>
                  <div className="pl-14 flex justify-between text-slate-500">
                    <span>644.01 Eurobond Kur Revalüasyon</span>
                    <span>8.500 TL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 font-semibold text-xs text-slate-650">
              <div className="p-4 bg-amber-50/60 border border-amber-150 rounded-2xl">
                <h5 className="font-bold text-amber-850 flex items-center gap-1 mb-1.5 uppercase text-[10px]">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Kur Farklarının Durumu
                </h5>
                <p className="leading-relaxed">
                  Döviz bazlı Eurobondlarda kur artışları değerleme gününde doğrudan gelir olarak yazılmakta ve kurumlar vergisine tabi tutulmaktadır. Cari dönem sonunda Merkez Bankası efektif döviz satış kurunu esas almalısınız.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-150 rounded-2xl">
                <h5 className="font-bold text-emerald-850 flex items-center gap-1 mb-1.5 uppercase text-[10px]">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Değer Azalışı Entegrasyonu
                </h5>
                <p className="leading-relaxed">
                  Borsa fiyatı düşerse ve kalıcı değer erimesi kanıtlanırsa, 119 Menkul Kıymetler Değer Düşüklüğü Karşılığı kurularak karşılık gideri (654) hesaplanır.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeKayıtTab === 'kupon' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="p-5 bg-slate-50 border border-slate-150 rounded-[1.75rem] space-y-4">
              <h4 className="text-xs font-black text-indigo-900 uppercase">C. Kupon Ödemesi / Dönemsel Kar Payı Alım Kaydı</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Eurobond kupon ödemeleri veya Kira Sertifikalarının dönemsel kar payları tahsil edildikçe banka hesabına borç, faiz ve kârlılık geliri olarak <b>642 Faiz Gelirleri</b> veya menkul kıymet kârlarına kaydedilir.
              </p>

              <div className="border border-slate-150 rounded-2xl overflow-hidden font-mono text-[11px] bg-white">
                <div className="bg-slate-800 text-white p-2.5 font-sans font-extrabold flex justify-between">
                  <span>YEVMİYE KAYDI (Nakit Kupon Nakdi)</span>
                  <span className="text-cyan-300">VUK Uyumlu</span>
                </div>
                <div className="p-3 space-y-2 leading-relaxed">
                  <div className="flex justify-between bg-emerald-50/10">
                    <span><b>102 BANKALAR HESABI</b></span>
                    <span className="text-emerald-600"><b>12.500 TL</b> (Borç)</span>
                  </div>
                  <div className="pl-6 flex justify-between text-slate-500">
                    <span>102.02 USD Tahsilat Hesabı</span>
                    <span>12.500 TL</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="pl-8"><b>642 FAİZ GELİRLERİ</b></span>
                    <span className="text-emerald-600"><b>12.500 TL</b> (Alacak)</span>
                  </div>
                  <div className="pl-14 flex justify-between text-slate-500">
                    <span>642.02 Menkul Kıymet Faizleri</span>
                    <span>12.500 TL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 font-semibold text-xs text-slate-650">
              <div className="p-4 bg-teal-50/60 border border-teal-150 rounded-2xl">
                <h5 className="font-bold text-teal-850 flex items-center gap-1 mb-1.5 uppercase text-[10px]">
                  <Award className="w-4 h-4 text-teal-600" /> Stopaj ve Geçici Vergi Beyannamesi
                </h5>
                <p className="leading-relaxed">
                  Yapılan kupon tahsilatlarında kesilen stopaj vergisini (varsa), Muhtasar beyannamesinde veya Geçici/Kurumlar vergisinde <b>ödenecek vergilerinizden mahsup edebilirsiniz.</b> Bankalardan yıllık stopaj döküm formunu (VUK 103 vb.) talep etmek bu nedenle çok önemlidir.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                <h5 className="font-bold text-slate-850 flex items-center gap-1 mb-1.5 uppercase text-[10px]">
                  <HelpCircle className="w-4 h-4 text-indigo-500" /> Faiz Gideri Olur mu?
                </h5>
                <p className="leading-relaxed">
                  Fon alışlarında satıcıya ödenen işlemiş kupon faizleri başlangıçta kapatma/grup faizi olarak <b>re-accrual</b> edilir, dolayısıyla sonraki kupon alımlarında gider yönlü netleştirme sağlanır.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeKayıtTab === 'satis' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="p-5 bg-slate-50 border border-slate-150 rounded-[1.75rem] space-y-4">
              <h4 className="text-xs font-black text-indigo-900 uppercase">D. Menkul Kıymet Alım / Satım Farkı Muhasebeleşmesi</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Seçilen enstrüman satıldığında alış maliyeti ile net satış bedeli arasındaki fark kâr ise <b>645 Menkul Kıymet Satış Karları</b>, zarar ise <b>655 Menkul Kıymet Satış Zararları</b> hesabında kapatılarak mizan dengelenir.
              </p>

              <div className="border border-slate-150 rounded-2xl overflow-hidden font-mono text-[11px] bg-white">
                <div className="bg-slate-800 text-white p-2.5 font-sans font-extrabold flex justify-between">
                  <span>YEVMİYE KAYDI (Karlı Satış Kaydı)</span>
                  <span className="text-cyan-300">VUK Uyumlu</span>
                </div>
                <div className="p-3 space-y-2 leading-relaxed">
                  <div className="flex justify-between">
                    <span><b>102 BANKALAR HESABI</b></span>
                    <span className="text-emerald-600"><b>115.000 TL</b> (Borç)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="pl-8"><b>111 ÖZEL SEKTÖR TAHVİL VE BONOLARI</b></span>
                    <span className="text-rose-600"><b>100.000 TL</b> (Alacak)</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="pl-8"><b>645 MENKUL KIYMET SATIŞ KARLARI</b></span>
                    <span className="text-emerald-600"><b>15.000 TL</b> (Alacak)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 font-semibold text-xs text-slate-650">
              <div className="p-4 bg-emerald-50/60 border border-emerald-150 rounded-2xl">
                <h5 className="font-bold text-emerald-850 flex items-center gap-1 mb-1.5 uppercase text-[10px]">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Bireysel Eurobond Satış İstisnası
                </h5>
                <p className="leading-relaxed">
                  Eurobond alım satım kazançları, kur farkları dâhil edilerek Gelir Vergisi Kanunu mükerrer 80. maddesi kapsamında değer artış kazancı olarak beyan sınırlarına tabidir. Şirketlerde ise doğrudan kurum kazancına eklenir ve istisna uygulanmaz.
                </p>
              </div>

              <div className="p-4 bg-rose-50/65 border border-rose-150 rounded-2xl">
                <h5 className="font-bold text-rose-850 flex items-center gap-1 mb-1.5 uppercase text-[10px]">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Enflasyon Düzeltmesi Katkısı
                </h5>
                <p className="leading-relaxed">
                  Yıl sonlarındaki VUK enflasyon düzeltmesi (mizan re-adjustment) hesaplarında 111 ve 112 hesapları parasal olmayan kıymet niteliğinde kabul edilir, dolayısıyla enflasyon düzeltme farkları (698) hesaplanarak vergi matrahlarını azaltabilir/artırabilir.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 🎓 YATIRIM FONLARI & MENKUL KIYMETLER EĞİTİM REHBERİ (ACADEMY FOR BEGINNERS) */}
      <div className="bg-gradient-to-br from-indigo-50/40 via-teal-50/20 to-slate-50/50 border border-slate-200/95 rounded-[2.25rem] p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-150 pb-5">
          <span className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">🎓 Yeni Başlayanlar İçin Menkul Kıymet ve Fon Portföy Akademisi</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Fon, Eurobond ve Kira Sertifikası uygulamalarını sıfırdan adım adım öğrenin.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Kira Sertifikası (Sukuk) */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xl">🏢</div>
            <h4 className="text-xs font-black text-slate-800 uppercase">1. Kira Sertifikası (Sukuk) Nedir?</h4>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Katılım finans ilkelerine uygun olarak ihraç edilen, faizsiz yatırım araçlarıdır. Bir varlığın veya hizmetin mülkiyetine ortaklık hakkı verir. Şirketler bu sertifikaları alarak <b>"kira geliri (kar payı/kupon)"</b> elde eder. 
            </p>
            <div className="pt-2 border-t border-slate-100 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Stopaj oranı kurumlarda %0'dır.
            </div>
          </div>

          {/* Card 2: Eurobond Nedir */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xl">🇺🇸💶</div>
            <h4 className="text-xs font-black text-slate-800 uppercase font-sans">2. Eurobond Nedir & Nasıl Kazandırır?</h4>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Devletin veya büyük şirketlerin yabancı para birimi (genelde USD veya EUR) cinsinden yurt dışı piyasalarda ihraç ettiği borçlanma senetleridir. Genellikle 6 ayda bir <b>USD veya EUR bazlı kupon ödemesi</b> alırsınız. Hem döviz kurunun artışından hem de döviz faizinden kazandırır.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[10px] text-indigo-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Değer farkı kur artışından beslenir.
            </div>
          </div>

          {/* Card 3: Yatırım Fonları */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xl">📦📈</div>
            <h4 className="text-xs font-black text-slate-800 uppercase">3. Yatırım Fonu (TEFAS) Nedir?</h4>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Tek başınıza yönetemeyeceğiniz büyüklükteki hisse senedi, döviz, faiz, altın veya emtiayı, profesyonel portföy yöneticilerinin yönettiği bir sepettir. Günlük olarak TEFAS'ta ilan edilen fiyatlar üzerinden adet bazında alınır ve satılır. Alış/Satış fiyatı arasındaki fark kazançtır.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[10px] text-purple-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Çeşitlendirme sağlayıp riski azaltır.
            </div>
          </div>

        </div>

        {/* FAQ - How to track section */}
        <div className="p-6 bg-slate-50 border border-slate-150 rounded-2.5xl space-y-4">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-500" /> Şirket Muhasebesinde En Çok Sorulan Sorular (SSS)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-150">
              <span className="font-extrabold text-[11px] text-indigo-750 font-sans">Soru: Satın aldığım Eurobond'un alış kurunu nasıl kaydetmeliyim?</span>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Seneti aldığınız günkü TCMB Döviz Alış Kuru mizan kayıtları ve alış maliyeti hesaplama için esas alınır. Döviz bazındaki tutar, alış kuruyla çarpılarak Türk Lirası cinsinden yevmiye defterine kaydedilir.
              </p>
            </div>

            <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-150">
              <span className="font-extrabold text-[11px] text-indigo-750">Soru: Dönem sonu değer artışı (unrealized gain) vergilendirilir mi?</span>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Evet, VUK hükümlerine göre geçici vergi dönemlerinde dövize endeksli kıymetler borsa rayici ve kur değerlemesine tabi tutulur. Oluşan kur farkı kârları "644 Menkul Kıymet Değer Artışları" hesabı ile vergi matrahına dâhil edilir.
              </p>
            </div>

            <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-150">
              <span className="font-extrabold text-[11px] text-indigo-750">Soru: Alım satım arasında kâr veya zarar olduğunu nasıl anlarım?</span>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Senet satıldığında, satılan toplam TL bedeli ile sisteminizde kayıtlı olan alış maliyeti arasındaki fark bulunur. Satış bedeli alış maliyetinden yüksekse <b>Satış Kârı (645)</b>, düşükse <b>Satış Zararı (655)</b> oluşur.
              </p>
            </div>

            <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-150">
              <span className="font-extrabold text-[11px] text-indigo-750">Soru: Kira Sertifikası (Sukuk) kupon ödemeleri zararla mahsup edilir mi?</span>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Elde edilen dönemsel kâr payları faiz gelirlerine (642) yazılarak kurumlar vergisine eklenirken, menkul kıymetlerin satışından kaynaklanan realizasyon zararlarıyle (655) Gelir/Kurumlar vergisi beyannamesinde mahsup edilebilir.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
