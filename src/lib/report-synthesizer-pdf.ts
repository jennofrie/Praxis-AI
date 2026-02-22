/**
 * Report Synthesizer PDF Export
 *
 * Generates professional branded A4 PDF reports with:
 * - Navy header bar with report type
 * - Participant info box
 * - Section-by-section content
 * - Confidentiality footer on every page
 * - SC signature block
 * - Page numbers
 */

import { jsPDF } from 'jspdf';

interface ParsedSection {
  key: string;
  label: string;
  content: string;
}

interface PersonaConfig {
  id: string;
  title: string;
  reportType: string;
}

// Navy colour constants
const NAVY = { r: 26, g: 35, b: 65 };
const LIGHT_NAVY = { r: 240, g: 242, b: 248 };
const TEXT_DARK = { r: 30, g: 41, b: 59 };
const TEXT_LIGHT = { r: 100, g: 116, b: 139 };

export function exportReportSynthesizerPdf(
  synthesizedText: string,
  sections: ParsedSection[],
  personaConfig: PersonaConfig,
  participantName?: string,
  ndisNumber?: string
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const footerY = pageHeight - 15;
  let y = 0;

  // ---- HELPER: Add footer to current page ----
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_LIGHT.r, TEXT_LIGHT.g, TEXT_LIGHT.b);
    doc.text(
      'CONFIDENTIAL \u2014 NDIS Participant Information. Authorised recipients only.',
      marginLeft,
      footerY
    );
    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - marginRight,
      footerY,
      { align: 'right' }
    );
  };

  // ---- HELPER: Check page break ----
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > footerY - 10) {
      doc.addPage();
      y = 20;
    }
  };

  // ---- HELPER: Write wrapped text ----
  const writeText = (text: string, fontSize: number, isBold: boolean = false, lineHeight: number = 5) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);

    const lines = doc.splitTextToSize(text, contentWidth);
    for (let i = 0; i < lines.length; i++) {
      checkPageBreak(lineHeight + 2);
      doc.text(lines[i], marginLeft, y);
      y += lineHeight;
    }
  };

  // ================================================================
  // PAGE 1: HEADER
  // ================================================================

  // Navy header bar
  doc.setFillColor(NAVY.r, NAVY.g, NAVY.b);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Title in header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PRAXIS-AI', marginLeft, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(personaConfig.reportType.toUpperCase(), marginLeft, 24);

  // Date on right
  const today = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(9);
  doc.text(today, pageWidth - marginRight, 14, { align: 'right' });

  y = 40;

  // ================================================================
  // PARTICIPANT INFO BOX
  // ================================================================
  doc.setFillColor(LIGHT_NAVY.r, LIGHT_NAVY.g, LIGHT_NAVY.b);
  doc.roundedRect(marginLeft, y, contentWidth, 22, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(NAVY.r, NAVY.g, NAVY.b);
  doc.text('Participant:', marginLeft + 5, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(participantName || 'Not specified', marginLeft + 32, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('NDIS Number:', marginLeft + 5, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(ndisNumber || 'Not specified', marginLeft + 36, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Generated:', contentWidth / 2 + marginLeft, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(today, contentWidth / 2 + marginLeft + 26, y + 8);

  y += 32;

  // ================================================================
  // REPORT CONTENT
  // ================================================================

  if (sections.length > 0) {
    // Render each section
    for (const section of sections) {
      checkPageBreak(20);

      // Section heading with navy background
      doc.setFillColor(NAVY.r, NAVY.g, NAVY.b);
      doc.rect(marginLeft, y - 4, contentWidth, 8, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(section.label.toUpperCase(), marginLeft + 4, y + 1);
      y += 10;

      // Section content
      const paragraphs = section.content.split('\n\n').filter((p: string) => p.trim());
      for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();
        if (!trimmed) continue;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);

        const lines = doc.splitTextToSize(trimmed, contentWidth);
        for (let i = 0; i < lines.length; i++) {
          checkPageBreak(5);
          doc.text(lines[i], marginLeft, y);
          y += 4.5;
        }
        y += 3; // Paragraph spacing
      }
      y += 5; // Section spacing
    }
  } else {
    // No sections parsed — render full text
    const paragraphs = synthesizedText.split('\n\n').filter((p: string) => p.trim());
    for (const paragraph of paragraphs) {
      writeText(paragraph.trim(), 10, false, 4.5);
      y += 3;
    }
  }

  // ================================================================
  // SIGNATURE BLOCK
  // ================================================================
  checkPageBreak(40);
  y += 10;

  doc.setDrawColor(NAVY.r, NAVY.g, NAVY.b);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, marginLeft + 80, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b);
  doc.text('Support Coordinator: ___________________________', marginLeft, y);
  y += 6;
  doc.text('Signature: ___________________________', marginLeft, y);
  y += 6;
  doc.text(`Date: ${today}`, marginLeft, y);

  // ================================================================
  // ADD FOOTERS TO ALL PAGES
  // ================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // ================================================================
  // SAVE
  // ================================================================
  const safeName = (participantName || 'report').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`praxis-report-${safeName}-${dateStr}.pdf`);
}
