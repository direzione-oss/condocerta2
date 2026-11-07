
import { GoogleGenAI, Type } from "@google/genai";
import { AuditReport, FileData } from "../types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const ANALYSIS_PROMPT = `
Sei un esperto revisore condominiale senior specializzato in legislazione italiana (Art. 1130 bis C.C.) e standard qualitativi ANACI.
Ti vengono forniti uno o più documenti che compongono il fascicolo del rendiconto condominiale (es. Registro contabilità, Riepilogo finanziario, Nota esplicativa, Riparto).
Analizza i documenti forniti e produci una "Relazione Tecnica di Revisione" estremamente dettagliata, professionale e discorsiva.

OBIETTIVO: Il rapporto non deve essere una semplice lista, ma una vera e propria relazione narrativa che guidi l'amministratore e i condomini nella comprensione della qualità del rendiconto.

REGOLE MANDATORIE PER IL CONTENUTO:
1. **Commenti Checklist**: Ogni commento nella "checklist" deve essere ampio (almeno 3-4 frasi), spiegando il "perché" del punteggio, citando riferimenti normativi (es. Art. 1130 bis C.C.) o standard ANACI, e fornendo un'analisi qualitativa profonda.
2. **Quantità fissa (Regola del 5)**: Per ogni sezione elencata sotto, devi fornire ESATTAMENTE 5 elementi distinti:
   - 5 Punti di Forza (strengths)
   - 5 Correzioni Necessarie (corrections)
   - 5 Criticità Gravi (criticalities)
   - 5 Suggerimenti per la Gestione Operativa (operationalSuggestions)
   - 5 Domande/Risposte nel Simulatore di Assemblea (assemblySimulator)
3. **Separazione Netta**: Mantieni la distinzione tra il giudizio sul DOCUMENTO (forma, trasparenza, conformità) e i suggerimenti per la GESTIONE (efficienza operativa).

Dovrai identificare obbligatoriamente:
- "condoName": Il nome del Condominio.
- "administratorName": Il nome dell'amministratore.
- "managementPeriod": Il periodo della gestione.

Dovrai restituire un JSON strutturato con queste sezioni:
1. "condoName", "administratorName", "managementPeriod".
2. "documentJudgment": Giudizio ESCLUSIVO sulla qualità del documento rendiconto:
   - "strengths": 5 punti di forza (Compliance, chiarezza).
   - "corrections": 5 errori tecnici o omissioni formali.
   - "criticalities": 5 rischi di impugnazione o vizi gravi.
3. "operationalSuggestions": 5 suggerimenti per il miglioramento della GESTIONE OPERATIVA durante l'anno.
4. "checklist": Valutazione semaforica di 5 punti chiave (Registro, Situazione Patrimoniale, Fondi, Rapporti in corso, Passaggio consegne). 
   - Ogni "comment" deve essere una mini-relazione narrativa e tecnica.
   - Punteggio "score" da 0 a 20 per ogni punto.
5. "assemblySimulator": 5 domande probabili dei condomini con risposte suggerite e basi legali.
6. "accountingMethodDetected": (Competenza, Cassa o Misto).
7. "structuralVerification": Presenza di Registro, Riepilogo, Nota.
8. "overallScore": Somma degli score della checklist (1-100).

Istruzioni di stile: Linguaggio da revisore contabile, tono autorevole, citazioni legali precise, orientamento alla trasparenza e alla riduzione del contenzioso.
`;

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.8-flash",
];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, modelName: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout (${Math.round(timeoutMs / 1000)}s) sul modello ${modelName}`));
    }, timeoutMs);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function analyzeFinancialDocuments(files: FileData[]): Promise<AuditReport> {
  const contentParts = [
    { text: ANALYSIS_PROMPT },
    ...files.map(f => {
      // Ensure clean base64 without prefix
      const commaIdx = f.base64.indexOf(",");
      const cleanBase64 = commaIdx !== -1 ? f.base64.slice(commaIdx + 1) : f.base64;
      const mime = f.mimeType || (f.name?.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/pdf");
      return {
        inlineData: { data: cleanBase64, mimeType: mime }
      };
    })
  ];

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      console.log(`Avvio analisi con modello ${model}...`);
      const apiPromise = ai.models.generateContent({
        model,
        contents: {
          parts: contentParts
        },
        config: {
          temperature: 0.1,
          maxOutputTokens: 32768,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              condoName: { type: Type.STRING },
              administratorName: { type: Type.STRING },
              managementPeriod: { type: Type.STRING },
              documentJudgment: {
                type: Type.OBJECT,
                properties: {
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 5, maxItems: 5 },
                  corrections: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 5, maxItems: 5 },
                  criticalities: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 5, maxItems: 5 }
                },
                required: ["strengths", "corrections", "criticalities"]
              },
              operationalSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 5, maxItems: 5 },
              checklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    status: { type: Type.STRING, description: "success, warning, error, pending" },
                    comment: { type: Type.STRING },
                    score: { type: Type.INTEGER, description: "Score from 0 to 20" }
                  },
                  required: ["id", "label", "status", "comment", "score"]
                },
                minItems: 5,
                maxItems: 5
              },
              assemblySimulator: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    suggestedResponse: { type: Type.STRING },
                    legalBasis: { type: Type.STRING }
                  }
                },
                minItems: 5,
                maxItems: 5
              },
              accountingMethodDetected: { type: Type.STRING },
              structuralVerification: {
                type: Type.OBJECT,
                properties: {
                  register: { type: Type.BOOLEAN },
                  summary: { type: Type.BOOLEAN },
                  note: { type: Type.BOOLEAN }
                }
              },
              overallScore: { type: Type.INTEGER, description: "Score from 1 to 100" }
            },
            required: ["condoName", "administratorName", "managementPeriod", "documentJudgment", "operationalSuggestions", "checklist", "assemblySimulator", "accountingMethodDetected", "structuralVerification", "overallScore"]
          }
        }
      });

      const response = await withTimeout(apiPromise, 75000, model);

      let rawText = (response.text || "").trim();
      if (rawText.startsWith("```json")) {
        rawText = rawText.slice(7);
      } else if (rawText.startsWith("```")) {
        rawText = rawText.slice(3);
      }
      if (rawText.endsWith("```")) {
        rawText = rawText.slice(0, -3);
      }
      rawText = rawText.trim();

      console.log(`Analisi completata con successo tramite ${model}.`);
      return JSON.parse(rawText || "{}") as AuditReport;
    } catch (err: any) {
      lastError = err;
      console.warn(`Tentativo fallito con ${model}:`, err?.message || err);
      if (err?.message?.includes("API_KEY_INVALID") || err?.message?.includes("API key not valid")) {
        throw new Error("La chiave API Gemini associata all'ambiente non è valida o è scaduta (API_KEY_INVALID).");
      }
      // Continua col prossimo modello della lista
    }
  }

  console.error("Gemini API Error in analyzeFinancialDocuments (tutti i modelli falliti):", lastError);
  throw lastError || new Error("Impossibile completare l'analisi con i modelli Gemini disponibili.");
}
