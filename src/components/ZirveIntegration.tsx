import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  FileSpreadsheet, 
  Clipboard, 
  HelpCircle, 
  RefreshCw,
  Info,
  ShieldCheck,
  ChevronRight,
  Database,
  ArrowDownToLine,
  Maximize2
} from 'lucide-react';
import { CompanyProfile, Personnel } from '../types';

interface ZirveIntegrationProps {
  companies: CompanyProfile[];
  currentCompany: CompanyProfile;
  onAddCompany: (profile: CompanyProfile) => Promise<void> | void;
  onUpdateCompany: (profile: CompanyProfile) => Promise<void> | void;
  onClose: () => void;
}

type ImportType = 'companies' | 'personnel';
type InputMode = 'file' | 'paste';

export const ZirveIntegration: React.FC<ZirveIntegrationProps> = ({ 
  companies, 
  currentCompany, 
  onAddCompany, 
  onUpdateCompany, 
  onClose 
}) => {
  const [importType, setImportType] = useState<ImportType>('companies');
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [pastedText, setPastedText] = useState('');
  const [selectedTargetCompanyId, setSelectedTargetCompanyId] = useState<string>(currentCompany?.id || companies[0]?.id || '0');
  
  // Parsed and preview states
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guide accordion
  const [activeGuideTab, setActiveGuideTab] = useState<'zirve_company' | 'zirve_worker'>('zirve_company');

  // Fields we can import into
  const COMPANY_FIELDS = [
    { key: 'title', label: 'Firma Ünvanı / Adı', required: true, synonyms: ['unvan', 'ad', 'firma', 'name', 'title'] },
    { key: 'taxNumber', label: 'Vergi No (VKN / TCKN)', required: true, synonyms: ['vkn', 'vergi', 'tckn', 'tc', 'tax', 'kimlik'] },
    { key: 'taxOffice', label: 'Vergi Dairesi', required: false, synonyms: ['daire', 'vd', 'taxoffice', 'vergi dairesi'] },
    { key: 'sgkNumber', label: 'SGK Sicil No', required: false, synonyms: ['sgk', 'sicil', 'ssk', 'sgk no', 'sgk numara'] },
    { key: 'sector', label: 'Faliyet Sektörü', required: false, synonyms: ['sektor', 'faaliyet', 'iş', 'sector'] },
    { key: 'legalStatus', label: 'Hukuki Yapı', required: false, synonyms: ['statü', 'şirket türü', 'tür', 'legal', 'tip'] },
    { key: 'ledgerType', label: 'Defter Sınıfı', required: false, synonyms: ['defter', 'sınıf', 'ledger'] },
  ];

  const PERSONNEL_FIELDS = [
    { key: 'fullName', label: 'İsim Soyisim / Ad Soyad', required: true, synonyms: ['ad', 'soyad', 'isim', 'personel', 'çalışan', 'fullname', 'name'] },
    { key: 'idNumber', label: 'T.C. Kimlik No', required: true, synonyms: ['tc', 'tckn', 'kimlik', 'idno', 'id'] },
    { key: 'role', label: 'Meslek / Görev', required: false, synonyms: ['gorev', 'görevi', 'unvan', 'meslek', 'rol', 'role'] },
    { key: 'netSalary', label: 'Net Ücret / Maaş', required: false, synonyms: ['net', 'ucret', 'maas', 'maaş', 'ucreti', 'salary'] },
    { key: 'startDate', label: 'Giriş Tarihi', required: false, synonyms: ['tarih', 'giris', 'isegiris', 'başlangıç', 'startdate'] },
    { key: 'group', label: 'Personel Statüsü', required: false, synonyms: ['grup', 'statu', 'group', 'tip'] },
  ];

  // Raw file parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        processRawText(text);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Dosya okunurken bir hata oluştu. Lütfen dosyanın doğruluğundan emin olun.");
    };
    reader.readAsText(file);
  };

  // Central raw text / pasted text processor
  const processRawText = (text: string) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    if (!text.trim()) {
      setErrorMessage("İçerik boş olamaz. Lütfen geçerli bir veri yapıştırın veya yükleyin.");
      return;
    }

    // Try parsing as Tab-Separated (Zirve copy-paste standard) or CSV
    let lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setErrorMessage("Geçerli bir veri tablosu algılanamadı. En az bir başlık satırı ve bir veri satırı gereklidir.");
      return;
    }

    // Detect delimiter: TAB (\t) or Semicolon (;) or Comma (,)
    let firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes(',')) delimiter = ',';

    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ""));
    setParsedHeaders(headers);

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ""));
      // Pad or slice columns to match headers
      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowObj[header] = cols[index] || '';
      });
      rows.push(rowObj);
    }
    setParsedRows(rows);

    // Auto smart column mapping
    const initialMapping: Record<string, string> = {};
    const targetFields = importType === 'companies' ? COMPANY_FIELDS : PERSONNEL_FIELDS;

    targetFields.forEach(field => {
      // Find a match in headers
      const match = headers.find(h => {
        const cleanHeader = h.toLowerCase().replace(/[\s_\-\.\/]/g, "");
        return field.synonyms.some(syn => {
          const cleanSyn = syn.toLowerCase().replace(/[\s_\-\.\/]/g, "");
          return cleanHeader.includes(cleanSyn) || cleanSyn.includes(cleanHeader);
        });
      });
      if (match) {
        initialMapping[field.key] = match;
      }
    });
    setColumnMappings(initialMapping);
    generatePreview(rows, initialMapping);
  };

  const handleMappingChange = (fieldKey: string, headerValue: string) => {
    const updated = { ...columnMappings, [fieldKey]: headerValue };
    setColumnMappings(updated);
    generatePreview(parsedRows, updated);
  };

  const generatePreview = (rows: Record<string, string>[], mappings: Record<string, string>) => {
    const previewData: any[] = [];

    if (importType === 'companies') {
      rows.forEach((row, index) => {
        const titleVal = row[mappings['title']] || '';
        const taxNumberVal = (row[mappings['taxNumber']] || '').replace(/\D/g, ""); // strip non-digits

        if (!titleVal) return; // Skip rows without business title

        // Collision Check: Search existing companies
        const existingCompany = companies.find(c => c.taxNumber === taxNumberVal && taxNumberVal !== '');
        
        previewData.push({
          rowId: index,
          original: row,
          title: titleVal,
          taxNumber: taxNumberVal || 'Girilmemiş',
          taxOffice: row[mappings['taxOffice']] || 'Belirtilmemiş',
          sgkNumber: row[mappings['sgkNumber']] || '',
          sector: row[mappings['sector']] || 'Genel',
          legalStatus: row[mappings['legalStatus']] || 'LTD',
          ledgerType: row[mappings['ledgerType']] || 'E-Defter (Bilanço)',
          exists: !!existingCompany,
          existingId: existingCompany?.id || null,
          status: existingCompany ? 'Güncelle / Birleştir' : 'Yeni Firma Ekle'
        });
      });
    } else {
      // Personnel Import
      const targetCompany = companies.find(c => c.id === selectedTargetCompanyId);
      const existingPersonnel = targetCompany?.personnel || [];

      rows.forEach((row, index) => {
        const fullNameVal = row[mappings['fullName']] || '';
        const idNumberVal = (row[mappings['idNumber']] || '').replace(/\D/g, "");

        if (!fullNameVal) return; // Skip empty rows

        // Collision check
        const match = existingPersonnel.find(p => p.idNumber === idNumberVal && idNumberVal !== '');

        previewData.push({
          rowId: index,
          original: row,
          fullName: fullNameVal,
          idNumber: idNumberVal || 'Girilmemiş',
          role: row[mappings['role']] || 'Personel',
          netSalary: parseFloat((row[mappings['netSalary']] || '').replace(/[^0-9,.]/g, "").replace(",", ".")) || 0,
          startDate: row[mappings['startDate']] || new Date().toISOString().split('T')[0],
          group: row[mappings['group']] || 'İşçi',
          exists: !!match,
          existingId: match?.id || null,
          status: match ? 'Maaş / Bilgi Güncelle' : 'Yeni Personel Ekle'
        });
      });
    }

    setImportPreview(previewData);
  };

  const executeImport = async () => {
    setIsProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (importType === 'companies') {
        let addedCount = 0;
        let updatedCount = 0;

        for (const item of importPreview) {
          const legalStatusVal: any = item.legalStatus.toLowerCase().includes('ltd') ? 'LTD' : 
                                 item.legalStatus.toLowerCase().includes('aş') || item.legalStatus.toLowerCase().includes('a.ş') ? 'AŞ' : 'Gerçek Kişi';
          const ledgerTypeVal: any = item.ledgerType.toLowerCase().includes('işletme') ? 'İşletme Defteri' : 'E-Defter (Bilanço)';

          if (item.exists && item.existingId) {
            // MERGE & UPDATE — Do not lose existing fields
            const existing = companies.find(c => c.id === item.existingId);
            if (existing) {
              const updatedProfile: CompanyProfile = {
                ...existing,
                title: item.title,
                taxNumber: item.taxNumber !== 'Girilmemiş' ? item.taxNumber : existing.taxNumber,
                taxOffice: item.taxOffice !== 'Belirtilmemiş' ? item.taxOffice : existing.taxOffice,
                sgkNumber: item.sgkNumber || existing.sgkNumber,
                sector: item.sector || existing.sector,
                legalStatus: legalStatusVal,
                ledgerType: ledgerTypeVal,
              };
              await onUpdateCompany(updatedProfile);
              updatedCount++;
            }
          } else {
            // INSERT NEW
            const newCompany: CompanyProfile = {
              id: Date.now().toString() + Math.random().toString().slice(2, 5),
              title: item.title,
              taxNumber: item.taxNumber !== 'Girilmemiş' ? item.taxNumber : '',
              taxOffice: item.taxOffice !== 'Belirtilmemiş' ? item.taxOffice : '',
              sgkNumber: item.sgkNumber || '',
              legalStatus: legalStatusVal,
              ledgerType: ledgerTypeVal,
              naceCodes: [],
              startDate: item.startDate || '',
              beratPreference: 'Aylık',
              isExporter: false,
              isImporter: false,
              hasWithholdingSales: false,
              hasWithholdingPurchases: false,
              hasRefunds: false,
              emails: ['', '', ''],
              phones: ['', '', ''],
              selectedDeclarations: ['KDV1', 'Muhtasar (MPH)'],
              sector: item.sector || 'Genel',
              personnel: [],
              hrProfile: {
                totalWorkers: 0,
                femaleWorkers: 0,
                maleWorkers: 0,
                personnelGroups: { retired: 0, disabled: 0, foreign: 0, apprentice: 0, management: 0 }
              }
            };
            await onAddCompany(newCompany);
            addedCount++;
          }
        }

        setSuccessMessage(`Zirve Firma Aktarımı Başarılı! Toplamda ${addedCount} YENİ firma eklendi, ${updatedCount} MEVCUT firma bilgisi güncellendi. Var olan hiçbir veriniz kaybolmadı!`);
      } else {
        // Personnel Import
        const targetCompany = companies.find(c => c.id === selectedTargetCompanyId);
        if (!targetCompany) {
          throw new Error("Lütfen personel kaydının aktarılacağı hedef firmayı seçin.");
        }

        const currentPersonnelList = [...(targetCompany.personnel || [])];
        let addedCount = 0;
        let updatedCount = 0;

        importPreview.forEach(item => {
          const groupVal: any = item.group.toLowerCase().includes('yönetim') ? 'Yönetim' :
                               item.group.toLowerCase().includes('emekli') ? 'Emekli' :
                               item.group.toLowerCase().includes('engelli') ? 'Engelli' : 'İşçi';

          if (item.exists && item.existingId) {
            // Update salary / duties
            const idx = currentPersonnelList.findIndex(p => p.id === item.existingId);
            if (idx > -1) {
              currentPersonnelList[idx] = {
                ...currentPersonnelList[idx],
                fullName: item.fullName,
                netSalary: item.netSalary || currentPersonnelList[idx].netSalary,
                role: item.role || currentPersonnelList[idx].role,
                group: groupVal
              };
              updatedCount++;
            }
          } else {
            // Adding
            const pNew: Personnel = {
              id: Date.now().toString() + Math.random().toString().slice(2, 5),
              fullName: item.fullName,
              idNumber: item.idNumber !== 'Girilmemiş' ? item.idNumber : '',
              role: item.role,
              netSalary: item.netSalary,
              startDate: item.startDate || new Date().toISOString().split('T')[0],
              leaveStatus: 'Aktif',
              group: groupVal,
              type: 'normal'
            };
            currentPersonnelList.push(pNew);
            addedCount++;
          }
        });

        // Recalculate HR Profile totals safely
        const total = currentPersonnelList.length;
        const maleCount = currentPersonnelList.filter(p => p.group === 'İşçi').length; // approximation
        const femaleCount = total - maleCount;

        const updatedCompany: CompanyProfile = {
          ...targetCompany,
          personnel: currentPersonnelList,
          hrProfile: {
            ...targetCompany.hrProfile,
            totalWorkers: total,
            maleWorkers: maleCount >= 0 ? maleCount : 0,
            femaleWorkers: femaleCount >= 0 ? femaleCount : 0,
          }
        };

        await onUpdateCompany(updatedCompany);
        setSuccessMessage(`Zirve Personel Aktarımı Başarılı! [${targetCompany.title}] firmasına ${addedCount} yeni çalışan eklendi, ${updatedCount} personelin ise maaş ve görev bilgileri güncellendi.`);
      }

      // Reset
      setPastedText('');
      setParsedRows([]);
      setParsedHeaders([]);
      setImportPreview([]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Veri aktarılırken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-kilim-blue-dark to-kilim-blue text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-2xl">
            <RefreshCw className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-black">Zirve Yazılım Akıllı Entegrasyon Masası</h2>
            <p className="text-xs text-blue-100 mt-1">Zirve Müşavir programındaki kayıtlarınızı doğrudan kopyala-yapıştır veya Excel ile Bitig'e aktarın.</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-bold text-xs"
        >
          Kapat / Çık
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Step-by-Step interactive guide panel */}
        <div className="p-5 bg-amber-50/70 border border-amber-200/80 rounded-3xl space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-700" />
            <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest">Zirve'den Veri Nasıl Alınır? (Kılavuz)</h4>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveGuideTab('zirve_company')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeGuideTab === 'zirve_company' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              Firma Bilgilerini Almak
            </button>
            <button 
              onClick={() => setActiveGuideTab('zirve_worker')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeGuideTab === 'zirve_worker' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              Personel & İşçi Kartlarını Almak
            </button>
          </div>

          <div className="text-xs text-amber-900 leading-relaxed space-y-1.5 pl-1">
            {activeGuideTab === 'zirve_company' ? (
              <ul className="list-decimal space-y-1 pl-4 font-medium">
                <li>Zirve Müşavir programında <b>Firma Tanımlama</b> modülünü açın.</li>
                <li>Firma listenizin bulunduğu tabloda mouse ile üzerlerine gelip tümünü seçin ya da liste üzerindeyken <b>Ctrl + A</b> tuşlayın.</li>
                <li>Ardından <b>Ctrl + C (Kopyala)</b> yapın veya alt köşedeki <b>Excel'e Gönder</b> butonuna basıp dosyayı kaydedin.</li>
                <li>Aşağıdaki paneli kullanarak kopyaladığınız verileri anında yapıştırın veya kaydettiğiniz Excel dosyasını yükleyin!</li>
              </ul>
            ) : (
              <ul className="list-decimal space-y-1 pl-4 font-medium">
                <li>Zirve Müşavir programında <b>Bordro / Personel</b> modülüne tıklayın.</li>
                <li><b>Personel Listesi</b> veya Excel Raporu butonuna basarak tüm personellerin listesini açın.</li>
                <li>Tabloyu tümüyle seçip <b>Ctrl + C</b> ile kopyalayın ya da <b>Excel / CSV</b> olarak bilgisayarınıza indirin.</li>
                <li>Aşağıda "Hedef Firma" seçimi yaptıktan sonra kopyalanan satırları yapıştırın.</li>
              </ul>
            )}
            <p className="text-[10px] text-amber-750 font-black italic flex items-center gap-1 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Mevcut verileriniz asla bozulmaz, çakışan kayıtlar (VKN/TCKN veya TC Kimlik No ile) akıllıca birleştirilir.
            </p>
          </div>
        </div>

        {/* Global Feedback Messages */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-2 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="font-semibold leading-relaxed">{successMessage}</div>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-start gap-2 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="font-bold leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Configurations Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Aktarım Tipi</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-200/65 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => { setImportType('companies'); setParsedRows([]); setImportPreview([]); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                  importType === 'companies' ? 'bg-white text-kilim-blue shadow-sm' : 'text-slate-650 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Firma Listesi
              </button>
              <button
                type="button"
                onClick={() => { setImportType('personnel'); setParsedRows([]); setImportPreview([]); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                  importType === 'personnel' ? 'bg-white text-kilim-blue shadow-sm' : 'text-slate-650 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Personel / İşçi Kartı
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Veri Giriş Biçimi</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-200/65 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                  inputMode === 'paste' ? 'bg-white text-kilim-blue shadow-sm' : 'text-slate-650 hover:text-slate-900'
                }`}
              >
                <Clipboard className="w-4 h-4" />
                Ctrl+C & Ctrl+V (Yapıştır)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                  inputMode === 'file' ? 'bg-white text-kilim-blue shadow-sm' : 'text-slate-650 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel / CSV Dosyası Yükle
              </button>
            </div>
          </div>
        </div>

        {/* Target Company Selector (Only for Personnel) */}
        {importType === 'personnel' && (
          <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-kilim-blue" />
              <div>
                <h4 className="text-xs font-black text-slate-800">Personelin Aktarılacağı Firma (Hedef)</h4>
                <p className="text-[10px] text-slate-500">Zirve'den gelen çalışanlar seçilen firmanın personel kartlarına dahil edilecektir.</p>
              </div>
            </div>
            <select
              value={selectedTargetCompanyId}
              onChange={(e) => {
                setSelectedTargetCompanyId(e.target.value);
                if (parsedRows.length > 0) {
                  generatePreview(parsedRows, columnMappings);
                }
              }}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 min-w-[280px]"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Input Zones */}
        {inputMode === 'paste' ? (
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-655 uppercase tracking-wider flex items-center gap-1.5">
              <span>Zirve Panosundan Kopyalanan Tabloyu Buraya Yapıştırın</span>
              <span className="text-[10px] text-slate-450 normal-case font-medium">(Zirve'den kopyalayıp buraya tıklatıp Ctrl+V yapın)</span>
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                processRawText(e.target.value);
              }}
              placeholder={`Örn: \nUnvan\tVergi No\tVergi Dairesi\tDefter\nKİLİM YAZILIM\t1234567890\tEsenler\tBilanço`}
              className="w-full h-44 p-4 border border-slate-200 rounded-3xl text-xs font-mono bg-slate-900 text-emerald-400 placeholder:text-slate-500 focus:ring-0 focus:border-kilim-blue tracking-wide"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 hover:border-kilim-blue/40 transition-all cursor-pointer relative">
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-white shadow rounded-2xl text-slate-400">
                <Upload className="w-6 h-6 text-kilim-blue" />
              </div>
              <h4 className="text-xs font-black text-slate-800">Dosyanızı Sürükleyin veya Seçin</h4>
              <p className="text-[10px] text-slate-450">Desteklenen formatlar: .xlsx, .xls, .csv, .tsv, .txt (Maks 10MB)</p>
            </div>
          </div>
        )}

        {/* Interactive Columns Matching Interface */}
        {parsedRows.length > 0 && (
          <div className="space-y-4 border border-slate-200/90 rounded-3xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <span className="p-1 px-2.5 bg-kilim-blue/10 text-kilim-blue rounded-full text-xs font-bold font-mono">1</span>
              <div>
                <h4 className="text-xs font-black text-slate-800">Sütunları Akıllı Match (Eşleştirme) Edin</h4>
                <p className="text-[10px] text-slate-450">Yüklenen tablonun sütun başlıklarını Bitig veri haneleriyle eşleyin.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {(importType === 'companies' ? COMPANY_FIELDS : PERSONNEL_FIELDS).map((field) => {
                const mappedVal = columnMappings[field.key] || '';
                return (
                  <div key={field.key} className="p-3 bg-white border border-slate-150 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-slate-450 uppercase flex items-center gap-1.5">
                      {field.label}
                      {field.required && <span className="text-rose-500 font-bold">*</span>}
                    </span>
                    <select
                      value={mappedVal}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      className={`w-full bg-slate-50 border border-slate-100 rounded-xl p-2 py-1 text-xs font-semibold ${
                        mappedVal ? 'text-kilim-blue border-kilim-blue/30 bg-blue-50/10' : 'text-slate-450'
                      }`}
                    >
                      <option value="">-- Sütun Seçin --</option>
                      {parsedHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Collision Detection & Dry Run Verification Table */}
        {importPreview.length > 0 && (
          <div className="space-y-4 border border-slate-200/90 rounded-3xl p-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-kilim-blue/10 text-kilim-blue rounded-full text-xs font-bold font-mono">2</span>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Aktarım Çakışma ve Güvenlik Önizlemesi</h4>
                  <p className="text-[10px] text-slate-450">Var olan hiçbir kaydınız silinmez. Çakışanlar anında tespit edilir ve birleştirilir.</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-3 py-1 rounded-full border">
                {importPreview.length} Satır Algılandı
              </span>
            </div>

            <div className="overflow-x-auto max-h-60 custom-scrollbar border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-3">Sıra No</th>
                    {importType === 'companies' ? (
                      <>
                        <th className="p-3">Firma Ünvanı / Adı</th>
                        <th className="p-3">VKN / TCKN</th>
                        <th className="p-3">Sektör</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3 font-semibold">Adı Soyadı</th>
                        <th className="p-3">T.C. Kimlik No</th>
                        <th className="p-3">Maaş</th>
                      </>
                    )}
                    <th className="p-3 text-right">Eylem / Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importPreview.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-3 font-bold text-slate-400 font-mono">{idx + 1}</td>
                      {importType === 'companies' ? (
                        <>
                          <td className="p-3 font-bold text-slate-750 truncate max-w-[200px]">{item.title}</td>
                          <td className="p-3 font-mono text-slate-500">{item.taxNumber}</td>
                          <td className="p-3 font-semibold text-slate-400">{item.sector}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-bold text-slate-750">{item.fullName}</td>
                          <td className="p-3 font-mono text-slate-500">{item.idNumber}</td>
                          <td className="p-3 font-bold text-slate-600">
                            ₺{item.netSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </>
                      )}
                      <td className="p-3 text-right">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                          item.exists 
                            ? 'bg-amber-100 text-amber-800 border-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        } border`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.exists ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-lg">
                <Info className="w-3.5 h-3.5 inline text-blue-500 mr-1 align-text-bottom" />
                "Güvenle Aktar" tıklandığında, eşleşen kayıtlarınızı yukarıdaki eyleme göre günceller; yeni kayıtları ise listelerin en altına ekler.
              </span>
              <button
                type="button"
                onClick={executeImport}
                disabled={isProcessing}
                className="py-3 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    İçe Aktarılıyor...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Bitig'e Güvenle Aktar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
