import React, { useState, useRef, useEffect } from 'react';
import { Send, Library, User, Loader2, Mic, MicOff, X, Minimize2, Maximize2, Eraser } from 'lucide-react';
import { askCopilotStream } from '../services/geminiService';
import { handleAssistantAction } from '../services/actionService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

interface FloatingChatProps {
  isOpen: boolean;
  onClose: () => void;
  companies?: any[];
  userId?: string;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ isOpen, onClose, companies = [], userId }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Merhaba! Ben size her konuda yardımcı olmaya hazır akıllı asistanınızım. Nasıl yardımcı olabilirim?' }
  ]);
  const [input, setInput] = useState('');
  const [isAnyLoading, setIsAnyLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsgText = textToSend;
    const userMsgId = Date.now().toString();
    const botMsgId = (Date.now() + 1).toString();
    
    setInput('');
    setMessages(prev => [
      ...prev, 
      { id: userMsgId, role: 'user', text: userMsgText },
      { id: botMsgId, role: 'model', text: '', isStreaming: true }
    ]);
    
    setIsAnyLoading(true);
    setIsSearching(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const stream = await askCopilotStream(userMsgText, history, companies);
      
      setIsSearching(false);
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk.text || '';
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, text: fullText } : m
        ));
      }
      
      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { ...m, isStreaming: false } : m
      ));

      const actionRegex = /\[ACTION: (.*?)\]/g;
      let match;
      while ((match = actionRegex.exec(fullText)) !== null) {
        try {
          const actionData = JSON.parse(match[1]);
          if (userId) {
            await handleAssistantAction(actionData, userId, companies);
          }
        } catch (e) {
          console.error("Action parse error:", e);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { ...m, text: 'Bir hata oluştu. Lütfen tekrar deneyin.', isStreaming: false } : m
      ));
      setIsSearching(false);
    } finally {
      setMessages(prev => {
        const stillStreaming = prev.some(m => m.isStreaming);
        if (!stillStreaming) setIsAnyLoading(false);
        return prev;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-24 right-6 w-[350px] sm:w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[500px]'}`}
    >
      {/* Header */}
      <div className="p-4 bg-kilim-red text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Library className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Hızlı Danışman</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-rose-100">Çevrimiçi</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setMessages([{ id: '1', role: 'model', text: 'Merhaba! Ben size her konuda yardımcı olmaya hazır akıllı asistanınızım. Nasıl yardımcı olabilirim?' }])}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Temizle"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-slate-200' : 'bg-rose-50'
                  }`}>
                    {msg.role === 'user' ? <User className="w-3 h-3 text-slate-600" /> : <Library className="w-3 h-3 text-kilim-red" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-kilim-red text-white rounded-tr-none shadow-md' 
                      : 'bg-white text-slate-800 rounded-tl-none shadow-sm border border-slate-100'
                  }`}>
                    {msg.isStreaming && !msg.text ? (
                      <div className="flex items-center gap-2 py-1">
                        <Loader2 className="w-3 h-3 animate-spin text-kilim-red" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {isSearching ? 'Taranıyor...' : 'Düşünüyor...'}
                        </span>
                      </div>
                    ) : (
                      <div className="markdown-body">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Sorunuzu yazın..."
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-kilim-red/20 focus:border-kilim-red outline-none transition-all text-xs"
                />
                <button 
                  onClick={toggleRecording}
                  className={`absolute right-2 p-1.5 rounded-lg transition-colors ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isAnyLoading}
                className="p-2.5 bg-kilim-red text-white rounded-2xl hover:bg-kilim-red/90 transition-colors disabled:opacity-50 shadow-lg shadow-kilim-red/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};
