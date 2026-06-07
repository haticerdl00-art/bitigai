import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  MapPin, 
  BookOpen, 
  TrendingUp, 
  Search, 
  Flame, 
  ChevronRight, 
  Layers,
  Sparkles,
  Calendar,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewsItem {
  id: string;
  scope: 'dunya' | 'turkiye' | 'kayseri';
  category: 'ekonomi' | 'siyasi' | 'kultur' | 'edebiyat';
  title: string;
  summary: string;
  date: string;
  source: string;
  tag: string;
  impact?: 'pozitif' | 'notr' | 'kritik';
}

const PRESET_NEWS: NewsItem[] = [
  // --- KAYSERİ HABERLERİ ---
  {
    id: 'k-1',
    scope: 'kayseri',
    category: 'ekonomi',
    title: 'Kayseri İhracatta Yeni Rekor Yolunda: Mobilya ve Metal Sanayii Zirvede',
    summary: 'Kayseri Ticaret Odası (KTO) ve Sanayi Odası liderliğinde açıklanan son verilere göre, Kayseri Serbest Bölgesi haziran ayı ihracat rakamlarında geçen yıla göre %12.4 artış kaydedildi. Özellikle SMMM odası üyeleri, ihracat tescil işlemlerinin dijitalleşmesinin süreci hızlandırdığını belirtiyor.',
    date: 'Bugün',
    source: 'KTO Bülteni',
    tag: 'İhracat & Sanayi',
    impact: 'pozitif'
  },
  {
    id: 'k-2',
    scope: 'kayseri',
    category: 'edebiyat',
    title: 'Yaman Dede Kültür ve Edebiyat Dinletileri Talas\'ta Sanatseverlerle Buluştu',
    summary: 'Kayseri\'nin önemli edebi şahsiyetlerinden Yaman Dede (Diyojen) anısına düzenlenen geleneksel şiir ve edebiyat günleri bu yıl tarihi Talas konaklarında gerçekleşti. Genç şairlerin katılım sağladığı gecede klasik Türk edebiyatından seçme gazel yorumları büyük beğeni topladı.',
    date: 'Dün',
    source: 'Kayseri Kültür Md.',
    tag: 'Yaman Dede Şiir Günleri'
  },
  {
    id: 'k-3',
    scope: 'kayseri',
    category: 'siyasi',
    title: 'Kayseri Vergi Dairesi Başkanlığı ile SMMM Odası Arasında İstişare Toplantısı',
    summary: 'Yeni Maliye düzenlemeleri ve tevkifatlı işlemlerin takibi amacıyla Kayseri Adliye ve Vergi Dairesi temsilcileri ile Serbest Muhasebeci Mali Müşavirler bir araya geldi. Toplantıda Kayseri\'deki 5/10 tevkifat muafiyet sınırlarının yerel işletmeler üzerindeki etkileri görüşüldü.',
    date: '2 gün önce',
    source: 'KSMMMO',
    tag: 'Mali İstişare',
    impact: 'kritik'
  },
  {
    id: 'k-4',
    scope: 'kayseri',
    category: 'kultur',
    title: 'Gevher Nesibe Şifahanesi Kültür Sanat Merkezinde "Selçuklu Motifleri" Sergisi',
    summary: 'Dünyanın ilk tıp merkezlerinden biri kabul edilen tarihi Gevher Nesibe Medresesinde Selçuklu tıp tarihi ve mistik el sanatları sergisi ziyarete açıldı. Müze müdürlüğü, Kayseri kültür turizminde bu ay rekor bir ziyaretçi sayısı beklediklerini bildirdi.',
    date: '3 gün önce',
    source: 'Kayseri B.Ş.B.',
    tag: 'Tarih & Sergi'
  },

  // --- TÜRKİYE HABERLERİ ---
  {
    id: 't-1',
    scope: 'turkiye',
    category: 'ekonomi',
    title: 'Enflasyonla Mücadele Kapsamında Yeni Sıkılaştırma ve Vergi Matrahı Kararları',
    summary: 'Resmi Gazete\'de yayımlanan karara göre, yurt dışı kaynaklı bazı finansal enstrümanlardaki vergi stopaj oranları güncellendi. SMMM odaları birliği (TÜRMOB), geçici vergi dönem kazançlarında matrah artırımı uygulamalarının detaylarını içeren bir kılavuz hazırladı.',
    date: 'Bugün',
    source: 'Hazine ve Maliye Bak.',
    tag: 'Hukuk & Vergi',
    impact: 'kritik'
  },
  {
    id: 't-2',
    scope: 'turkiye',
    category: 'siyasi',
    title: 'E-Defter ve Enflasyon Muhasebesi Kanun Teklifi TBMM Komisyonunda',
    summary: 'Dijital dönüşüm çerçevesinde tüm mükellef gruplarının e-Defter kapsamına alınmasını öngören ve enflasyon düzeltmesi vergi takvimlerini yeniden planlayan torba yasa tasarısı meclis alt komisyonunda kabul edildi. Yürürlük tarihi yakından izleniyor.',
    date: 'Dün',
    source: 'TBMM Haberleri',
    tag: 'Torba Yasa',
    impact: 'kritik'
  },
  {
    id: 't-3',
    scope: 'turkiye',
    category: 'edebiyat',
    title: 'Türk Edebiyatında "İkinci Yeni" Esintileri: Yeni Arşiv Belgeleri Gün Işığına Çıktı',
    summary: 'Cemal Süreya ve Sezai Karakoç\'un üniversite yıllarında kaleme aldıkları ve daha önce hiçbir yerde yayımlanmamış mektupları ile el yazması şiir taslakları Milli Kütüphane arşiv uzmanları tarafından dijital ortama aktarılarak edebiyat dünyasına kazandırıldı.',
    date: '4 gün önce',
    source: 'Milli Kütüphane',
    tag: 'Modern Edebiyat'
  },
  {
    id: 't-4',
    scope: 'turkiye',
    category: 'kultur',
    title: 'Göbeklitepe ve Karahantepe "Kültür Yolu Festivalleri" ile Rekor Kırıyor',
    summary: 'Kültür ve Turizm Bakanlığı öncülüğünde sürdürülen Taş Tepeler projesindeki son kazılarda yeni figürlerin bulunmasıyla birlikte biletli ziyaretçi sayısında tarihi zirveye ulaşıldı. Bölgedeki otel doluluk oranları şimdiden %98\'e ulaştı.',
    date: '1 hafta önce',
    source: 'Kültür ve Turizm Bak.',
    tag: 'Arkeoloji'
  },

  // --- DÜNYA HABERLERİ ---
  {
    id: 'd-1',
    scope: 'dunya',
    category: 'ekonomi',
    title: 'FED ve ECB Küresel Enflasyon Karşısında Faiz Politikalarında Ayrışıyor',
    summary: 'Amerika Merkez Bankası (FED) çekirdek enflasyondaki yavaşlama gerekçesiyle faiz indirimlerine yeşil ışık yakarken; Avrupa Merkez Bankası (ECB) doğu Avrupa tedarik zinciri krizleri sebebiyle ihtiyatlı duruşunu koruma ve sıkı para politikasına devam kararı aldı.',
    date: 'Bugün',
    source: 'Bloomberg Int.',
    tag: 'Makro Ekonomi',
    impact: 'notr'
  },
  {
    id: 'd-2',
    scope: 'dunya',
    category: 'edebiyat',
    title: 'Dünya Edebiyat Forumu "Dijital Çağda Roman ve Anlatım Sanatı" Temasıyla Toplandı',
    summary: 'Frankfurt Kitap Fuarı öncesi Paris\'te düzenlenen uluslararası delegasyonda, yapay zekanın edebi kurgudaki rolü ve insan yaratıcılığının telif sınırları tartışıldı. Nobel edebiyat jürisi üyeleri yaratıcı yazarlıkta özgün ruhun makinelerle taklit edilemeyeceğini vurguladı.',
    date: '3 gün önce',
    source: 'UNESCO Edebiyat',
    tag: 'Dijital Edebiyat Forumu'
  },
  {
    id: 'd-3',
    scope: 'dunya',
    category: 'siyasi',
    title: 'BM Küresel Karbon Vergisi ve Yeşil Sınır Mutabakatı Taslağını Onayladı',
    summary: 'Birleşmiş Milletler çevre komisyonu, sınırda karbon düzenleme mekanizmasının (SKDM) küresel ticaret ortakları arasında zorunlu vergi beyanlarıyla entegre edilmesini öngören yeni yasayı onayladı. Sektör temsilcileri bu verginin gelişmekte olan sanayilere getireceği yükleri tartışıyor.',
    date: '5 gün önce',
    source: 'Reuters Financial',
    tag: 'Yeşil Dönüşüm',
    impact: 'kritik'
  },
  {
    id: 'd-4',
    scope: 'dunya',
    category: 'kultur',
    title: 'Venedik Sanat Bienali 2026 "Sınırların Ötesindeki Kültürler" Temasıyla Kapılarını Açtı',
    summary: '80\'den fazla ülkenin pavyonuyla katıldığı dünyanın en prestijli çağdaş sanat etkinliği kapılarını açtı. Türkiye pavyonundaki enstalasyon, geleneksel el dokuması kilimlerin akustik mimari tasarımlarla birleşimini sergileyerek ilk günden tam not aldı.',
    date: '1 hafta önce',
    source: 'Vogue Art',
    tag: 'Çağdaş Sanat'
  }
];

