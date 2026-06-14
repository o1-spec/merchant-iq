'use client';

import { useState } from 'react';
import { CFOChatModal } from '@/components/ai/CFOChatModal';

export function AIInsightCard() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
        <div className="bg-muted/50 px-6 py-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Financial Intelligence</h2>
          </div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted px-2 py-1 rounded-sm border border-border">Gemini AI</span>
        </div>
        
        <div className="p-6 space-y-5 flex-1">
          <div className="flex gap-4">
            <div className="mt-0.5 text-amber-500 bg-amber-500/10 p-1.5 rounded-md h-fit">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">Cashflow Forecast</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Based on recent supplier payments, a 15% cash flow gap is projected by next Wednesday. Review upcoming invoices to mitigate.
              </p>
            </div>
          </div>
          
          <div className="w-full h-px bg-border"></div>

          <div className="flex gap-4">
            <div className="mt-0.5 text-primary bg-primary/10 p-1.5 rounded-md h-fit">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">Growth Opportunity</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Customer retention has increased by 8%. Implementing a loyalty tier this weekend could yield an estimated ₦120,000 in additional revenue.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-border bg-muted/20">
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-background border border-border hover:bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Ask Financial Assistant
          </button>
        </div>
      </div>

      <CFOChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
