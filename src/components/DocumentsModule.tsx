import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Mail,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Building2,
  RefreshCw,
  X,
  Eye,
  Calendar,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile, CompanyDocument } from '../types';
import { db, auth, handleFirestoreError, OperationType, uploadFile, deleteFile } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

interface DocumentsModuleProps {
  companies: CompanyProfile[];
}

export const DocumentsModule: React.FC<DocumentsModuleProps> = ({ companies }) => {
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(companies[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('Tümü');
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // SMMM specific advanced controls
  const [selectedUploadType, setSelectedUploadType] = useState<string>('Vergi Levhası');
  const [uploadExpiryDate, setUploadExpiryDate] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  // Preview Modal module
  const [previewDoc, setPreviewDoc] = useState<CompanyDocument | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);

  useEffect(() => {
    if (!selectedCompany || !auth.currentUser) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docsRef = collection(db, 'documents');
    const q = query(
      docsRef, 
      where('companyId', '==', selectedCompany.id),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData: CompanyDocument[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        docsData.push({
          id: doc.id,
          ...data,
          uploadDate: data.uploadDate?.toDate ? data.uploadDate.toDate().toISOString().split('T')[0] : data.uploadDate
        } as CompanyDocument);
      });
      setDocuments(docsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCompany]);

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
    'Kira Kontratı',
    'Beyanname Tahakkuk',
    'SGK Bildirgesi',
    'Mizan',
    'Diğer'
  ];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'Tümü' || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Base64 helper for offline / unprovisioned storage fallback
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Image compressor helper specifically for SMMM receipt and document sizes
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxDim = 1200; // Optimal resolution
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Save as JPEG with 70% quality to ensure below Firestore limit (~100-300KB)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Resim dosyası yüklenirken bir hata oluştu.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Main file processing logic
  const handleFileSelected = async (file: File) => {
    if (!selectedCompany || !auth.currentUser) return;

    try {
      setUploading(true);
      setNotification(null);
      const ext = (file.name.split('.').pop()?.toLowerCase() as any) || 'pdf';
      
      let downloadUrl = '#';
      let storagePath = `documents/${auth.currentUser.uid}/${selectedCompany.id}/${Date.now()}_${file.name}`;

      // Try uploading to Firebase Storage first (Standard cloud approach)
      try {
        downloadUrl = await uploadFile(storagePath, file);
      } catch (storageError: any) {
        console.warn('Firebase Storage is unprovisioned, falling back to secure Database attachment:', storageError);
        // Fallback: Check sizes since Firestore doc size limit is strict 1MB
        storagePath = ''; // Clear storagePath to indicate database inline representation
        
        if (file.type.startsWith('image/')) {
          // Compress immediately
          downloadUrl = await compressImage(file);
        } else {
          // For PDF, Word, Excel, the file size must be small enough to avoid exceeding Firestore limits
          if (file.size > 920 * 1024) { // ~920 KB max to prevent breaking Firestore limits
            throw new Error(`"Firebase Storage" aktif edilmemiş. Bu sebeple 900 KB'den büyük dokümanlar yüklenemez. Lütfen daha düşük boyutlu bir PDF/Excel seçin veya resim dosyalarınızı küçültüp yüklemeyi deneyin.`);
          }
          downloadUrl = await readFileAsBase64(file);
        }
      }

      const expiry = uploadExpiryDate || undefined;
      const calculatedStatus = expiry && new Date(expiry) < new Date() ? 'Süresi Dolmuş' : 'Geçerli';

      const newDocMetadata = {
        companyId: selectedCompany.id,
        ownerId: auth.currentUser.uid,
        title: file.name,
        type: selectedUploadType,
        uploadDate: serverTimestamp(),
        fileUrl: downloadUrl,
        storagePath: storagePath || null,
        fileType: ext,
        status: calculatedStatus,
        expiryDate: expiry || null,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'documents'), newDocMetadata);
      setNotification({ type: 'success', message: `"${file.name}" belgesi başarıyla kütüphaneye eklendi.` });
      setUploading(false);
      setUploadExpiryDate('');
    } catch (error: any) {
      console.error('Document upload error:', error);
      setNotification({ 
        type: 'error', 
        message: error.message || 'Belge yüklenirken bir sorun çıktı. Lütfen dosya boyutunu veya türünü kontrol edin.' 
      });
      setUploading(false);
    }
  };

  const handleUploadInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
    // Reset file input back to empty
    event.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleRename = async (id: string) => {
    if (!newName.trim()) return;
    try {
      setLoading(true);
      const docRef = doc(db, 'documents', id);
      await updateDoc(docRef, { title: newName });
      setRenamingId(null);
      setNewName('');
      setNotification({ type: 'success', message: 'Belge adı güncellendi.' });
      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `documents/${id}`);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const docToDelete = documents.find(d => d.id === id);
    if (!docToDelete) return;

    if (window.confirm('Bu belgeyi kütüphaneden kalıcı olarak silmek istediğinize emin misiniz?')) {
      try {
        setLoading(true);
        // Clear preview if deleted
        if (previewDoc?.id === id) {
          setPreviewDoc(null);
        }

        if (docToDelete.storagePath) {
          try {
            await deleteFile(docToDelete.storagePath);
          } catch (storageError) {
            console.warn('Storage deletion failed:', storageError);
          }
        }
        
        await deleteDoc(doc(db, 'documents', id));
        setNotification({ type: 'success', message: 'Belge başarıyla silindi.' });
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
        setLoading(false);
      }
    }
  };

  // Direct file downloader supporting both external bucket URLs and Base64 binary inline files
  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFile = async (docObj: CompanyDocument) => {
    try {
      const isBase64 = docObj.fileUrl.startsWith('data:');
      if (isBase64) {
        triggerDownload(docObj.fileUrl, docObj.title);
        return;
      }
      
      const response = await fetch(docObj.fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      triggerDownload(blobUrl, docObj.title);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.warn("Downloader cross-origin fetch bypassed. Opening direct download URL in background:", err);
      const link = document.createElement('a');
      link.href = docObj.fileUrl;
      link.target = '_blank';
      link.download = docObj.title;
      link.click();
    }
  };

  const handleShare = async (docObj: CompanyDocument, platform: 'whatsapp' | 'email') => {
    const isBase64 = docObj.fileUrl.startsWith('data:');
    const shareSubject = `Belge Paylaşımı: ${docObj.title}`;
    
    let linkText = '';
    if (!isBase64) {
      linkText = `\n🔗 *Belge Bağlantısı:* ${docObj.fileUrl}`;
    } else {
      linkText = `\n🔒 *Belge Detayı:* Bu evrak sistem veri tabanında şifreli lokal veri olarak korunmaktadır. BİTİG portal üzerinden güvenle görüntüleyebilirsiniz.`;
    }

    const shareBody = `*${selectedCompany?.title || 'Firma'}*\n📄 *Belge Adı:* ${docObj.title}\n📁 *Kategori:* ${docObj.type}\n📅 *Yükleme Tarihi:* ${docObj.uploadDate}${linkText}\n\n*SMMM Hatice ERDAL - BİTİG Muhasebe Yönetimi*`;

    if (platform === 'whatsapp') {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareBody)}`;
      window.open(waUrl, '_blank');
    } else {
      const mailUrl = `mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareBody.replace(/\*/g, ''))}`;
      window.open(mailUrl, '_blank');
    }
  };

  // Helper function to render specific beautiful icons depending on actual file extensions
  const renderFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'heic', 'gif', 'webp', 'dcim'].includes(type)) {
      return <ImageIcon className="w-5 h-5 text-amber-500" />;
    }
    if (['xlsx', 'xls', 'csv'].includes(type)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(type)) {
      return <FileArchive className="w-5 h-5 text-purple-500" />;
    }
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-kilim-blue" />
            Mükellef Belge & Evrak Yönetimi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">Firmalara ait resmi tescil, beyanname, sicil gazetesi, imza sirküsü ve sözleşmeleri güvenle depolayın.</p>
        </div>
      </div>

      {/* Advanced Quick Upload Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Upload Config Panel */}
        <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Upload className="w-4 h-4 text-slate-400" />
            Yükleme Parametreleri
          </h4>

          <div className="space-y-3">
            {/* Category / Document Type Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Belge Türü (Kategori)</label>
              <select
                value={selectedUploadType}
                onChange={(e) => setSelectedUploadType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-kilim-blue cursor-pointer"
              >
                {documentTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Optional Validity Limit / Expiration date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Geçerlilik Bitiş Tarihi (Opsiyonel)</label>
              <input
                type="date"
                value={uploadExpiryDate}
                onChange={(e) => setUploadExpiryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-kilim-blue cursor-pointer"
              />
              <p className="text-[9px] text-slate-400 leading-normal">Bu tarih dolduğunda mükellef evrakı otomatik olarak "Süresi Dolmuş" durum kuralına geçer.</p>
            </div>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div className="md:col-span-8 h-full">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`w-full border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[175px] cursor-pointer ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-50/55' 
                : 'border-slate-200 hover:border-kilim-blue hover:bg-slate-50/30 bg-white'
            }`}
          >
            <input 
              type="file" 
              id="drag-file-uploader" 
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.heic,.csv,.txt,.zip,.rar" 
              onChange={handleUploadInputChange}
              disabled={uploading || !selectedCompany}
            />
            <label htmlFor="drag-file-uploader" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              <div className="w-12 h-12 bg-slate-50 group-hover:bg-slate-100 rounded-full flex items-center justify-center mb-3">
                {uploading ? (
                  <RefreshCw className="w-6 h-6 text-kilim-blue animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <p className="text-xs font-bold text-slate-700">
                {uploading ? 'Yarıda kesmeyin, karşıya yükleniyor...' : 'Sürükleyin veya Dosya Seçin'}
              </p>
              <p className="text-[10px] text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                Desteklenen formatlar: PDF, Word, Excel, PNG, JPG, JPEG, HEIC, ZIP, RAR, TXT, CSV. (Maksimum 900KB)
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Notification and alert box */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl flex items-center justify-between border ${
              notification.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                : 'bg-rose-50 text-rose-800 border-rose-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span className="text-xs font-bold">{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Company List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-2">Kayıtlı Mükellefler</h3>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {companies.length > 0 ? (
                companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                      selectedCompany?.id === company.id 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-500/5' 
                        : 'hover:bg-slate-50/80 text-slate-600 border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      selectedCompany?.id === company.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold truncate">{company.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">V.N: {company.taxNumber}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  Henüz firma eklenmemiş.
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-5 bg-slate-900 border-none rounded-3xl text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
            <p className="text-[9px] font-black tracking-widest text-emerald-400 uppercase mb-2">Evrak Analitik</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Toplam Belge</span>
                <span className="font-bold">{documents.length} Adet</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Süresi Dolanlar</span>
                <span className="font-black text-rose-400">
                  {documents.filter(d => d.status === 'Süresi Dolmuş').length} Adet
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
                placeholder="Belge adı veya tipine göre detaylı arama..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/15 outline-none cursor-pointer"
              >
                <option value="Tümü">Tüm Kategoriler</option>
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card p-4 hover:shadow-lg hover:border-slate-300/80 transition-all group flex flex-col justify-between min-h-[170px]"
                    style={{ borderTop: `4px solid ${doc.status === 'Süresi Dolmuş' ? '#f43f5e' : '#10b981'}` }}
                  >
                    <div>
                      {/* Card Header Actions */}
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2.5 rounded-xl ${doc.status === 'Süresi Dolmuş' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {renderFileIcon(doc.fileType)}
                        </div>
                        <div className="flex items-center gap-1">
                          {renamingId === doc.id ? (
                            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                              <input 
                                type="text" 
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="text-[10px] px-1 py-0.5 outline-none font-bold text-slate-700 w-24"
                                autoFocus
                              />
                              <button onClick={() => handleRename(doc.id)} className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => setRenamingId(null)} className="p-0.5 text-rose-600 hover:bg-rose-50 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setRenamingId(doc.id);
                                setNewName(doc.title);
                              }}
                              className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                              title="Adı Değiştir"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleShare(doc, 'whatsapp')}
                            className="p-1 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors"
                            title="WhatsApp Paylaş"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleShare(doc, 'email')}
                            className="p-1 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg transition-colors"
                            title="E-posta Gönder"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(doc.id)}
                            className="p-1 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Titles */}
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate" title={doc.title}>{doc.title}</h4>
                        <div className="inline-block bg-slate-100 text-slate-600 text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full uppercase">
                          {doc.type}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      {/* Validity states / dates */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1">
                          {doc.status === 'Geçerli' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse" />
                          )}
                          <span className={`font-black ${doc.status === 'Geçerli' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {doc.status === 'Geçerli' ? 'GÜNCEL' : 'SÜRESİ DOLMUŞ'}
                          </span>
                        </div>
                        <span className="text-slate-400 flex items-center gap-1 font-bold">
                          <Clock className="w-2.5 h-2.5" />
                          {doc.uploadDate}
                        </span>
                      </div>

                      {doc.expiryDate && (
                        <div className={`p-1.5 rounded-xl text-[9px] font-black flex items-center justify-between ${
                          doc.status === 'Süresi Dolmuş' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                        }`}>
                          <span>Son Geçerlilik:</span>
                          <span>{doc.expiryDate}</span>
                        </div>
                      )}

                      {/* Direct card preview and download triggers */}
                      <div className="grid grid-cols-2 gap-2 pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => handleDownloadFile(doc)}
                          className="flex items-center justify-center gap-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-extrabold transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          İndir
                        </button>
                        <button 
                          onClick={() => {
                            setPreviewDoc(doc);
                            setPreviewZoom(1);
                          }}
                          className="flex items-center justify-center gap-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-extrabold transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Görüntüle
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold">Belge Bulunmuyor</h3>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto mt-1">
                      Mükellefe bağlı herhangi bir evrak dosyası yüklenmemiş. Yukarıdan yeni bütçe kuralına uygun evrak ekleyebilirsiniz.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Advanced Preview Modal with robust PDF, Images Zoom capabilities */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    {renderFileIcon(previewDoc.fileType)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 truncate max-w-sm sm:max-w-md" title={previewDoc.title}>
                      {previewDoc.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{previewDoc.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewDoc(null)} 
                  className="p-1 px-2.5 rounded-full bg-slate-200/50 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Container */}
              <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100 min-h-[40vh]">
                {/* Images layout (zoom supported) */}
                {['jpg', 'jpeg', 'png', 'heic', 'gif', 'webp', 'dcim'].includes(previewDoc.fileType.toLowerCase()) ? (
                  <div className="relative max-w-full max-h-[55vh] flex flex-col items-center justify-center">
                    {/* Zoom bar */}
                    <div className="absolute top-2 right-2 bg-slate-900/85 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 z-10 text-white select-none shadow-sm">
                      <button 
                        onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.25))} 
                        className="p-0.5 hover:text-emerald-400 transition-colors"
                        title="Uzaklaştır"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black tracking-wider w-8 text-center">%{Math.round(previewZoom * 100)}</span>
                      <button 
                        onClick={() => setPreviewZoom(z => Math.min(3, z + 0.25))} 
                        className="p-0.5 hover:text-emerald-400 transition-colors"
                        title="Yakınlaştır"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setPreviewZoom(1)} 
                        className="text-[9px] font-bold border-l border-white/20 pl-1.5 ml-1 select-none hover:text-emerald-400"
                      >
                        Sıfırla
                      </button>
                    </div>
                    {/* Image */}
                    <div className="overflow-auto max-w-full max-h-[50vh] p-2 bg-white rounded-2xl shadow border-4 border-white">
                      <img 
                        src={previewDoc.fileUrl} 
                        alt={previewDoc.title} 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-[45vh] object-contain transition-transform duration-200 origin-center"
                        style={{ transform: `scale(${previewZoom})` }}
                      />
                    </div>
                  </div>
                ) : previewDoc.fileType.toLowerCase() === 'pdf' ? (
                  /* PDF Renderer layout */
                  <div className="w-full h-[55vh] flex flex-col">
                    <iframe 
                      src={previewDoc.fileUrl} 
                      title={previewDoc.title} 
                      className="w-full h-full rounded-2xl border border-slate-200/80 shadow-md bg-white"
                    />
                    <p className="text-[10px] text-slate-400 text-center mt-2 font-bold select-none italic">
                      Eğer tarayıcınız PDF önizlemesini desteklemiyorsa, evrakı indirmek için 'Dosyayı İndir' butonunu kullanabilirsiniz.
                    </p>
                  </div>
                ) : (
                  /* Word, Excel and other formats placeholder */
                  <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-slate-200/50 space-y-5 animate-fade-in">
                    <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                      {renderFileIcon(previewDoc.fileType)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest">Önizleme Desteklenmiyor</h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Sayın Müşavir, Word (.doc, .docx) ve Excel (.xls, .xlsx) evrak formatları tarayıcıda doğrudan önizlenemez. 
                        Bu evrakı cihazınızda yerel olarak açmak için lütfen indirin veya paylaşın.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-center gap-3">
                      <button 
                        onClick={() => handleDownloadFile(previewDoc)}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-sm"
                      >
                        Evrak Dosyasını İndir
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
                <div className="text-[10px] text-slate-400 font-bold">
                  Yüklenme: {previewDoc.uploadDate} {previewDoc.expiryDate ? `| Geçerlilik: ${previewDoc.expiryDate}` : ''}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare(previewDoc, 'whatsapp')}
                    className="px-4 py-2.5 bg-emerald-100 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black border border-emerald-100 flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare(previewDoc, 'email')}
                    className="px-4 py-2.5 bg-blue-100 hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-black border border-blue-100 flex items-center gap-1.5"
                  >
                    <Mail className="w-4 h-4" />
                    E-posta
                  </button>
                  <button
                    onClick={() => handleDownloadFile(previewDoc)}
                    className="px-5 py-2.5 bg-kilim-blue text-white hover:bg-kilim-blue-dark rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-kilim-blue/10"
                  >
                    <Download className="w-4 h-4" />
                    Evrakı Cihaza İndir
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
