import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  ArrowRight, 
  Save, 
  X,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OCRField {
  key: string;
  value: string;
  confidence: number;
  isEdited?: boolean;
}

interface OCRResult {
  fields: OCRField[];
  rawText: string;
  sourceId: string;
}

export const OCRModule = ({ onTransfer }: { onTransfer: (data: any) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<'fatura' | 'mizan'>('fatura');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      processOCR(selectedFile);
    }
  };

  const processOCR = async (file: File) => {
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch(`/api/ocr/process?docType=${docType}`, {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('OCR işlemi sırasında bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFieldChange = (index: number, newValue: string) => {
    if (!result) return;
    const newFields = [...result.fields];
    newFields[index] = { ...newFields[index], value: newValue, isEdited: true };
    setResult({ ...result, fields: newFields });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.90) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (confidence >= 0.70) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.90) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ %{Math.round(confidence * 100)}</span>;
    if (confidence >= 0.70) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚠ Kontrol Et</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">✗ Manuel Gir</span>;
  };

  const handleConfirm = async () => {
    if (!result) return;
    
    if (docType === 'mizan') {
      // Handle Mizan Data
      const parseVal = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
      
      const mizanData = {
        companyId: localStorage.getItem('selected_company_id') || 'default',
        period: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
        accounts: result.fields.map(f => ({
          code: f.key.split(' ')[0],
          name: f.key,
          debit: 0,
          credit: 0,
          balance: parseVal(f.value)
        })),
        summary: {
          totalCash: parseVal(result.fields.find(f => f.key.includes('100'))?.value || '0'),
          totalBank: parseVal(result.fields.find(f => f.key.includes('102'))?.value || '0'),
          totalReceivables: parseVal(result.fields.find(f => f.key.includes('120'))?.value || '0'),
          totalPayables: parseVal(result.fields.find(f => f.key.includes('320'))?.value || '0'),
          adatRisk131: parseVal(result.fields.find(f => f.key.includes('131'))?.value || '0') > 50000,
          adatRisk331: parseVal(result.fields.find(f => f.key.includes('331'))?.value || '0') > 50000,
          highCashRisk: parseVal(result.fields.find(f => f.key.includes('100'))?.value || '0') > 100000,
        }
      };

      localStorage.setItem(`mizan_data_${mizanData.companyId}`, JSON.stringify(mizanData));
      alert('Mizan verileri başarıyla kaydedildi ve Finansal Durum sayfasına aktarıldı.');
      setResult(null);
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    // Map fields to the format expected by VoucherTransferModule
    const transferData = {
      faturaNo: result.fields.find(f => f.key === 'Fatura No')?.value || '',
      faturaTarihi: result.fields.find(f => f.key === 'Fatura Tarihi')?.value || '',
      vkn: result.fields.find(f => f.key === 'VKN / TC No')?.value || '',
      cari: result.fields.find(f => f.key === 'Firma Ünvanı')?.value || '',
      toplamTutar: result.fields.find(f => f.key === 'Toplam Tutar')?.value.replace(/[^0-9,.]/g, '').replace(',', '.') || '',
      kdv: result.fields.find(f => f.key === 'KDV Tutarı')?.value.replace(/[^0-9,.]/g, '').replace(',', '.') || '',
      kdvDahilToplam: result.fields.find(f => f.key === 'KDV Dahil Toplam')?.value.replace(/[^0-9,.]/g, '').replace(',', '.') || '',
      faturaTipi: result.fields.find(f => f.key === 'Fatura Tipi')?.value || 'Alış', // Alış/Satış
      kaynakBelgeId: result.sourceId
    };

    try {
      const response = await fetch('/api/fis/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });
      const data = await response.json();
      if (data.success) {
        onTransfer(transferData);
        alert(`Fiş oluşturuldu! ID: ${data.fisId}`);
        setResult(null);
        setFile(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Transfer Error:', error);
      alert('Aktarım sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-kilim-blue-dark">Veri Girişi & OCR</h2>
          <p className="text-sm text-slate-500">Faturaları veya Mizanları yükleyin, AI ile verileri otomatik çıkarın.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setDocType('fatura')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${docType === 'fatura' ? 'bg-white text-kilim-blue shadow-sm' : 'text-slate-500'}`}
          >
            Fatura / Fiş
          </button>
          <button 
            onClick={() => setDocType('mizan')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${docType === 'mizan' ? 'bg-white text-kilim-blue shadow-sm' : 'text-slate-500'}`}
          >
            Mizan (Excel/PDF)
          </button>
        </div>
      </div>

      {!file && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="glass-card p-12 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-all group"
        >
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <Upload className="w-10 h-10 text-slate-400 group-hover:text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-700">Belge Yükleyin</p>
            <p className="text-sm text-slate-500">PDF veya Görsel formatındaki faturaları buraya sürükleyin veya tıklayın</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf"
          />
        </div>
      )}

      {isProcessing && (
        <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
          <div className="text-center">
            <p className="text-lg font-bold text-slate-700">Belge okunuyor...</p>
            <p className="text-sm text-slate-500">Yapay zeka alanları analiz ediyor (~5 saniye)</p>
          </div>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Preview Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm">Çıkarılan Veriler</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kontrol Gerekli</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Alan Adı</th>
                      <th className="p-4">Çıkarılan Değer</th>
                      <th className="p-4">Güven Skoru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.fields.map((field, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-sm font-medium text-slate-600">{field.key}</td>
                        <td className="p-4">
                          <div className="relative">
                            <input 
                              type="text" 
                              value={field.value}
                              onChange={(e) => handleFieldChange(index, e.target.value)}
                              autoFocus={field.confidence < 0.90}
                              className={`w-full p-2 rounded-lg border text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                                field.isEdited ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'
                              }`}
                            />
                            {field.isEdited && (
                              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-bold rounded-full shadow-sm">
                                Düzenlendi
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {getConfidenceBadge(field.confidence)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => { setResult(null); setFile(null); }}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button className="px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Kaydet, Sonra Aktar
                </button>
                <button 
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Onayla ve Fişe Aktar
                </button>
              </div>
            </div>
          </div>

          {/* Document Preview */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-card overflow-hidden sticky top-24">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-400" />
                  Belge Önizleme
                </h3>
                <button 
                  onClick={() => setPreviewUrl(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 bg-slate-100 aspect-[3/4] relative overflow-hidden">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Fatura Önizleme" 
                    className="w-full h-full object-contain shadow-sm rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <FileText className="w-12 h-12 opacity-20" />
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-50 text-[10px] text-slate-500 leading-relaxed">
                <p className="font-bold uppercase tracking-widest mb-1">OCR Ham Metin</p>
                <div className="max-h-32 overflow-y-auto custom-scrollbar italic">
                  {result.rawText}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
