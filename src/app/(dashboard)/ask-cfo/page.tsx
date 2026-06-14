'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  ShieldAlert,
  User,
  Brain
} from 'lucide-react';
import { askCfo } from '@/lib/ai-client';

interface Message {
  id: string;
  sender: 'user' | 'cfo';
  text: string;
}

const SUGGESTIONS = [
  'Can I afford to restock this week?',
  'Why did my cashflow drop recently?',
  'What expenses should I watch?',
  'How can I improve my credit readiness?',
  'What was my best sales period?',
  'Am I spending too much on inventory?',
];

export default function AskCfoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSuggestionClick = (prompt: string) => {
    if (!loading) {
      setInput(prompt);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

    
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query
    };

    
    setMessages((prev) => [...prev, userMsg].slice(-10));
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await askCfo(query);
      
      const cfoMsg: Message = {
        id: `cfo-${Date.now()}`,
        sender: 'cfo',
        text: res.answer
      };

      
      setMessages((prev) => [...prev, cfoMsg].slice(-10));
    } catch (err) {
      
      setError(err instanceof Error ? err.message : 'Could not answer that right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-[900px] mx-auto space-y-4">
      
      <div className="shrink-0 flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Ask CFO</h1>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Sparkles className="w-2.5 h-2.5 shrink-0" />
              Grounded
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Ask questions about your cashflow, sales, expenses, and credit readiness.
          </p>
        </div>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block">
          Answers are based on your recorded business data.
        </span>
      </div>

      
      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-0">
        
        
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 min-h-0">
          
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Brain className="w-6 h-6 shrink-0" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 text-sm">Ask a question to understand your business better</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Get details about restocking runway, revenue trends, expense optimization, or loan readiness backed by actual transactions.
                </p>
              </div>

              
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    className="p-3 text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 max-w-[85%] ${
                      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-xs font-semibold
                        ${isUser 
                          ? 'bg-slate-100 text-slate-700 border-slate-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : 'IQ'}
                    </div>

                    
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap
                        ${isUser
                          ? 'bg-slate-900 text-white rounded-tr-none'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          
          {loading && (
            <div className="flex items-start gap-2.5 mr-auto max-w-[85%] animate-pulse">
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[10px] text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 space-y-1.5 min-w-[200px]">
                <p className="font-medium flex items-center gap-1.5">
                  Analyzing your business data...
                </p>
                <div className="space-y-1">
                  <div className="h-2 bg-slate-200 rounded w-full" />
                  <div className="h-2 bg-slate-200 rounded w-5/6" />
                </div>
              </div>
            </div>
          )}

          
          <div ref={messagesEndRef} />
        </div>

        
        {messages.length > 0 && !loading && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide shrink-0">Suggestions:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="px-2.5 py-1 text-[10px] font-medium bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-600 transition-colors shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        
        {error && (
          <div className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div className="space-y-0.5">
              <p className="font-semibold text-red-950">Could not answer that right now</p>
              <p className="text-red-700/90">{error}</p>
            </div>
          </div>
        )}

        
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 items-end shrink-0">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask something like: Can I afford to buy ₦200,000 worth of stock next week?"
            className="flex-1 max-h-[80px] min-h-[40px] px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-100 resize-none transition-shadow"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl transition-colors shrink-0"
            title="Ask CFO"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      
      <div className="shrink-0 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center px-4 py-1">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          MerchantIQ provides business guidance based on available records. It does not guarantee profit or loan approval.
        </span>
      </div>
    </div>
  );
}
