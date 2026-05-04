
import { jsPDF } from "jspdf";
import { AuditReport } from "../types";

export async function generatePdfReport(report: AuditReport) {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  // Helper for page breaks
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > 280) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CondoAudit AI", margin, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text("IL REVISORE DIGITALE ANACI-ORIENTED", margin, 28);
  
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generato il: ${new Date().toLocaleDateString('it-IT')}`, 160, 28);

  y = 55;

  // Condo Info & Score Section
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(margin, y - 5, contentWidth, 35, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(margin, y - 5, contentWidth, 35, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Condominio: ${report.condoName}`, margin + 5, y + 5);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Periodo Gestione: ${report.managementPeriod}`, margin + 5, y + 12);
  doc.text(`Metodo Contabile: ${report.accountingMethodDetected}`, margin + 5, y + 19);

  let scoreColor: [number, number, number] = [16, 185, 129]; // green
  let statusText = "PROFESSIONALE / ECCELLENTE";
  if (report.overallScore < 70) {
    scoreColor = [245, 158, 11]; // amber
    statusText = "NECESSITA MIGLIORAMENTI";
  }
  if (report.overallScore < 40) {
    scoreColor = [225, 29, 72]; // rose
    statusText = "CRITICO / NON CONFORME";
  }

  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(`${report.overallScore}/100`, margin + 130, y + 12);
  
  doc.setFontSize(9);
  doc.text(statusText, margin + 5, y + 26);

  y += 45;

  // Title Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Rapporto di Revisione Condominiale", margin, y);
  y += 12;

  // Checklist
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Checklist di Controllo (Dettaglio Punteggi)", margin, y);
  y += 10;

  report.checklist.forEach(item => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    let statusPrefix = "[ ] ";
    if (item.status === 'success') { statusPrefix = "[V] "; doc.setTextColor(16, 185, 129); }
    else if (item.status === 'warning') { statusPrefix = "[!] "; doc.setTextColor(245, 158, 11); }
    else if (item.status === 'error') { statusPrefix = "[X] "; doc.setTextColor(225, 29, 72); }
    
    // Header line: Status + Label + Score
    const scoreText = `(Punti: ${item.score}/20)`;
    const labelLines = doc.splitTextToSize(`${statusPrefix}${item.label} ${scoreText}`, contentWidth);
    checkPageBreak(labelLines.length * 5 + 10);
    doc.text(labelLines, margin, y);
    y += (labelLines.length * 5);
    
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    const commentLines = doc.splitTextToSize(item.comment || "Nessun commento aggiuntivo.", contentWidth - 10);
    checkPageBreak(commentLines.length * 5 + 5);
    doc.text(commentLines, margin + 5, y);
    y += (commentLines.length * 5) + 8;
    
    doc.setTextColor(15, 23, 42);
  });

  y += 5;

  // Detailed Audit Sections
  const docJudgment = report.documentJudgment;
  const sections = [
    { title: "GIUDIZIO DOCUMENTO: PUNTI DI FORZA", items: docJudgment.strengths, color: [16, 185, 129] as [number, number, number] },
    { title: "GIUDIZIO DOCUMENTO: CORREZIONI NECESSARIE", items: docJudgment.corrections, color: [100, 116, 139] as [number, number, number] },
    { title: "GIUDIZIO DOCUMENTO: CRITICITÀ GRAVI", items: docJudgment.criticalities, color: [225, 29, 72] as [number, number, number] },
    { title: "SUGGERIMENTI GESTIONE OPERATIVA", items: report.operationalSuggestions, color: [245, 158, 11] as [number, number, number] }
  ];

  sections.forEach(sec => {
    checkPageBreak(15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(sec.color[0], sec.color[1], sec.color[2]);
    doc.text(sec.title, margin, y);
    y += 8;
    
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    
    if (!sec.items || sec.items.length === 0) {
      doc.text("- Nessun rilievo specifico rilevato in questa sezione.", margin + 5, y);
      y += 8;
    } else {
      sec.items.forEach(item => {
        const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 5);
        checkPageBreak(lines.length * 5 + 2);
        doc.text(lines, margin + 2, y);
        y += (lines.length * 5) + 3;
      });
      y += 5;
    }
  });

  // Simulator
  y += 5;
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("SIMULATORE DI ASSEMBLEA (Q&A)", margin, y);
  y += 10;

  if (!report.assemblySimulator || report.assemblySimulator.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Nessun quesito simulato disponibile.", margin, y);
    y += 10;
  } else {
    report.assemblySimulator.forEach(qa => {
      const qLines = doc.splitTextToSize(`D: ${qa.question}`, contentWidth);
      const rLines = doc.splitTextToSize(`R: ${qa.suggestedResponse}`, contentWidth);
      const spaceNeeded = (qLines.length * 5) + (rLines.length * 5) + (qa.legalBasis ? 10 : 10);
      
      checkPageBreak(spaceNeeded);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(qLines, margin, y);
      y += (qLines.length * 5) + 1;
      
      doc.setFont("helvetica", "normal");
      doc.text(rLines, margin, y);
      y += (rLines.length * 5) + 2;
      
      if (qa.legalBasis) {
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "italic");
        doc.text(`Riferimento Legale: ${qa.legalBasis}`, margin, y);
        y += 6;
      }
      y += 5;
      doc.setTextColor(15, 23, 42);
    });
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`CondoAudit AI - ${report.condoName} - Pagina ${i} di ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`Rapporto_Revisione_${report.condoName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
}

export async function generateCertificatePdf(report: AuditReport) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Parchment Background
  doc.setFillColor(252, 245, 229);
  doc.rect(0, 0, width, height, 'F');

  // Ornate Border
  doc.setDrawColor(20, 30, 50);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, width - 20, height - 20, 'S');
  doc.setLineWidth(0.5);
  doc.rect(12, 12, width - 24, height - 24, 'S');

  // Corner Accents (simulated)
  doc.setFillColor(20, 30, 50);
  doc.circle(11, 11, 2, 'F');
  doc.circle(width - 11, 11, 2, 'F');
  doc.circle(11, height - 11, 2, 'F');
  doc.circle(width - 11, height - 11, 2, 'F');

  // Title
  doc.setTextColor(20, 30, 50);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(40);
  doc.text("CONDOCERTA", width / 2, 45, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont("times", "normal");
  doc.text("CERTIFICATO DI QUALITÀ E TRASPARENZA CONTABILE", width / 2, 55, { align: 'center' });

  // Body
  doc.setFontSize(18);
  doc.text("Si certifica che il Rendiconto del", width / 2, 80, { align: 'center' });
  
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.text(report.condoName.toUpperCase(), width / 2, 95, { align: 'center' });

  doc.setFont("times", "normal");
  doc.setFontSize(18);
  doc.text(`Relativo all'esercizio: ${report.managementPeriod}`, width / 2, 110, { align: 'center' });

  doc.text("Amministrato da:", width / 2, 125, { align: 'center' });
  doc.setFont("times", "bold");
  doc.text(report.administratorName.toUpperCase(), width / 2, 135, { align: 'center' });

  // Evaluation
  doc.setFont("times", "normal");
  doc.text("Ha superato la revisione digitale con un punteggio di:", width / 2, 155, { align: 'center' });

  // Seal / Score
  doc.setFillColor(15, 23, 42);
  doc.circle(width / 2, 175, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(`${report.overallScore}`, width / 2, 177, { align: 'center' });

  doc.setTextColor(20, 30, 50);
  doc.setFontSize(10);
  doc.text("PUNTEGGIO COMPLIANCE", width / 2, 195, { align: 'center' });

  // Legal footer
  doc.setFontSize(8);
  doc.setFont("times", "italic");
  doc.text("In conformità agli standard ANACI e ai criteri di trasparenza dell'Art. 1130 bis C.C.", width / 2, height - 15, { align: 'center' });

  doc.save(`Certificato_CondoCerta_${report.condoName.replace(/\s+/g, '_')}.pdf`);
}
