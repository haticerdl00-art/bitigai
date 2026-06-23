
export interface CalendarItem {
  id: string;
  date: Date;
  title: string;
  description: string;
  criticalNote: string;
  legalWarning: string;
  type: 'tax' | 'sgk' | 'legal' | 'berat';
  isExtended?: boolean;
  originalDate?: Date;
  extensionReason?: string;
}

const FIXED_HOLIDAYS = [
  { day: 1, month: 0, name: 'Yılbaşı' },
  { day: 23, month: 3, name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  { day: 1, month: 4, name: 'Emek ve Dayanışma Günü' },
  { day: 19, month: 4, name: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı' },
  { day: 15, month: 6, name: 'Demokrasi ve Milli Birlik Günü' },
  { day: 30, month: 7, name: 'Zafer Bayramı' },
  { day: 29, month: 9, name: 'Cumhuriyet Bayramı' },
];

export const isHoliday = (date: Date) => {
  return FIXED_HOLIDAYS.some(h => h.day === date.getDate() && h.month === date.getMonth());
};

export const getAdjustedDate = (date: Date): { date: Date; note?: string } => {
  let adjustedDate = new Date(date);
  let note = '';

  const checkAndAdjust = () => {
    const day = adjustedDate.getDay();
    if (day === 0) { // Sunday
      adjustedDate.setDate(adjustedDate.getDate() + 1);
      note = `Hafta sonu (Pazar) nedeniyle son gün ${adjustedDate.toLocaleDateString('tr-TR')} olarak güncellenmiştir.`;
      return true;
    }
    if (day === 6) { // Saturday
      adjustedDate.setDate(adjustedDate.getDate() + 2);
      note = `Hafta sonu (Cumartesi) nedeniyle son gün ${adjustedDate.toLocaleDateString('tr-TR')} olarak güncellenmiştir.`;
      return true;
    }
    if (isHoliday(adjustedDate)) {
      const holiday = FIXED_HOLIDAYS.find(h => h.day === adjustedDate.getDate() && h.month === adjustedDate.getMonth());
      adjustedDate.setDate(adjustedDate.getDate() + 1);
      note = `Resmi tatil (${holiday?.name}) nedeniyle son gün ${adjustedDate.toLocaleDateString('tr-TR')} olarak güncellenmiştir.`;
      return true;
    }
    return false;
  };

  while (checkAndAdjust()) {
    // Continue checking if the new date is also a holiday or weekend
  }

  return { date: adjustedDate, note: note || undefined };
};

export const getCalendarItems = (currentDate: Date, beratPreference: 'aylik' | 'gecici' = 'aylik'): CalendarItem[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const items: CalendarItem[] = [];

  // ==========================================
  // 1. AYLIK BEYANNAMELER (EVERY MONTH)
  // ==========================================

  // KDV1 Beyannamesi (28th of each month)
  const originalKdv1Raw = new Date(year, month, 28);
  const kdv1Date = getAdjustedDate(originalKdv1Raw);
  const isKdv1Extended = month === 5 && year === 2026; // June 2026 Simulation
  const finalKdv1Date = isKdv1Extended ? new Date(2026, 6, 2) : kdv1Date.date;
  
  items.push({
    id: 'kdv1',
    date: finalKdv1Date,
    title: 'KDV1 Beyannamesi',
    description: 'Katma Değer Vergisi (KDV1) beyannamesinin verilmesi ve ödenmesi.',
    criticalNote: isKdv1Extended 
      ? '⏰ SÜRE UZATILDI: GİB 169 No\'lu Vergi Usul Kanunu Sirküleri ile KDV1 beyan süresi 2 Temmuz akşamına kadar uzatılmıştır.' 
      : (kdv1Date.note || 'Her ayın 28. günü akşamına kadardır.'),
    legalWarning: 'Süresinde beyan edilmeyen KDV tutarları için vergi ziyaı cezası uygulanabilir.',
    type: 'tax',
    isExtended: isKdv1Extended,
    originalDate: isKdv1Extended ? kdv1Date.date : undefined,
    extensionReason: isKdv1Extended ? 'GİB Yoğunluk ve Entegrasyon Güncellemesi Duyurusu' : undefined
  });

  // KDV2 Beyannamesi (25th of each month)
  const kdv2Date = getAdjustedDate(new Date(year, month, 25));
  items.push({
    id: 'kdv2',
    date: kdv2Date.date,
    title: 'KDV2 Beyannamesi',
    description: 'Tam ve kısmi tevkifat uygulanan işlemler için KDV2 beyannamesinin verilmesi ve ödenmesi.',
    criticalNote: kdv2Date.note || 'Her ayın 25. günü akşamına kadardır.',
    legalWarning: 'Sorumlu sıfatıyla beyan edilen KDV2 ödenmeden KDV1 indirim konusu yapılamaz.',
    type: 'tax'
  });

  // MUHSGK Beyannamesi (26th of each month)
  const originalMuhsgkRaw = new Date(year, month, 26);
  const muhsgkDate = getAdjustedDate(originalMuhsgkRaw);
  const isMuhsgkExtended = month === 5 && year === 2026; // June 2026 Simulation
  const finalMuhsgkDate = isMuhsgkExtended ? new Date(2026, 5, 30) : muhsgkDate.date;

  items.push({
    id: 'muhsgk',
    date: finalMuhsgkDate,
    title: 'MUHSGK Beyannamesi',
    description: 'Muhtasar ve Prim Hizmet Beyannamesinin verilmesi ve ödenmesi.',
    criticalNote: isMuhsgkExtended 
      ? '⏰ SÜRE UZATILDI: GİB Sirküleri uyarınca MUHSGK beyan ve ödeme süresi 30 Haziran akşamına kadar uzatılmıştır.' 
      : (muhsgkDate.note || 'Her ayın 26. günü akşamına kadardır.'),
    legalWarning: 'SGK sigortalı hizmet bilgileri ile muhtasar vergi kesintileri tek beyannamede toplanır.',
    type: 'tax',
    isExtended: isMuhsgkExtended,
    originalDate: isMuhsgkExtended ? muhsgkDate.date : undefined,
    extensionReason: isMuhsgkExtended ? 'GİB 168 No\'lu VUK Sirküleri ile Süre Uzatımı Kararı' : undefined
  });

  // Damga Vergisi Beyannamesi (26th of each month)
  const damgaDate = getAdjustedDate(new Date(year, month, 26));
  items.push({
    id: 'damga-vergisi',
    date: damgaDate.date,
    title: 'Damga Vergisi Beyannamesi',
    description: 'Sürekli damga vergisi mükellefiyeti bulunanlar için beyanname verilmesi ve ödenmesi.',
    criticalNote: damgaDate.note || 'Her ayın 26. günü akşamına kadardır.',
    legalWarning: 'Sözleşme, karar ve kağıtlara ait damga vergilerinin takibi ve süresinde beyanı zorunludur.',
    type: 'tax'
  });

  // Turizm Payı Beyannamesi - TGA (26th of each month)
  const tgaDate = getAdjustedDate(new Date(year, month, 26));
  items.push({
    id: 'tga-beyannamesi',
    date: tgaDate.date,
    title: 'Turizm Payı Beyannamesi (TGA)',
    description: 'Turizm beyannamesinin (TGA) elektronik ortamda beyan edilmesi ve ödenmesi.',
    criticalNote: tgaDate.note || 'Her ayın 26. günü akşamına kadardır.',
    legalWarning: 'Turizm payı mükellefiyeti olan konaklama, yeme-içme ve seyahat acentelerinin beyanı zorunluluktur.',
    type: 'tax'
  });

  // TÜİK Anket Bildirimi (25th of each month)
  const tuikDate = getAdjustedDate(new Date(year, month, 25));
  items.push({
    id: 'tuik-anket',
    date: tuikDate.date,
    title: 'TÜİK Anket & Bildirim Süresi',
    description: 'TÜİK veya bakanlık anket formlarının elektronik ortamda doldurulması.',
    criticalNote: tuikDate.note || 'Her ayın 25. günü akşamına kadardır.',
    legalWarning: 'İstatistik Kanunu uyarınca doğru bilgi verilmesi ve sürelere uyulması yasal bir zorunluluktur.',
    type: 'legal'
  });

  // SGK Prim Ödemesi (Last day of each month)
  const sgkDate = getAdjustedDate(new Date(year, month + 1, 0));
  items.push({
    id: 'sgk-prim',
    date: sgkDate.date,
    title: 'SGK Prim Ödemesi & Bildirimi',
    description: 'Cari aya ait SGK primlerinin ve Bağ-Kur borçlarının ödenmesi.',
    criticalNote: sgkDate.note || 'Ayın son iş günüdür.',
    legalWarning: 'Primlerin süresinde ödenmemesi durumunda gecikme zammı uygulanır ve güncel teşvikler kaybedilir.',
    type: 'sgk'
  });

  // Form Ba-Bs Bildirimleri (Last day of each month)
  const babsDate = getAdjustedDate(new Date(year, month + 1, 0));
  items.push({
    id: 'babs-form',
    date: babsDate.date,
    title: 'Form Ba-Bs Bildirimi (Alış-Satış Mutabakatı)',
    description: 'Bir önceki döneme ait mal ve hizmet alımları (Ba) ile mal ve hizmet satışlarına (Bs) ilişkin bildirim formlarının verilmesi.',
    criticalNote: babsDate.note || 'Her ayın son günü akşamına kadardır.',
    legalWarning: 'Süresinde bildirilmeyen veya hatalı bildirilen Form Ba-Bs için özel usulsüzlük cezası kesilmektedir.',
    type: 'legal'
  });

  // ÖTV Beyannamesi (15th of each month)
  const otvDate = getAdjustedDate(new Date(year, month, 15));
  items.push({
    id: 'otv-beyannamesi',
    date: otvDate.date,
    title: 'Özel Tüketim Vergisi (ÖTV) Beyannamesi',
    description: 'ÖTV mükelleflerinin (I, II, III, IV sayılı listelerdeki malları ithal eden, üreten veya ilk iktisabını gerçekleştirenler) beyanname vermesi ve ödemesi.',
    criticalNote: otvDate.note || 'Her ayın 15. günü akşamına kadardır.',
    legalWarning: 'ÖTV beyanının aksatılması gümrükleme, tescil ve vergi incelemesi süreçlerinde ciddi gecikmelere sebep olur.',
    type: 'tax'
  });


  // ==========================================
  // 2. DEFTER BERAT YÜKLEMELERİ (MONTHLY OR QUARTERLY PREFERENCE)
  // ==========================================
  
  if (beratPreference === 'aylik') {
    // Aylık Gelir Defter Berat Yüklemesi (10th of each month)
    const beratGelirAylikDate = getAdjustedDate(new Date(year, month, 10));
    items.push({
      id: 'defter-berat-gelir-aylik',
      date: beratGelirAylikDate.date,
      title: 'Aylık Gelir Defter Berat Yüklemesi',
      description: 'Aylık berat yüklemeyi seçen mükelleflerin 4 ay önceki döneme ait Gelir Defteri beratlarının yüklenmesi.',
      criticalNote: beratGelirAylikDate.note || 'Aylık tercih eden mükellefler için her ayın 10. günü akşamına kadardır.',
      legalWarning: 'Defter beratlarının yüklenmemesi durumunda ticari defterler kanunen geçersiz sayılabilir.',
      type: 'berat'
    });

    // Aylık Diğer Defter Berat Yüklemesi (14th of each month, except January where it's 10th)
    const beratDigerDay = month === 0 ? 10 : 14;
    const beratDigerAylikDate = getAdjustedDate(new Date(year, month, beratDigerDay));
    items.push({
      id: 'defter-berat-diger-aylik',
      date: beratDigerAylikDate.date,
      title: 'Aylık Diğer Defter Berat Yüklemesi',
      description: 'Aylık berat yüklemeyi seçen mükelleflerin 4 ay önceki döneme ait Yevmiye ve Kebir Defteri (Diğer Defter) beratlarının yüklenmesi.',
      criticalNote: beratDigerAylikDate.note || `Aylık tercih eden mükellefler için her ayın ${beratDigerDay}. günü akşamına kadardır.`,
      legalWarning: 'Yevmiye ve Kebir beratlarının eksiksiz yüklenmesi vergi incelemelerinde en çok kontrol edilen husustur.',
      type: 'berat'
    });
  } else {
    // Geçici Gelir Defter Berat Yüklemesi (Quarterly: April 10, June 10, September 10, December 10)
    if (month === 3) { // April
      const beratGDate = getAdjustedDate(new Date(year, 3, 10));
      items.push({
        id: 'defter-berat-gelir-gecici-q4',
        date: beratGDate.date,
        title: 'Geçici Gelir Defter Berat Yüklemesi (Ekim-Kasım-Aralık)',
        description: 'Geçici berat yüklemeyi seçenlerin bir önceki yılın 4. çeyrek dönemine ait Gelir Defteri beratlarının yüklenmesi.',
        criticalNote: beratGDate.note || 'Geçici mükellefler için 10 Nisan akşamına kadardır.',
        legalWarning: 'Yıllık Kurumlar/Gelir vergisi öncesi berat mutabakatı yapılmalıdır.',
        type: 'berat'
      });
    } else if (month === 5) { // June
      const beratGDate = getAdjustedDate(new Date(year, 5, 10));
      items.push({
        id: 'defter-berat-gelir-gecici-q1',
        date: beratGDate.date,
        title: 'Geçici Gelir Defter Berat Yüklemesi (Ocak-Şubat-Mart)',
        description: 'Geçici berat yüklemeyi seçenlerin 1. çeyrek dönemine ait Gelir Defteri beratlarının yüklenmesi.',
        criticalNote: beratGDate.note || 'Geçici mükellefler için 10 Haziran akşamına kadardır.',
        legalWarning: '1. Geçici Vergi beyanı ile kayıtların tutarlı olması gerekir.',
        type: 'berat'
      });
    } else if (month === 8) { // September
      const beratGDate = getAdjustedDate(new Date(year, 8, 10));
      items.push({
        id: 'defter-berat-gelir-gecici-q2',
        date: beratGDate.date,
        title: 'Geçici Gelir Defter Berat Yüklemesi (Nisan-Mayıs-Haziran)',
        description: 'Geçici berat yüklemeyi seçenlerin 2. çeyrek dönemine ait Gelir Defteri beratlarının yüklenmesi.',
        criticalNote: beratGDate.note || 'Geçici mükellefler için 10 Eylül akşamına kadardır.',
        legalWarning: '2. Geçici Vergi dönemiyle eşzamanlı kayıt mutabakatı yapılmalıdır.',
        type: 'berat'
      });
    } else if (month === 11) { // December
      const beratGDate = getAdjustedDate(new Date(year, 11, 10));
      items.push({
        id: 'defter-berat-gelir-gecici-q3',
        date: beratGDate.date,
        title: 'Geçici Gelir Defter Berat Yüklemesi (Temmuz-Ağustos-Eylül)',
        description: 'Geçici berat yüklemeyi seçenlerin 3. çeyrek dönemine ait Gelir Defteri beratlarının yüklenmesi.',
        criticalNote: beratGDate.note || 'Geçici mükellefler için 10 Aralık akşamına kadardır.',
        legalWarning: '3. Geçici Vergi dönem kazanç ve gider kalemlerinin berata yansıması sağlanmalıdır.',
        type: 'berat'
      });
    }

    // Geçici Diğer Defter Berat Yüklemesi (Quarterly: May 14, June 14, September 14, December 14)
    if (month === 4) { // May
      const beratDDate = getAdjustedDate(new Date(year, 4, 14));
      items.push({
        id: 'defter-berat-diger-gecici-q4',
        date: beratDDate.date,
        title: 'Geçici Diğer Defter Berat Yüklemesi (Ekim-Kasım-Aralık)',
        description: 'Geçici berat yüklemeyi seçenlerin bir önceki yılın 4. çeyrek dönemine ait Yevmiye ve Kebir Defteri beratlarının yüklenmesi.',
        criticalNote: beratDDate.note || 'Geçici mükellefler için 14 Mayıs akşamına kadardır.',
        legalWarning: 'Son çeyrek defter beratlarının yüklenmesi yıllık hesap kapanışları açısından önemlidir.',
        type: 'berat'
      });
    } else if (month === 5) { // June
      const beratDDate = getAdjustedDate(new Date(year, 5, 14));
      items.push({
        id: 'defter-berat-diger-gecici-q1',
        date: beratDDate.date,
        title: 'Geçici Diğer Defter Berat Yüklemesi (Ocak-Şubat-Mart)',
        description: 'Geçici berat yüklemeyi seçenlerin 1. çeyrek dönemine ait Yevmiye ve Kebir Defteri beratlarının yüklenmesi.',
        criticalNote: beratDDate.note || 'Geçici mükellefler için 14 Haziran akşamına kadardır.',
        legalWarning: 'Dönem içi işlemlerin doğruluğunu tevsik edici defter beratı yüklemesi yapılmalıdır.',
        type: 'berat'
      });
    } else if (month === 8) { // September
      const beratDDate = getAdjustedDate(new Date(year, 8, 14));
      items.push({
        id: 'defter-berat-diger-gecici-q2',
        date: beratDDate.date,
        title: 'Geçici Diğer Defter Berat Yüklemesi (Nisan-Mayıs-Haziran)',
        description: 'Geçici berat yüklemeyi seçenlerin 2. çeyrek dönemine ait Yevmiye ve Kebir Defteri beratlarının yüklenmesi.',
        criticalNote: beratDDate.note || 'Geçici mükellefler için 14 Eylül akşamına kadardır.',
        legalWarning: 'Yarıyıl finansal tablolarının defter kayıtlarıyla uyumlu olması şarttır.',
        type: 'berat'
      });
    } else if (month === 11) { // December
      const beratDDate = getAdjustedDate(new Date(year, 11, 14));
      items.push({
        id: 'defter-berat-diger-gecici-q3',
        date: beratDDate.date,
        title: 'Geçici Diğer Defter Berat Yüklemesi (Temmuz-Ağustos-Eylül)',
        description: 'Geçici berat yüklemeyi seçenlerin 3. çeyrek dönemine ait Yevmiye ve Kebir Defteri beratlarının yüklenmesi.',
        criticalNote: beratDDate.note || 'Geçici mükellefler için 14 Aralık akşamına kadardır.',
        legalWarning: 'Dokuz aylık faaliyet döneminin yasal defter berat süreçleri tamamlanır.',
        type: 'berat'
      });
    }
  }


  // ==========================================
  // 3. YILLIK, DÖNEMSEL VE ÖZEL BEYANNAMELER / BİLDİRİMLER (MONTH-SPECIFIC)
  // ==========================================

  // --- JANUARY (Ocak - Month 0) ---
  if (month === 0) {
    // GEKAP Q4
    const gekapDate = getAdjustedDate(new Date(year, 0, 31));
    items.push({
      id: 'gekap-q4',
      date: gekapDate.date,
      title: 'GEKAP Beyannamesi (Ekim-Kasım-Aralık)',
      description: 'Geri Kazanım Katılım Payı (GEKAP) beyannamesinin verilmesi ve ödenmesi.',
      criticalNote: gekapDate.note || 'Yılın dördüncü çeyreğine ait GEKAP beyanının son günüdür.',
      legalWarning: 'Beyanda bulunmayan mükelleflere Çevre Kanunu uyarınca idari para cezası kesilmektedir.',
      type: 'tax'
    });

    // Kapanış Tasdiki (Yevmiye Defteri)
    const kapanisYevmiyeDate = getAdjustedDate(new Date(year, 0, 31));
    items.push({
      id: 'kapanis-yevmiye',
      date: kapanisYevmiyeDate.date,
      title: 'Yevmiye Defteri Kapanış Tasdiki',
      description: 'Önceki yıla ait yasal Yevmiye Defterinin noter kapanış tasdikinin yaptırılması.',
      criticalNote: kapanisYevmiyeDate.note || 'Ocak ayının son iş günüdür.',
      legalWarning: 'Zamanında kapanış tasdiki yapılmayan defterler ticari uyuşmazlıklarda mahkemede delil kabul edilmez.',
      type: 'legal'
    });

    // MTV 1. Taksit
    const mtv1Date = getAdjustedDate(new Date(year, 0, 31));
    items.push({
      id: 'mtv-1',
      date: mtv1Date.date,
      title: 'Motorlu Taşıtlar Vergisi (MTV) 1. Taksit',
      description: 'Motorlu taşıtların 1. taksit vergi ödemesi.',
      criticalNote: mtv1Date.note || 'Ocak ayının son günüdür.',
      legalWarning: 'Süresinde ödenmeyen MTV için aylık gecikme zammı tahakkuk eder ve araç satılamaz/muayene edilemez.',
      type: 'tax'
    });

    // İlan ve Reklam Vergisi
    const ilanReklamDate = getAdjustedDate(new Date(year, 0, 31));
    items.push({
      id: 'ilan-reklam',
      date: ilanReklamDate.date,
      title: 'Yıllık İlan ve Reklam Vergisi Bildirimi',
      description: 'Mükelleflerin bağlı bulundukları belediyelere yıllık ilan, tabela ve reklam vergisi beyanı.',
      criticalNote: ilanReklamDate.note || 'Ocak ayının son günüdür.',
      legalWarning: 'Belediye sınırları içindeki tabelalar için zorunlu beyandır.',
      type: 'tax'
    });

    // Yıllık SMMM Sözleşmeleri Yenileme
    const smmmSozlesmeDate = getAdjustedDate(new Date(year, 0, 31));
    items.push({
      id: 'smmm-sozlesme',
      date: smmmSozlesmeDate.date,
      title: 'SMMM Hizmet Sözleşmeleri Yenileme',
      description: 'GİB ve TÜRMOB sistemleri üzerinden SMMM aracılık ve sorumluluk sözleşmelerinin yenilenmesi ve damga vergisinin ödenmesi.',
      criticalNote: smmmSozlesmeDate.note || 'Yeni mali yılın başında tamamlanmalıdır.',
      legalWarning: 'Sözleşme güncellenmemesi e-beyanname gönderim yetkisinin askıya alınmasına yol açabilir.',
      type: 'legal'
    });
  }

  // --- FEBRUARY (Şubat - Month 1) ---
  if (month === 1) {
    // Geçici Vergi Q4
    const geciciDate = getAdjustedDate(new Date(year, 1, 17));
    items.push({
      id: 'gecici-vergi-q4',
      date: geciciDate.date,
      title: 'Geçici Vergi Beyannamesi (Ekim-Kasım-Aralık)',
      description: 'Bir önceki yılın 4. çeyreğine ait Gelir/Kurum Geçici Vergisinin beyanı ve ödenmesi.',
      criticalNote: geciciDate.note || 'Dönemi takip eden ikinci ayın 17. günü akşamına kadardır.',
      legalWarning: 'Geçici vergi matrahındaki eksik beyanların %10 yanılma payını aşmaması şarttır.',
      type: 'tax'
    });

    // Basit Usul Gelir Vergisi Beyannamesi
    const basitUsulDate = getAdjustedDate(new Date(year, 1, 28));
    items.push({
      id: 'basit-usul',
      date: basitUsulDate.date,
      title: 'Basit Usul Yıllık Gelir Vergisi Beyannamesi',
      description: 'Basit usule tabi mükelleflerin yıllık ticari kazançlarına ilişkin beyannamenin verilmesi.',
      criticalNote: basitUsulDate.note || 'Şubat ayının son günüdür.',
      legalWarning: 'Beyanname vermeyen mükellefler vergi avantajlarından ve indirimlerden mahrum kalırlar.',
      type: 'tax'
    });

    // Basit Usul Vergi Levhası Oluşturma
    const basitLevhaDate = getAdjustedDate(new Date(year, 1, 28));
    items.push({
      id: 'basit-usul-levha',
      date: basitLevhaDate.date,
      title: 'Basit Usul Vergi Levhası Oluşturma',
      description: 'Basit usule tabi mükelleflerin yıllık gelir vergisi beyanından sonra vergi levhasını sistemden oluşturması.',
      criticalNote: basitLevhaDate.note || 'Şubat ayının son günü itibarıyla alınabilir.',
      legalWarning: 'İşyerlerinde vergi levhasının bulundurulması yasal bir gerekliliktir.',
      type: 'legal'
    });
  }

  // --- MARCH (Mart - Month 2) ---
  if (month === 2) {
    // Gelir Vergisi Beyannamesi
    const gelirDate = getAdjustedDate(new Date(year, 2, 31));
    items.push({
      id: 'gelir-vergisi',
      date: gelirDate.date,
      title: 'Yıllık Gelir Vergisi Beyannamesi',
      description: 'Gerçek kişilerin bir önceki takvim yılına ait şahsi kazançlarının (Ticari, Mesleki, Ücret vb.) beyanı.',
      criticalNote: gelirDate.note || 'Mart ayı sonuna kadar verilmelidir.',
      legalWarning: 'Hatalı vergi dilimi hesaplamalarından kaçınmak için tüm istisna ve indirim kalemleri kontrol edilmelidir.',
      type: 'tax'
    });

    // Kira Beyannamesi (GMSİ)
    const kiraDate = getAdjustedDate(new Date(year, 2, 31));
    items.push({
      id: 'kira-beyannamesi',
      date: kiraDate.date,
      title: 'Yıllık Kira (GMSİ) Beyannamesi',
      description: 'Gerçek kişilerin elde ettiği mesken ve işyeri kira gelirlerinin beyanı ve 1. taksit ödemesi.',
      criticalNote: kiraDate.note || 'Mart ayının son günü akşamına kadar beyan edilir.',
      legalWarning: 'Mesken istisna tutarının üzerindeki tüm kira gelirlerinin beyan edilmesi zorunludur.',
      type: 'tax'
    });

    // Gerçek Kişi Vergi Levhası Oluşturma
    const levhaDate = getAdjustedDate(new Date(year, 2, 31));
    items.push({
      id: 'gercek-kisi-vergi-levhasi',
      date: levhaDate.date,
      title: 'Gerçek Kişi Vergi Levhası Oluşturma',
      description: 'Yıllık Gelir Vergisi beyannamesini gönderen şahıs mükelleflerinin sistemden vergi levhalarını çekmesi.',
      criticalNote: levhaDate.note || 'Gelir vergisi beyan döneminin son günüdür.',
      legalWarning: 'Vergi levhasının dijital olarak veya işyerinde asılı bulundurulması yasal zorunluluktur.',
      type: 'legal'
    });
  }

  // --- APRIL (Nisan - Month 3) ---
  if (month === 3) {
    // GEKAP Q1
    const gekapDate = getAdjustedDate(new Date(year, 3, 30));
    items.push({
      id: 'gekap-q1',
      date: gekapDate.date,
      title: 'GEKAP Beyannamesi (Ocak-Şubat-Mart)',
      description: 'Geri Kazanım Katılım Payı (GEKAP) birinci çeyrek beyannamesinin verilmesi ve ödenmesi.',
      criticalNote: gekapDate.note || 'Nisan ayının son günüdür.',
      legalWarning: 'GEKAP ödemeleri genel bütçe geliridir, aksatılması halinde Amme Alacakları kanununa göre takip edilir.',
      type: 'tax'
    });

    // Kurumlar Vergisi Beyannamesi
    const kurumlarDate = getAdjustedDate(new Date(year, 3, 30));
    items.push({
      id: 'kurumlar-vergisi',
      date: kurumlarDate.date,
      title: 'Yıllık Kurumlar Vergisi Beyannamesi',
      description: 'Sermaye şirketlerinin bir önceki yıla ait yıllık Kurumlar Vergisi beyanı ve ödemesi.',
      criticalNote: kurumlarDate.note || 'Nisan ayının son günü akşamına kadar verilmelidir.',
      legalWarning: 'Kanunen Kabul Edilmeyen Giderler (KKEG) ve Ar-Ge / Yatırım teşvikleri titizlikle ayrılmalıdır.',
      type: 'tax'
    });

    // Tüzel Kişi Vergi Levhası Oluşturma
    const tuzelLevhaDate = getAdjustedDate(new Date(year, 3, 30));
    items.push({
      id: 'tuzel-kisi-vergi-levhasi',
      date: tuzelLevhaDate.date,
      title: 'Tüzel Kişi Vergi Levhası Oluşturma',
      description: 'Kurumlar Vergisi beyannamesini gönderen şirketlerin vergi levhalarını e-Vergi dairesinden oluşturması.',
      criticalNote: tuzelLevhaDate.note || 'Nisan ayının son günüdür.',
      legalWarning: 'Vergi levhası bulundurmayan kurumlar için özel usulsüzlük cezası mevcuttur.',
      type: 'legal'
    });

    // Yıllık İşletme Cetveli (Sanayi Sicil)
    const isletmeCetveliDate = getAdjustedDate(new Date(year, 3, 30));
    items.push({
      id: 'yillik-isletme-cetveli',
      date: isletmeCetveliDate.date,
      title: 'Yıllık İşletme Cetveli Bildirimi',
      description: 'Sanayi Sicil Belgesine sahip işletmelerin Sanayi ve Teknoloji Bakanlığına bir önceki yıl verilerini içeren işletme cetvelini sunması.',
      criticalNote: isletmeCetveliDate.note || 'Nisan ayının son günüdür.',
      legalWarning: 'Süresinde doldurulmayan cetveller için sanayi sicil kanunu kapsamında idari para cezası kesilir.',
      type: 'legal'
    });

    // KOOPBİS Veri İşleme
    const koopbisDate = getAdjustedDate(new Date(year, 3, 26));
    items.push({
      id: 'koopbis-veri',
      date: koopbisDate.date,
      title: 'KOOPBİS Bilgi Sistemi Veri Girişi',
      description: 'Kooperatiflerin mali ve ortaklık yapısı verilerinin KOOPBİS sistemine işlenmesi.',
      criticalNote: koopbisDate.note || 'Yasal zorunlu veri giriş tarihidir.',
      legalWarning: 'Veri girişini geciktiren kooperatif yönetim kurulları hakkında idari cezalar uygulanabilmektedir.',
      type: 'legal'
    });
  }

  // --- MAY (Mayıs - Month 4) ---
  if (month === 4) {
    // Geçici Vergi Q1
    const hasSpecialMayDate = year === 2026;
    const geciciDate = getAdjustedDate(new Date(year, 4, hasSpecialMayDate ? 20 : 17));
    items.push({
      id: 'gecici-vergi-q1',
      date: geciciDate.date,
      title: 'Geçici Vergi Beyannamesi (Ocak-Şubat-Mart)',
      description: 'Birinci çeyrek dönemine ait Gelir/Kurum Geçici Vergisinin beyanı ve ödenmesi.',
      criticalNote: geciciDate.note || `Dönemi takip eden ikinci ayın ${hasSpecialMayDate ? '20' : '17'}. günü akşamına kadardır.`,
      legalWarning: 'Ödenen geçici vergiler, yıllık gelir/kurumlar vergisinden mahsup edilmektedir.',
      type: 'tax'
    });

    // Emlak Vergisi 1. Taksit
    const emlakDate = getAdjustedDate(new Date(year, 4, 31));
    items.push({
      id: 'emlak-1',
      date: emlakDate.date,
      title: 'Emlak & Çevre Temizlik Vergisi 1. Taksit',
      description: 'Belediyelere ödenen yıllık bina, arazi ve çevre temizlik vergisinin birinci taksiti.',
      criticalNote: emlakDate.note || 'Mayıs ayının son günüdür.',
      legalWarning: 'Ödemeler doğrudan ilgili belediyelere veya e-belediye sistemlerinden gerçekleştirilir.',
      type: 'tax'
    });
  }

  // --- JUNE (Haziran - Month 5) ---
  if (month === 5) {
    // Kapanış Tasdiki (Karar Defteri)
    const kapanisKararDate = getAdjustedDate(new Date(year, 5, 30));
    items.push({
      id: 'kapanis-karar',
      date: kapanisKararDate.date,
      title: 'Yönetim Kurulu Karar Defteri Kapanış Tasdiki',
      description: 'Anonim şirketlerin Yönetim Kurulu Karar Defterinin noter kapanış tasdiklerinin yapılması.',
      criticalNote: kapanisKararDate.note || 'Haziran ayının son iş günüdür.',
      legalWarning: 'Söz konusu tasdiklerin yapılmaması halinde TTK uyarınca idari para cezası kesilir.',
      type: 'legal'
    });

    // Yıllık Üyelik Aidatları (Oda Aidatları) 1. Taksit
    const odaAidatDate = getAdjustedDate(new Date(year, 5, 30));
    items.push({
      id: 'oda-aidat-1',
      date: odaAidatDate.date,
      title: 'Ticaret / Sanayi Odası Yıllık Aidatı 1. Taksit',
      description: 'KTO, ESO vb. meslek odalarına ödenen yıllık maktu ve nispi üyelik aidatlarının birinci taksiti.',
      criticalNote: odaAidatDate.note || 'Haziran ayının son günüdür.',
      legalWarning: 'Ödenmeyen aidat bakiyeleri için kanuni gecikme faizi işletilmektedir.',
      type: 'tax'
    });
  }

  // --- JULY (Temmuz - Month 6) ---
  if (month === 6) {
    // GEKAP Q2
    const gekapDate = getAdjustedDate(new Date(year, 6, 31));
    items.push({
      id: 'gekap-q2',
      date: gekapDate.date,
      title: 'GEKAP Beyannamesi (Nisan-Mayıs-Haziran)',
      description: 'İkinci çeyrek dönemine ait Geri Kazanım Katılım Payı (GEKAP) beyanının verilmesi ve ödenmesi.',
      criticalNote: gekapDate.note || 'Temmuz ayının son günüdür.',
      legalWarning: 'Uymayanlar için çevre kirliliği idari yaptırım maddeleri uygulanır.',
      type: 'tax'
    });

    // MTV 2. Taksit
    const mtv2Date = getAdjustedDate(new Date(year, 6, 31));
    items.push({
      id: 'mtv-2',
      date: mtv2Date.date,
      title: 'Motorlu Taşıtlar Vergisi (MTV) 2. Taksit',
      description: 'Motorlu taşıtların 2. taksit vergi ödemesi.',
      criticalNote: mtv2Date.note || 'Temmuz ayının son günüdür.',
      legalWarning: 'Aksatılan vergiler vergi dairelerince e-haciz yoluyla tahsil edilmektedir.',
      type: 'tax'
    });

    // Gelir Vergisi 2. Taksit
    const gelir2Date = getAdjustedDate(new Date(year, 6, 31));
    items.push({
      id: 'gelir-2-taksit',
      date: gelir2Date.date,
      title: 'Yıllık Gelir Vergisi 2. Taksit Ödemesi',
      description: 'Yıllık Gelir Vergisi mükelleflerinin ikinci taksit ödemesi.',
      criticalNote: gelir2Date.note || 'Temmuz ayının son günüdür.',
      legalWarning: 'Gecikme zammı ile karşılaşmamak için son güne kalmadan ödenmelidir.',
      type: 'tax'
    });

    // Kira Beyannamesi (GMSİ) 2. Taksit
    const gmsi2Date = getAdjustedDate(new Date(year, 6, 31));
    items.push({
      id: 'gmsi-2-taksit',
      date: gmsi2Date.date,
      title: 'Yıllık Kira (GMSİ) Vergisi 2. Taksit Ödemesi',
      description: 'Kira geliri elde eden gerçek kişilerin ikinci taksit ödemesi.',
      criticalNote: gmsi2Date.note || 'Temmuz ayının son günüdür.',
      legalWarning: 'Ödemeler vergi dairesine, anlaşmalı bankalara veya GİB internet sitesinden yapılabilir.',
      type: 'tax'
    });
  }

  // --- AUGUST (Ağustos - Month 7) ---
  if (month === 7) {
    // Geçici Vergi Q2
    const hasSpecialAugDate = year === 2026;
    const geciciDate = getAdjustedDate(new Date(year, 7, hasSpecialAugDate ? 18 : 17));
    items.push({
      id: 'gecici-vergi-q2',
      date: geciciDate.date,
      title: 'Geçici Vergi Beyannamesi (Nisan-Mayıs-Haziran)',
      description: 'İkinci çeyrek dönemine ait Gelir/Kurum Geçici Vergisinin beyanı ve ödenmesi.',
      criticalNote: geciciDate.note || `Dönemi takip eden ikinci ayın ${hasSpecialAugDate ? '18' : '17'}. günü akşamına kadardır.`,
      legalWarning: 'Geçici vergilerin vadesinde ödenmesi, gelir vergisi dönemi mahsup işlemleri için esastır.',
      type: 'tax'
    });

    // Gerçek Faydalanıcı Bildirimi
    const gercekFaydalaniciDate = getAdjustedDate(new Date(year, 7, 31));
    items.push({
      id: 'gercek-faydalanici',
      date: gercekFaydalaniciDate.date,
      title: 'Yıllık Gerçek Faydalanıcı Bildirimi',
      description: 'Şirketlerin gerçek faydalanıcı (ortaklık yapısında nihai paya sahip kişi) bilgilerinin güncellenmesi.',
      criticalNote: gercekFaydalaniciDate.note || 'Ağustos ayının son günüdür.',
      legalWarning: 'Gerçek faydalanıcı formunun verilmemesi halinde yüksek tutarlı özel usulsüzlük cezaları kesilmektedir.',
      type: 'legal'
    });
  }

  // --- OCTOBER (Ekim - Month 9) ---
  if (month === 9) {
    // GEKAP Q3
    const gekapDate = getAdjustedDate(new Date(year, 9, 30));
    items.push({
      id: 'gekap-q3',
      date: gekapDate.date,
      title: 'GEKAP Beyannamesi (Temmuz-Ağustos-Eylül)',
      description: 'Üçüncü çeyrek dönemine ait Geri Kazanım Katılım Payı (GEKAP) beyanının verilmesi ve ödenmesi.',
      criticalNote: gekapDate.note || 'Ekim ayının son günüdür.',
      legalWarning: 'Zorunlu beyan tabi ambalaj ve plastik taşıma poşetleri bu kapsamda beyan edilmektedir.',
      type: 'tax'
    });

    // Yıllık Üyelik Aidatları (Oda Aidatları) 2. Taksit
    const odaAidatDate = getAdjustedDate(new Date(year, 9, 31));
    items.push({
      id: 'oda-aidat-2',
      date: odaAidatDate.date,
      title: 'Ticaret / Sanayi Odası Yıllık Aidatı 2. Taksit',
      description: 'Meslek odalarına (KTO vb.) ait yıllık üyelik aidatlarının ikinci ve son taksiti.',
      criticalNote: odaAidatDate.note || 'Ekim ayının son günüdür.',
      legalWarning: 'Zamanında ödenmeyen aidat alacakları icra takibine konu edilebilmektedir.',
      type: 'tax'
    });
  }

  // --- NOVEMBER (Kasım - Month 10) ---
  if (month === 10) {
    // Geçici Vergi Q3
    const geciciDate = getAdjustedDate(new Date(year, 10, 17));
    items.push({
      id: 'gecici-vergi-q3',
      date: geciciDate.date,
      title: 'Geçici Vergi Beyannamesi (Temmuz-Ağustos-Eylül)',
      description: 'Üçüncü çeyrek dönemine ait Gelir/Kurum Geçici Vergisinin beyanı ve ödenmesi.',
      criticalNote: geciciDate.note || 'Dönemi takip eden ikinci ayın 17. günü akşamına kadardır.',
      legalWarning: 'Son geçici vergi dönemine ait kazançların hesaplanmasında yıl sonu amortismanları göz önünde bulundurulmalıdır.',
      type: 'tax'
    });

    // Emlak Vergisi 2. Taksit
    const emlakDate = getAdjustedDate(new Date(year, 10, 30));
    items.push({
      id: 'emlak-2',
      date: emlakDate.date,
      title: 'Emlak & Çevre Temizlik Vergisi 2. Taksit',
      description: 'Belediyelere ödenen emlak vergisinin ikinci ve son taksit ödemesi.',
      criticalNote: emlakDate.note || 'Kasım ayının son günüdür.',
      legalWarning: 'Zamanında ödenmeyen taksitlere gecikme zammı eklenmektedir.',
      type: 'tax'
    });
  }

  // --- DECEMBER (Aralık - Month 11) ---
  if (month === 11) {
    // Defter Açılış Tasdiki
    const acilisDate = getAdjustedDate(new Date(year, 11, 31));
    items.push({
      id: 'acilis-tasdiki',
      date: acilisDate.date,
      title: 'Yeni Yıl Defterleri Açılış Tasdiki',
      description: 'Gelecek faaliyet döneminde kullanılacak yasal ticari defterlerin noter açılış tasdiki veya e-Defter müracaat işlemleri.',
      criticalNote: acilisDate.note || 'Aralık ayının son günü akşamına kadardır.',
      legalWarning: 'Açılış onayı yaptırılmamış defterlere yapılan kayıtlar geçersiz sayılır, ticari delil olarak kabul edilmez.',
      type: 'legal'
    });
  }

  // Sort by date ascending
  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
};
