import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  Upload, 
  Plus, 
  ChevronRight, 
  ArrowRight,
  Zap,
  CheckCircle2,
  Package,
  Users,
  Factory,
  RefreshCw,
  Info,
  Trash2,
  Calculator,
  Layers,
  ShoppingBag,
  DollarSign,
  PieChart,
  FileUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile } from '../types';

interface CostAnalysisModuleProps {
  profile: CompanyProfile;
}

interface RecipeItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

export const CostAnalysisModule = ({ profile }: CostAnalysisModuleProps) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for the wizard
  const [productName, setProductName] = useState('Yeni Ürün');
  const [recipe, setRecipe] = useState<RecipeItem[]>([
    { id: '1', name: 'Ana Hammadde A', quantity: 1, unit: 'kg', unitCost: 85 },
    { id: '2', name: 'Yardımcı Malzeme B', quantity: 0.5, unit: 'lt', unitCost: 40 },
  ]);
  
  const [periodData, setPeriodData] = useState({
    salesQuantity: 1000,
    totalLabor: 25000,
    totalOverhead: 15000,
    targetProfitMargin: 25, // %
    currentPrice: 220
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Calculations
  const analysis = useMemo(() => {
    const totalMaterialCost = recipe.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const unitLaborCost = periodData.salesQuantity > 0 ? periodData.totalLabor / periodData.salesQuantity : 0;
    const unitOverheadCost = periodData.salesQuantity > 0 ? periodData.totalOverhead / periodData.salesQuantity : 0;
    
    const totalUnitCost = totalMaterialCost + unitLaborCost + unitOverheadCost;
    const breakEvenPrice = totalUnitCost;
    const targetPrice = totalUnitCost / (1 - (periodData.targetProfitMargin / 100));
    const currentProfitMargin = periodData.currentPrice > 0 
      ? ((periodData.currentPrice - totalUnitCost) / periodData.currentPrice) * 100 
      : 0;

    // Break-even Volume Calculation
    // Total Fixed Costs = Total Labor + Total Overhead (assuming these are fixed for the period)
    const totalFixedCosts = periodData.totalLabor + periodData.totalOverhead;
    const contributionMarginPerUnit = periodData.currentPrice - totalMaterialCost;
    const breakEvenVolume = contributionMarginPerUnit > 0 ? totalFixedCosts / contributionMarginPerUnit : Infinity;

    const totalRevenue = periodData.currentPrice * periodData.salesQuantity;
    const totalCost = totalUnitCost * periodData.salesQuantity;
    const totalProfit = totalRevenue - totalCost;

    return {
      totalMaterialCost,
      unitLaborCost,
      unitOverheadCost,
      totalUnitCost,
      breakEvenPrice,
      targetPrice,
      currentProfitMargin,
      breakEvenVolume,
      totalProfit,
      totalRevenue,
      totalFixedCosts
    };
  }, [recipe, periodData]);

  // What-if Simulator State
  const [simPrice, setSimPrice] = useState(periodData.currentPrice);
  const [simVolume, setSimVolume] = useState(periodData.salesQuantity);

  // Update simulation when period data changes
  React.useEffect(() => {
    setSimPrice(periodData.currentPrice);
    setSimVolume(periodData.salesQuantity);
  }, [periodData.currentPrice, periodData.salesQuantity]);

  const simAnalysis = useMemo(() => {
    const totalCost = analysis.totalUnitCost * simVolume;
    const totalRevenue = simPrice * simVolume;
    const totalProfit = totalRevenue - totalCost;
    const margin = simPrice > 0 ? ((simPrice - analysis.totalUnitCost) / simPrice) * 100 : 0;
    return { totalProfit, margin };
  }, [simPrice, simVolume, analysis.totalUnitCost]);

  // Handlers
  const simulateAIAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setRecipe([
        { id: '1', name: 'Premium Deri', quantity: 1.2, unit: 'mt', unitCost: 120 },
        { id: '2', name: 'Taban Malzemesi', quantity: 1, unit: 'adet', unitCost: 45 },
        { id: '3', name: 'Yapıştırıcı ve Aksesuar', quantity: 0.2, unit: 'kg', unitCost: 30 },
      ]);
      setProductName('Lüks Deri Ayakkabı');
      setIsAnalyzing(false);
    }, 1500);
  };
  const addRecipeItem = () => {
    const newItem: RecipeItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      quantity: 0,
      unit: 'adet',
      unitCost: 0
    };
    setRecipe([...recipe, newItem]);
  };

  const removeRecipeItem = (id: string) => {
    setRecipe(recipe.filter(item => item.id !== id));
  };

  const updateRecipeItem = (id: string, field: keyof RecipeItem, value: any) => {
    setRecipe(recipe.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
  };

  const nextStep = () => {
    if (activeStep < 3) setActiveStep(activeStep + 1);
  };

  const prevStep = () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-10">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              activeStep === step ? 'bg-kilim-blue text-white shadow-lg shadow-blue-100 scale-110' : 
              activeStep > step ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {activeStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
            </div>
            <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${activeStep === step ? 'text-kilim-blue' : 'text-slate-400'}`}>
              {step === 1 ? 'Üretim Reçetesi' : step === 2 ? 'Dönem Verileri' : 'Analiz & Sonuç'}
            </span>
          </div>
          {step < 3 && (
            <div className={`w-20 h-0.5 mx-4 ${activeStep > step ? 'bg-emerald-500' : 'bg-slate-100'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-kilim-blue-dark flex items-center gap-2">
            <Factory className="w-8 h-8 text-kilim-blue" />
            Maliyet & Üretim Analiz Merkezi
          </h1>
          <p className="text-sm text-slate-500 mt-1">Aşama aşama ürün maliyetlendirme ve karlılık analizi.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
          >
            <FileUp className="w-4 h-4" />
            BELGE YÜKLE
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            multiple
          />
        </div>
      </header>

      {uploadedFiles.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            {uploadedFiles.map(file => (
              <div key={file.id} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <FileText className="w-3.5 h-3.5 text-kilim-blue" />
                <span className="text-[10px] font-medium text-slate-600 truncate max-w-[120px]">{file.name}</span>
                <button onClick={() => removeFile(file.id)} className="hover:text-rose-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={simulateAIAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
              isAnalyzing ? 'bg-slate-100 text-slate-400' : 'bg-kilim-blue/10 text-kilim-blue hover:bg-kilim-blue/20'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                BELGE ANALİZ EDİLİYOR...
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                BELGEYİ ANALİZ ET VE REÇETE OLUŞTUR
              </>
            )}
          </button>
        </div>
      )}

      {renderStepIndicator()}

      <AnimatePresence mode="wait">
        {activeStep === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Aşama 1: Üretim Reçetesi (BOM)</h2>
                  <p className="text-xs text-slate-500">Ürünü oluşturmak için gereken hammadde ve malzemeleri tanımlayın.</p>
                </div>
                <div className="w-full max-w-xs">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ürün Adı</label>
                  <input 
                    type="text" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-kilim-blue/20 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Malzeme / Parça</th>
                      <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Miktar</th>
                      <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Birim</th>
                      <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Birim Maliyet (₺)</th>
                      <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Toplam (₺)</th>
                      <th className="pb-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recipe.map((item) => (
                      <tr key={item.id} className="group">
                        <td className="py-4">
                          <input 
                            type="text" 
                            value={item.name}
                            onChange={(e) => updateRecipeItem(item.id, 'name', e.target.value)}
                            placeholder="Malzeme adı..."
                            className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700"
                          />
                        </td>
                        <td className="py-4">
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateRecipeItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-sm text-center"
                          />
                        </td>
                        <td className="py-4">
                          <select 
                            value={item.unit}
                            onChange={(e) => updateRecipeItem(item.id, 'unit', e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs text-slate-500"
                          >
                            <option value="kg">kg</option>
                            <option value="lt">lt</option>
                            <option value="adet">adet</option>
                            <option value="gr">gr</option>
                            <option value="mt">mt</option>
                          </select>
                        </td>
                        <td className="py-4">
                          <input 
                            type="number" 
                            value={item.unitCost}
                            onChange={(e) => updateRecipeItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-24 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-sm text-right"
                          />
                        </td>
                        <td className="py-4 text-right font-bold text-slate-700 text-sm">
                          ₺{(item.quantity * item.unitCost).toFixed(2)}
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => removeRecipeItem(item.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button 
                onClick={addRecipeItem}
                className="mt-6 flex items-center gap-2 text-xs font-bold text-kilim-blue hover:text-kilim-blue-dark transition-colors"
              >
                <Plus size={16} />
                YENİ MALZEME EKLE
              </button>

              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
                <div className="text-slate-500 text-sm">
                  Toplam Hammadde Maliyeti: <span className="font-bold text-slate-800 ml-2">₺{analysis.totalMaterialCost.toFixed(2)}</span>
                </div>
                <button 
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-kilim-blue text-white rounded-xl font-bold hover:bg-kilim-blue-dark transition-all shadow-lg shadow-blue-100"
                >
                  SONRAKİ AŞAMA
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeStep === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-800">Aşama 2: Satış ve Dönem Giderleri</h2>
                <p className="text-xs text-slate-500">Satış hacmi ve üretim için yapılan toplam genel giderleri girin.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-kilim-blue">
                        <ShoppingBag size={20} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">Satış Hacmi</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Satılan Ürün Adedi</label>
                        <input 
                          type="number" 
                          value={periodData.salesQuantity}
                          onChange={(e) => setPeriodData({...periodData, salesQuantity: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-kilim-blue/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mevcut Satış Fiyatı (₺)</label>
                        <input 
                          type="number" 
                          value={periodData.currentPrice}
                          onChange={(e) => setPeriodData({...periodData, currentPrice: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-kilim-blue/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <TrendingUp size={20} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">Hedef Karlılık</h3>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hedef Kar Marjı (%)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="0" 
                          max="100"
                          value={periodData.targetProfitMargin}
                          onChange={(e) => setPeriodData({...periodData, targetProfitMargin: parseInt(e.target.value)})}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-kilim-blue"
                        />
                        <span className="w-12 text-center font-bold text-kilim-blue">%{periodData.targetProfitMargin}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                        <Users size={20} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">Toplam Giderler</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Toplam İşçilik Gideri (Aylık)</label>
                        <input 
                          type="number" 
                          value={periodData.totalLabor}
                          onChange={(e) => setPeriodData({...periodData, totalLabor: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-kilim-blue/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Toplam Genel Üretim Giderleri</label>
                        <input 
                          type="number" 
                          value={periodData.totalOverhead}
                          onChange={(e) => setPeriodData({...periodData, totalOverhead: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-kilim-blue/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-kilim-blue flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-kilim-blue uppercase mb-1">Hesaplama Mantığı</p>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Girdiğiniz toplam giderler, satış hacmine bölünerek birim başına düşen pay hesaplanacaktır. 
                          Bu sayede ürünün gerçek maliyetini görebilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between">
                <button 
                  onClick={prevStep}
                  className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  GERİ DÖN
                </button>
                <button 
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-kilim-blue text-white rounded-xl font-bold hover:bg-kilim-blue-dark transition-all shadow-lg shadow-blue-100"
                >
                  ANALİZİ TAMAMLA
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeStep === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Birim Maliyet</p>
                <p className="text-2xl font-black text-slate-800">₺{analysis.totalUnitCost.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Package size={10} className="text-slate-400" />
                  <span className="text-[9px] text-slate-400 font-medium">Tüm giderler dahil</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mevcut Kâr Marjı</p>
                <p className={`text-2xl font-black ${analysis.currentProfitMargin < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  %{analysis.currentProfitMargin.toFixed(1)}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Hedef: %{periodData.targetProfitMargin}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Başa Baş Fiyat</p>
                <p className="text-2xl font-black text-amber-600">₺{analysis.breakEvenPrice.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Minimum Satış Fiyatı</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Başa Baş Adet</p>
                <p className="text-2xl font-black text-blue-600">{analysis.breakEvenVolume === Infinity ? '∞' : Math.ceil(analysis.breakEvenVolume).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Kâr İçin Gereken Satış</p>
              </div>
              <div className="bg-kilim-blue-dark text-white p-6 rounded-3xl shadow-lg">
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Önerilen Fiyat</p>
                <p className="text-2xl font-black text-emerald-400">₺{analysis.targetPrice.toFixed(2)}</p>
                <p className="text-[10px] text-blue-300/60 font-medium mt-1">%{periodData.targetProfitMargin} Kar Hedefiyle</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cost Breakdown */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-1">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                  <PieChart className="w-5 h-5 text-kilim-blue" />
                  Maliyet Dağılımı
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className="text-slate-500">Hammadde</span>
                      <span className="text-slate-800">%{((analysis.totalMaterialCost / analysis.totalUnitCost) * 100).toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${(analysis.totalMaterialCost / analysis.totalUnitCost) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className="text-slate-500">İşçilik</span>
                      <span className="text-slate-800">%{((analysis.unitLaborCost / analysis.totalUnitCost) * 100).toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${(analysis.unitLaborCost / analysis.totalUnitCost) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className="text-slate-500">Genel Gider</span>
                      <span className="text-slate-800">%{((analysis.unitOverheadCost / analysis.totalUnitCost) * 100).toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${(analysis.unitOverheadCost / analysis.totalUnitCost) * 100}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase">Kritik Uyarı</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Hammadde maliyetiniz toplamın <strong>%{((analysis.totalMaterialCost / analysis.totalUnitCost) * 100).toFixed(0)}</strong>'ini oluşturuyor. 
                    Tedarikçi fiyatlarındaki dalgalanmalara karşı en hassas kalem budur.
                  </p>
                </div>
              </div>

              {/* What-if Simulator */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-kilim-blue" />
                    "Ya Şöyle Olursa?" (Simülatör)
                  </h3>
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Tahmini Kâr:</span>
                    <span className="text-xs font-black text-emerald-700">₺{simAnalysis.totalProfit.toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Simüle Edilen Fiyat</label>
                        <span className="text-xs font-bold text-kilim-blue">₺{simPrice}</span>
                      </div>
                      <input 
                        type="range" 
                        min={Math.floor(analysis.totalUnitCost * 0.8)} 
                        max={Math.floor(analysis.totalUnitCost * 2)}
                        value={simPrice}
                        onChange={(e) => setSimPrice(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-kilim-blue"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Simüle Edilen Adet</label>
                        <span className="text-xs font-bold text-kilim-blue">{simVolume} Adet</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max={periodData.salesQuantity * 3}
                        value={simVolume}
                        onChange={(e) => setSimVolume(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-kilim-blue"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Yeni Marj</span>
                        <span className={`text-sm font-black ${simAnalysis.margin < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                          %{simAnalysis.margin.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Toplam Ciro</span>
                        <span className="text-sm font-black text-slate-800">₺{(simPrice * simVolume).toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        * Fiyatı <strong>₺{simPrice}</strong> seviyesine çekip <strong>{simVolume}</strong> adet satarsanız, 
                        toplamda <strong>₺{simAnalysis.totalProfit.toLocaleString('tr-TR')}</strong> kâr elde edersiniz.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sensitivity Analysis */}
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-kilim-blue" />
                  Duyarlılık Analizi
                </h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-bold text-slate-700">Gider Değişimlerinin Birim Maliyete Etkisi</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Senaryolar</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">İşçilik +%20</p>
                        <p className="text-sm font-black text-slate-800">₺{(analysis.totalUnitCost + (analysis.unitLaborCost * 0.2)).toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">G.Gider +%20</p>
                        <p className="text-sm font-black text-slate-800">₺{(analysis.totalUnitCost + (analysis.unitOverheadCost * 0.2)).toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Hammadde +%20</p>
                        <p className="text-sm font-black text-rose-600">₺{(analysis.totalUnitCost + (analysis.totalMaterialCost * 0.2)).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-3">Satış Hacmi ve Birim Maliyet İlişkisi</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-rose-400 h-full w-[80%]" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-24 text-right">%20 Düşüş: ₺{(analysis.totalMaterialCost + (analysis.totalFixedCosts / (periodData.salesQuantity * 0.8))).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-kilim-blue h-full w-[100%]" />
                        </div>
                        <span className="text-[10px] font-bold text-kilim-blue w-24 text-right">Mevcut: ₺{analysis.totalUnitCost.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full w-[120%]" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-24 text-right">%20 Artış: ₺{(analysis.totalMaterialCost + (analysis.totalFixedCosts / (periodData.salesQuantity * 1.2))).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => setActiveStep(1)}
                    className="text-xs font-bold text-kilim-blue hover:underline"
                  >
                    YENİ ANALİZ BAŞLAT
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
