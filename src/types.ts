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
  MUSTERI_ILETISIM = 'musteri-iletisim',
  PERSONEL_BORDRO = 'personel-bordro',
  CONTENT_CREATOR = 'content-creator'
}

export interface Personnel {
  id: string;
  fullName: string;
  role: string;
  idNumber: string; // TC/SGK No
  netSalary: number;
  startDate: string;
  leaveStatus: 'Aktif' | 'İzinli' | 'Ayrıldı';
}

export interface CompanyProfile {
  id: string;
  title: string;
  taxOffice: string;
  taxNumber: string;
  sgkNumber: string;
  legalStatus: 'Gerçek Kişi' | 'LTD' | 'AŞ' | 'Kooperatif' | 'Dernek' | 'Vakıf';
  ledgerType: 'İşletme Defteri' | 'E-Defter (Bilanço)' | 'Serbest Meslek Makbuzu' | 'Basit Usul';
  naceCode: string;
  startDate: string;
  beratPreference: 'Aylık' | 'Geçici (3 Aylık)';
  isExporter: boolean;
  hasWithholdingSales: boolean;
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
    };
  };
}

export interface UserProfile {
  fullName: string;
  username: string;
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
  title: string;
  type: string;
  uploadDate: string;
  fileUrl: string;
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
