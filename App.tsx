
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { AuditDashboard } from './components/AuditDashboard';
import { analyzeFinancialDocuments } from './services/geminiService';
import { AuditReport, AppState, FileData } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LOCKED);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyCode = async () => {
    if (!accessCode) return;
    if (accessCode === 'ADMIN2026') {
      setState(AppState.ADMIN);
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la verifica');
      }
      
      setState(AppState.IDLE);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    if (selectedFiles.length === 0) return;
    
    setState(AppState.ANALYZING);
    setError(null);

    try {
      const result = await analyzeFinancialDocuments(selectedFiles, accessCode);
      
      setReport(result);
      setState(AppState.REPORT_READY);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      const errorMsg = err.message || "Si è verificato un errore sconosciuto.";
      setError(`Errore durante l'analisi: ${errorMsg}`);
      setState(AppState.ERROR);
    }
  };

  const reset = () => {
    setState(AppState.IDLE);
    setSelectedFiles([]);
    setReport(null);
    setError(null);
  };

  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNewCode = async (count: number = 1) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ADMIN2026', count })
      });
      const data = await response.json();
      if (response.ok) {
        setGeneratedCodes(data.codes || [data.code]); // Fallback se il backend è in cache
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Errore generazione");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout>
      {/* Valore Professionale Section visibile su LOCKED e IDLE */}
      {(state === AppState.LOCKED || state === AppState.IDLE) && (
        <div className="max-w-4xl mx-auto bg-emerald-50 border border-emerald-100 rounded-3xl p-8 md:p-12 shadow-sm mt-8 mb-4 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
              <i className="fas fa-certificate text-emerald-500 text-3xl"></i>
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Perché questa App è preziosa?</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Come specificato nella Premessa della <strong>Guida ANACI (Pag. 2)</strong>, l'Associazione mira a differenziare il 
                <span className="text-emerald-700 font-semibold italic"> "professionista" </span> dall'improvvisato.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Questa app non si limita a controllare i conti, ma certifica che il rendiconto sia uno strumento di 
                <span className="text-emerald-700 font-bold"> "valenza etica e professionale"</span>, 
                fornendo all'amministratore un supporto concreto per ridurre drasticamente il contenzioso giudiziario e 
                garantire la massima trasparenza ai condomini.
              </p>
            </div>
          </div>
        </div>
      )}

      {state === AppState.LOCKED && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-lg border border-slate-100 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-lock text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Accesso Protetto</h2>
            <p className="text-slate-500 mb-8 text-sm">Inserisci il codice monouso per sbloccare l'analisi del rendiconto.</p>
            
            <input 
              type="text" 
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Inserisci il codice..."
              className="w-full text-center text-2xl font-bold tracking-widest p-4 rounded-xl border border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all mb-4 uppercase"
              onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
            />
            
            {error && (
              <div className="text-rose-500 text-sm mb-4 font-medium p-3 bg-rose-50 rounded-lg">
                {error}
              </div>
            )}

            <button 
              onClick={verifyCode}
              disabled={!accessCode || isVerifying}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 transition disabled:opacity-50"
            >
              {isVerifying ? 'Verifica in corso...' : 'Sblocca'}
            </button>
          </div>
        </div>
      )}

      {state === AppState.ADMIN && (
        <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-lg border border-emerald-100 text-center">
             <h2 className="text-2xl font-bold text-emerald-800 mb-6">Pannello Amministrazione</h2>
             <p className="text-slate-600 mb-6">Da qui puoi generare i codici usa e getta da inviare ai tuoi clienti. Ogni codice è valido per una singola analisi.</p>
             
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
               <button 
                 onClick={() => generateNewCode(1)} 
                 disabled={isGenerating}
                 className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-sm transition"
               >
                 Genera 1 Codice
               </button>
               <button 
                 onClick={() => generateNewCode(10)} 
                 disabled={isGenerating}
                 className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-sm transition"
               >
                 Genera Pacchetto da 10
               </button>
             </div>

             {generatedCodes.length > 0 && (
               <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl mb-8 text-left max-h-64 overflow-y-auto">
                 <p className="text-sm font-bold text-emerald-800 mb-4 border-b border-emerald-200 pb-2">
                   {generatedCodes.length === 1 ? 'Codice Generato:' : `${generatedCodes.length} Codici Generati:`}
                 </p>
                 <div className="space-y-2">
                   {generatedCodes.map((code, i) => (
                     <div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-emerald-100">
                       <span className="text-xl font-extrabold text-slate-800 tracking-widest">{code}</span>
                       <button 
                         onClick={() => navigator.clipboard.writeText(code)}
                         className="text-xs text-emerald-600 hover:text-emerald-800 uppercase font-bold"
                       >
                         Copia
                       </button>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <div className="border-t border-slate-100 pt-6">
               <button onClick={() => { setState(AppState.LOCKED); setAccessCode(''); setGeneratedCodes([]); }} className="text-slate-500 underline text-sm hover:text-slate-800">Torna al Lucchetto</button>
             </div>
          </div>
        </div>
      )}

      {state === AppState.IDLE && (
        <div className="space-y-12 py-4 animate-in fade-in duration-500">

          <div className="text-center">
            <div className="max-w-3xl mx-auto px-4">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-6">Versione Professionale ANACI-Oriented</span>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Certifica il tuo Rendiconto</h2>
              <p className="text-slate-500 text-lg mb-12">
                Analizza la trasparenza, la contabilità e la conformità legale dei tuoi rendiconti condominiali caricando i file che compongono il fascicolo.
              </p>
              
              <FileUpload onFilesSelect={handleFilesSelect} isLoading={false} />

              {selectedFiles.length > 0 && (
                <div className="mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-left max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
                  <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">File Selezionati ({selectedFiles.length})</h4>
                  <ul className="space-y-2 mb-6">
                    {selectedFiles.map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <i className="fas fa-file-pdf text-rose-500 flex-shrink-0"></i>
                          <span className="text-sm font-medium text-slate-600 truncate">{file.name}</span>
                        </div>
                        <button 
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={startAnalysis}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <i className="fas fa-brain"></i>
                    <span>Avvia Revisione Digitale</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {state === AppState.ANALYZING && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-brain text-emerald-600 text-2xl animate-pulse"></i>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800">Elaborazione in corso...</h3>
            <p className="text-slate-500 text-sm mt-2">L'IA sta eseguendo l'OCR e analizzando la struttura secondo l'Art. 1130 bis C.C.</p>
            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                <i className="fas fa-check text-emerald-500"></i>
                <span>Estrazione testi e tabelle da {selectedFiles.length} documenti</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                <i className="fas fa-sync animate-spin text-emerald-500"></i>
                <span>Verifica "Trinità Documentale"</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                <i className="fas fa-shield-halved text-slate-300"></i>
                <span>Incrocio quadrature finanziarie</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {state === AppState.REPORT_READY && report && (
        <AuditDashboard report={report} onReset={reset} />
      )}

      {state === AppState.ERROR && (
        <div className="max-w-md mx-auto py-12 text-center bg-white rounded-2xl border border-rose-100 p-8 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-exclamation-circle text-3xl"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Errore di Analisi</h3>
          <p className="text-slate-500 text-sm mb-8">{error}</p>
          <button 
            onClick={() => setState(AppState.IDLE)}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition"
          >
            Riprova
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
