
import { jsPDF } from "jspdf";
import { AuditReport } from "../types";

export async function generatePdfReport(report: AuditReport) {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  // Helper for page breaks (leave safe bottom margin before footer at y=290)
  const MAX_Y = 272;
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > MAX_Y) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // Helper to render wrapped lines one by one with exact lineHeight
  const renderLines = (lines: string[], x: number, lineHeight: number) => {
    lines.forEach((line: string) => {
      doc.text(line, x, y);
      y += lineHeight;
    });
  };

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CondoCerta", margin, 20);
  
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
  const methodLines = doc.splitTextToSize(`Metodo Contabile: ${report.accountingMethodDetected}`, 120);
  doc.text(methodLines[0] || "", margin + 5, y + 19);

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
  y += 9;

  report.checklist.forEach(item => {
    let statusPrefix = "[ ] ";
    let statusRgb: [number, number, number] = [15, 23, 42];
    if (item.status === 'success') { statusPrefix = "[V] "; statusRgb = [16, 185, 129]; }
    else if (item.status === 'warning') { statusPrefix = "[!] "; statusRgb = [245, 158, 11]; }
    else if (item.status === 'error') { statusPrefix = "[X] "; statusRgb = [225, 29, 72]; }
    
    const scoreText = `(Punti: ${item.score}/20)`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const labelLines = doc.splitTextToSize(`${statusPrefix}${item.label} ${scoreText}`, contentWidth - 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const commentLines = doc.splitTextToSize(item.comment || "Nessun commento aggiuntivo.", contentWidth - 8);

    const totalItemHeight = (labelLines.length * 4.5) + (commentLines.length * 4.2) + 6;
    checkPageBreak(totalItemHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(statusRgb[0], statusRgb[1], statusRgb[2]);
    renderLines(labelLines, margin, 4.5);
    y += 0.5;
    
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    renderLines(commentLines, margin + 5, 4.2);
    y += 4.5;
    
    doc.setTextColor(15, 23, 42);
  });

  y += 3;

  // Detailed Audit Sections
  const docJudgment = report.documentJudgment;
  const sections = [
    { title: "GIUDIZIO DOCUMENTO: PUNTI DI FORZA", items: docJudgment.strengths, color: [16, 185, 129] as [number, number, number] },
    { title: "GIUDIZIO DOCUMENTO: CORREZIONI NECESSARIE", items: docJudgment.corrections, color: [100, 116, 139] as [number, number, number] },
    { title: "GIUDIZIO DOCUMENTO: CRITICITÀ GRAVI", items: docJudgment.criticalities, color: [225, 29, 72] as [number, number, number] },
    { title: "SUGGERIMENTI GESTIONE OPERATIVA", items: report.operationalSuggestions, color: [245, 158, 11] as [number, number, number] }
  ];

  sections.forEach(sec => {
    // Measure first item height so the section header is never orphaned at bottom of page
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const firstItemLines = (sec.items && sec.items.length > 0)
      ? doc.splitTextToSize(`• ${sec.items[0]}`, contentWidth - 6)
      : ["Nessun rilievo"];
    const headerPlusFirstItem = 9 + (firstItemLines.length * 4.2) + 4;
    checkPageBreak(headerPlusFirstItem);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(sec.color[0], sec.color[1], sec.color[2]);
    doc.text(sec.title, margin, y);
    y += 7.5;
    
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    
    if (!sec.items || sec.items.length === 0) {
      doc.text("- Nessun rilievo specifico rilevato in questa sezione.", margin + 5, y);
      y += 7;
    } else {
      sec.items.forEach(item => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 6);
        checkPageBreak((lines.length * 4.2) + 3);
        renderLines(lines, margin + 2, 4.2);
        y += 2.5;
      });
      y += 4;
    }
  });

  // Simulator (Simulatore di Assemblea Q&A)
  y += 2;
  const qaBoxWidth = contentWidth - 10; // inner width for text inside padded Q&A box

  // Helper to pre-calculate a Q&A item's wrapped lines with exact fonts set BEFORE splitTextToSize
  const prepareQaBlock = (qa: { question: string; suggestedResponse: string; legalBasis?: string }) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const qLines: string[] = doc.splitTextToSize(`D: ${qa.question || ""}`, qaBoxWidth);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const rLines: string[] = doc.splitTextToSize(`R: ${qa.suggestedResponse || ""}`, qaBoxWidth);

    let lLines: string[] = [];
    if (qa.legalBasis) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      lLines = doc.splitTextToSize(`Riferimento Legale: ${qa.legalBasis}`, qaBoxWidth);
    }

    const qHeight = qLines.length * 4.3;
    const rHeight = rLines.length * 4.2;
    const lHeight = lLines.length > 0 ? (lLines.length * 3.8 + 1.5) : 0;
    const boxHeight = 5 + qHeight + 2 + rHeight + lHeight + 4;

    return { qLines, rLines, lLines, boxHeight };
  };

  if (!report.assemblySimulator || report.assemblySimulator.length === 0) {
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("SIMULATORE DI ASSEMBLEA (Q&A)", margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Nessun quesito simulato disponibile.", margin, y);
    y += 10;
  } else {
    const preparedBlocks = report.assemblySimulator.map(prepareQaBlock);
    // Keep section title together with the first Q&A block
    checkPageBreak(10 + preparedBlocks[0].boxHeight + 4);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("SIMULATORE DI ASSEMBLEA (Q&A)", margin, y);
    y += 8;

    preparedBlocks.forEach(({ qLines, rLines, lLines, boxHeight }) => {
      checkPageBreak(boxHeight + 4);

      const boxTop = y - 3.5;
      // Subtle background card + emerald left accent bar
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin, boxTop, contentWidth, boxHeight, 'F');
      doc.setFillColor(16, 185, 129); // emerald-500 left bar
      doc.rect(margin, boxTop, 1.8, boxHeight, 'F');

      y = boxTop + 5;

      // Question (Bold 9pt)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      renderLines(qLines, margin + 5, 4.3);
      y += 1.5;

      // Suggested Response (Normal 9pt)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      renderLines(rLines, margin + 5, 4.2);

      // Legal Basis (Italic 8pt)
      if (lLines.length > 0) {
        y += 1.5;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        renderLines(lLines, margin + 5, 3.8);
      }

      y = boxTop + boxHeight + 4;
      doc.setTextColor(15, 23, 42);
    });
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`CondoCerta - ${report.condoName} - Pagina ${i} di ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
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
