
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-file-shield text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CondoAudit AI</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">Il Revisore Digitale ANACI-Oriented</p>
            </div>
          </div>
          {/* Navigation links removed as requested */}
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 py-6">
        <div className="container mx-auto px-4 text-center text-slate-500 text-xs">
          <p>&copy; 2024 CondoAudit AI - In conformità con Art. 1130 bis C.C. - Powered by Gemini Engine</p>
        </div>
      </footer>
    </div>
  );
};
