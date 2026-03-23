/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Gavel, 
  FileCheck, 
  Receipt, 
  RefreshCw, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Calendar, 
  ScanLine, 
  BarChart3,
  Wallet,
  Building2,
  Factory,
  Menu,
  X,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  FileSpreadsheet,
  Calculator,
  Plus,
  FileText,
  MessageCircle,
  ShieldCheck,
  Share2,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dashboard } from './components/Dashboard';
import { ChatModule } from './components/ChatModule';
import { LegislationModule } from './components/LegislationModule';
import { CustomerRiskModule } from './components/CustomerRiskModule';
import { VoucherTransferModule } from './components/VoucherTransferModule';
import { SGKModule } from './components/SGKModule';
import { CalendarModule } from './components/CalendarModule';
import { ProductivityModule } from './components/ProductivityModule';
import { Login } from './components/Login';
import { AppLogo } from './components/Logo';
import { ProfileModule } from './components/ProfileModule';
import { CashFlowModule } from './components/CashFlowModule';
import { CompanyInfoModule } from './components/CompanyInfoModule';
import { CostAnalysisModule } from './components/CostAnalysisModule';
import { TasksModule } from './components/TasksModule';
import { OfficeProductivityModule } from './components/OfficeProductivityModule';
import { DocumentsModule } from './components/DocumentsModule';
import { OCRModule } from './components/OCRModule';
import { ContentCreatorModule } from './components/ContentCreatorModule';
import { fetchLatestLegislation } from './services/geminiService';
import { ModuleId, UserProfile, CompanyProfile } from './types';
import { MEVZUAT_DATA } from './data/legislationData';

// Components for each module (simplified for initial structure)
const ModulePlaceholder = ({ title, description }: { title: string, description: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
    <div className="w-20 h-20 bg-kilim-blue-pale rounded-full flex items-center justify-center">
      <LayoutDashboard className="w-10 h-10 text-kilim-blue" />
    </div>
    <h2 className="text-2xl font-bold text-kilim-blue-dark">{title}</h2>
    <p className="text-slate-500 max-w-md">{description}</p>
    <button className="px-6 py-2 bg-kilim-blue text-white rounded-xl hover:bg-kilim-blue-dark transition-colors">
      Modülü Başlat
    </button>
  </div>
);

const LoadingScreen = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] bg-kilim-bg flex flex-col items-center justify-center space-y-6"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        duration: 0.8,
        repeat: Infinity,
        repeatType: "reverse"
      }}
    >
      <AppLogo size="lg" />
    </motion.div>
    <div className="flex flex-col items-center space-y-2">
      <h2 className="text-2xl font-black text-kilim-blue-dark tracking-tighter">BİTİG AI</h2>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-kilim-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-kilim-red rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-kilim-red rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-[10px] text-kilim-blue font-bold uppercase tracking-[0.2em] mt-4">Müşavir Asistanı Hazırlanıyor</p>
    </div>
  </motion.div>
);

