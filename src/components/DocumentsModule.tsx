import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Share2, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  MoreVertical, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Mail,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile, CompanyDocument } from '../types';

interface DocumentsModuleProps {
  companies: CompanyProfile[];
}

export const DocumentsModule: React.FC<DocumentsModuleProps> = ({ companies }) => {
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(companies[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('Tümü');

  // Mock documents data
  const [documents, setDocuments] = useState<CompanyDocument[]>([
    {
      id: '1',
      companyId: '1',
      title: '2024 Vergi Levhası',
      type: 'Vergi Levhası',
      uploadDate: '2024-01-15',
      fileUrl: '#',
      fileType: 'pdf',
      status: 'Geçerli'
    },
    {
      id: '2',
      companyId: '1',
      title: 'İmza Sirküleri - 2025',
      type: 'İmza Sirküsü',
      uploadDate: '2025-02-10',
      fileUrl: '#',
      fileType: 'pdf',
      status: 'Geçerli',
      expiryDate: '2026-02-10'
    },
    {
      id: '3',
      companyId: '1',
      title: 'Ticaret Sicil Gazetesi - Kuruluş',
      type: 'Ticaret Sicil Gazetesi',
      uploadDate: '2020-01-01',
      fileUrl: '#',
      fileType: 'pdf',
      status: 'Geçerli'
    },
    {
      id: '4',
      companyId: '2',
      title: 'Faaliyet Belgesi',
      type: 'Faaliyet Belgesi',
      uploadDate: '2024-11-20',
      fileUrl: '#',
      fileType: 'pdf',
      status: 'Süresi Dolmuş',
      expiryDate: '2025-02-20'
    }
  ]);

  const documentTypes = [
    'Vergi Levhası',
    'İmza Sirküsü',
    'Kimlik Fotokopisi',
    'Oda Kayıt Belgesi',
    'Faaliyet Belgesi',
    'Araç Ruhsatı',
    'Tescil Belgesi',
    'Ticaret Sicil Gazetesi',
    'Dilekçe',
    'Diğer'
  ];

  const filteredDocs = documents.filter(doc => {
    const matchesCompany = selectedCompany ? doc.companyId === selectedCompany.id : true;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'Tümü' || doc.type === filterType;
    return matchesCompany && matchesSearch && matchesFilter;
  });

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate upload
    const newDoc: CompanyDocument = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: selectedCompany?.id || '1',
      title: file.name,
      type: 'Diğer',
      uploadDate: new Date().toISOString().split('T')[0],
      fileUrl: URL.createObjectURL(file),
      fileType: (file.name.split('.').pop()?.toLowerCase() as any) || 'pdf',
      status: 'Geçerli'
    };
    setDocuments([...documents, newDoc]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu belgeyi silmek istediğinize emin misiniz?')) {
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const handleShare = async (doc: CompanyDocument, platform: 'whatsapp' | 'email') => {
    const message = `*${doc.title}* belgesi paylaşıldı.\nBelge tipi: ${doc.type}\n\nSMMM Hatice ERDAL\nBİTİG AI Analizidir`;
    
    // Web Share API support for files
    if (navigator.share && doc.fileUrl && doc.fileUrl !== '#') {
      try {
        const response = await fetch(doc.fileUrl);
        const blob = await response.blob();
        const file = new File([blob], doc.title + '.' + doc.fileType, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: doc.title,
            text: message,
          });
          return;
        }
      } catch (error) {
        console.error('Dosya paylaşımı başarısız oldu:', error);
      }
    }

    // Fallback to text sharing if file sharing is not supported
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`mailto:?subject=${encodeURIComponent(doc.title)}&body=${encodeURIComponent(message)}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Belge & Evrak Yönetimi</h2>
          <p className="text-sm text-slate-500">Firmalara ait resmi belgeleri takip edin ve paylaşın.</p>
        </div>
        <div className="relative">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv"
            onChange={handleUpload}
          />
          <label 
            htmlFor="file-upload"
            className="flex items-center gap-2 px-6 py-2.5 bg-kilim-blue text-white rounded-xl font-bold hover:bg-kilim-blue-dark transition-all shadow-lg shadow-kilim-blue/20 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Yeni Belge Yükle
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Company List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Firmalar</h3>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    selectedCompany?.id === company.id 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedCompany?.id === company.id ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{company.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{company.taxNumber}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 bg-slate-900 text-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">İstatistik</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">Toplam Belge</span>
                <span className="text-sm font-bold">{documents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">Süresi Dolan</span>
                <span className="text-sm font-bold text-rose-400">
                  {documents.filter(d => d.status === 'Süresi Dolmuş').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Main Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters & Search */}
          <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Belge adı veya tipi ile ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              >
                <option value="Tümü">Tüm Tipler</option>
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-card p-4 hover:shadow-md transition-all group border-t-4 border-t-emerald-500"
                    style={{ borderTopColor: doc.status === 'Süresi Dolmuş' ? '#f43f5e' : '#10b981' }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-lg ${doc.status === 'Süresi Dolmuş' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleShare(doc, 'whatsapp')}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                          title="WhatsApp ile Paylaş"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleShare(doc, 'email')}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="E-posta ile Paylaş"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{doc.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{doc.type}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {doc.status === 'Geçerli' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                        )}
                        <span className={`text-[10px] font-bold ${doc.status === 'Geçerli' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {doc.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {doc.uploadDate}
                      </span>
                    </div>

                    {doc.expiryDate && (
                      <div className={`mt-2 p-2 rounded-lg text-[9px] font-bold flex items-center justify-between ${
                        doc.status === 'Süresi Dolmuş' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <span>Son Geçerlilik:</span>
                        <span>{doc.expiryDate}</span>
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex items-center justify-center gap-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors">
                        <Download className="w-3 h-3" />
                        İndir
                      </button>
                      <button className="flex items-center justify-center gap-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        Görüntüle
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold">Belge Bulunamadı</h3>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto mt-1">
                      Seçili kriterlere uygun belge bulunamadı. Yeni bir belge yükleyebilir veya filtreleri temizleyebilirsiniz.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
