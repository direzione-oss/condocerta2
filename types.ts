
export interface AnalysisSection {
  title: string;
  items: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  comment: string;
  score: number; // Partial score for this item
}

export interface AssemblyQuestion {
  question: string;
  suggestedResponse: string;
  legalBasis: string;
}

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
}

export interface AuditReport {
  condoName: string;
  administratorName: string;
  managementPeriod: string;
  documentJudgment: {
    strengths: string[];
    corrections: string[];
    criticalities: string[];
  };
  operationalSuggestions: string[];
  checklist: ChecklistItem[];
  assemblySimulator: AssemblyQuestion[];
  accountingMethodDetected: 'Competenza' | 'Cassa' | 'Misto' | 'Non Rilevato';
  structuralVerification: {
    register: boolean;
    summary: boolean;
    note: boolean;
  };
  overallScore: number; // Score from 1 to 100
}

export enum AppState {
  LOCKED = 'locked',
  ADMIN = 'admin',
  IDLE = 'idle',
  UPLOADING = 'uploading',
  ANALYZING = 'analyzing',
  REPORT_READY = 'report_ready',
  ERROR = 'error'
}
