import React, { useState, useEffect } from 'react';
import { User, Shield, X, Sparkles, Heart, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLogo } from './Logo';

interface LoginProps {
  onLogin: (name: string, title: string) => void;
}

interface UserData {
  username: string;
  password: string;
  fullName: string;
  title: string;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showKVKK, setShowKVKK] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');

  // Registration states
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regTitle, setRegTitle] = useState('');

  const getUsers = (): UserData[] => {
    const saved = localStorage.getItem('bitig_users');
    return saved ? JSON.parse(saved) : [];
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      onLogin(user.fullName, user.title);
    } else {
      setError('Geçersiz kullanıcı adı veya şifre.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regUsername || !regPassword || !regFullName) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    const users = getUsers();
    if (users.some(u => u.username === regUsername)) {
      setError('Bu kullanıcı adı zaten alınmış.');
      return;
    }

    const newUser: UserData = {
      username: regUsername,
      password: regPassword,
      fullName: regFullName,
      title: regTitle || 'Mali Müşavir'
    };

    localStorage.setItem('bitig_users', JSON.stringify([...users, newUser]));
    setShowRegister(false);
    setUsername(regUsername);
    setPassword(regPassword);
    // Clear registration fields
    setRegUsername('');
    setRegPassword('');
    setRegFullName('');
    setRegTitle('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-6 relative overflow-hidden">
      {/* Bohemian Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E8D5C4] rounded-full blur-[100px] opacity-40" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D4E2D4] rounded-full blur-[100px] opacity-40" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-flex items-center justify-center mb-6 p-4 bg-white rounded-[2rem] shadow-sm border border-[#E8D5C4]"
          >
            <AppLogo size="lg" />
          </motion.div>
          <h1 className="text-4xl font-serif font-bold text-[#5D4037] tracking-tight mb-2">BİTİG AI</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-[1px] w-8 bg-[#8D6E63]" />
            <p className="text-[#8D6E63] text-[10px] font-bold uppercase tracking-[0.3em]">Dijital Müşavir Asistanı</p>
            <div className="h-[1px] w-8 bg-[#8D6E63]" />
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border border-white/50 relative">
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5D4037] uppercase tracking-widest ml-1">Kullanıcı Adı</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1887F]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adınız"
                  className="w-full pl-12 pr-6 py-3.5 bg-[#FAF7F2] border border-[#E8D5C4] rounded-xl focus:ring-2 focus:ring-[#1e40af]/20 focus:border-[#1e40af] outline-none transition-all text-[#5D4037] placeholder-[#A1887F]/50 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5D4037] uppercase tracking-widest ml-1">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1887F]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-3.5 bg-[#FAF7F2] border border-[#E8D5C4] rounded-xl focus:ring-2 focus:ring-[#1e40af]/20 focus:border-[#1e40af] outline-none transition-all text-[#5D4037] placeholder-[#A1887F]/50 font-medium"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-4 bg-[#1e40af] text-white font-bold rounded-xl hover:bg-[#1e3a8a] shadow-lg shadow-[#1e40af]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Giriş Yap</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="w-full py-4 bg-[#28a745] text-white font-bold rounded-xl hover:bg-[#218838] shadow-lg shadow-[#28a745]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Kaydol</span>
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[#A1887F] text-[10px] mt-8 font-medium tracking-widest uppercase">
          © 2026 BİTİG AI • Yerel Veri Güvencesi
        </p>
      </motion.div>

      {/* KVKK Link in bottom right */}
      <div className="fixed bottom-6 right-6 z-10">
        <button 
          onClick={() => setShowKVKK(true)}
          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest flex items-center gap-2"
        >
          <Shield className="w-3 h-3" />
          KVKK ve Gizlilik Metni
        </button>
      </div>

      {/* Register Modal */}
      <AnimatePresence>
        {showRegister && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#5D4037]/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-md w-full rounded-[2rem] shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setShowRegister(false)}
                className="absolute top-6 right-6 p-2 hover:bg-[#FAF7F2] rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-[#5D4037]" />
              </button>

              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-[#D4E2D4] rounded-xl">
                    <UserPlus className="w-6 h-6 text-[#2E7D32]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#5D4037]">Yeni Hesap Oluştur</h2>
                    <p className="text-[10px] text-[#8D6E63] font-bold uppercase tracking-widest">Bilgileriniz yerel olarak saklanır</p>
                  </div>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#5D4037] uppercase tracking-widest ml-1">Tam İsim</label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Örn: Hatice Erdal"
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8D5C4] rounded-xl focus:ring-2 focus:ring-[#28a745]/20 focus:border-[#28a745] outline-none transition-all text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#5D4037] uppercase tracking-widest ml-1">Unvan</label>
                    <input
                      type="text"
                      value={regTitle}
                      onChange={(e) => setRegTitle(e.target.value)}
                      placeholder="Örn: SMMM"
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8D5C4] rounded-xl focus:ring-2 focus:ring-[#28a745]/20 focus:border-[#28a745] outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#5D4037] uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Giriş için kullanıcı adı"
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8D5C4] rounded-xl focus:ring-2 focus:ring-[#28a745]/20 focus:border-[#28a745] outline-none transition-all text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#5D4037] uppercase tracking-widest ml-1">Şifre</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E8D5C4] rounded-xl focus:ring-2 focus:ring-[#28a745]/20 focus:border-[#28a745] outline-none transition-all text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-4 bg-[#28a745] text-white font-bold rounded-xl hover:bg-[#218838] transition-all shadow-lg shadow-[#28a745]/20"
                  >
                    Kayıt Ol ve Giriş Yap
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KVKK Modal */}
      <AnimatePresence>
        {showKVKK && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#5D4037]/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setShowKVKK(false)}
                className="absolute top-6 right-6 p-2 hover:bg-[#FAF7F2] rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-[#5D4037]" />
              </button>

              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-[#D4E2D4] rounded-2xl">
                    <Shield className="w-8 h-8 text-[#2E7D32]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#5D4037]">Gizlilik ve KVKK</h2>
                    <p className="text-xs text-[#8D6E63] font-bold uppercase tracking-widest">Veri Güvenliği Politikası</p>
                  </div>
                </div>

                <div className="space-y-6 text-[#5D4037] leading-relaxed">
                  <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#E8D5C4]">
                    <p className="text-sm font-bold text-[#5D4037] mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#8D6E63]" />
                      Yerel Depolama Garantisi
                    </p>
                    <p className="text-sm">
                      Bu uygulama, girdiğiniz hiçbir veriyi (isim, unvan, şifreler, şirket bilgileri vb.) herhangi bir uzak sunucuya 
                      <strong> göndermez ve saklamaz.</strong>
                    </p>
                  </div>

                  <p className="text-sm">
                    Verileriniz sunuculara gönderilmez, sadece bu cihazda şifrelenmiş olarak saklanır. Tüm kayıtlar sadece bu cihazın tarayıcı hafızasında (localStorage) saklanır.
                  </p>

                  <p className="text-sm">
                    Tarayıcı verilerini temizlediğinizde veya uygulamadaki "Hesabımı Sil" butonunu kullandığınızda tüm verileriniz kalıcı olarak silinir.
                  </p>
                </div>

                <button 
                  onClick={() => setShowKVKK(false)}
                  className="w-full mt-10 py-4 bg-[#D4E2D4] text-[#2E7D32] font-bold rounded-2xl hover:bg-[#C8DBC8] transition-all"
                >
                  Anladım, Devam Et
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


