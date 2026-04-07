import React, { useState } from 'react';
import { 
  Zap, 
  Car, 
  Store, 
  FileCheck, 
  FileText, 
  Users, 
  TrendingUp, 
  Clock, 
  Search,
  ChevronRight,
  Info,
  AlertCircle,
  Calendar,
  CreditCard,
  Briefcase,
  Heart,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NoteItem {
  id: string;
  title: string;
  category: string;
  icon: any;
  content: React.ReactNode;
  tags: string[];
}

const HAP_NOTLAR_DATA: NoteItem[] = [
  {
    id: 'binek-oto',
    title: 'Binek Otomobil Gider Kısıtlaması (2026)',
    category: 'Vergi',
    icon: Car,
    tags: ['otomobil', 'gider', 'kkeg', 'amortisman'],
    content: (
      <div className="space-y-4">
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
          <p className="text-sm text-amber-800 font-medium">
            Binek otomobillere ilişkin giderlerin en fazla %70'i indirilebilir, %30'u KKEG olarak dikkate alınır.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Kiralama Sınırı (2026)</h4>
            <p className="text-lg font-bold text-kilim-blue">40.000 TL / Ay</p>
            <p className="text-[10px] text-slate-400">KDV Hariç aylık kira bedeli üst sınırı.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">ÖTV/KDV İndirim Sınırı</h4>
            <p className="text-lg font-bold text-kilim-blue">1.100.000 TL</p>
            <p className="text-[10px] text-slate-400">Gider yazılabilecek toplam vergi sınırı.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Amortisman Sınırı (ÖTV/KDV Hariç)</h4>
            <p className="text-lg font-bold text-kilim-blue">1.300.000 TL</p>
            <p className="text-[10px] text-slate-400">Amortismana esas bedel üst sınırı.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Amortisman Sınırı (Vergiler Dahil)</h4>
            <p className="text-lg font-bold text-kilim-blue">2.500.000 TL</p>
            <p className="text-[10px] text-slate-400">Vergilerin maliyete eklendiği durumdaki sınır.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'basit-usul-2026',
    title: 'Basit Usulden Gerçek Usule Geçiş (2026)',
    category: 'Mevzuat',
    icon: Store,
    tags: ['basit usul', 'gerçek usul', '10380', 'cumhurbaşkanı kararı'],
    content: (
      <div className="space-y-4">
        <div className="bg-rose-50 border-l-4 border-rose-400 p-4 rounded-r-lg">
          <p className="text-sm text-rose-800 font-bold">
            01.01.2026 tarihinden itibaren aşağıdaki mükellefler artık BASİT USULDE vergilendirilemeyecek!
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-slate-700">Kapsam:</h4>
          <p className="text-xs text-slate-600 italic">Büyükşehirlerde (nüfusu 30.000'in üstünde olan ilçelerde) faaliyet gösterenler:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Her türlü emtia imalatı',
              'Her türlü emtia alım-satımı',
              'İnşaat ile ilgili her türlü işler',
              'Motorlu taşıtların bakım ve onarımı',
              'Lokanta ve benzeri hizmet işletmeleri',
              'Şehir içi yolcu taşımacılığı'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 font-medium">Referans: Cumhurbaşkanı Kararı No: 10380</p>
      </div>
    )
  },
  {
    id: 'vuk-sinirlar-2026',
    title: 'VUK Önemli Sınırlar (2026)',
    category: 'Vergi',
    icon: Zap,
    tags: ['fatura', 'fiş', 'demirbaş', 'nakit', 'tevkifat'],
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Fiş Kesme Sınırı</h4>
            <p className="text-lg font-bold text-kilim-blue">15.000 TL</p>
            <p className="text-[10px] text-slate-400">Bu tutarı aşan satışlarda fatura zorunludur.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Demirbaş Sınırı</h4>
            <p className="text-lg font-bold text-kilim-blue">15.000 TL</p>
            <p className="text-[10px] text-slate-400">Doğrudan gider yazılabilecek amortisman sınırı.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Nakit Tahsilat Sınırı</h4>
            <p className="text-lg font-bold text-kilim-blue">15.000 TL</p>
            <p className="text-[10px] text-slate-400">Banka/Aracı kurum zorunluluğu sınırı.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Tevkifat Sınırı</h4>
            <p className="text-lg font-bold text-kilim-blue">5.000 TL</p>
            <p className="text-[10px] text-slate-400">KDV Tevkifatı uygulanacak fatura alt sınırı.</p>
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-blue-800 uppercase">Fatura Düzenleme Süresi</h4>
          </div>
          <p className="text-sm text-blue-900">
            Malın teslimi veya hizmetin yapıldığı tarihten itibaren <b>7 GÜN</b> içinde düzenlenmelidir.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'e-fatura-2026',
    title: 'E-Dönüşüm Zorunlulukları (2026)',
    category: 'E-Dönüşüm',
    icon: FileCheck,
    tags: ['e-fatura', 'e-arşiv', 'e-defter', '2026'],
    content: (
      <div className="space-y-4">
        <div className="bg-kilim-blue-pale border-l-4 border-kilim-blue p-4 rounded-r-lg">
          <p className="text-sm text-kilim-blue-dark font-bold">
            01.01.2026 itibariyle tüm faturalar TUTAR SINIRI OLMAKSIZIN E-Arşiv/E-Fatura olarak düzenlenmek zorundadır.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase">E-Defter Geçiş Şartları (2026):</h4>
          <ul className="text-xs text-slate-700 space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-kilim-blue rounded-full" />
              <span>2025 yılı brüt satış hasılatı <b>3 Milyon TL</b> ve üzeri olanlar.</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-kilim-blue rounded-full" />
              <span>E-Ticaret faaliyeti yürütenlerden 2025 cirosu <b>500 Bin TL</b> ve üzeri olanlar.</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-kilim-blue rounded-full" />
              <span>Bağımsız denetime tabi olan şirketler (Ciroya bakılmaksızın).</span>
            </li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'asgari-ucret-2026',
    title: 'Asgari Ücret Parametreleri (2026)',
    category: 'SGK',
    icon: CreditCard,
    tags: ['asgari ücret', 'maaş', 'maliyet', 'bordro'],
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
            <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Brüt Ücret</p>
            <p className="text-xl font-black text-emerald-700">33.030,00 TL</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
            <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Net Ücret</p>
            <p className="text-xl font-black text-blue-700">28.075,50 TL</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
            <p className="text-[10px] text-rose-600 font-bold uppercase mb-1">İşveren Maliyeti</p>
            <p className="text-xl font-black text-rose-700">40.214,03 TL</p>
            <p className="text-[8px] text-rose-400 font-medium">(%2 Teşvikli)</p>
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">SGK Tavan/Taban</h4>
          <div className="flex justify-between text-xs py-1 border-b border-slate-100">
            <span className="text-slate-600">Günlük Taban</span>
            <span className="font-bold">1.101,00 TL</span>
          </div>
          <div className="flex justify-between text-xs py-1">
            <span className="text-slate-600">Günlük Tavan</span>
            <span className="font-bold">8.257,50 TL</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'genc-girisimci',
    title: 'Genç Girişimci İstisnası',
    category: 'Vergi',
    icon: TrendingUp,
    tags: ['genç girişimci', 'istisna', 'bağkur', 'vergi muafiyeti'],
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-700 uppercase mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Vergi İstisnası
            </h4>
            <p className="text-sm text-indigo-900">
              <b>3 yıl</b> boyunca yıllık <b>150.000 TL</b>'ye kadar olan kazançlar gelir vergisinden muaftır.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <h4 className="text-xs font-bold text-purple-700 uppercase mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Bağ-Kur Desteği
            </h4>
            <p className="text-sm text-purple-900">
              İşe başlanılan tarihten itibaren <b>1 yıl</b> boyunca sigorta primleri Hazine tarafından ödenir.
            </p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Şartlar:</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</div>
              <span><b>18-29 yaş</b> aralığında olmak (30 yaşından gün almamış).</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</div>
              <span>İlk defa vergi mükellefi olmak.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</div>
              <span>Kendi işinde bilfiil çalışmak veya sevk ve idare etmek.</span>
            </li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'mazeret-izinleri',
    title: 'İşçi Mazeret İzinleri (4857 SK)',
    category: 'SGK',
    icon: Heart,
    tags: ['izin', 'mazeret', 'evlilik', 'doğum', 'ölüm'],
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Evlilik İzni', days: '3 Gün', color: 'bg-pink-50 text-pink-700' },
            { label: 'Ölüm İzni', days: '3 Gün', color: 'bg-slate-100 text-slate-700' },
            { label: 'Babalık İzni', days: '5 Gün', color: 'bg-blue-50 text-blue-700' },
            { label: 'Evlat Edinme', days: '3 Gün', color: 'bg-emerald-50 text-emerald-700' }
          ].map((item, i) => (
            <div key={i} className={`p-3 rounded-xl text-center ${item.color}`}>
              <p className="text-[10px] font-bold uppercase mb-1">{item.label}</p>
              <p className="text-lg font-black">{item.days}</p>
            </div>
          ))}
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-amber-800 uppercase">Engelli Çocuk Tedavi İzni</h4>
          </div>
          <p className="text-xs text-amber-900">
            En az %70 oranında engelli veya süreğen hastalığı olan çocuğun tedavisi için ebeveynlerden birine <b>yılda 10 güne kadar</b> ücretli izin verilir.
          </p>
        </div>
        <p className="text-[10px] text-slate-400 italic">Mazeret izinleri yıllık izin süresinden düşülemez ve ertelenemez.</p>
      </div>
    )
  },
  {
    id: 'ortulu-sermaye',
    title: 'Örtülü Sermaye Riski',
    category: 'Vergi',
    icon: AlertCircle,
    tags: ['örtülü sermaye', 'borç', 'öz sermaye', 'kkeg'],
    content: (
      <div className="space-y-4">
        <div className="p-4 bg-slate-900 text-white rounded-2xl text-center">
          <p className="text-xs text-slate-400 mb-2">Formül:</p>
          <p className="text-lg font-mono">Ortak Borcu {'>'} (Öz Sermaye x 3)</p>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-700">Sonuçları:</h4>
          <div className="space-y-2">
            <div className="flex gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
              <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-900">KKEG Sayılır</p>
                <p className="text-[10px] text-rose-700">Aşan kısma isabet eden faiz, kur farkı vb. giderler indirilemez.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">%15 Stopaj</p>
                <p className="text-[10px] text-amber-700">Örtülü kazanç dağıtımı sayılır ve stopaj uygulanır.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'e-defter-berat',
    title: 'E-Defter Berat Yükleme Süreleri',
    category: 'E-Dönüşüm',
    icon: Clock,
    tags: ['e-defter', 'berat', 'süre', 'takvim'],
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Aylık Tercih
            </h4>
            <p className="text-xs text-slate-700">
              İlgili ayı takip eden <b>3. ayın son gününe</b> kadar.
            </p>
            <p className="text-[10px] text-slate-400 mt-2 italic">Örn: Ocak ayı beratı 30 Nisan'a kadar.</p>
          </div>
          <div className="p-4 bg-kilim-blue-pale rounded-2xl border border-kilim-blue/10">
            <h4 className="text-xs font-bold text-kilim-blue uppercase mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Geçici Vergi Bazlı
            </h4>
            <div className="space-y-1 text-xs text-kilim-blue-dark">
              <p>• 1. Dönem: 31 Mayıs</p>
              <p>• 2. Dönem: 31 Ağustos</p>
              <p>• 3. Dönem: 30 Kasım</p>
              <p>• 4. Dönem: Gelir/Kurumlar Beyan Ayı Sonu</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'yevmiye-kayitlari',
    title: 'Kritik Yevmiye Kayıt Örnekleri',
    category: 'Muhasebe',
    icon: FileText,
    tags: ['yevmiye', 'kayıt', 'amortisman', 'reeskont', 'sermaye'],
    content: (
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Amortisman Kaydı</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              770 GENEL YÖNETİM GİDERLERİ      (B)<br />
              257 BİRİKMİŞ AMORTİSMANLAR (-)   (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Reeskont Kaydı (Alacak Senetleri)</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              657 REESKONT FAİZ GİDERLERİ      (B)<br />
              122 ALACAK SENETLERİ REESKONTU   (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Sermaye Taahhüt Kaydı</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              501 ÖDENMEMİŞ SERMAYE (-)        (B)<br />
              500 SERMAYE                      (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Leasing Kaydı (Haklar)</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              260 HAKLAR (Finansal Kiralama)   (B)<br />
              301 FİN. KİRALAMA İŞL. BORÇLAR   (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Kur Farkı Geliri Kaydı</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              102 BANKALAR                     (B)<br />
              646 KAMBİYO KARLARI              (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Sermaye Ödemesi Kaydı</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              500 SERMAYE                      (B)<br />
              501 ÖDENMEMİŞ SERMAYE (-)        (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Vergi Ödemesi Kaydı (KDV)</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              360 ÖDENECEK VERGİ VE FONLAR     (B)<br />
              102 BANKALAR                     (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Uzun Vadeli Kredi Kaydı</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              102 BANKALAR                     (B)<br />
              400 B.V. BANKA KREDİLERİ         (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Menkul Kıymet Alım Kaydı</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              111 ÖZEL KESİM TAHVİL SENET VB   (B)<br />
              102 BANKALAR                     (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Sigorta Gider Mahsubu</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              770 GENEL YÖNETİM GİDERLERİ      (B)<br />
              180 GELECEK AYLARA AİT GİDERLER  (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Olağandışı Kar Kaydı</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              102 BANKALAR                     (B)<br />
              679 DİĞER OLAĞANDIŞI GELİR VE KAR(A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Sermaye Artırımı Kaydı</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              501 ÖDENMEMİŞ SERMAYE            (B)<br />
              500 SERMAYE                      (A)
            </pre>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Menkul Kıymet Satış Zararı</h4>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg">
              102 BANKALAR                     (B)<br />
              655 MENKUL KIYMET SATIŞ ZARARI   (B)<br />
              111 ÖZEL KESİM TAHVİL SENET VB   (A)
            </pre>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'sosyal-guvenlik-2026',
    title: 'Sosyal Güvenlik & Emeklilik (2026)',
    category: 'SGK',
    icon: ShieldCheck,
    tags: ['emeklilik', 'bağkur', 'işsizlik', 'prim'],
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2">Bağ-Kur Primleri (2026)</h4>
            <p className="text-sm font-bold text-emerald-900">11.560,50 TL / Ay</p>
            <p className="text-[10px] text-emerald-600">Düzenli ödeme indirimi (%5) dahil.</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">İşsizlik Ödeneği Üst Sınırı</h4>
            <p className="text-sm font-bold text-blue-900">16.000,00 TL</p>
            <p className="text-[10px] text-blue-600">Brüt asgari ücretin %80'ini geçemez.</p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Emeklilik Şartları (Genel):</h4>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-kilim-blue rounded-full" />
              <span>8 Eylül 1999 öncesi girişliler için <b>EYT</b> kapsamında yaş şartı aranmaz.</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-kilim-blue rounded-full" />
              <span>1999-2008 arası girişliler: Kadın 58, Erkek 60 yaş ve 7000 gün.</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-kilim-blue rounded-full" />
              <span>2008 sonrası girişliler: 7200 gün ve 65 yaşa kadar kademeli artış.</span>
            </li>
          </ul>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <h4 className="text-xs font-bold text-amber-700 uppercase mb-3">İşsizlik Maaşı Şartları:</h4>
          <ul className="space-y-2 text-xs text-amber-900">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1" />
              <span>Kendi istek ve kusuru dışında işsiz kalmak.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1" />
              <span>Hizmet akdinin sona ermesinden önceki son 120 gün hizmet akdine tabi olmak.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1" />
              <span>Son 3 yıl içinde en az 600 gün işsizlik sigortası primi ödemiş olmak.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1" />
              <span>İşten ayrıldıktan sonraki 30 gün içinde İŞKUR'a başvurmak.</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }
];

export const HapNotlarModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = Array.from(new Set(HAP_NOTLAR_DATA.map(item => item.category)));

  const filteredData = HAP_NOTLAR_DATA.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-kilim-red/10 text-kilim-red rounded-full text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3 h-3" />
            Hızlı Erişim
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Hap Notlar
          </h1>
          <p className="text-slate-500 max-w-xl">
            Mevzuat ve uygulama süreçlerinde en çok ihtiyaç duyulan pratik bilgiler, güncel sınırlar ve hatırlatıcılar.
          </p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-kilim-blue transition-colors" />
          <input
            type="text"
            placeholder="Notlarda ara (örn: otomobil, ciro...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-kilim-blue/10 focus:border-kilim-blue outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            !selectedCategory 
              ? 'bg-kilim-blue text-white shadow-lg shadow-kilim-blue/20' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Tümü
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-kilim-blue text-white shadow-lg shadow-kilim-blue/20' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredData.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                expandedId === item.id 
                  ? 'border-kilim-blue ring-4 ring-kilim-blue/5 shadow-2xl' 
                  : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
              }`}
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      expandedId === item.id ? 'bg-kilim-blue text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-kilim-blue uppercase tracking-widest mb-1 block">
                        {item.category}
                      </span>
                      <h3 className="text-xl font-black text-slate-800 leading-tight">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
                    expandedId === item.id ? 'rotate-90 bg-kilim-blue/10 text-kilim-blue' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-medium rounded-md">
                      #{tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-[10px] text-slate-300 font-medium">+{item.tags.length - 3}</span>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-slate-100"
                  >
                    <div className="p-6 bg-slate-50/50">
                      {item.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Sonuç Bulunamadı</h3>
          <p className="text-slate-500">Arama kriterlerinize uygun hap not bulunmuyor.</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}
            className="text-kilim-blue font-bold hover:underline"
          >
            Tüm notları göster
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Info className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Bilgi Güncelliği</h3>
            <p className="text-slate-400 text-sm max-w-md">
              Hap notlar genel bilgilendirme amaçlıdır. Uygulama öncesi güncel mevzuat ve özelgelerin kontrol edilmesi tavsiye edilir.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Son Güncelleme</p>
            <p className="text-sm font-bold">Nisan 2026</p>
          </div>
          <div className="w-px h-10 bg-white/10 hidden sm:block" />
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-bold">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
