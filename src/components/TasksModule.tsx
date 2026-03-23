import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, ListTodo } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export const TasksModule: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('bitig_tasks');
    return saved ? JSON.parse(saved) : [
      { id: '1', text: 'KDV1 Beyannamelerini Kontrol Et', completed: false, createdAt: Date.now() },
      { id: '2', text: 'Yeni Mevzuat Özetini Oku', completed: true, createdAt: Date.now() - 10000 },
      { id: '3', text: 'Müşteri Toplantısı Hazırlığı', completed: false, createdAt: Date.now() - 20000 },
    ];
  });
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    localStorage.setItem('bitig_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('bitig_tasks');
      if (saved) setTasks(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: newTask.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="glass-card p-6 border-kilim-blue-light/30 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-kilim-red/10 rounded-lg">
          <ListTodo className="w-5 h-5 text-kilim-red" />
        </div>
        <h3 className="font-semibold text-kilim-blue-light">Günlük Görevler</h3>
      </div>

      <form onSubmit={addTask} className="relative mb-6">
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
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 max-h-[250px]">
        <AnimatePresence initial={false}>
          {tasks.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm italic">Henüz bir görev eklenmedi.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  task.completed 
                    ? 'bg-slate-50 border-slate-100 opacity-60' 
                    : 'bg-white border-slate-100 hover:border-kilim-red/30 hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 transition-colors ${
                    task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-kilim-red'
                  }`}
                >
                  {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                
                <span className={`flex-1 text-sm transition-all ${
                  task.completed ? 'line-through text-slate-400' : 'text-slate-700'
                }`}>
                  {task.text}
                  {(task as any).date && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      📅 {(task as any).date}
                    </span>
                  )}
                </span>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium uppercase tracking-wider">
        <span>Toplam: {tasks.length}</span>
        <span>Tamamlanan: {tasks.filter(t => t.completed).length}</span>
      </div>
    </div>
  );
};
