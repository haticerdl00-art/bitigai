import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Mic, MicOff, CheckCircle2 } from 'lucide-react';
import { askCopilotStream } from '../services/geminiService';
import { handleAssistantAction } from '../services/actionService';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export const ChatModule = ({ companies = [] }: { companies?: any[] }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Merhaba! Ben eylem odaklı akıllı asistanınızım. Size mevzuat danışmanlığı yapabilir, notlarınızı kaydedebilir veya beyanname süreçlerinizi takip edebilirim. Nasıl yardımcı olabilirim?' }
  ]);
  const [input, setInput] = useState('');
  const [isAnyLoading, setIsAnyLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const suggestedQuestions = [
    "KDV beyannamesi verildi olarak işaretle",
    "X firması için 'Fatura eksik' notu ekle",
    "2026 asgari ücret maliyeti nedir?",
    "Yeni bir not kaydet: Yarın SGK ödemesi var"
  ];

  // Speech Recognition Setup
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

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
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
    
    // Add user message and a placeholder for bot response
    setMessages(prev => [
      ...prev, 
      { id: userMsgId, role: 'user', text: userMsgText },
      { id: botMsgId, role: 'model', text: '', isStreaming: true }
    ]);
    
    setIsAnyLoading(true);
    setIsSearching(true);

    try {
      // Get history (excluding the messages we just added)
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      
      const stream = await askCopilotStream(userMsgText, history, companies);
      
      setIsSearching(false);
      let fullText = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text || '';
        fullText += chunkText;
        
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, text: fullText } : m
        ));
      }
      
      // Mark as finished
      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { ...m, isStreaming: false } : m
      ));

      // Parse actions from the final response
      const actionRegex = /\[ACTION: (.*?)\]/g;
      let match;
      while ((match = actionRegex.exec(fullText)) !== null) {
        try {
          const actionData = JSON.parse(match[1]);
          handleAssistantAction(actionData);
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
      // Check if any other messages are still streaming
      setMessages(prev => {
        const stillStreaming = prev.some(m => m.isStreaming);
        if (!stillStreaming) setIsAnyLoading(false);
        return prev;
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] glass-card overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-kilim-red flex items-center justify-center">
            <Bot className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">DANIŞMANA SOR</h3>
            <p className="text-[10px] sm:text-xs text-kilim-red font-medium">Yapay Zeka Destekli Asistan (Pro)</p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ id: '1', role: 'model', text: 'Merhaba! Ben eylem odaklı akıllı asistanınızım. Size mevzuat danışmanlığı yapabilir, notlarınızı kaydedebilir veya beyanname süreçlerinizi takip edebilirim. Nasıl yardımcı olabilirim?' }])}
          className="ml-auto text-[10px] font-bold text-slate-400 hover:text-kilim-red transition-colors uppercase tracking-wider"
        >
          Sohbeti Temizle
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-slate-200' : 'bg-rose-50'
              }`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5 sm:w-4 h-4 text-slate-600" /> : <Bot className="w-3.5 h-3.5 sm:w-4 h-4 text-kilim-red" />}
              </div>
              <div className={`p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-kilim-red text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none shadow-sm'
              }`}>
                {msg.isStreaming && !msg.text ? (
                  <div className="flex flex-col gap-2 py-1">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-kilim-red" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isSearching ? 'Resmi Kaynaklar Sorgulanıyor...' : 'Yanıt Hazırlanıyor...'}
                      </span>
                    </div>
                    {isSearching && (
                      <p className="text-[9px] text-slate-400 italic">
                        GİB, SGK, TÜRMOB ve Bakanlık verileri taranıyor...
                      </p>
                    )}
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

      <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
        {suggestedQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => { handleSend(q); }}
            className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-medium text-slate-600 hover:border-kilim-red hover:text-kilim-red transition-all shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Sorunuzu buraya yazın..."
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-kilim-red/20 focus:border-kilim-red outline-none transition-all"
            />
            <button 
              onClick={toggleRecording}
              className={`absolute right-2 p-2 rounded-lg transition-colors ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-100'}`}
              title={isRecording ? "Kaydı Durdur" : "Sesli Komut"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isAnyLoading}
            className="p-3 bg-kilim-red text-white rounded-xl hover:bg-kilim-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Yapay zeka hatalı bilgi üretebilir. Önemli kararlar için resmi mevzuatı kontrol ediniz.
        </p>
      </div>
    </div>
  );
};
