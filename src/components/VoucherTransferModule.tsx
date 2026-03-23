import React, { useState, useRef } from 'react';
import { Download, Plus, Trash2, FileSpreadsheet, Search, Upload, Loader2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { analyzeVoucher } from '../services/geminiService';

interface VoucherRow {
  id: string;
  faturaTarihi: string;
  faturaNo: string;
  vkn: string;
  cari: string;
  matrah: string;
  kdvOrani: string;
  kdvTutari: string;
  kdvDahilToplam: string;
  toplamTutar: string;
  faturaTuru: string;
  faturaTipi: string; // Alış/Satış
  hesapKodu: string;
  // Optional fields
  tevkifatOrani?: string;
  tevkifatTutari?: string;
  tevkifatKodu?: string;
  iskontoTutari?: string;
  iadeTutari?: string;
}

const MIZAN_MAPPING: Record<string, string> = {
  'ZİRAAT BANKASI': '102.001',
  'HALK BANKASI': '102.002',
  'BANKA': '102',
  'BANKALAR': '102',
  'KASA': '100',
  'X AŞ': '120.01',
  'Y LTD ŞTİ': '120.02',
  'Z': '120.03',
  'ALICI': '120',
  'ALICILAR': '120',
  'A AŞ': '320.01',
  'B LTD ŞTİ': '320.02',
  'C': '320.03',
  'SATICI': '320',
  'SATICILAR': '320',
  'YURTİÇİ SATIŞ': '600',
  '%10 KDV SATIŞ': '600.10',
  '%10 KDVLİ SATIŞ': '600.10',
  'TİCARİ MAL': '153',
  '%10 KDV ALIŞ': '153.0002',
  '%10 KDV\'Lİ ALIŞ': '153.0002',
  'İNDİRİLECEK KDV': '191',
  '%10 İNDİRİLECEK KDV': '191.10',
  '%20 İNDİRİLECEK KDV': '191.20',
  '7/10 İNDİRİLECEK KDV': '191.23',
  'HESAPLANAN KDV': '391',
  '%10 HESAPLANAN KDV': '391.10',
  '%10 HES. KDV': '391.10',
  'GENEL YÖNETİM GİDER': '770',
  '%20 KDV GİDER': '770.20',
  '%20 KDV\'Lİ GİDER': '770.20',
  '7/10 TEV. GİDER': '770.23',
};

export const VoucherTransferModule = ({ initialData }: { initialData?: any[] }) => {
  const [rows, setRows] = useState<VoucherRow[]>(() => {
    if (initialData && initialData.length > 0) {
      return initialData.map(d => ({
        id: crypto.randomUUID(),
        faturaTarihi: d.faturaTarihi || '',
        faturaNo: d.faturaNo || '',
        vkn: d.vkn || '',
        cari: d.cari || '',
        matrah: d.matrah || '',
        kdvOrani: d.kdvOrani || '',
        kdvTutari: d.kdvTutari || '',
        kdvDahilToplam: d.kdvDahilToplam || '',
        toplamTutar: d.toplamTutar || '',
        faturaTuru: d.faturaTuru || '',
        faturaTipi: d.faturaTipi || 'Alış',
        hesapKodu: d.hesapKodu || ''
      }));
    }
    return [{ id: crypto.randomUUID(), faturaTarihi: '', faturaNo: '', vkn: '', cari: '', matrah: '', kdvOrani: '', kdvTutari: '', kdvDahilToplam: '', toplamTutar: '', faturaTuru: '', faturaTipi: 'Alış', hesapKodu: '' }];
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visibleOptionalColumns, setVisibleOptionalColumns] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [accountHistory, setAccountHistory] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const optionalColumns = [
    { id: 'tevkifatOrani', label: 'Tevkifat Oranı' },
    { id: 'tevkifatTutari', label: 'Tevkifat Tutarı' },
    { id: 'tevkifatKodu', label: 'Tevkifat Kodu' },
    { id: 'iskontoTutari', label: 'İskonto Tutarı' },
    { id: 'iadeTutari', label: 'İade Tutarı' },
  ];

  const toggleColumn = (colId: string) => {
    setVisibleOptionalColumns(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const addRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), faturaTarihi: '', faturaNo: '', vkn: '', cari: '', matrah: '', kdvOrani: '', kdvTutari: '', kdvDahilToplam: '', toplamTutar: '', faturaTuru: '', faturaTipi: 'Alış', hesapKodu: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    } else {
      setRows([{ id: crypto.randomUUID(), faturaTarihi: '', faturaNo: '', vkn: '', cari: '', matrah: '', kdvOrani: '', kdvTutari: '', kdvDahilToplam: '', toplamTutar: '', faturaTuru: '', faturaTipi: 'Alış', hesapKodu: '' }]);
    }
  };

  const updateRow = (id: string, field: keyof VoucherRow, value: string) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        
        // If cari or hesapKodu is updated, we might want to update history or auto-fill
        if (field === 'cari') {
          const historyCode = accountHistory[value.toLocaleUpperCase('tr-TR')];
          if (historyCode) {
            updatedRow.hesapKodu = historyCode;
          } else if (!updatedRow.hesapKodu) {
            updatedRow.hesapKodu = findAccountCode(value);
          }
        }

        if (field === 'hesapKodu' && row.cari) {
          setAccountHistory(prev => ({
            ...prev,
            [row.cari.toLocaleUpperCase('tr-TR')]: value
          }));
        }

        return updatedRow;
      }
      return row;
    }));
  };

  const findAccountCode = (text: string) => {
    const upperText = text.toLocaleUpperCase('tr-TR');
    
    // Exact match first
    for (const [key, code] of Object.entries(MIZAN_MAPPING)) {
      if (upperText === key.toLocaleUpperCase('tr-TR')) return code;
    }

    // Partial match
    for (const [key, code] of Object.entries(MIZAN_MAPPING)) {
      if (upperText.includes(key.toLocaleUpperCase('tr-TR'))) return code;
    }

    return '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAnalyzing(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        const filePromise = new Promise<{ data: string, mimeType: string }>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({ data: base64, mimeType: file.type });
          };
          reader.readAsDataURL(file);
        });

        const { data, mimeType } = await filePromise;
        const extractedData = await analyzeVoucher(data, mimeType);
        
        if (Array.isArray(extractedData)) {
          const newRows = extractedData.map(item => {
            const cariName = item.cari || '';
            const historyCode = accountHistory[cariName.toLocaleUpperCase('tr-TR')];
            const autoCode = historyCode || findAccountCode(cariName);

            return {
              id: crypto.randomUUID(),
              faturaTarihi: item.faturaTarihi || '',
              faturaNo: item.faturaNo || '',
              vkn: item.vkn || '',
              cari: cariName,
              matrah: item.matrah?.toString() || '',
              kdvOrani: item.kdvOrani?.toString() || '',
              kdvTutari: item.kdvTutari?.toString() || '',
              kdvDahilToplam: item.kdvDahilToplam?.toString() || '',
              toplamTutar: item.toplamTutar?.toString() || '',
              faturaTuru: item.faturaTuru || '',
              faturaTipi: item.faturaTipi || 'Alış',
              hesapKodu: autoCode,
              tevkifatOrani: item.tevkifatOrani?.toString(),
              tevkifatTutari: item.tevkifatTutari?.toString(),
              tevkifatKodu: item.tevkifatKodu?.toString(),
              iskontoTutari: item.iskontoTutari?.toString(),
              iadeTutari: item.iadeTutari?.toString(),
            };
          });
          
          setRows(prev => {
            if (prev.length === 1 && !prev[0].faturaTarihi && !prev[0].cari) {
              return newRows;
            }
            return [...prev, ...newRows];
          });

          // Automatically show columns if data exists
          const foundCols = optionalColumns.filter(col => 
            newRows.some(row => (row as any)[col.id])
          ).map(col => col.id);
          
          if (foundCols.length > 0) {
            setVisibleOptionalColumns(prev => Array.from(new Set([...prev, ...foundCols])));
          }
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Belge analizi sırasında bir hata oluştu.");
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportToExcel = () => {
    const data = rows.map(row => {
      const exportRow: any = {
        'Fatura Tarihi': row.faturaTarihi,
        'Fatura No': row.faturaNo,
        'VKN/TC No': row.vkn,
        'Cari': row.cari,
        'Fatura Tipi': row.faturaTipi,
        'Matrah': row.matrah,
        'KDV Oranı': row.kdvOrani,
        'KDV Tutarı': row.kdvTutari,
        'KDV Dahil Toplam': row.kdvDahilToplam,
        'Toplam Tutar': row.toplamTutar,
        'Fatura Türü': row.faturaTuru,
        'Hesap Kodu': row.hesapKodu
      };

      visibleOptionalColumns.forEach(colId => {
        const col = optionalColumns.find(c => c.id === colId);
        if (col) {
          exportRow[col.label] = (row as any)[colId];
        }
      });

      return exportRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fişler');
    XLSX.writeFile(workbook, 'fis_aktarim_listesi.xlsx');
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fiş Aktarım Modülü</h1>
          <p className="text-slate-500">Fiş verilerini girin veya belge yükleyerek otomatik analiz edin.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
            multiple
            className="hidden"
          />
        </div>
      </header>

      {/* Upload Area */}
      <div className="relative">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="glass-card p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-all group"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <FileText className="w-8 h-8 text-slate-400 group-hover:text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#4d80b3]">Belge Yükleyin</p>
            <p className="text-sm text-slate-500">PDF veya Görsel formatındaki belgeleri buraya sürükleyin veya tıklayın</p>
          </div>
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-emerald-600 font-medium animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              Yapay Zeka Belgeleri Analiz Ediyor...
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="relative">
          <button 
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="px-4 py-2 bg-[#4d80b3] text-white rounded-xl hover:bg-[#3d668f] transition-colors shadow-md text-sm font-medium"
          >
            Ekle/Çıkar
          </button>
          
          <AnimatePresence>
            {showColumnPicker && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 space-y-3"
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ek Bilgiler</p>
                <div className="space-y-2">
                  {optionalColumns.map(col => (
                    <div key={col.id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{col.label}</span>
                      <button 
                        onClick={() => toggleColumn(col.id)}
                        className={`p-1 rounded-lg transition-colors ${
                          visibleOptionalColumns.includes(col.id) 
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {visibleOptionalColumns.includes(col.id) ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fatura Tarihi</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fatura No</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Vkn/Tc No</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">ad soyad / ünvan</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Fatura Tipi</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Matrah</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">KDV Oranı</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">KDV Tutarı</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">KDV Dahil Toplam</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Toplam Tutar</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fatura Türü</th>
                
                {visibleOptionalColumns.map(colId => (
                  <th key={colId} className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {optionalColumns.find(c => c.id === colId)?.label}
                  </th>
                ))}

                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hesap Kodu (Otomatik)</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-2">
                    <input 
                      type="date" 
                      value={row.faturaTarihi}
                      onChange={(e) => updateRow(row.id, 'faturaTarihi', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      placeholder="FAT-001"
                      value={row.faturaNo}
                      onChange={(e) => updateRow(row.id, 'faturaNo', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      placeholder="1234567890"
                      value={row.vkn}
                      onChange={(e) => updateRow(row.id, 'vkn', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      placeholder="Cari Ünvan"
                      value={row.cari}
                      onChange={(e) => updateRow(row.id, 'cari', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <select 
                      value={row.faturaTipi}
                      onChange={(e) => updateRow(row.id, 'faturaTipi', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                    >
                      <option value="Alış">Alış</option>
                      <option value="Satış">Satış</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={row.matrah}
                      onChange={(e) => updateRow(row.id, 'matrah', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      placeholder="0"
                      value={row.kdvOrani}
                      onChange={(e) => updateRow(row.id, 'kdvOrani', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={row.kdvTutari}
                      onChange={(e) => updateRow(row.id, 'kdvTutari', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={row.kdvDahilToplam}
                      onChange={(e) => updateRow(row.id, 'kdvDahilToplam', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={row.toplamTutar}
                      onChange={(e) => updateRow(row.id, 'toplamTutar', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm font-bold"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      placeholder="Tür"
                      value={row.faturaTuru}
                      onChange={(e) => updateRow(row.id, 'faturaTuru', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                    />
                  </td>

                  {visibleOptionalColumns.map(colId => (
                    <td key={colId} className="p-2">
                      <input 
                        type="text" 
                        placeholder="..."
                        value={(row as any)[colId] || ''}
                        onChange={(e) => updateRow(row.id, colId as any, e.target.value)}
                        className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm"
                      />
                    </td>
                  ))}

                  <td className="p-2">
                    <input 
                      type="text" 
                      placeholder="Hesap Kodu"
                      value={row.hesapKodu}
                      onChange={(e) => updateRow(row.id, 'hesapKodu', e.target.value)}
                      className="w-full p-2 bg-transparent border border-transparent focus:border-emerald-500 rounded-lg outline-none text-sm font-medium text-emerald-700"
                    />
                  </td>
                  <td className="p-2">
                    <button 
                      onClick={() => removeRow(row.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button 
            onClick={addRow}
            className="flex items-center gap-2 text-sm font-medium text-[#4d80b3] hover:text-[#3d668f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Satır Ekle
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Excel İndir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Mizan Eşleştirme Bilgisi
          </h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>Sistem, girdiğiniz <strong>Açıklama</strong> veya <strong>Ünvan</strong> alanlarını analiz ederek mizan tablonuzdaki en uygun hesap kodunu otomatik olarak atar.</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>"Halk Bankası" → 102.002</li>
              <li>"Ziraat Bankası" → 102.001</li>
              <li>"X AŞ" → 120.01</li>
              <li>"A AŞ" → 320.01</li>
            </ul>
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            İpucu
          </h3>
          <p className="text-sm text-slate-600">
            Birden fazla fiş girmek için "Yeni Satır Ekle" butonunu kullanabilirsiniz. Excel çıktısında tüm satırlar tek bir liste halinde sunulacaktır.
          </p>
        </div>
      </div>
    </div>
  );
};
