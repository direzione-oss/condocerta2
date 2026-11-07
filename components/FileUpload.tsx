
import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center text-center
          ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-400 hover:bg-slate-50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept=".pdf" 
          multiple
          className="hidden" 
          onChange={handleChange}
          disabled={isLoading}
        />
        
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <i className={`fas fa-cloud-upload-alt text-3xl ${dragActive ? 'text-emerald-500' : 'text-slate-400'}`}></i>
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2">Carica i Documenti</h3>
        <p className="text-slate-500 text-sm max-w-sm">
          Seleziona uno o più file PDF (Registro, Riepilogo, Nota, Riparto) che compongono il rendiconto.
        </p>
        
        <div className="mt-8">
          <button 
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Sfoglia Documenti
          </button>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: 'fa-check-circle', text: 'Analisi Art. 1130 bis C.C.' },
          { icon: 'fa-shield-alt', text: 'Standard ANACI' },
          { icon: 'fa-file-invoice', text: 'Quadrature Automatiche' }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-slate-200">
            <i className={`fas ${item.icon} text-emerald-500`}></i>
            <span className="text-xs font-semibold text-slate-700">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
