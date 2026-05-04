import { AuditReport, FileData } from "../types";

export async function analyzeFinancialDocuments(files: FileData[]): Promise<AuditReport> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || `Errore del server: ${response.status}`);
  }

  const data = await response.json();
  return data as AuditReport;
}
