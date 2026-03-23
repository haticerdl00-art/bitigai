
export interface CalendarItem {
  id: string;
  date: Date;
  title: string;
  description: string;
  criticalNote: string;
  legalWarning: string;
  type: 'tax' | 'sgk' | 'legal' | 'berat';
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

  // 1. Beyannameler
  // KDV2 (25th of each month)
  const kdv2Date = getAdjustedDate(new Date(year, month, 25));
  items.push({
    id: 'kdv2',
    date: kdv2Date.date,
    title: 'KDV2 Beyannamesi',
    description: 'Tam ve kısmi tevkifat uygulanan işlemler için KDV2 beyannamesinin verilmesi.',
    criticalNote: kdv2Date.note || 'Her ayın 25. günü akşamına kadardır.',
    legalWarning: 'Tevkifatlı işlemlerde sorumluluk sıfatıyla beyan zorunludur.',
    type: 'tax'
  });

  // MUHSGK (26th of each month)
  const muhsgkDate = getAdjustedDate(new Date(year, month, 26));
  items.push({
    id: 'muhsgk',
    date: muhsgkDate.date,
    title: 'MUHSGK Beyannamesi',
    description: 'Muhtasar ve Prim Hizmet Beyannamesinin verilmesi ve ödenmesi.',
    criticalNote: muhsgkDate.note || 'Her ayın 26. günü akşamına kadardır.',
    legalWarning: 'SGK bildirimleri ile vergi beyanlarının uyumlu olması kritiktir.',
    type: 'tax'
  });

  // KDV1 (28th of each month)
  const kdv1Date = getAdjustedDate(new Date(year, month, 28));
  items.push({
    id: 'kdv1',
    date: kdv1Date.date,
    title: 'KDV1 Beyannamesi',
    description: 'Katma Değer Vergisi beyannamesinin verilmesi ve ödenmesi.',
    criticalNote: kdv1Date.note || 'Her ayın 28. günü akşamına kadardır.',
    legalWarning: 'Süresinde verilmemesi durumunda özel usulsüzlük cezası uygulanır.',
    type: 'tax'
  });

  // Damga Vergisi (26th of each month - usually part of MUHSGK but can be separate)
  const damgaDate = getAdjustedDate(new Date(year, month, 26));
  items.push({
    id: 'damga-vergisi',
    date: damgaDate.date,
    title: 'Damga Vergisi Beyannamesi',
    description: 'Sürekli damga vergisi mükellefiyeti olanlar için beyan ve ödeme.',
    criticalNote: damgaDate.note || 'Her ayın 26. günü akşamına kadardır.',
    legalWarning: 'Sözleşme damga vergileri takibi önemlidir.',
    type: 'tax'
  });

  // GEKAP (Quarterly - Jan, Apr, Jul, Oct)
  if ([0, 3, 6, 9].includes(month)) {
    const gekapDate = getAdjustedDate(new Date(year, month + 1, 0)); // Last day of month
    items.push({
      id: 'gekap',
      date: gekapDate.date,
      title: 'GEKAP Beyannamesi',
      description: 'Geri Kazanım Katılım Payı beyannamesinin verilmesi.',
      criticalNote: gekapDate.note || 'Üç aylık dönemi takip eden ayın son günüdür.',
      legalWarning: 'Bildirim yükümlülüğüne uyulmaması idari para cezası gerektirir.',
      type: 'tax'
    });
  }

  // Geçici Vergi (Feb, May, Aug, Nov - 17th)
  if ([1, 4, 7, 10].includes(month)) {
    const geciciDate = getAdjustedDate(new Date(year, month, 17));
    items.push({
      id: 'gecici-vergi',
      date: geciciDate.date,
      title: 'Geçici Vergi Beyannamesi',
      description: 'İlgili döneme ait Geçici Vergi beyannamesinin verilmesi ve ödenmesi.',
      criticalNote: geciciDate.note || 'Dönemi takip eden ikinci ayın 17. günü akşamına kadardır.',
      legalWarning: '%10\'u aşan yanılma payına dikkat edilmelidir.',
      type: 'tax'
    });
  }

  // Gelir Vergisi (March)
  if (month === 2) {
    const gelirDate = getAdjustedDate(new Date(year, 2, 31));
    items.push({
      id: 'gelir-vergisi',
      date: gelirDate.date,
      title: 'Yıllık Gelir Vergisi Beyannamesi',
      description: 'Gerçek kişilerin yıllık gelir vergisi beyan dönemi.',
      criticalNote: gelirDate.note || 'Mart ayı sonuna kadar verilmelidir.',
      legalWarning: 'Kira geliri olan mükellefler için istisna tutarları kontrol edilmelidir.',
      type: 'tax'
    });
  }

  // Kurumlar Vergisi (April)
  if (month === 3) {
    const kurumlarDate = getAdjustedDate(new Date(year, 3, 30));
    items.push({
      id: 'kurumlar-vergisi',
      date: kurumlarDate.date,
      title: 'Kurumlar Vergisi Beyannamesi',
      description: 'Tüzel kişilerin yıllık kurumlar vergisi beyan dönemi.',
      criticalNote: kurumlarDate.note || 'Nisan ayı sonuna kadar verilmelidir.',
      legalWarning: 'KKEG ayrımı titizlikle yapılmalıdır.',
      type: 'tax'
    });
  }

  // E-Defter Berat
  if (beratPreference === 'aylik') {
    const beratDate = getAdjustedDate(new Date(year, month, 14));
    items.push({
      id: 'berat-aylik',
      date: beratDate.date,
      title: 'E-Defter Berat Yüklemesi',
      description: '3 ay önceki döneme ait e-defter beratlarının yüklenmesi.',
      criticalNote: beratDate.note || 'Aylık tercih edenler için takip eden 3. ayın 14. günüdür.',
      legalWarning: 'Berat yüklenmemesi defterlerin geçersiz sayılmasına neden olabilir.',
      type: 'berat'
    });
  }

  // SGK (Last day of month)
  const sgkDate = getAdjustedDate(new Date(year, month + 1, 0));
  items.push({
    id: 'sgk-prim',
    date: sgkDate.date,
    title: 'SGK Prim Ödemesi',
    description: 'Cari aya ait SGK primlerinin ödenmesi.',
    criticalNote: sgkDate.note || 'Ayın son iş günüdür.',
    legalWarning: 'Gecikme zammı ve teşvik kaybı riskine karşı ödeme günü kaçırılmamalıdır.',
    type: 'sgk'
  });

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
};
