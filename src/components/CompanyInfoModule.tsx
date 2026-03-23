import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  Info, 
  Users, 
  Briefcase, 
  FileText, 
  Calendar, 
  Fingerprint,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile, Personnel } from '../types';

interface CompanyInfoModuleProps {
  profile: CompanyProfile;
  companies: CompanyProfile[];
  onUpdate: (profile: CompanyProfile) => void;
  onAdd: (profile: CompanyProfile) => void;
  onSelect: (profile: CompanyProfile) => void;
  onDelete: (id: string) => void;
}

export const CompanyInfoModule: React.FC<CompanyInfoModuleProps> = ({ profile, companies, onUpdate, onAdd, onSelect, onDelete }) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'genel' | 'personel'>('genel');

  // Update form data when profile changes (e.g. when selecting a different company)
  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'hrProfile') {
        setFormData(prev => ({
          ...prev,
          hrProfile: {
            ...prev.hrProfile,
            [child]: child === 'femaleWorkers' || child === 'maleWorkers' || child === 'totalWorkers' 
              ? parseInt(value) || 0 
              : value
          }
        }));
      } else if (parent === 'personnelGroups') {
        setFormData(prev => ({
          ...prev,
          hrProfile: {
            ...prev.hrProfile,
            personnelGroups: {
              ...prev.hrProfile.personnelGroups,
              [child]: parseInt(value) || 0
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddPersonnel = () => {
    const newPersonnel: Personnel = {
      id: Date.now().toString(),
      fullName: '',
      role: '',
      idNumber: '',
      netSalary: 0,
      startDate: new Date().toISOString().split('T')[0],
      leaveStatus: 'Aktif'
    };
    setFormData(prev => ({
      ...prev,
      personnel: [...(prev.personnel || []), newPersonnel]
    }));
  };

  const handleUpdatePersonnel = (id: string, field: keyof Personnel, value: any) => {
    setFormData(prev => ({
      ...prev,
      personnel: (prev.personnel || []).map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handleDeletePersonnel = (id: string) => {
    setFormData(prev => ({
      ...prev,
      personnel: (prev.personnel || []).filter(p => p.id !== id)
    }));
  };

  const handleAddNew = () => {
    const newId = (companies.length + 1).toString();
    const newCompany: CompanyProfile = {
      ...profile,
      id: newId,
      title: 'YENİ FİRMA ÜNVANI',
      taxNumber: '',
      sgkNumber: '',
      sector: 'Genel',
      hrProfile: {
        totalWorkers: 0,
        femaleWorkers: 0,
        maleWorkers: 0,
        personnelGroups: {
          retired: 0,
          disabled: 0,
          foreign: 0,
          apprentice: 0
        }
      }
    };
    onAdd(newCompany);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kilim-blue-dark flex items-center gap-2">
            <Building2 className="w-7 h-7 text-kilim-blue" />
            Firma Bilgisi & Mükellef Kimlik Kartı
          </h1>
          <p className="text-slate-500">Yapay zekanın mevzuat ve teşvik analizleri için temel referans verileri.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-kilim-blue border border-kilim-blue rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Yeni Firma Ekle
          </button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-2.5 bg-kilim-blue text-white rounded-xl font-bold hover:bg-kilim-blue/90 transition-all shadow-lg shadow-kilim-blue/20"
          >
            <Save className="w-5 h-5" />
            Bilgileri Güncelle
          </button>
        </div>
      </header>

      {isSaved && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2"
        >
          <ShieldCheck className="w-5 h-5" />
          Firma bilgileri başarıyla güncellendi ve LocalStorage'a kaydedildi. Yapay zeka artık bu verileri analizlerinde kullanacak.
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Company List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4 border-kilim-blue-light/20">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Kayıtlı Firmalar ({companies.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {companies.map((c) => (
                <div key={c.id} className="group relative">
                  <button
                    onClick={() => onSelect(c)}
                    className={`w-full text-left p-3 rounded-xl transition-all border pr-10 ${
                      profile.id === c.id 
                        ? 'bg-kilim-blue text-white border-kilim-blue shadow-md shadow-kilim-blue/20' 
                        : 'bg-white text-slate-600 border-slate-100 hover:border-kilim-blue/30 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{c.title}</p>
                    <p className={`text-[10px] mt-1 ${profile.id === c.id ? 'text-white/70' : 'text-slate-400'}`}>
                      VKN: {c.taxNumber || 'Girilmemiş'}
                    </p>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`${c.title} firmasını silmek istediğinize emin misiniz?`)) {
                        onDelete(c.id);
                      }
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                      profile.id === c.id 
                        ? 'text-white/60 hover:text-white hover:bg-white/10' 
                        : 'text-slate-300 hover:text-[#D32F2F] hover:bg-red-50'
                    }`}
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-amber-800 uppercase">Bilgi</h4>
            </div>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              Sol taraftaki listeden firma seçerek bilgilerini güncelleyebilir veya yeni firma ekleyerek portföyünüzü genişletebilirsiniz.
            </p>
          </div>
        </div>

        {/* Form Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('genel')}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'genel' 
                  ? 'border-kilim-blue text-kilim-blue' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Genel Bilgiler
            </button>
            <button
              onClick={() => setActiveTab('personel')}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'personel' 
                  ? 'border-kilim-blue text-kilim-blue' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              İşçi Bilgileri ({formData.personnel?.length || 0})
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'genel' ? (
              <motion.div
                key="genel"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Kimlik ve Hukuki Statü */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6 border-kilim-blue-light/30">
                      <h3 className="font-bold text-kilim-blue-light flex items-center gap-2 mb-6">
                        <Fingerprint className="w-5 h-5 text-kilim-blue" />
                        Temel Kimlik Bilgileri
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Firma Ünvanı</label>
                          <input 
                            type="text" 
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Vergi Dairesi</label>
                          <input 
                            type="text" 
                            name="taxOffice"
                            value={formData.taxOffice}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Vergi / TC Kimlik No</label>
                          <input 
                            type="text" 
                            name="taxNumber"
                            value={formData.taxNumber}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">SGK Sicil No</label>
                          <input 
                            type="text" 
                            name="sgkNumber"
                            value={formData.sgkNumber}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Sektör</label>
                          <input 
                            type="text" 
                            name="sector"
                            value={formData.sector || ''}
                            onChange={handleChange}
                            placeholder="Örn: Tekstil, İnşaat, Gıda"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 border-kilim-blue-light/30">
                      <h3 className="font-bold text-kilim-blue-light flex items-center gap-2 mb-6">
                        <Briefcase className="w-5 h-5 text-kilim-blue" />
                        Mali ve Hukuki Parametreler
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Hukuki Statü</label>
                          <select 
                            name="legalStatus"
                            value={formData.legalStatus}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          >
                            {['Gerçek Kişi', 'LTD', 'AŞ', 'Kooperatif', 'Dernek', 'Vakıf'].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Defter ve Beyan Türü</label>
                          <select 
                            name="ledgerType"
                            value={formData.ledgerType}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          >
                            {['İşletme Defteri', 'E-Defter (Bilanço)', 'Serbest Meslek Makbuzu', 'Basit Usul'].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">NACE Kodu</label>
                          <input 
                            type="text" 
                            name="naceCode"
                            value={formData.naceCode}
                            onChange={handleChange}
                            placeholder="Örn: 69.20.01"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">İşe Başlama Tarihi</label>
                          <input 
                            type="date" 
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Berat Tercihi</label>
                          <select 
                            name="beratPreference"
                            value={formData.beratPreference}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          >
                            <option value="Aylık">Aylık</option>
                            <option value="Geçici (3 Aylık)">Geçici (3 Aylık)</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-6 pt-4 md:col-span-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              id="isExporter"
                              name="isExporter"
                              checked={formData.isExporter}
                              onChange={handleChange}
                              className="w-5 h-5 accent-emerald-600 rounded"
                            />
                            <label htmlFor="isExporter" className="text-sm font-bold text-slate-700 cursor-pointer">İhracat Yapıyor mu?</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              id="hasWithholdingSales"
                              name="hasWithholdingSales"
                              checked={formData.hasWithholdingSales}
                              onChange={handleChange}
                              className="w-5 h-5 accent-emerald-600 rounded"
                            />
                            <label htmlFor="hasWithholdingSales" className="text-sm font-bold text-slate-700 cursor-pointer">Tevkifatlı Satışı Var mı?</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* İnsan Kaynakları Profili */}
                  <div className="space-y-6">
                    <div className="glass-card p-6 border-kilim-blue-light/30">
                      <h3 className="font-bold text-kilim-blue-light flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-kilim-blue" />
                        İnsan Kaynakları Profili
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Toplam İşçi Sayısı</label>
                          <input 
                            type="number" 
                            name="hrProfile.totalWorkers"
                            value={formData.hrProfile.totalWorkers}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Kadın</label>
                            <input 
                              type="number" 
                              name="hrProfile.femaleWorkers"
                              value={formData.hrProfile.femaleWorkers}
                              onChange={handleChange}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Erkek</label>
                            <input 
                              type="number" 
                              name="hrProfile.maleWorkers"
                              value={formData.hrProfile.maleWorkers}
                              onChange={handleChange}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Özel Personel Grupları</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: 'Emekli', key: 'retired' },
                              { label: 'Engelli', key: 'disabled' },
                              { label: 'Yabancı', key: 'foreign' },
                              { label: 'Çırak/Stajyer', key: 'apprentice' },
                            ].map(group => (
                              <div key={group.key} className="space-y-1">
                                <label className="text-[10px] font-medium text-slate-400">{group.label}</label>
                                <input 
                                  type="number" 
                                  name={`personnelGroups.${group.key}`}
                                  value={(formData.hrProfile.personnelGroups as any)[group.key]}
                                  onChange={handleChange}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 bg-kilim-blue-dark text-white border-none">
                      <h3 className="font-bold flex items-center gap-2 mb-4">
                        <Info className="w-5 h-5 text-kilim-blue-light" />
                        AI Akıllı Mantık Notu
                      </h3>
                      <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                        {formData.ledgerType === 'Basit Usul' && (
                          <p className="flex gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span>"Basit Usul" seçili. KDV1 beyanname uyarıları devre dışı bırakıldı. Yıllık beyanname Şubat ayına sabitlendi.</span>
                          </p>
                        )}
                        {formData.hrProfile.femaleWorkers > 0 && (
                          <p className="flex gap-2">
                            <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>Kadın işçi girişi yapıldı. SGK teşvik robotunda "6111 Kadın İstihdam Teşviki" önceliklendirilecek.</span>
                          </p>
                        )}
                        {!formData.startDate && (
                          <p className="flex gap-2 text-rose-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>İşe başlama tarihi girilmemiş. Teşvik analizleri kısıtlı çalışabilir.</span>
                          </p>
                        )}
                        {formData.ledgerType === 'Serbest Meslek Makbuzu' && (
                          <p className="flex gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span>"Serbest Meslek" seçili. AI sadece Gelir-Gider dengesine ve Stopaj kesintilerine odaklanacak.</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="personel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-kilim-blue-light flex items-center gap-2">
                    <Users className="w-5 h-5 text-kilim-blue" />
                    İşçi Bilgileri Yönetimi
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddPersonnel}
                    className="flex items-center gap-2 px-4 py-2 bg-kilim-blue text-white rounded-xl text-sm font-bold hover:bg-kilim-blue/90 transition-all shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Yeni Personel Ekle
                  </button>
                </div>

                <div className="glass-card overflow-hidden border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ad Soyad</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Görev</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">TC / SGK No</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Maaş</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giriş Tarihi</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(formData.personnel || []).map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <input 
                                type="text"
                                value={p.fullName}
                                onChange={(e) => handleUpdatePersonnel(p.id, 'fullName', e.target.value)}
                                placeholder="İsim Soyisim"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="text"
                                value={p.role}
                                onChange={(e) => handleUpdatePersonnel(p.id, 'role', e.target.value)}
                                placeholder="Görev"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-600"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="text"
                                value={p.idNumber}
                                onChange={(e) => handleUpdatePersonnel(p.id, 'idNumber', e.target.value)}
                                placeholder="11 Haneli No"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-600 font-mono"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-sm">₺</span>
                                <input 
                                  type="number"
                                  value={p.netSalary}
                                  onChange={(e) => handleUpdatePersonnel(p.id, 'netSalary', parseFloat(e.target.value) || 0)}
                                  className="w-24 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <input 
                                type="date"
                                value={p.startDate}
                                onChange={(e) => handleUpdatePersonnel(p.id, 'startDate', e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 text-xs text-slate-600"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={p.leaveStatus}
                                onChange={(e) => handleUpdatePersonnel(p.id, 'leaveStatus', e.target.value)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-full border-none focus:ring-0 cursor-pointer ${
                                  p.leaveStatus === 'Aktif' ? 'bg-emerald-50 text-emerald-600' :
                                  p.leaveStatus === 'İzinli' ? 'bg-amber-50 text-amber-600' :
                                  'bg-rose-50 text-rose-600'
                                }`}
                              >
                                <option value="Aktif">Aktif</option>
                                <option value="İzinli">İzinli</option>
                                <option value="Ayrıldı">Ayrıldı</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => handleDeletePersonnel(p.id)}
                                className="p-2 text-slate-300 hover:text-[#D32F2F] hover:bg-red-50 rounded-lg transition-all"
                              >
                                <UserMinus size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(formData.personnel || []).length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-10 text-center">
                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Users className="w-10 h-10 opacity-20" />
                                <p className="text-sm italic">Henüz personel kaydı yapılmamış.</p>
                                <button
                                  type="button"
                                  onClick={handleAddPersonnel}
                                  className="text-xs font-bold text-kilim-blue hover:underline mt-2"
                                >
                                  İlk Personeli Ekle
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                  <button 
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-10 py-3 bg-kilim-blue text-white rounded-xl font-bold hover:bg-kilim-blue/90 transition-all shadow-lg shadow-kilim-blue/20"
                  >
                    <Save className="w-5 h-5" />
                    Bilgileri Güncelle
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
