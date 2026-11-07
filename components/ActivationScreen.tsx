import React, { useState } from 'react';
import { AuthUser, PaymentConfig } from '../types';

interface ActivationScreenProps {
  user: AuthUser;
  paymentConfig: PaymentConfig;
  onRefreshStatus: () => Promise<void>;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({
  user,
  paymentConfig,
  onRefreshStatus,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isExpired =
    user.expiresAt && new Date(user.expiresAt + 'T23:59:59') < new Date();
  const isOutOfCredits =
    user.status === 'active' && !isExpired && user.credits !== -1 && user.credits <= 0;

  let badgeText = 'In Attesa di Attivazione';
  let badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
  let titleText = `Benvenuto, ${user.name}! Il tuo account è in attesa di abilitazione`;

  if (user.status === 'suspended') {
    badgeText = 'Account Sospeso';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
    titleText = 'Il tuo account è temporaneamente sospeso';
  } else if (isExpired) {
    badgeText = `Abbonamento Scaduto (${user.expiresAt})`;
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
    titleText = 'Il tuo periodo di abbonamento è terminato';
  } else if (isOutOfCredits) {
    badgeText = 'Crediti di Revisione Esauriti';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
    titleText = 'Hai utilizzato tutte le revisioni del tuo pacchetto';
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshStatus();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const copyIban = () => {
    if (!paymentConfig.iban) return;
    navigator.clipboard.writeText(paymentConfig.iban);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Banner */}
        <div className="bg-slate-900 text-white p-8 text-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border mb-4 ${badgeColor}`}
          >
            <i className="fas fa-clock"></i>
            <span>{badgeText}</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-2">{titleText}</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            {paymentConfig.welcomeMessage}
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* Pricing / Plans Box */}
          {paymentConfig.plansText && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-2">
                <i className="fas fa-tags text-emerald-600"></i>
                <span>Piani e Pacchetti di Revisione Disponibili</span>
              </h3>
              <div className="text-slate-800 text-sm whitespace-pre-line leading-relaxed font-medium">
                {paymentConfig.plansText}
              </div>
            </div>
          )}

          {/* Direct Payment & Bank Transfer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option 1: Online Payment Link (Stripe / PayPal) */}
            <div className="border border-slate-200 rounded-2xl p-6 flex flex-col justify-between bg-slate-50/60">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <i className="fas fa-credit-card text-lg"></i>
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">
                  1. Pagamento Rapido Online
                </h4>
                <p className="text-xs text-slate-500 mb-5">
                  Paga con Carta di Credito, PayPal o Stripe per velocizzare l'attivazione dei tuoi
                  crediti di revisione.
                </p>
              </div>

              {paymentConfig.paymentUrl ? (
                <a
                  href={paymentConfig.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center"
                >
                  <i className="fas fa-external-link-alt"></i>
                  <span>Procedi al Pagamento Online</span>
                </a>
              ) : (
                <a
                  href={`mailto:${paymentConfig.contactEmail || 'direzione@serrastudio.it'}?subject=${encodeURIComponent(
                    `Richiesta link pagamento CondoCerta - ${user.name} (${user.email})`
                  )}`}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center"
                >
                  <i className="fas fa-envelope"></i>
                  <span>Richiedi Link Pagamento Rapido</span>
                </a>
              )}
            </div>

            {/* Option 2: Bank Transfer / Direct Contact */}
            <div className="border border-slate-200 rounded-2xl p-6 flex flex-col justify-between bg-slate-50/60">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <i className="fas fa-university text-lg"></i>
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">
                  2. Bonifico Bancario / Studio Serra
                </h4>
                <div className="text-xs text-slate-600 space-y-1.5 mb-4">
                  <p>
                    <strong>Intestatario:</strong> {paymentConfig.bankBeneficiary || 'Studio Serra'}
                  </p>
                  {paymentConfig.iban && (
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-slate-800 text-[11px] break-all">
                        {paymentConfig.iban}
                      </span>
                      <button
                        type="button"
                        onClick={copyIban}
                        className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px] flex-shrink-0"
                      >
                        {copied ? 'Copiato!' : 'Copia'}
                      </button>
                    </div>
                  )}
                  <p>
                    <strong>Causale:</strong> Attivazione CondoCerta - {user.email}
                  </p>
                </div>
              </div>

              <a
                href={`mailto:${paymentConfig.contactEmail || 'direzione@serrastudio.it'}?subject=${encodeURIComponent(
                  `Conferma Pagamento CondoCerta - ${user.name}`
                )}&body=${encodeURIComponent(
                  `Buongiorno Studio Serra,\n\nho registrato l'account ${user.email} (${user.company || user.name}) su CondoCerta e richiedo l'attivazione dei crediti.\n\nCordiali saluti,\n${user.name}\nTel: ${user.phone}`
                )}`}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center"
              >
                <i className="fas fa-paper-plane"></i>
                <span>Invia Contabile / Contatta Studio</span>
              </a>
            </div>
          </div>

          {/* Refresh Status Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Account registrato come <strong>{user.email}</strong>. Non appena l'amministratore
              abilita il tuo profilo, clicca sul pulsante qui accanto per entrare.
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 flex-shrink-0"
            >
              <i className={`fas fa-sync-alt ${refreshing ? 'animate-spin' : ''}`}></i>
              <span>Verifica Stato Attivazione</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