const DEFAULT_COMPANY: CompanyProfile = {
  id: '0',
  title: 'Lütfen Firma Ekleyin',
  taxOffice: '',
  taxNumber: '',
  sgkNumber: '',
  legalStatus: 'Gerçek Kişi',
  ledgerType: 'İşletme Defteri',
  naceCode: '',
  startDate: '',
  beratPreference: 'Aylık',
  isExporter: false,
  hasWithholdingSales: false,
  productionType: 'Seri Üretim',
  sector: '',
  hrProfile: {
    totalWorkers: 0,
    femaleWorkers: 0,
    maleWorkers: 0,
    personnelGroups: { retired: 0, disabled: 0, foreign: 0, apprentice: 0 }
  }
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('is_authenticated') === 'true';
  });
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('user_profile_v2');
    return saved ? JSON.parse(saved) : null;
  });
  const [companies, setCompanies] = useState<CompanyProfile[]>(() => {
    const saved = localStorage.getItem('companies_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing companies data:', e);
      }
    }
    return [];
  });
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('selected_company_id');
    if (saved) {
      const found = companies.find(c => c.id === saved);
      if (found) return found;
    }
    return companies[0] || DEFAULT_COMPANY;
  });

  const handleSetCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    localStorage.setItem('selected_company_id', profile.id);
  };
  const [activeModule, setActiveModule] = useState<ModuleId>(ModuleId.DASHBOARD);

  const handleSetActiveModule = (id: ModuleId) => {
    setActiveModule(id);
    localStorage.setItem('active_module_v3', id);
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCopilotHovered, setIsCopilotHovered] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [ocrTransferData, setOcrTransferData] = useState<any[] | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch('/api/notifications/count');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON, got ${contentType}`);
        }
        const data = await response.json();
        setNotificationCount(data.count);
      } catch (error) {
        console.error('Notification count fetch error:', error);
      }
    };
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const defaultModules = [
    { id: ModuleId.DASHBOARD, title: 'Panel', icon: LayoutDashboard, desc: 'Genel durum ve akıllı mali takvim özeti.' },
    { id: ModuleId.BEYANNAME, title: 'Beyanname Takibi', icon: FileCheck, desc: 'Tüm firmaların beyanname süreçlerinin matris görünümü ile takibi.' },
    { id: ModuleId.PERSONEL_BORDRO, title: 'Personel & Bordro', icon: Users, desc: 'Maaş hesaplama, SGK maliyeti ve izin takibi.' },
    { id: ModuleId.NAKIT_AKIS, title: 'Finansal Durum', icon: Wallet, desc: 'Mizan analizi, mali tablo analizleri ve KDV İade & GEKSİS analizleri.' },
    { id: ModuleId.CARI_HESAP, title: 'Cari & Tahsilat', icon: TrendingUp, desc: 'Müşteri bakiyeleri, gecikmiş alacaklar ve ödeme girişi.' },
    { id: ModuleId.MUSTERI_ILETISIM, title: 'Müşteri İletişim', icon: MessageCircle, desc: 'WhatsApp ve E-posta şablonları ile hızlı bildirim.' },
    { id: ModuleId.OCR, title: 'Veri Girişi & OCR', icon: ScanLine, desc: 'Evraklardan otomatik veri çıkarma ve fiş aktarım sistemi.' },
    { id: ModuleId.CONTENT_CREATOR, title: 'İçerik Üretici', icon: Share2, desc: 'Analizlerden sosyal medya ve yönetici özeti oluşturma.' },
    { id: ModuleId.BELGELER, title: 'Belge & Evrak', icon: FileText, desc: 'Firmalara ait resmi belgelerin takibi ve paylaşımı.' },
    { id: ModuleId.CHAT, title: 'Danışmana Sor', icon: Bot, desc: 'Mevzuat referanslı akıllı danışmanlık asistanı.' },
    { id: ModuleId.MEVZUAT, title: 'Mevzuat Takip', icon: Gavel, desc: 'Mevzuat riskini sıfıra indiren akıllı takip sistemi.' },
    { id: ModuleId.MALIYET_ANALIZI, title: 'Maliyet ve Üretim', icon: Factory, desc: 'Birim maliyet analizi, fire kontrolü ve SMM otomasyonu.' },
    { id: ModuleId.FIRMA_BILGISI, title: 'Firma Bilgileri', icon: Building2, desc: 'Mükellef kimlik kartı ve mali statü yönetimi.' },
    { id: ModuleId.PROFIL, title: 'Profil', icon: User, desc: 'Kullanıcı profil bilgileri ve hesap ayarları.' },
  ];

  const [sidebarModules, setSidebarModules] = useState(() => {
    const saved = localStorage.getItem('sidebar_order_v3');
    if (saved) {
      try {
        const order = JSON.parse(saved) as ModuleId[];
        const savedModules = order.map(id => defaultModules.find(m => m.id === id)).filter(Boolean) as typeof defaultModules;
        const missingModules = defaultModules.filter(m => !order.includes(m.id));
        return [...savedModules, ...missingModules];
      } catch (e) {
        return defaultModules;
      }
    }
    return defaultModules;
  });

  const handleReorder = (newOrder: typeof sidebarModules) => {
    setSidebarModules(newOrder);
    localStorage.setItem('sidebar_order_v3', JSON.stringify(newOrder.map(m => m.id)));
  };

  const handleLogin = (name: string, title: string) => {
    setIsAuthenticated(true);
    const profile = {
      fullName: name,
      username: title,
      email: '',
      phone: ''
    };
    setUser(profile);
    localStorage.setItem('is_authenticated', 'true');
    localStorage.setItem('user_profile_v2', JSON.stringify(profile));
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    localStorage.setItem('user_profile_v2', JSON.stringify(updatedProfile));
  };

  const handleUpdateCompanyProfile = (updatedProfile: CompanyProfile) => {
    const newCompanies = companies.map(c => c.id === updatedProfile.id ? updatedProfile : c);
    setCompanies(newCompanies);
    handleSetCompanyProfile(updatedProfile);
    localStorage.setItem('companies_data', JSON.stringify(newCompanies));
  };

  const handleAddCompany = (newCompany: CompanyProfile) => {
    const newCompanies = [...companies, newCompany];
    setCompanies(newCompanies);
    handleSetCompanyProfile(newCompany);
    localStorage.setItem('companies_data', JSON.stringify(newCompanies));
  };

  const handleDeleteCompany = (id: string) => {
    const updated = companies.filter(c => c.id !== id);
    setCompanies(updated);
    localStorage.setItem('companies_data', JSON.stringify(updated));
    
    // Clean up associated data
    localStorage.removeItem(`mizan_data_${id}`);
    
    if (companyProfile && companyProfile.id === id) {
      if (updated.length > 0) {
        handleSetCompanyProfile(updated[0]);
      } else {
        handleSetCompanyProfile(DEFAULT_COMPANY);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('user_profile_v2');
  };

  const handleDeleteAllData = () => {
    if (window.confirm('TÜM VERİLERİNİZ KALICI OLARAK SİLİNECEKTİR. Bu işlem geri alınamaz. Onaylıyor musunuz?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeModule) {
      case ModuleId.DASHBOARD:
        return (
          <div className="space-y-10">
            <Dashboard user={user} onNavigate={handleSetActiveModule} />
          </div>
        );
      case ModuleId.CHAT:
        return <ChatModule companies={companies} />;
      case ModuleId.MEVZUAT:
        return <LegislationModule profile={companyProfile} companies={companies} />;
      case ModuleId.OCR:
        return <OCRModule onTransfer={(data) => {
          setOcrTransferData([data]);
          handleSetActiveModule(ModuleId.FIS_AKTARIM);
        }} />;
      case ModuleId.CONTENT_CREATOR:
        return <ContentCreatorModule />;
      case ModuleId.FIS_AKTARIM:
        return <VoucherTransferModule initialData={ocrTransferData || undefined} />;
      case ModuleId.NAKIT_AKIS:
        return <CashFlowModule profile={companyProfile} />;
      case ModuleId.MALIYET_ANALIZI:
        return <CostAnalysisModule profile={companyProfile} />;
      case ModuleId.BEYANNAME:
      case ModuleId.CARI_HESAP:
      case ModuleId.MUSTERI_ILETISIM:
      case ModuleId.PERSONEL_BORDRO:
      case ModuleId.HESAPLAMALAR:
        return <OfficeProductivityModule activeTab={activeModule} companies={companies} />;
      case ModuleId.FIRMA_BILGISI:
        return (
          <CompanyInfoModule 
            profile={companyProfile} 
            companies={companies}
            onUpdate={handleUpdateCompanyProfile} 
            onAdd={handleAddCompany}
            onSelect={handleSetCompanyProfile}
            onDelete={handleDeleteCompany}
          />
        );
      case ModuleId.BELGELER:
        return <DocumentsModule companies={companies} />;
      case ModuleId.PROFIL:
        return user ? <ProfileModule profile={user} onUpdate={handleUpdateProfile} onDeleteAll={handleDeleteAllData} /> : null;
      default:
        const mod = sidebarModules.find(m => m.id === activeModule);
        return <ModulePlaceholder title={mod?.title || ''} description={mod?.desc || ''} />;
    }
  };

  return (
    <div className="h-screen flex bg-kilim-bg overflow-hidden relative">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-slate-700 text-slate-300 transition-all duration-300 ease-in-out flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        md:relative md:translate-x-0
      `}>
        <div className="h-full flex flex-col relative">
          {/* Collapse Toggle Button (Desktop/Tablet) */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }}
            className="hidden md:flex absolute -right-3 top-12 w-6 h-6 bg-emerald-600 text-white rounded-full items-center justify-center z-50 shadow-lg hover:bg-emerald-500 transition-colors border-2 border-slate-700"
            title={isSidebarCollapsed ? "Genişlet" : "Daralt"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className={`p-6 flex items-center justify-between gap-3 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
            <div className="flex items-center gap-3">
              <AppLogo size="sm" />
              {!isSidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap leading-tight">BİTİG AI</span>
                  <span className="text-[10px] text-kilim-red font-bold uppercase tracking-wider leading-none">Müşavir Asistanı</span>
                </div>
              )}
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-slate-600 rounded-lg text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
            {sidebarModules.map((mod) => (
              <div
                key={mod.id}
                className="relative group"
              >
                <div
                  onClick={() => handleSetActiveModule(mod.id)}
                  title={isSidebarCollapsed ? mod.title : ''}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                    ${isSidebarCollapsed ? 'justify-center px-0' : ''}
                    ${activeModule === mod.id 
                      ? mod.id === ModuleId.CHAT 
                        ? 'bg-kilim-red/20 text-white border border-kilim-red/40 font-bold shadow-lg shadow-kilim-red/10'
                        : 'bg-kilim-blue/20 text-white border border-kilim-blue/40 font-bold shadow-lg shadow-kilim-blue/10' 
                      : 'hover:bg-slate-600 hover:text-white'}
                  `}
                >
                  <mod.icon className={`w-5 h-5 flex-shrink-0 ${activeModule === mod.id ? (mod.id === ModuleId.CHAT ? 'text-kilim-red' : 'text-slate-300') : 'text-slate-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className={`text-sm whitespace-nowrap ${activeModule === mod.id ? 'font-bold' : 'font-medium'}`}>{mod.title}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-600">
            <div 
              onClick={handleLogout}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-600 transition-colors cursor-pointer group ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors flex-shrink-0">
                <User className="w-4 h-4 text-slate-300 group-hover:text-rose-400" />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-slate-500 truncate group-hover:text-rose-400/70 transition-colors">Çıkış Yap</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Mobile Logo/Title */}
            <div className="flex items-center gap-2 md:hidden">
              <AppLogo size="sm" />
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 text-sm tracking-tight truncate max-w-[120px] leading-tight">BİTİG AI</span>
                <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider leading-none">SMMM Platformu</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {/* Header area cleared for a more minimal look */}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>

          {/* Floating Copilot Shortcut */}
          {activeModule !== ModuleId.CHAT && (
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
              <motion.button
                initial={{ y: 100, opacity: 0 }}
                animate={{ 
                  y: [0, -20, 0], 
                  opacity: 1,
                  transition: {
                    y: {
                      delay: 2.5,
                      duration: 0.6,
                      times: [0, 0.5, 1],
                      ease: "easeOut"
                    },
                    opacity: { delay: 2.5, duration: 0.3 }
                  }
                }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(139, 26, 26, 0.2), 0 10px 10px -5px rgba(139, 26, 26, 0.1)"
                }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setIsCopilotHovered(true)}
                onMouseLeave={() => setIsCopilotHovered(false)}
                onClick={() => handleSetActiveModule(ModuleId.CHAT)}
                className="w-14 h-14 bg-kilim-red text-white rounded-full shadow-xl flex items-center justify-center hover:bg-kilim-red/90 transition-all border-4 border-white relative group"
              >
                <Bot className="w-7 h-7" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-kilim-red flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-kilim-red rounded-full animate-ping" />
                </span>
              </motion.button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
