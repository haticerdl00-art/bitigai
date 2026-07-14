import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Calendar, 
  Loader2, 
  Mic, 
  MicOff, 
  Filter, 
  Briefcase, 
  Heart, 
  FileText, 
  User, 
  Notebook, 
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';

interface AgendaItem {
  id: string;
  text: string;
  category: 'İş' | 'Kişisel';
  completed: boolean;
  date: string;
  priority: 'Düşük' | 'Orta' | 'Yüksek';
  createdAt: any;
}

export const AgendaModule: React.FC = () => {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'İş' | 'Kişisel'>('İş');
  const [newNotePriority, setNewNotePriority] = useState<'Düşük' | 'Orta' | 'Yüksek'>('Orta');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFilter, setSelectedFilter] = useState<'Tümü' | 'İş' | 'Kişisel'>('Tümü');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [activePostponeId, setActivePostponeId] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  const toggleSpeechRecognition = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceHint('Konuşun... (örn: "Yarın için raporları hazırla yüksek önemde iş olarak ekle")');
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      setTimeout(() => setVoiceHint(null), 3000);
    };
    
    recognition.onerror = () => {
      setIsRecording(false);
      setVoiceHint('Ses anlaşılamadı, tekrar deneyin.');
      setTimeout(() => setVoiceHint(null), 3000);
    };

    recognition.onresult = (event: any) => {
      let transcript = event.results[0][0].transcript;
      let matchedCategory: 'İş' | 'Kişisel' | null = null;
      let matchedPriority: 'Düşük' | 'Orta' | 'Yüksek' | null = null;
      let cleanedText = transcript;

      // Smart Voice Command parsing
      const lowerTranscript = transcript.toLowerCase();

      if (lowerTranscript.includes('iş olarak ekle') || lowerTranscript.includes('iş olarak') || lowerTranscript.includes('iş kategorisi')) {
        matchedCategory = 'İş';
        cleanedText = cleanedText
          .replace(/iş olarak ekle/gi, '')
          .replace(/iş olarak/gi, '')
          .replace(/iş kategorisi/gi, '');
      } else if (lowerTranscript.includes('kişisel olarak ekle') || lowerTranscript.includes('kişisel olarak') || lowerTranscript.includes('kişisel kategori')) {
        matchedCategory = 'Kişisel';
        cleanedText = cleanedText
          .replace(/kişisel olarak ekle/gi, '')
          .replace(/kişisel olarak/gi, '')
          .replace(/kişisel kategori/gi, '');
      }

      if (lowerTranscript.includes('yüksek önemde') || lowerTranscript.includes('yüksek önem') || lowerTranscript.includes('önemli')) {
        matchedPriority = 'Yüksek';
        cleanedText = cleanedText
          .replace(/yüksek önemde/gi, '')
          .replace(/yüksek önem/gi, '')
          .replace(/önemli/gi, '');
      } else if (lowerTranscript.includes('düşük önemde') || lowerTranscript.includes('düşük önem') || lowerTranscript.includes('önemsiz')) {
        matchedPriority = 'Düşük';
        cleanedText = cleanedText
          .replace(/düşük önemde/gi, '')
          .replace(/düşük önem/gi, '')
          .replace(/önemsiz/gi, '');
      } else if (lowerTranscript.includes('orta önemde') || lowerTranscript.includes('orta önem')) {
        matchedPriority = 'Orta';
        cleanedText = cleanedText
          .replace(/orta önemde/gi, '')
          .replace(/orta önem/gi, '');
      }

      // Cleanup trailing punctuation and spaces
      cleanedText = cleanedText.trim().replace(/^[,.]+|[,.]+$|\s+/g, ' ');
      
      if (cleanedText) {
        setNewNote((prev) => (prev ? `${prev} ${cleanedText}` : cleanedText));
        
        let feedback = 'Ses kaydedildi!';
        if (matchedCategory) {
          setNewNoteCategory(matchedCategory);
          feedback += ` Kategori: ${matchedCategory}.`;
        }
        if (matchedPriority) {
          setNewNotePriority(matchedPriority);
          feedback += ` Önem: ${matchedPriority}.`;
        }
        setVoiceHint(feedback);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      const userId = user.uid;
      const agendaRef = collection(db, 'users', userId, 'agenda');
      const q = query(agendaRef);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const agendaData: AgendaItem[] = [];
        snapshot.forEach((docRef) => {
          const rawData = docRef.data();
          // Sanitize category to ensure robust 'İş' | 'Kişisel' mapping from legacy data
          let sanitizedCategory: 'İş' | 'Kişisel' = 'İş';
          if (rawData.category === 'Kişisel') {
            sanitizedCategory = 'Kişisel';
          }
          
          agendaData.push({ 
            id: docRef.id, 
            text: rawData.text || '',
            category: sanitizedCategory,
            completed: !!rawData.completed,
            date: rawData.date || new Date().toISOString().split('T')[0],
            priority: rawData.priority || 'Orta',
            createdAt: rawData.createdAt
          } as AgendaItem);
        });

        // Client side sorting by createdAt descending, handling server timestamp delay
        agendaData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || Date.now();
          const timeB = b.createdAt?.toMillis?.() || Date.now();
          return timeB - timeA;
        });

        setItems(agendaData);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/agenda`);
        setLoading(false);
      });

      return () => unsubscribe();
    });

    return () => unsubscribeAuth();
  }, []);

  const addAgendaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const agendaRef = collection(db, 'users', userId, 'agenda');

    try {
      await addDoc(agendaRef, {
        text: newNote.trim(),
        category: newNoteCategory,
        completed: false,
        date: newNoteDate || new Date().toISOString().split('T')[0],
        priority: newNotePriority,
        createdAt: serverTimestamp()
      });
      setNewNote('');
      setNewNotePriority('Orta');
      // Set date back to today
      setNewNoteDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/agenda`);
    }
  };

  const toggleItemCompleted = async (id: string, currentStatus: boolean) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    try {
      await updateDoc(doc(db, 'users', userId, 'agenda', id), {
        completed: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/agenda/${id}`);
    }
  };

  const deleteAgendaItem = async (id: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    try {
      await deleteDoc(doc(db, 'users', userId, 'agenda', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/agenda/${id}`);
    }
  };

  const postponeItem = async (id: string, currentDate: string, days: number) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    try {
      const baseDate = new Date(currentDate);
      if (isNaN(baseDate.getTime())) {
        baseDate.setTime(Date.now());
      }
      baseDate.setDate(baseDate.getDate() + days);
      const newFormattedDate = baseDate.toISOString().split('T')[0];

      await updateDoc(doc(db, 'users', userId, 'agenda', id), {
        date: newFormattedDate
      });
      setActivePostponeId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/agenda/${id}`);
    }
  };

  const filteredItems = items.filter(item => {
    if (selectedFilter === 'Tümü') return true;
    return item.category === selectedFilter;
  });

  const getCategoryTheme = (category: 'İş' | 'Kişisel') => {
    switch (category) {
      case 'İş':
        return {
          bg: 'bg-indigo-50 border-indigo-100 text-indigo-700',
          badge: 'bg-indigo-100 text-indigo-800',
          icon: Briefcase
        };
      case 'Kişisel':
        return {
          bg: 'bg-emerald-50 border-emerald-100 text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-850',
          icon: Heart
        };
    }
  };

  const getPriorityTheme = (priority: 'Düşük' | 'Orta' | 'Yüksek') => {
    switch (priority) {
      case 'Yüksek':
        return 'bg-rose-50 border-rose-100 text-rose-700 font-extrabold';
      case 'Orta':
        return 'bg-amber-50 border-amber-100 text-amber-700 font-bold';
      case 'Düşük':
        return 'bg-slate-50 border-slate-100 text-slate-500 font-medium';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col space-y-6">
      {/* Header section with brand matching subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Notebook className="w-5 h-5 text-orange-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg uppercase tracking-tight">Ajandam</h3>
            <p className="text-[11px] text-slate-400 font-medium">Bireysel işleriniz ve kişisel notlarınız için sadeleştirilmiş akıllı ajanda.</p>
          </div>
        </div>
        
        {/* Quick Summary Badges */}
        <div className="flex items-center gap-3.5 text-xs text-slate-400 font-bold bg-slate-50 p-2 rounded-xl border border-slate-200/40">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> İş : {items.filter(i => i.category === 'İş').length}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Kişisel : {items.filter(i => i.category === 'Kişisel').length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Input Form Column */}
        <div className="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-6 space-y-4">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Yeni Görev & Not</h4>
          <form onSubmit={addAgendaItem} className="space-y-4">
            {/* Note Text area */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase">Açıklama</label>
              <div className="relative">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Notunuzu buraya yazın veya sesli komut özelliğini kullanın..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                  required
                />
                
                {/* Speech recognition toggle */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`absolute right-2 bottom-3 p-1.5 rounded-lg transition-all ${isRecording ? 'bg-orange-500 text-white animate-pulse shadow-md shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="Sesle Görev Ekle"
                >
                  {isRecording ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <MicOff className="w-3.5 h-3.5" />
                    </motion.div>
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              
              {/* Voice instruction hint bar */}
              {voiceHint ? (
                <div className="bg-orange-50 text-orange-700 text-[10px] p-2 rounded-lg font-bold border border-orange-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-500 flex-shrink-0" />
                  <span>{voiceHint}</span>
                </div>
              ) : (
                <div className="text-[9px] text-slate-400 leading-relaxed italic">
                  💡 <b>Sesli Akıllı Ekleme</b>: "..." konuşup ardından <i>"iş olarak ekle"</i> veya <i>"yüksek önemde"</i> diyerek otomatik ayarlayabilirsiniz.
                </div>
              )}
            </div>

            {/* Note Category Selection Grid */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase">Kategori</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['İş', 'Kişisel'] as const).map((cat) => {
                  const isActive = newNoteCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewNoteCategory(cat)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        isActive 
                          ? 'bg-orange-500 text-white border-orange-500 font-extrabold shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Importance level / Önem Derecesi Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase">Önem Derecesi</label>
              <div className="grid grid-cols-3 gap-1">
                {(['Düşük', 'Orta', 'Yüksek'] as const).map((pri) => {
                  const isActive = newNotePriority === pri;
                  let activeStyle = '';
                  if (isActive) {
                    if (pri === 'Yüksek') activeStyle = 'bg-rose-500 text-white border-rose-500';
                    else if (pri === 'Orta') activeStyle = 'bg-amber-500 text-white border-amber-500';
                    else activeStyle = 'bg-slate-500 text-white border-slate-500';
                  }
                  
                  return (
                    <button
                      key={pri}
                      type="button"
                      onClick={() => setNewNotePriority(pri)}
                      className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                        isActive 
                          ? `${activeStyle} font-extrabold` 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {pri}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Calendar due selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase">Son Tarih (Termin)</label>
              <div className="flex items-center gap-2 border border-slate-200 bg-slate-50/50 p-2 rounded-xl">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="date"
                  value={newNoteDate}
                  onChange={(e) => setNewNoteDate(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none text-slate-700 font-semibold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-orange-600/10"
            >
              <Plus className="w-3.5 h-3.5" />
              Notu / Görevi Ekle
            </button>
          </form>
        </div>

        {/* Display List Column */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          {/* Quick Filter Selection tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start overflow-x-auto max-w-full">
            {(['Tümü', 'İş', 'Kişisel'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-1 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
                  selectedFilter === filter 
                    ? 'bg-white text-[#1e3a8a] shadow-sm font-extrabold' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Agenda Items List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[450px] pr-1.5 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <p className="text-xs text-slate-400">Veriler buluttan yükleniyor...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="border-2 border-dashed border-slate-100 rounded-2xl py-14 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Notebook className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Seçili Listede Kayıt Bulunmuyor</h4>
                  <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto mt-1">
                    Sol panelden döküm girerek ilk ajanda notunuzu buluta saklayabilirsiniz.
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredItems.map((item) => {
                  const theme = getCategoryTheme(item.category);
                  const Icon = theme.icon;
                  const isPast = new Date(item.date) < new Date() && !item.completed;
                  const isPostponeActive = activePostponeId === item.id;
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.98, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`group flex flex-col p-4 border rounded-2xl transition-all ${
                        item.completed 
                          ? 'bg-slate-50/50 border-slate-100 opacity-60' 
                          : 'bg-white border-slate-150 hover:shadow-md hover:shadow-slate-100 hover:border-orange-250'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleItemCompleted(item.id, item.completed)}
                          className={`flex-shrink-0 mt-0.5 transition-colors ${
                            item.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-orange-500'
                          }`}
                        >
                          {item.completed ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Circle className="w-4.5 h-4.5" />}
                        </button>

                        {/* Content block */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            {/* Category Badge */}
                            <span className={`text-[8.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md flex items-center gap-1 ${theme.badge}`}>
                              <Icon className="w-2.5 h-2.5" />
                              {item.category}
                            </span>
                            
                            {/* Priority Badge */}
                            <span className={`text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded-md ${getPriorityTheme(item.priority || 'Orta')}`}>
                              {item.priority || 'Orta'} Önem
                            </span>

                            {/* Due Date Badge */}
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                              isPast ? 'bg-rose-50 text-rose-700 font-extrabold border border-rose-100' : 'bg-slate-50 text-slate-500'
                            }`}>
                              <Calendar className="w-2.5 h-2.5" />
                              Termin: {item.date} {isPast && '(Günü Geçti)'}
                            </span>
                          </div>

                          <p className={`text-xs font-medium leading-relaxed break-words whitespace-pre-wrap ${
                            item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}>
                            {item.text}
                          </p>
                        </div>

                        {/* Actions block (Delete & Expand Postpone) */}
                        <div className="flex items-center gap-1 flex-shrink-0 self-start">
                          {!item.completed && (
                            <button
                              onClick={() => setActivePostponeId(isPostponeActive ? null : item.id)}
                              className={`p-1.5 rounded-lg transition-all ${isPostponeActive ? 'bg-orange-50 text-orange-600' : 'text-slate-450 hover:bg-slate-50 hover:text-orange-500'}`}
                              title="Ertele"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteAgendaItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Postpone Options Area */}
                      <AnimatePresence>
                        {isPostponeActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-100 mt-3 pt-3 flex flex-col gap-2"
                          >
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Erteleme Süresi Seçin:</div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => postponeItem(item.id, item.date, 1)}
                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-150 rounded-lg text-[10px] font-black transition-colors"
                              >
                                +1 Gün
                              </button>
                              <button
                                onClick={() => postponeItem(item.id, item.date, 3)}
                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-150 rounded-lg text-[10px] font-black transition-colors"
                              >
                                +3 Gün
                              </button>
                              <button
                                onClick={() => postponeItem(item.id, item.date, 7)}
                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-150 rounded-lg text-[10px] font-black transition-colors"
                              >
                                +1 Hafta
                              </button>
                              <button
                                onClick={() => setActivePostponeId(null)}
                                className="px-2 py-1.5 bg-white text-slate-400 hover:bg-slate-50 border border-slate-150 rounded-lg text-[10px] font-bold ml-auto"
                              >
                                Vazgeç
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
