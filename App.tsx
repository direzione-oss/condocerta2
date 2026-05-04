
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { AuditDashboard } from './components/AuditDashboard';
import { analyzeFinancialDocuments } from './services/geminiService';
import { AuditReport, AppState, FileData } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const result = await analyzeFinancialDocuments(selectedFiles);
      
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

  return (
    <Layout>
      {state === AppState.IDLE && (
        <div className="space-y-12 py-8 animate-in fade-in duration-500">
          {/* Valore Professionale Section */}
          <div className="max-w-4xl mx-auto bg-emerald-50 border border-emerald-100 rounded-3xl p-8 md:p-12 shadow-sm">
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
