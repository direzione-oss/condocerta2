import React from 'react';
import { AuthUser } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user?: AuthUser | null;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  pendingCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  onLogout,
  onOpenAdmin,
  pendingCount = 0,
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
              <i className="fas fa-file-shield text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CondoCerta</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">
                Il Revisore Digitale ANACI-Oriented
              </p>
            </div>
          </div>

          {user && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Credits & Expiration Badge */}
              <div className="hidden md:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
                <i className="fas fa-coins text-emerald-400"></i>
                <span className="text-slate-300">Crediti:</span>
                <span className="font-bold text-white">
                  {user.role === 'admin' || user.credits === -1
                    ? 'Illimitati'
                    : `${user.credits} revision${user.credits === 1 ? 'e' : 'i'}`}
                </span>
                {user.expiresAt && (
                  <span className="text-slate-400 border-l border-slate-700 pl-2">
                    Scad: {user.expiresAt}
                  </span>
                )}
              </div>

              {/* Admin Panel Button */}
              {user.role === 'admin' && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="relative px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-sm"
                >
                  <i className="fas fa-user-shield"></i>
                  <span>Gestione Utenti & Pagamenti</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-600 text-white font-extrabold animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Info & Logout */}
              <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-3 py-1.5 border border-slate-700/70">
                <div className="text-right">
                  <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {user.company || user.email}
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Esci dall'account"
                    className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">{children}</main>

      <footer className="bg-slate-100 border-t border-slate-200 py-6">
        <div className="container mx-auto px-4 text-center text-slate-500 text-xs">
          <p>
            &copy; {new Date().getFullYear()} CondoCerta — Studio Serra — In conformità con Art. 1130
            bis C.C.
          </p>
        </div>
      </footer>
    </div>
  );
};
