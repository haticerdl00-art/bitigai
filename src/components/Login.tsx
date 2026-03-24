import React, { useState } from 'react';
import { Shield, X, Sparkles, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLogo } from './Logo';
import { loginWithEmail, registerWithEmail } from '../firebase';

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [showKVKK, setShowKVKK] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onLogin();
    } catch (err: any) {
      console.error("Google Login error:", err);
      setError(err.message || "Google ile giriş yapılırken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isRegistering) {
        if (!fullName) throw new Error("Lütfen adınızı ve soyadınızı giriniz.");
        await registerWithEmail(email, password, fullName);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Email Auth error:", err);
      let message = "Bir hata oluştu.";
      if (err.code === 'auth/user-not-found') message = "Kullanıcı bulunamadı.";
      else if (err.code === 'auth/wrong-password') message = "Hatalı şifre.";
      else if (err.code === 'auth/email-already-in-use') message = "Bu e-posta adresi zaten kullanımda.";
      else if (err.code === 'auth/invalid-email') message = "Geçersiz e-posta adresi.";
      else if (err.code === 'auth/weak-password') message = "Şifre çok zayıf (en az 6 karakter).";
      setError(err.message || message);
    } finally {
      setIsLoading(false);
    }
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
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-serif font-bold text-[#5D4037]">
                {isRegistering ? 'Hesap Oluştur' : 'Hoş Geldiniz'}
              </h2>
              <p className="text-sm text-[#8D6E63]">
                {isRegistering ? 'Bilgilerinizi girerek kayıt olun.' : 'Uygulamaya erişmek için giriş yapın.'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegistering && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6E63]" />
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2] border border-[#E8D5C4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20 transition-all"
                    required
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6E63]" />
                <input
                  type="email"
                  placeholder="E-posta Adresi"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2] border border-[#E8D5C4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20 transition-all"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6E63]" />
                <input
                  type="password"
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2] border border-[#E8D5C4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#5D4037] text-white font-bold rounded-xl hover:bg-[#4E342E] shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegistering ? 'Kayıt Ol' : 'Giriş Yap'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8D5C4]"></div>
              </div>
              <span className="relative px-4 bg-white text-[10px] text-[#A1887F] font-bold uppercase tracking-widest">veya</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white text-[#5D4037] font-bold rounded-xl border border-[#E8D5C4] hover:bg-[#FAF7F2] shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              <span>Google ile Devam Et</span>
            </button>

            <div className="text-center">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-[#8D6E63] font-bold hover:text-[#5D4037] transition-colors"
              >
                {isRegistering ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
              </button>
            </div>

            <div className="pt-4 border-t border-[#E8D5C4]">
              <p className="text-[10px] text-center text-[#A1887F] leading-relaxed">
                Giriş yaparak kullanım koşullarını ve gizlilik politikasını kabul etmiş olursunuz.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[#A1887F] text-[10px] mt-8 font-medium tracking-widest uppercase">
          © 2026 BİTİG AI • Bulut Veri Güvencesi
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
                      Bulut Veri Güvencesi
                    </p>
                    <p className="text-sm">
                      Bu uygulama, verilerinizi Firebase altyapısı kullanarak güvenli bir şekilde bulutta saklar. 
                      Verileriniz sadece sizin tarafınızdan erişilebilir durumdadır.
                    </p>
                  </div>

                  <p className="text-sm">
                    Verileriniz Google altyapısı üzerinde şifrelenmiş olarak saklanır. Google hesabınızla giriş yaparak verilerinize her yerden erişebilirsiniz.
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


