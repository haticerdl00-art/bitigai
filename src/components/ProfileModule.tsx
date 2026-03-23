import React, { useState } from 'react';
import { User, Mail, Phone, ShieldCheck, Camera, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileModuleProps {
  profile: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
  onDeleteAll: () => void;
}

export const ProfileModule = ({ profile, onUpdate, onDeleteAll }: ProfileModuleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSaveProfile = () => {
    onUpdate(editedProfile);
    setIsEditing(false);
    setMsg({ type: 'success', text: 'Profil bilgileriniz başarıyla güncellendi.' });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setMsg({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
      return;
    }
    // In a real app, we'd call an API here
    setMsg({ type: 'success', text: 'Şifreniz başarıyla değiştirildi.' });
    setPasswordForm({ current: '', new: '', confirm: '' });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Kullanıcı Bilgileri / Profil</h2>
          <p className="text-xs sm:text-sm text-slate-500">Hesap bilgilerinizi ve iletişim tercihlerinizi buradan yönetebilirsiniz.</p>
        </div>
        {msg && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.text}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="glass-card p-4 sm:p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E8D5C4] flex items-center justify-center border-4 border-white shadow-sm">
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-[#5D4037]" />
              </div>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">{profile.fullName}</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">{profile.username}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center gap-2 flex-wrap">
              <span className="px-2 sm:px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-bold uppercase rounded-full">Aktif Hesap</span>
              <span className="px-2 sm:px-3 py-1 bg-blue-50 text-blue-700 text-[9px] sm:text-[10px] font-bold uppercase rounded-full">Pro Plan</span>
            </div>
          </div>

          <div className="glass-card p-5">
            <h4 className="font-bold text-slate-800 mb-4 text-sm">Güvenlik Durumu</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-slate-600 font-medium">İki Faktörlü Doğrulama</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">AÇIK</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[85%]"></div>
              </div>
              <p className="text-[10px] text-slate-400">Hesap güvenliğiniz %85 oranında korunuyor.</p>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Kişisel Bilgiler
              </h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded-lg transition-colors"
                >
                  Düzenle
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İsim Soyisim</label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={editedProfile.fullName}
                    onChange={(e) => setEditedProfile({...editedProfile, fullName: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{profile.fullName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unvan</label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={editedProfile.username}
                    onChange={(e) => setEditedProfile({...editedProfile, username: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{profile.username}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-Posta Adresi</label>
                {isEditing ? (
                  <input 
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{profile.email || 'Belirtilmemiş'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefon Numarası</label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{profile.phone || 'Belirtilmemiş'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instagram</label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={editedProfile.instagram || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, instagram: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    placeholder="https://instagram.com/..."
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400">IG</span>
                    <span className="text-sm font-medium text-slate-700">{profile.instagram || 'Belirtilmemiş'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LinkedIn</label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={editedProfile.linkedin || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, linkedin: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    placeholder="https://linkedin.com/in/..."
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400">LI</span>
                    <span className="text-sm font-medium text-slate-700">{profile.linkedin || 'Belirtilmemiş'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Web Sitesi</label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={editedProfile.website || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, website: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    placeholder="https://..."
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400">WEB</span>
                    <span className="text-sm font-medium text-slate-700">{profile.website || 'Belirtilmemiş'}</span>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => { setIsEditing(false); setEditedProfile(profile); }}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-colors"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            )}
          </div>

          {/* Change Password Section */}
          <div className="glass-card p-8">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Şifremi Değiştir
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mevcut Şifre</label>
                  <input 
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yeni Şifre</label>
                  <input 
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yeni Şifre (Tekrar)</label>
                  <input 
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                >
                  Şifreyi Güncelle
                </button>
              </div>
            </form>
          </div>

          <div className="glass-card p-8 border-rose-100 bg-rose-50/30">
            <h3 className="font-bold text-rose-800 mb-2">Tehlikeli Bölge</h3>
            <p className="text-xs text-rose-600 mb-6">
              Aşağıdaki buton tüm yerel verilerinizi (şirketler, mizanlar, ayarlar) kalıcı olarak siler. 
              Bu işlem geri alınamaz.
            </p>
            <button 
              onClick={onDeleteAll}
              className="w-full py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              Tüm Verilerimi ve Hesabımı Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

