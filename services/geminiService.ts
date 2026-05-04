import { AuditReport } from "../types";
import { upload } from '@vercel/blob/client';

export async function analyzeFinancialDocuments(files: File[]): Promise<AuditReport> {
  // 1. Carica i file su Vercel Blob
  const fileUrls = await Promise.all(
    files.map(async (file) => {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      return {
        url: blob.url,
        mimeType: file.type,
        name: file.name
      };
    })
  );

  // 2. Passa gli URL al backend per l'analisi
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileUrls }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || `Errore del server: ${response.status}`);
  }

  const data = await response.json();
  return data as AuditReport;
}
