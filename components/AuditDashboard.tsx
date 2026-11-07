
import React, { useState } from 'react';
import { AuditReport } from '../types';
import { generatePdfReport, generateCertificatePdf } from '../services/pdfService';

interface AuditDashboardProps {
  report: AuditReport;
  onReset: () => void;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ report, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isCertExporting, setIsCertExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generatePdfReport(report);
    } catch (error) {
      console.error("Errore durante l'esportazione PDF:", error);
      alert("Si è verificato un errore durante la creazione del PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCertExport = async () => {
    setIsCertExporting(true);
    try {
      await generateCertificatePdf(report);
    } catch (error) {
      console.error("Errore certificato:", error);
      alert("Errore nella generazione del certificato.");
    } finally {
      setIsCertExporting(false);
    }
  };

  const getTrafficLightColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getTrafficLightIcon = (score: number) => {
    if (score >= 70) return 'fa-circle-check';
    if (score >= 40) return 'fa-triangle-exclamation';
    return 'fa-circle-xmark';
  };

  const getScoreStatusLabel = (score: number) => {
    if (score >= 70) return 'Professionale / Eccellente';
    if (score >= 40) return 'Necessita Miglioramenti';
    return 'Critico / Non Conforme';
  };

  const getItemScoreColor = (score: number) => {
    if (score >= 15) return 'text-emerald-600';
    if (score >= 10) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Overview Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 flex flex-col md:flex-row md:items-center justify-between text-white">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Rapporto di Revisione Digitale</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300 text-sm">
              <span className="flex items-center"><i className="fas fa-building mr-2 text-emerald-400"></i> {report.condoName}</span>
              <span className="flex items-center"><i className="fas fa-calendar-alt mr-2 text-emerald-400"></i> {report.managementPeriod}</span>
            </div>
            <p className="text-slate-400 text-[10px] mt-2">Amministratore: <span className="text-emerald-400 font-bold">{report.administratorName}</span></p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
             <button 
              onClick={handleCertExport}
              disabled={isCertExporting}
              className="text-xs px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center disabled:opacity-50 shadow-lg border border-amber-500/30"
            >
              <i className={`fas ${isCertExporting ? 'fa-spinner fa-spin' : 'fa-certificate'} mr-2`}></i>
              {isCertExporting ? 'Generazione...' : 'Certificato CondoCerta'}
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center disabled:opacity-50"
            >
              <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'} mr-2`}></i>
              {isExporting ? 'Esportazione...' : 'Esporta PDF Report'}
            </button>
            <button 
              onClick={onReset}
              className="text-xs px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition"
            >
              Nuova Analisi
            </button>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${report.structuralVerification.register ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-sm font-medium">Registro di Contabilità</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${report.structuralVerification.summary ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-sm font-medium">Riepilogo Finanziario</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${report.structuralVerification.note ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-sm font-medium">Nota Sintetica Esplicativa</span>
          </div>
          <div className="flex items-center space-x-4 border-l pl-6 border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400">Punteggio Globale</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xl font-black ${getTrafficLightColor(report.overallScore)}`}>{report.overallScore}/100</span>
                <i className={`fas ${getTrafficLightIcon(report.overallScore)} ${getTrafficLightColor(report.overallScore)}`}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Light Visual Indicator */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider">Giudizio Generale del Rendiconto</h3>
        <div className="flex justify-center items-center space-x-8">
           <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${report.overallScore < 40 ? 'bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.5)]' : 'bg-rose-100 opacity-20'}`}>
                <i className="fas fa-traffic-light text-white text-2xl"></i>
              </div>
              <span className={`text-[10px] font-bold ${report.overallScore < 40 ? 'text-rose-600' : 'text-slate-300'}`}>ROSSO</span>
           </div>
           <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${report.overallScore >= 40 && report.overallScore < 70 ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'bg-amber-100 opacity-20'}`}>
                <i className="fas fa-traffic-light text-white text-2xl"></i>
              </div>
              <span className={`text-[10px] font-bold ${report.overallScore >= 40 && report.overallScore < 70 ? 'text-amber-600' : 'text-slate-300'}`}>GIALLO</span>
           </div>
           <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${report.overallScore >= 70 ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-emerald-100 opacity-20'}`}>
                <i className="fas fa-traffic-light text-white text-2xl"></i>
              </div>
              <span className={`text-[10px] font-bold ${report.overallScore >= 70 ? 'text-emerald-600' : 'text-slate-300'}`}>VERDE</span>
           </div>
        </div>
        <div className="mt-8">
          <p className={`text-xl font-extrabold uppercase tracking-tight ${getTrafficLightColor(report.overallScore)}`}>
            {getScoreStatusLabel(report.overallScore)}
          </p>
          <p className="text-slate-500 text-sm mt-1 italic">Analisi basata sui criteri di trasparenza Art. 1130 bis C.C. e standard ANACI</p>
        </div>
      </div>

      {/* Checklist Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 col-span-full">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <i className="fas fa-tasks text-emerald-600 mr-2"></i> Checklist di Controllo ANACI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {report.checklist.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between h-full group hover:bg-white hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-black ${getItemScoreColor(item.score)}`}>{item.score}/20</span>
                    {item.status === 'success' && <i className="fas fa-check-circle text-emerald-500"></i>}
                    {item.status === 'warning' && <i className="fas fa-exclamation-triangle text-amber-500"></i>}
                    {item.status === 'error' && <i className="fas fa-times-circle text-rose-500"></i>}
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-tight mb-2">{item.label}</p>
                </div>
                <p className="text-[11px] text-slate-500 italic mt-auto group-hover:text-slate-700 transition-colors">{item.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <i className="fas fa-file-invoice text-emerald-600 mr-2"></i> Giudizio del Documento Rendiconto
            </h3>
            <div className="space-y-6">
              <SubSection title="Punti di Forza (Compliance)" icon="fa-award text-emerald-500" items={report.documentJudgment.strengths} type="positive" />
              <SubSection title="Correzioni Necessarie (Errori Tecnici)" icon="fa-wrench text-slate-500" items={report.documentJudgment.corrections} type="warning" />
              <SubSection title="Criticità Gravi (Rischio Impugnazione)" icon="fa-gavel text-rose-600" items={report.documentJudgment.criticalities} type="danger" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 bg-amber-50/10 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <i className="fas fa-lightbulb text-amber-500 mr-2"></i> Suggerimenti per la Gestione Operativa
            </h3>
            <p className="text-xs text-slate-500 mb-4 italic">Consigli pratici per migliorare l'amministrazione del condominio durante l'anno.</p>
            <ul className="space-y-3">
              {report.operationalSuggestions.length > 0 ? report.operationalSuggestions.map((item, i) => (
                <li key={i} className="flex items-start space-x-3 text-sm text-slate-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                  <span>{item}</span>
                </li>
              )) : (
                <li className="text-slate-400 text-xs italic">Nessun suggerimento operativo identificato.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Assembly Simulator */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl sticky top-24">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <i className="fas fa-comments-dollar text-emerald-400 mr-2"></i> Simulatore di Assemblea
            </h3>
            <p className="text-slate-400 text-xs mb-6">Domande probabili dei condomini basate sui punti critici rilevati.</p>
            
            <div className="space-y-6">
              {report.assemblySimulator.map((item, idx) => (
                <div key={idx} className="bg-slate-800 rounded-xl p-4 border-l-4 border-emerald-500">
                  <p className="text-xs font-bold text-emerald-300 mb-2 uppercase tracking-wide">Domanda Probabile:</p>
                  <p className="text-sm italic mb-3">"{item.question}"</p>
                  <div className="p-3 bg-slate-900 rounded-lg">
                    <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Suggerimento Risposta:</p>
                    <p className="text-xs leading-relaxed">{item.suggestedResponse}</p>
                    {item.legalBasis && (
                      <p className="text-[10px] text-emerald-500/80 mt-2 font-mono">{item.legalBasis}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubSection: React.FC<{ title: string, icon: string, items: string[], type: 'positive' | 'neutral' | 'warning' | 'danger' }> = ({ title, icon, items, type }) => {
  const getColors = () => {
    switch(type) {
      case 'positive': return 'text-emerald-700';
      case 'warning': return 'text-amber-700';
      case 'danger': return 'text-rose-700';
      default: return 'text-slate-700';
    }
  };

  return (
    <div className="space-y-3">
      <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center ${getColors()}`}>
        <i className={`fas ${icon} mr-2`}></i> {title}
      </h4>
      <ul className="space-y-2 pl-6">
        {items.length > 0 ? items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 list-disc">
            {item}
          </li>
        )) : (
          <li className="text-slate-400 text-xs italic list-none">Nessun rilievo identificato.</li>
        )}
      </ul>
    </div>
  );
};
