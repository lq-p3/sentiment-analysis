import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Loader2, AlertTriangle, X, Sparkles } from 'lucide-react';
import { askAiAssistant } from '../services/aiChatService';
import { CityAnalysisData } from '../types';

interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ReportAIChatProps {
  reportData: CityAnalysisData | null;
  direction?: 'ltr' | 'rtl';
}

export const ReportAIChat: React.FC<ReportAIChatProps> = ({ reportData, direction = 'rtl' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef<boolean>(false);

  // Settings
  const aiEnabled = localStorage.getItem('aiEnabled') !== 'false';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (!aiEnabled || !reportData || isInitialized.current) {
        if (!aiEnabled) setIsLoading(false);
        return;
    }
    
    isInitialized.current = true;
    generateInitialSummary();
  }, [reportData, aiEnabled]);

  const generateInitialSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await askAiAssistant(reportData, null);
      if (response.success) {
        setMessages([
          { id: Date.now().toString(), role: 'assistant', content: response.message }
        ]);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("تعذر الاتصال بالمساعد الذكي السحابي.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await askAiAssistant(reportData, userMessage);
      if (response.success) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: response.message }]);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("فشل في استلام الرد. يرجى التأكد من توفر الخادم.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!aiEnabled) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div 
        className={`fixed bottom-6 ${direction === 'rtl' ? 'left-6' : 'right-6'} z-50 transition-all duration-300 ${isOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-16 h-16 bg-primary text-white rounded-full shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all duration-300"
        >
          <Sparkles className="absolute top-3 right-3 w-4 h-4 text-yellow-300 animate-pulse" />
          <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform" />
          
          {/* Unread dot indicator (if needed, simulating attention) */}
          {messages.length > 0 && (
             <span className="absolute top-0 right-0 flex h-4 w-4">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
             </span>
          )}
        </button>
      </div>

      {/* Floating Chat Panel */}
      <div 
        className={`fixed bottom-6 ${direction === 'rtl' ? 'left-6' : 'right-6'} z-50 w-96 h-[600px] max-h-[80vh] flex flex-col bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 transition-all duration-400 origin-bottom-left ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-20 pointer-events-none'
        } ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
        dir={direction}
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/90 p-4 rounded-t-3xl border-b border-primary/20 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight">المستشار السياحي</h3>
              <span className="text-white/80 text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Gemini API
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50/90 text-red-600 p-3 mx-4 mt-4 rounded-xl text-sm flex items-start gap-2 border border-red-100/50 backdrop-blur-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Messages Window */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-sm' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm p-4 shadow-sm flex gap-2 items-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs text-gray-400 font-medium tracking-wide">الذكاء الاصطناعي يحلل البيانات...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <form onSubmit={handleSend} className="p-3 bg-white/50 backdrop-blur-md rounded-b-3xl border-t border-gray-100">
          <div className="flex relative items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || !!error}
              placeholder="اسأل المستشار عن تفاصيل التقرير..."
              className="w-full bg-white/80 border border-gray-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 shadow-sm"
              dir={direction}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !!error}
              className={`absolute ${direction === 'rtl' ? 'left-2' : 'right-2'} p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:scale-100 hover:scale-105 shadow-md shadow-primary/20 transition-all flex items-center justify-center`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
