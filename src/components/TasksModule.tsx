import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, ListTodo, Clock, Calendar, AlertCircle, Loader2 } from 'lucide-react';
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
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any;
  date?: string;
}

export const TasksModule: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/tasks`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    const tasksRef = collection(db, 'users', userId, 'tasks');
    
    try {
      await addDoc(tasksRef, {
        text: newTask.trim(),
        completed: false,
        createdAt: serverTimestamp(),
        date: newTaskDate || null
      });
      setNewTask('');
      setNewTaskDate('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/tasks`);
    }
  };

  const postponeTask = async (id: string, days: number) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const task = tasks.find(t => t.id === id);
    if (task && task.date) {
      const d = new Date(task.date);
      d.setDate(d.getDate() + days);
      try {
        await updateDoc(doc(db, 'users', userId, 'tasks', id), {
          date: d.toISOString().split('T')[0]
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/tasks/${id}`);
      }
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    const today = new Date().toISOString().split('T')[0];
    
    const getPriority = (task: Task) => {
      if (!task.date) return 2;
      if (task.date <= today) return 1;
      return 3;
    };

    const pA = getPriority(a);
    const pB = getPriority(b);

    if (pA !== pB) return pA - pB;

    if (a.date && b.date) {
      return a.date.localeCompare(b.date);
    }

    // Handle serverTimestamp which might be null initially
    const timeA = a.createdAt?.toMillis?.() || Date.now();
    const timeB = b.createdAt?.toMillis?.() || Date.now();
    return timeB - timeA;
  });

  const toggleTask = async (id: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const task = tasks.find(t => t.id === id);
    if (task) {
      try {
        await updateDoc(doc(db, 'users', userId, 'tasks', id), {
          completed: !task.completed
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/tasks/${id}`);
      }
    }
  };

  const deleteTask = async (id: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', userId, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/tasks/${id}`);
    }
  };

  return (
    <div className="glass-card p-6 border-kilim-blue-light/30 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-kilim-red/10 rounded-lg">
          <ListTodo className="w-5 h-5 text-kilim-red" />
        </div>
        <h3 className="font-semibold text-kilim-blue-light">Günlük Görevler</h3>
      </div>

      <form onSubmit={addTask} className="space-y-2 mb-6">
        <div className="relative">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Yeni görev ekle..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-kilim-red/20 focus:border-kilim-red outline-none transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-kilim-red text-white rounded-lg hover:bg-kilim-red/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input 
            type="date"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-kilim-red transition-all"
          />
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 max-h-[300px]">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-kilim-red" />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {sortedTasks.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm italic">Henüz bir görev eklenmedi.</p>
              </div>
            ) : (
              sortedTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group flex flex-col p-3 rounded-xl border transition-all ${
                    task.completed 
                      ? 'bg-slate-50 border-slate-100 opacity-60' 
                      : 'bg-white border-slate-100 hover:border-kilim-red/30 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex-shrink-0 transition-colors ${
                        task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-kilim-red'
                      }`}
                    >
                      {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm transition-all truncate ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-700'
                      }`}>
                        {task.text}
                      </p>
                      {task.date && (
                        <span className={`text-[10px] flex items-center gap-1 mt-0.5 ${
                          new Date(task.date) < new Date() && !task.completed ? 'text-rose-500 font-bold' : 'text-slate-400'
                        }`}>
                          <Calendar className="w-3 h-3" /> {task.date}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {task.date && !task.completed && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => postponeTask(task.id, 1)}
                        className="text-[9px] px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-amber-100 hover:text-amber-700 transition-colors"
                      >
                        Ertele (+1G)
                      </button>
                      <button 
                        onClick={() => postponeTask(task.id, 7)}
                        className="text-[9px] px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        Süre Uzat (+7G)
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium uppercase tracking-wider">
        <span>Toplam: {tasks.length}</span>
        <span>Tamamlanan: {tasks.filter(t => t.completed).length}</span>
      </div>
    </div>
  );
};
