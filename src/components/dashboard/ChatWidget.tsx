'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Brain,
  Trash2,
  Sparkles,
  User,
  AlertCircle
} from 'lucide-react';
import { MarkdownFormatter } from '@/components/ui/MarkdownFormatter';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

const WIDGET_SUGGESTIONS = [
  'Can I afford to restock Ma?',
  'Why did cashflow drop?',
  'How to raise my credit score?',
  'What was my best sales day?',
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch past messages on mount/open
  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen]);

  // Scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const fetchChatHistory = async () => {
    setIsFetchingHistory(true);
    setError(null);
    try {
      const res = await fetch('/api/chat/messages');
      const json = await res.json();
      if (res.ok && json.success) {
        setMessages(json.data.messages || []);
      } else {
        setError(json.error || 'Failed to load chat history');
      }
    } catch (err) {
      setError('Could not connect to server.');
      console.error(err);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isLoading) return;

    setInput('');
    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update messages
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to get answer');
      }

      const { userMessage, modelMessage } = json.data;

      // Replace optimistic message and add model response
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== tempUserMsg.id)
          .concat([userMessage, modelMessage])
      );
    } catch (err: any) {
      setError(err.message || 'Could not send message. Please try again.');
      // Remove temp message so user can retry
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear your chat history?')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat/messages', { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        setMessages([]);
      } else {
        setError(json.error || 'Failed to clear history');
      }
    } catch (err) {
      setError('Failed to clear chat history.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Chat Window Container */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300 transform scale-100 origin-bottom-right animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3.5 flex items-center justify-between text-white shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <Brain className="w-4.5 h-4.5 text-slate-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-wide">MerchantIQ CFO</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-300 font-medium">Your Bank Statement CFO</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 min-h-0">
            {isFetchingHistory ? (
              <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                <span className="text-xs font-semibold">Loading history...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900">
                  <Sparkles className="w-5 h-5 shrink-0" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-850 text-xs">Ask CFO anything about your business</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-[240px]">
                    I can advise you on stock budgets, credit readiness, or top sales trends.
                  </p>
                </div>
                <div className="w-full grid grid-cols-1 gap-1.5 pt-2">
                  {WIDGET_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="p-2.5 text-left text-[11px] bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium transition-all hover:translate-x-1"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold
                          ${isUser
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                      >
                        {isUser ? <User className="w-3 h-3" /> : 'IQ'}
                      </div>

                      <div
                        className={`rounded-2xl px-3 py-2 text-[11px] leading-relaxed shadow-xs
                          ${isUser
                            ? 'bg-slate-900 text-white rounded-tr-none whitespace-pre-wrap'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}
                      >
                        {isUser ? msg.content : <MarkdownFormatter content={msg.content} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isLoading && (
              <div className="flex items-start gap-2 mr-auto max-w-[85%] animate-pulse">
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3 py-2 text-[11px] text-slate-500 space-y-1 min-w-[150px]">
                  <p className="font-semibold text-slate-700 flex items-center gap-1">
                    CFO is calculating...
                  </p>
                  <div className="space-y-1">
                    <div className="h-1.5 bg-slate-200 rounded w-full" />
                    <div className="h-1.5 bg-slate-200 rounded w-4/5" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions footer (if has messages) */}
          {messages.length > 0 && !isLoading && (
            <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/50 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
              {WIDGET_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="px-2.5 py-1 text-[10px] font-medium bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-655 transition-colors shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mx-3 mt-1.5 flex items-start gap-1.5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-2.5 text-[10px] shrink-0">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-red-950">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-end shrink-0">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask CFO..."
              className="flex-1 max-h-[60px] min-h-[36px] px-3 py-2 text-[11px] border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 resize-none transition-shadow"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-9 h-9 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl transition-colors shrink-0 shadow-sm"
              title="Send"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200 border border-slate-700/20"
        title={isOpen ? 'Close CFO Assistant' : 'Ask AI CFO'}
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-in spin-in-90 duration-200" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-500"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
