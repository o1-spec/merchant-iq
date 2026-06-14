export function Header() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4 md:hidden">
        
        <span className="font-bold text-primary">MerchantIQ</span>
      </div>
      
      <div className="flex-1 flex justify-end items-center gap-6">
        <div className="hidden md:flex relative w-64">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" placeholder="Search transactions..." className="w-full pl-9 pr-4 py-2 bg-muted border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" />
        </div>
        
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            JD
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">John Doe</p>
            <p className="text-xs text-muted-foreground mt-1">Acme Corp</p>
          </div>
        </div>
      </div>
    </header>
  );
}
