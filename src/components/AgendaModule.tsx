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
  AlertTriangle
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
  category: 'İş' | 'Kişisel' | 'Mükellef' | 'Maliye' | 'Genel';
  completed: boolean;
  date: string;
  createdAt: any;
}

export const AgendaModule: React.FC = () => {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'İş' | 'Kişisel' | 'Mükellef' | 'Maliye' | 'Genel'>('İş');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFilter, setSelectedFilter] = useState<'Tümü' | 'İş' | 'Kişisel' | 'Mükellef' | 'Maliye' | 'Genel'>('Tümü');
  const [isRecording, setIsRecording] = useState(false);
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

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewNote((prev) => (prev ? `${prev} ${transcript}` : transcript));
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
          agendaData.push({ id: docRef.id, ...docRef.data() } as AgendaItem);
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
        createdAt: serverTimestamp()
      });
      setNewNote('');
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

  const filteredItems = items.filter(item => {
    if (selectedFilter === 'Tümü') return true;
    return item.category === selectedFilter;
  });

  const getCategoryTheme = (category: string) => {
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
      case 'Mükellef':
        return {
          bg: 'bg-rose-50 border-rose-100 text-rose-700',
          badge: 'bg-rose-100 text-rose-800',
          icon: User
        };
      case 'Maliye':
        return {
          bg: 'bg-amber-50 border-amber-100 text-amber-700',
          badge: 'bg-amber-100 text-amber-800',
          icon: FileText
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-100 text-slate-700',
          badge: 'bg-slate-100 text-slate-800',
          icon: FileText
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Notebook className="w-5 h-5 text-orange-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base uppercase tracking-tight">Kişisel ve Mesleki Ajanda</h3>
            <p className="text-[11px] text-slate-400 font-medium">Bireysel işleriniz, mükellef takipleri ve mali ajanda notları listesi.</p>
          </div>
        </div>
        
        {/* Quick Summary Badges */}
        <div className="flex items-center gap-3.5 text-xs text-slate-400 font-bold bg-slate-50 p-2 rounded-xl border border-slate-200/40">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> İş : {items.filter(i => i.category === 'İş').length}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Kişisel : {items.filter(i => i.category === 'Kişisel').length}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Mükellef : {items.filter(i => i.category === 'Mükellef').length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Input Form Column */}
        <div className="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-6 space-y-4">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Yeni Ajanda Notu</h4>
          <form onSubmit={addAgendaItem} className="space-y-4">
            {/* Note Text area */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase">Not & Detay</label>
              <div className="relative">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Sehven kesilen faturayı incele, Yaman Dede anmasına davet hazırlığı yap..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-450 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                  required
                />
                
                {/* Speech recognition toggle */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`absolute right-2 bottom-3 p-1.5 rounded-lg transition-all ${isRecording ? 'bg-orange-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-150'}`}
                  title="Sesle Yaz"
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Note Category Selection Grid */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase">Kategori</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['İş', 'Kişisel', 'Mükellef', 'Maliye', 'Genel'] as const).map((cat) => {
                  const isActive = newNoteCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewNoteCategory(cat)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        isActive 
                          ? 'bg-orange-500 text-white border-orange-500' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Calendar due selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase">Ajanda Tarihi</label>
              <div className="flex items-center gap-2 border border-slate-250 bg-slate-50/50 p-2 rounded-xl">
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
              Notu Ajandaya Ekle
            </button>
          </form>
        </div>

        {/* Display List Column */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          {/* Quick Filter Selection tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start overflow-x-auto max-w-full">
            {(['Tümü', 'İş', 'Kişisel', 'Mükellef', 'Maliye', 'Genel'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
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
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[350px] pr-1.5 custom-scrollbar">
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
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.98, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`group flex items-start gap-4 p-4 border rounded-2xl transition-all ${
                        item.completed 
                          ? 'bg-slate-50/50 border-slate-100 opacity-60' 
                          : 'bg-white border-slate-150 hover:shadow-md hover:shadow-slate-100 hover:border-orange-250'
                      }`}
                    >
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
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-[8.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md flex items-center gap-1 ${theme.badge}`}>
                            <Icon className="w-2.5 h-2.5" />
                            {item.category}
                          </span>
                          
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                            isPast ? 'bg-rose-50 text-rose-700 font-extrabold border border-rose-100' : 'bg-slate-50 text-slate-500'
                          }`}>
                            <Calendar className="w-2.5 h-2.5" />
                            {item.date} {isPast && '(Günü Geçti)'}
                          </span>
                        </div>

                        <p className={`text-xs font-medium leading-relaxed break-words whitespace-pre-wrap ${
                          item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}>
                          {item.text}
                        </p>
                      </div>

                      {/* Delete action button */}
                      <button
                        onClick={() => deleteAgendaItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
