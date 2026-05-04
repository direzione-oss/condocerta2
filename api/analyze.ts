import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurazione CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: "File mancanti o formato non valido" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = "gemini-3-pro-preview";

    const contentParts = [
      { text: ANALYSIS_PROMPT },
      ...files.map(f => ({
        inlineData: { data: f.base64, mimeType: f.mimeType }
      }))
    ];

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: contentParts
      },
      config: {
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

    const text = response.text || "{}";
    const data = JSON.parse(text);

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Errore Gemini API:", error);
    return res.status(500).json({ error: "Si è verificato un errore durante l'analisi", details: error.message });
  }
}
