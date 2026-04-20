
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, AlertTriangle, Gavel, ListTodo } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type: 'legislation' | 'calendar' | 'task' | 'info';
}

let toastListener: ((message: ToastMessage) => void) | null = null;

export const showToast = (title: string, body: string, type: ToastMessage['type']) => {
  if (toastListener) {
    toastListener({
      id: Math.random().toString(36).substr(2, 9),
      title,
      body,
      type
    });
  }
};

export const NotificationToast: React.FC = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== msg.id));
      }, 8000);
    };
    return () => { toastListener = null; };
  }, []);

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'legislation': return <Gavel className="w-5 h-5 text-purple-500" />;
      case 'calendar': return <Bell className="w-5 h-5 text-amber-500" />;
      case 'task': return <ListTodo className="w-5 h-5 text-rose-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = (type: ToastMessage['type']) => {
    switch (type) {
      case 'legislation': return 'border-purple-200';
      case 'calendar': return 'border-amber-200';
      case 'task': return 'border-rose-200';
      default: return 'border-blue-200';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto w-80 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border-l-4 ${getBorderColor(msg.type)} flex gap-4 relative overflow-hidden`}
          >
            <div className="flex-shrink-0 pt-1">
              {getIcon(msg.type)}
            </div>
            <div className="flex-1 pr-4">
              <h4 className="text-sm font-black text-slate-800 tracking-tight">{msg.title}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{msg.body}</p>
            </div>
            <button 
              onClick={() => removeToast(msg.id)}
              className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 8, ease: 'linear' }}
                className={`h-full ${
                  msg.type === 'legislation' ? 'bg-purple-500' : 
                  msg.type === 'calendar' ? 'bg-amber-500' : 
                  msg.type === 'task' ? 'bg-rose-500' : 'bg-blue-500'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
