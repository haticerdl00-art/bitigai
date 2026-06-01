export enum ModuleId {
  MEVZUAT = 'mevzuat',
  BEYANNAME = 'beyanname',
  FIS_ONERI = 'fis-oneri',
  E_DONUSUM = 'e-donusum',
  SGK = 'sgk',
  MUSTERI_RISK = 'musteri-risk',
  CHAT = 'chat',
  TAKVIM = 'takvim',
  OCR = 'ocr',
  VERIMLILIK = 'verimlilik',
  DASHBOARD = 'dashboard',
  PROFIL = 'profil',
  FIS_AKTARIM = 'fis-aktarim',
  NAKIT_AKIS = 'nakit-akis',
  MALIYET_ANALIZI = 'maliyet-analizi',
  FIRMA_BILGISI = 'firma-bilgisi',
  HESAPLAMALAR = 'hesaplamalar',
  BELGELER = 'belgeler',
  CARI_HESAP = 'cari-hesap',
  PERSONEL_BORDRO = 'personel-bordro',
  CONTENT_CREATOR = 'content-creator',
  HAP_NOTLAR = 'hap-notlar',
  OFIS_GIDER = 'ofis-gider'
}

export interface Personnel {
  id: string;
  fullName: string;
  role: string;
  idNumber: string; // TC/SGK No
  netSalary: number;
  startDate: string;
  leaveStatus: 'Aktif' | 'İzinli' | 'Ayrıldı';
  group: 'Yönetim' | 'İşçi' | 'Emekli' | 'Engelli' | 'Yabancı' | 'Çırak';
  type?: 'normal' | 'huzur_hakki';
}

export interface CariTransaction {
  id: string;
  companyId: string;
  date: string;
  type: 'Tahsilat' | 'Fatura';
  category: string;
  amount: number;
  desc: string;
  createdAt?: any;
}

export interface CompanyProfile {
  id: string;
  ownerId?: string;
  title: string;
  taxOffice: string;
  taxNumber: string;
  tcNumber?: string;
  sgkNumber: string;
  legalStatus: 'Gerçek Kişi' | 'LTD' | 'AŞ' | 'Kooperatif' | 'Dernek' | 'Vakıf' | 'Diğer';
  ledgerType: 'İşletme Defteri' | 'E-Defter (Bilanço)' | 'Serbest Meslek Makbuzu' | 'Basit Usul';
  naceCodes: string[];
  startDate: string;
  beratPreference: 'Aylık' | 'Geçici (3 Aylık)';
  isExporter: boolean;
  isImporter: boolean;
  hasWithholdingSales: boolean;
  hasWithholdingPurchases: boolean;
  hasRefunds: boolean;
  emails: string[];
  phones: string[];
  selectedDeclarations: string[];
  productionType?: 'Seri Üretim' | 'Sipariş Bazlı';
  sector?: string;
  personnel?: Personnel[];
  hrProfile: {
    totalWorkers: number;
    femaleWorkers: number;
    maleWorkers: number;
    personnelGroups: {
      retired: number;
      disabled: number;
      foreign: number;
      apprentice: number;
      management: number;
    };
  };
}

export interface UserProfile {
  id?: string;
  fullName: string;
  username: string;
  title?: string;
  email: string;
  phone: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
}

export interface Module {
  id: ModuleId;
  title: string;
  icon: string;
  description: string;
}

export interface LegislationUpdate {
  id: string;
  date: string;
  title: string;
  category: string;
  summary: string;
  impact: 'low' | 'medium' | 'high';
}

export interface Customer {
  id: string;
  name: string;
  taxNumber: string;
  riskScore: number;
  financialHealth: number;
}

export interface CompanyDocument {
  id: string;
  companyId: string;
  ownerId: string;
  title: string;
  type: string;
  uploadDate: string;
  fileUrl: string;
  storagePath?: string;
  fileType: 'pdf' | 'jpg' | 'png' | 'docx';
  status: 'Geçerli' | 'Süresi Dolmuş' | 'Güncellenmeli';
  expiryDate?: string;
}

export interface MizanAccount {
  code: string;
  name: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface MizanData {
  companyId: string;
  period: string;
  accounts: MizanAccount[];
  summary: {
    totalCash: number;
    totalBank: number;
    totalReceivables: number;
    totalPayables: number;
    adatRisk131: boolean;
    adatRisk331: boolean;
    highCashRisk: boolean;
  };
}

export interface VergiTakipData {
  id?: string;
  firma_id: string;
  ownerId: string;
  ay: number; // 1-12
  yil: number;
  
  // Mevcut Dönem Borçlar
  kdv2Borc: number;
  kdv1Borc: number;
  muhtasarBorc?: number;
  stopajBorc: number;
  sgkBorc: number;
  kvGvBorc: number; // Geçici Vergi or Kurumlar Vergi
  damgaVergisi?: number;
  duzeltmeBorcu?: number;
  digerBorc: number;
  
  // KDV İade Verileri
  alinabilecekIadeTutarı: number; // Toplam iade hakkı
  oncekiDonemKalanIade: number; // Geçmişten devreden iade
  cariDonemIadeHakki: number; // Bu ay oluşan iade
  kdvIadesi: number; // Eskiden kullanılan alan (uyumluluk için tutulabilir veya alinabilecekIadeTutarı ile eşlenir)
  
  // KDV Bilgileri
  indirilecekKdv: number;
  hesaplananKdv: number;
  ithaldKdv: number;
  devredenKdv: number; // Önceki aydan gelen
  
  // Matrahlar
  satisFaturaMatrahi: number;
  alisTeVkifatliMatrahi: number;
  alisTevsizMatrahi: number;
  
  // Sonraki Dönem Projeksiyonları (Opsiyonel)
  gelecekKdv1?: number;
  gelecekKdv2?: number;
  gelecekMuhtasar?: number;
  gelecekStopaj?: number;
  gelecekGeciciVergi?: number;
  gelecekKurumlarVergisi?: number;
  gelecekSgk?: number;
  gelecekDamga?: number;
  gelecekDuzeltme?: number;
  gelecekDigerBorclar?: number;
  gelecekMuhtemelIade?: number;

  // Ayarlar
  kdvOrani?: number; // Örn: 20
  tevkifatPay?: number; // Örn: 5
  tevkifatPayda?: number; // Örn: 10
  
  // Devredenler (Hesaplanan)
  devredenBorc: number; // Ödenemeyen borç toplamı
  kalanIadeTutari?: number; // Mahsuptan sonra kalan iade

  created_at?: any;
  updated_at?: any;
}
