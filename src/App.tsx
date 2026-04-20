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
  Library,
  ShieldCheck,
  Share2,
  Bot,
  Zap
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
import { HapNotlarModule } from './components/HapNotlarModule';
import { FloatingChat } from './components/FloatingChat';
import { NotificationManager } from './components/NotificationManager';
import { NotificationToast } from './components/NotificationToast';
import { fetchLatestLegislation } from './services/geminiService';
import { ModuleId, UserProfile, CompanyProfile } from './types';
import { MEVZUAT_DATA } from './data/legislationData';
import { auth, loginWithGoogle, logout, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDocs,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

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
  tcNumber: '',
  sgkNumber: '',
  legalStatus: 'Gerçek Kişi',
  ledgerType: 'İşletme Defteri',
  naceCodes: [],
  startDate: '',
  beratPreference: 'Aylık',
  isExporter: false,
  isImporter: false,
  hasWithholdingSales: false,
  hasWithholdingPurchases: false,
  hasRefunds: false,
  emails: ['', '', ''],
  phones: ['', '', ''],
  selectedDeclarations: [],
  productionType: 'Seri Üretim',
  sector: '',
  hrProfile: {
    totalWorkers: 0,
    femaleWorkers: 0,
    maleWorkers: 0,
    personnelGroups: { retired: 0, disabled: 0, foreign: 0, apprentice: 0, management: 0 }
  }
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Firebase Auth Listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsAuthenticated(true);
        
        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            // Initialize profile if it doesn't exist
            const initialProfile: UserProfile = {
              id: firebaseUser.uid,
              fullName: firebaseUser.displayName || 'Kullanıcı',
              username: firebaseUser.email?.split('@')[0] || 'user',
              title: 'Mali Müşavir',
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || ''
            };
            setDoc(userDocRef, initialProfile);
            setUser(initialProfile);
          }
        });

        // Fetch settings (sidebar, active module, etc.)
        const sidebarRef = doc(db, 'users', firebaseUser.uid, 'settings', 'sidebar');
        onSnapshot(sidebarRef, (docSnap) => {
          if (docSnap.exists()) {
            const order = docSnap.data().order as ModuleId[];
            const savedModules = order.map(id => defaultModules.find(m => m.id === id)).filter(Boolean) as typeof defaultModules;
            const missingModules = defaultModules.filter(m => !order.includes(m.id));
            setSidebarModules([...savedModules, ...missingModules]);
          }
        });

        const activeModuleRef = doc(db, 'users', firebaseUser.uid, 'settings', 'activeModule');
        // Removed onSnapshot for activeModule to ensure it always starts at Dashboard

        const selectedCompanyRef = doc(db, 'users', firebaseUser.uid, 'settings', 'selectedCompany');
        onSnapshot(selectedCompanyRef, (docSnap) => {
          if (docSnap.exists()) {
            setSelectedCompanyId(docSnap.data().id);
          }
        });

      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(DEFAULT_COMPANY);

  // Firebase Data Sync & Migration
  // 1. Fetch Companies (Only depends on Auth)
  React.useEffect(() => {
    if (!isAuthenticated || !auth.currentUser) {
      setCompanies([]);
      return;
    }

    const userId = auth.currentUser.uid;
    console.log('Subscribing to companies for user:', userId);
    const companiesRef = collection(db, 'companies');
    const q = query(companiesRef, where('ownerId', '==', userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const companiesData: CompanyProfile[] = [];
      snapshot.forEach((doc) => {
        companiesData.push({ id: doc.id, ...doc.data() } as CompanyProfile);
      });
      // Sort alphabetically by title
      companiesData.sort((a, b) => a.title.localeCompare(b.title, 'tr', { sensitivity: 'base' }));
      
      console.log('Fetched companies from Firestore:', companiesData.length, companiesData.map(c => c.title));
      setCompanies(companiesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'companies');
    });

    // Migration Logic (Run once on auth)
    const migrateData = async () => {
      const saved = localStorage.getItem('companies_data');
      if (saved) {
        try {
          console.log('Found local data, migrating...');
          const localCompanies = JSON.parse(saved) as CompanyProfile[];
          const batch = writeBatch(db);
          
          for (const comp of localCompanies) {
            const newDocRef = doc(collection(db, 'companies'));
            const { id, ...rest } = comp;
            batch.set(newDocRef, { ...rest, ownerId: userId });
          }
          
          await batch.commit();
          localStorage.removeItem('companies_data');
          console.log('Migration successful');
        } catch (error) {
          console.error('Migration failed:', error);
        }
      }
    };

    migrateData();
    return () => unsubscribe();
  }, [isAuthenticated]);

  // 2. Sync Selected Company Profile
  React.useEffect(() => {
    if (companies.length === 0) {
      setCompanyProfile(DEFAULT_COMPANY);
      return;
    }

    if (selectedCompanyId) {
      const found = companies.find(c => c.id === selectedCompanyId);
      if (found) {
        setCompanyProfile(found);
      } else {
        // If selected company not found in list, fall back to first one
        setCompanyProfile(companies[0]);
        if (auth.currentUser) {
          setDoc(doc(db, 'users', auth.currentUser.uid, 'settings', 'selectedCompany'), { id: companies[0].id }, { merge: true });
        }
      }
    } else {
      // No selection, pick first one
      setCompanyProfile(companies[0]);
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid, 'settings', 'selectedCompany'), { id: companies[0].id }, { merge: true });
      }
    }
  }, [companies, selectedCompanyId, isAuthenticated]);

  const handleSetCompanyProfile = async (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'settings', 'selectedCompany'), {
        id: profile.id,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/settings/selectedCompany`);
    }
  };
  const [activeModule, setActiveModule] = useState<ModuleId>(ModuleId.DASHBOARD);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);

  const handleSetActiveModule = async (id: ModuleId) => {
    setActiveModule(id);
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'settings', 'activeModule'), {
        id,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/settings/activeModule`);
    }
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
    if (!isAuthenticated) {
      setNotificationCount(0);
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;

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
        retryCount = 0; // Reset on success
      } catch (error) {
        // Only log if we've exhausted retries or it's not a fetch failure
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchNotificationCount, 2000 * retryCount);
        } else {
          console.error('Notification count fetch error:', error);
        }
      }
    };

    // Initial delay to ensure server is ready
    const initialTimer = setTimeout(() => {
      console.log('Starting initial notification count fetch...');
      fetchNotificationCount();
    }, 3000);
    const interval = setInterval(fetchNotificationCount, 300000); // 5 minutes
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const defaultModules = [
    { id: ModuleId.DASHBOARD, title: 'Panel', icon: LayoutDashboard, desc: 'Genel durum ve akıllı mali takvim özeti.' },
    { id: ModuleId.BEYANNAME, title: 'Beyanname Takibi', icon: FileCheck, desc: 'Tüm firmaların beyanname süreçlerinin matris görünümü ile takibi.' },
    { id: ModuleId.PERSONEL_BORDRO, title: 'Personel & Bordro', icon: Users, desc: 'Maaş hesaplama, SGK maliyeti ve izin takibi.' },
    { id: ModuleId.NAKIT_AKIS, title: 'Finansal Durum', icon: Wallet, desc: 'Mizan analizi, mali tablo analizleri ve KDV İade & GEKSİS analizleri.' },
    { id: ModuleId.CARI_HESAP, title: 'Cari & Tahsilat', icon: TrendingUp, desc: 'Müşteri bakiyeleri, gecikmiş alacaklar ve ödeme girişi.' },
    { id: ModuleId.OCR, title: 'Veri Girişi & OCR', icon: ScanLine, desc: 'Evraklardan otomatik veri çıkarma ve fiş aktarım sistemi.' },
    { id: ModuleId.CONTENT_CREATOR, title: 'İçerik Üretici', icon: Share2, desc: 'Analizlerden sosyal medya ve yönetici özeti oluşturma.' },
    { id: ModuleId.HAP_NOTLAR, title: 'Hap Notlar', icon: Zap, desc: 'Mevzuat ve uygulama süreçlerinde pratik bilgiler.' },
    { id: ModuleId.BELGELER, title: 'Belge & Evrak', icon: FileText, desc: 'Firmalara ait resmi belgelerin takibi ve paylaşımı.' },
    { id: ModuleId.CHAT, title: 'Danışmana Sor', icon: Bot, desc: 'Mevzuat referanslı akıllı danışmanlık asistanı.' },
    { id: ModuleId.MEVZUAT, title: 'Mevzuat Takip', icon: Gavel, desc: 'Mevzuat riskini sıfıra indiren akıllı takip sistemi.' },
    { id: ModuleId.MALIYET_ANALIZI, title: 'Maliyet ve Üretim', icon: Factory, desc: 'Birim maliyet analizi, fire kontrolü ve SMM otomasyonu.' },
    { id: ModuleId.FIRMA_BILGISI, title: 'Firma Bilgileri', icon: Building2, desc: 'Mükellef kimlik kartı ve mali statü yönetimi.' },
    { id: ModuleId.PROFIL, title: 'Profil', icon: User, desc: 'Kullanıcı profil bilgileri ve hesap ayarları.' },
  ];

  const [sidebarModules, setSidebarModules] = useState<typeof defaultModules>(defaultModules);

  const handleReorder = async (newOrder: typeof sidebarModules) => {
    setSidebarModules(newOrder);
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'settings', 'sidebar'), {
        order: newOrder.map(m => m.id),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/settings/sidebar`);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        ...updatedProfile,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}`);
    }
  };

  const handleUpdateCompanyProfile = async (updatedProfile: CompanyProfile) => {
    if (!auth.currentUser) return;
    try {
      const { id, ...rest } = updatedProfile;
      await setDoc(doc(db, 'companies', id), { ...rest, ownerId: auth.currentUser.uid });
      handleSetCompanyProfile(updatedProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `companies/${updatedProfile.id}`);
    }
  };

  const handleAddCompany = async (newCompany: CompanyProfile) => {
    if (!auth.currentUser) return;
    try {
      const newDocRef = doc(collection(db, 'companies'));
      const { id, ...rest } = newCompany;
      const finalCompany = { ...rest, id: newDocRef.id, ownerId: auth.currentUser.uid };
      await setDoc(newDocRef, finalCompany);
      handleSetCompanyProfile(finalCompany as CompanyProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'companies');
    }
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'companies', id));
      
      // Clean up associated data
      localStorage.removeItem(`mizan_data_${id}`);
      
      if (companyProfile && companyProfile.id === id) {
        const updated = companies.filter(c => c.id !== id);
        if (updated.length > 0) {
          handleSetCompanyProfile(updated[0]);
        } else {
          handleSetCompanyProfile(DEFAULT_COMPANY);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `companies/${id}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
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

  if (!isAuthReady) {
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
            <Dashboard user={user} onNavigate={handleSetActiveModule} companies={companies} />
          </div>
        );
      case ModuleId.CHAT:
        return <ChatModule userId={user?.id} companies={companies} />;
      case ModuleId.MEVZUAT:
        return <LegislationModule profile={companyProfile} companies={companies} />;
      case ModuleId.OCR:
        return <OCRModule profile={companyProfile} onTransfer={(data) => {
          setOcrTransferData([data]);
          handleSetActiveModule(ModuleId.FIS_AKTARIM);
        }} />;
      case ModuleId.CONTENT_CREATOR:
        return <ContentCreatorModule user={user} />;
      case ModuleId.HAP_NOTLAR:
        return <HapNotlarModule />;
      case ModuleId.FIS_AKTARIM:
        return <VoucherTransferModule initialData={ocrTransferData || undefined} profile={companyProfile} />;
      case ModuleId.NAKIT_AKIS:
        return <CashFlowModule profile={companyProfile} companies={companies} onSelectCompany={handleSetCompanyProfile} />;
      case ModuleId.MALIYET_ANALIZI:
        return <CostAnalysisModule profile={companyProfile} />;
      case ModuleId.BEYANNAME:
      case ModuleId.CARI_HESAP:
      case ModuleId.PERSONEL_BORDRO:
      case ModuleId.HESAPLAMALAR:
        return <OfficeProductivityModule activeTab={activeModule} companies={companies} profile={companyProfile} />;
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
      <NotificationManager />
      <NotificationToast />
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
          <FloatingChat 
            isOpen={isFloatingChatOpen} 
            onClose={() => setIsFloatingChatOpen(false)} 
            userId={user?.id}
            companies={companies}
          />

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
                scale: 1.1,
                boxShadow: "0 20px 25px -5px rgba(139, 26, 26, 0.3), 0 10px 10px -5px rgba(139, 26, 26, 0.2)"
              }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setIsCopilotHovered(true)}
              onMouseLeave={() => setIsCopilotHovered(false)}
              onClick={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
              className="w-16 h-16 bg-kilim-red text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-kilim-red/90 transition-all border-4 border-white relative group overflow-hidden"
            >
              <motion.div
                animate={{ 
                  rotate: isFloatingChatOpen ? 180 : 0,
                  scale: isFloatingChatOpen ? 0.8 : 1
                }}
              >
                {isFloatingChatOpen ? <X className="w-8 h-8" /> : <Library className="w-9 h-9" />}
              </motion.div>
              {!isFloatingChatOpen && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full border-2 border-kilim-red flex items-center justify-center">
                  <div className="w-2 h-2 bg-kilim-red rounded-full animate-ping" />
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  );
}