export const NewsModule = () => {
  const [selectedScope, setSelectedScope] = useState<'all' | 'dunya' | 'turkiye' | 'kayseri'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ekonomi' | 'siyasi' | 'kultur' | 'edebiyat'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNews = useMemo(() => {
    return PRESET_NEWS.filter(item => {
      const matchesScope = selectedScope === 'all' || item.scope === selectedScope;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchLower) ||
        item.summary.toLowerCase().includes(searchLower) ||
        item.tag.toLowerCase().includes(searchLower) ||
        item.source.toLowerCase().includes(searchLower);

      return matchesScope && matchesCategory && matchesSearch;
    });
  }, [selectedScope, selectedCategory, searchQuery]);

  const scopeTabs: { id: 'all' | 'dunya' | 'turkiye' | 'kayseri'; label: string; icon: any }[] = [
    { id: 'all', label: 'TÜMÜ', icon: Layers },
    { id: 'dunya', label: 'DÜNYA', icon: Globe },
    { id: 'turkiye', label: 'TÜRKİYE', icon: Flame },
    { id: 'kayseri', label: 'KAYSERİ (YEREL)', icon: MapPin },
  ];

  const categoryFilters: { id: 'all' | 'ekonomi' | 'siyasi' | 'kultur' | 'edebiyat'; label: string; icon: any }[] = [
    { id: 'all', label: 'Tüm Konular', icon: Layers },
    { id: 'ekonomi', label: 'Ekonomi', icon: TrendingUp },
    { id: 'siyasi', label: 'Siyasi', icon: Building2 },
    { id: 'kultur', label: 'Kültür & Turizm', icon: Sparkles },
    { id: 'edebiyat', label: 'Edebiyat', icon: BookOpen },
  ];

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'pozitif':
        return <span className="text-[9px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">POZİTİF GELİŞME</span>;
      case 'kritik':
        return <span className="text-[9px] font-black tracking-widest uppercase bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">KRİTİK GELİŞME</span>;
      default:
        return <span className="text-[9px] font-black tracking-widest uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">GÜNDEM NOTU</span>;
    }
  };

  const scopeLabel = (scope: string) => {
    switch (scope) {
      case 'dunya': return 'DÜNYA';
      case 'turkiye': return 'TÜRKİYE';
      case 'kayseri': return 'KAYSERİ (LOKAL)';
      default: return 'GÜNDEM';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 space-y-6">
      {/* Header with Location Branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <h3 className="font-extrabold text-slate-950 text-base uppercase tracking-tight">Gündem Özet Haberleri</h3>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Dünya, Türkiye ve Kayseri yerel ağından süzülmüş ekonomi, siyaset, edebiyat ve kültür derlemeleri.
          </p>
        </div>

        {/* Location Indicator Banner */}
        <div className="px-4 py-2 bg-gradient-to-r from-kilim-blue/5 to-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600 animate-bounce" />
          <div className="text-left">
            <p className="text-[9px] font-semibold text-slate-400 uppercase leading-none">Aktif Konum</p>
            <p className="text-xs font-extrabold text-[#1e3a8a] leading-tight">Kayseri, Türkiye</p>
          </div>
        </div>
      </div>

      {/* Scope Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {scopeTabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = selectedScope === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedScope(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
                isActive 
                  ? 'bg-[#1e3a8a] text-white shadow-md shadow-[#1e3a8a]/10 hover:bg-[#1e3a8a]/95' 
                  : 'bg-slate-50 border border-slate-200/60 text-slate-600 hover:border-slate-300'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Category Horizontal Filter Grid */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 border border-slate-200/50 rounded-xl overflow-x-auto">
          {categoryFilters.map((cat) => {
            const CatIcon = cat.icon;
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isCatActive 
                    ? 'bg-white text-[#1e3a8a] shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <CatIcon className="w-3 h-3 text-slate-400" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
        <div className="relative flex-1 md:max-w-xs">
          <input
            type="text"
            placeholder="Haber başlığı veya fihrist ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-kilim-blue/50"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* News Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredNews.length > 0 ? (
            filteredNews.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="group border border-slate-100 hover:border-kilim-blue/20 bg-slate-50/10 hover:bg-white rounded-2xl p-5 hover:shadow-md hover:shadow-slate-100 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                        news.scope === 'kayseri' ? 'bg-amber-100 text-amber-800' :
                        news.scope === 'turkiye' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-blue-50 text-blue-800 border border-blue-100'
                      }`}>
                        {scopeLabel(news.scope)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">•</span>
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {news.category}
                      </span>
                    </div>

                    {getImpactBadge(news.impact || 'notr')}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-amber-700 leading-snug transition-colors">
                      {news.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                      {news.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 font-bold">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      {news.date}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500 font-extrabold uppercase">{news.source}</span>
                  </div>
                  
                  <span className="text-[10px] font-black text-amber-700 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    {news.tag}
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Uyuşan Haber Bulunamadı</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Lütfen arama kelimenizi veya filtre tercihlerinizi değiştirerek tekrar deneyin.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Micro Poetry accent / Edebiyat Köşesi */}
      <div className="bg-[#1e3a8a]/5 border border-slate-200/40 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
          <div className="text-left space-y-0.5">
            <h5 className="text-xs font-black text-[#1e3a8a]">Edebiyat Köşesi — Kayseri Yaman Dede</h5>
            <p className="text-xs italic text-slate-600 leading-relaxed font-serif">
              "Susuz kalsam yansam da rûyâda, sana doymak imkânsız bu dünyâda..." 
            </p>
          </div>
        </div>
        <div className="text-[10px] font-black text-amber-900 bg-amber-100/60 px-3 py-1 rounded-xl whitespace-nowrap">
          Şiir & Kültür Mirası
        </div>
      </div>
    </div>
  );
};
