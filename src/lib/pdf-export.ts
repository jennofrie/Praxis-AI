/**
 * PDF Export utilities for Senior Planner and CoC Assessor
 * Uses jsPDF for client-side PDF generation
 */

import { jsPDF } from 'jspdf';
import type { AuditStatus, SeniorPlannerPDFOptions, CoCPDFOptions, PDFExportResult } from '@/types/senior-planner';
import { getPathwayLabel } from '@/types/senior-planner';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  primary: [79, 70, 229] as [number, number, number], // Indigo
  success: [16, 185, 129] as [number, number, number], // Emerald
  warning: [245, 158, 11] as [number, number, number], // Amber
  danger: [239, 68, 68] as [number, number, number], // Red
  text: [30, 41, 59] as [number, number, number], // Slate 800
  textLight: [100, 116, 139] as [number, number, number], // Slate 500
  border: [226, 232, 240] as [number, number, number], // Slate 200
};

const MARGINS = {
  left: 20,
  right: 20,
  top: 20,
  bottom: 20,
};

const PAGE_WIDTH = 210; // A4 width in mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getStatusColor(status: AuditStatus): [number, number, number] {
  switch (status) {
    case 'excellent':
      return COLORS.success;
    case 'good':
      return [59, 130, 246]; // Blue
    case 'needs_improvement':
      return COLORS.warning;
    case 'critical':
      return COLORS.danger;
    default:
      return COLORS.textLight;
  }
}

function getStatusLabel(status: AuditStatus): string {
  switch (status) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'needs_improvement':
      return 'Needs Improvement';
    case 'critical':
      return 'Critical';
    case 'security_blocked':
      return 'Blocked';
    default:
      return 'Unknown';
  }
}

function getVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'likely_eligible':
      return 'Likely Eligible';
    case 'possibly_eligible':
      return 'Possibly Eligible';
    case 'not_eligible':
      return 'Not Eligible';
    default:
      return 'Unknown';
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function addPageHeader(doc: jsPDF, title: string, subtitle?: string): number {
  let y = MARGINS.top;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(title, MARGINS.left, y);
  y += 8;

  // Subtitle
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text(subtitle, MARGINS.left, y);
    y += 6;
  }

  // Horizontal line
  y += 4;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(MARGINS.left, y, PAGE_WIDTH - MARGINS.right, y);
  y += 8;

  return y;
}

function addSection(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(title, MARGINS.left, y);
  return y + 8;
}

function addParagraph(doc: jsPDF, text: string, y: number, maxWidth: number = CONTENT_WIDTH): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, MARGINS.left, y);
  return y + lines.length * 5;
}

function addBulletList(doc: jsPDF, items: string[], y: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  for (const item of items) {
    const lines = doc.splitTextToSize(item, CONTENT_WIDTH - 10);
    doc.text('\u2022', MARGINS.left, y);
    doc.text(lines, MARGINS.left + 6, y);
    y += lines.length * 5 + 2;
  }

  return y;
}

function checkPageBreak(doc: jsPDF, y: number, requiredSpace: number = 40): number {
  if (y + requiredSpace > 280) {
    doc.addPage();
    return MARGINS.top;
  }
  return y;
}

function addScoreGauge(doc: jsPDF, label: string, score: number, x: number, y: number, width: number = 60): number {
  const gaugeHeight = 6;
  const labelHeight = 4;

  // Label
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text(label, x, y);
  y += labelHeight + 2;

  // Background bar
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(x, y, width, gaugeHeight, 2, 2, 'F');

  // Score bar
  const scoreWidth = (score / 100) * width;
  const scoreColor = score >= 85 ? COLORS.success : score >= 70 ? [59, 130, 246] as [number, number, number] : score >= 50 ? COLORS.warning : COLORS.danger;
  doc.setFillColor(...scoreColor);
  doc.roundedRect(x, y, scoreWidth, gaugeHeight, 2, 2, 'F');

  // Score text
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(`${score}%`, x + width + 4, y + 4.5);

  return y + gaugeHeight + 4;
}

function addFooter(doc: jsPDF, pageNumber: number): void {
  const totalPages = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);

  // Page number
  doc.text(`Page ${pageNumber} of ${totalPages}`, PAGE_WIDTH - MARGINS.right - 20, 290);

  // Disclaimer
  doc.text('Generated by Praxis AI - For clinical use only', MARGINS.left, 290);
}

// ============================================================================
// SENIOR PLANNER (SECTION 34 AUDITOR) PDF
// ============================================================================

export function generateSeniorPlannerPDF(options: SeniorPlannerPDFOptions): PDFExportResult {
  const { auditResult, documentName, documentTypeLabel, skipDownload = false } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = addPageHeader(
    doc,
    'Section 34 Audit Report',
    `${documentTypeLabel} - ${documentName}`
  );

  // Overall Score Box
  const statusColor = getStatusColor(auditResult.status);
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2], 0.1);
  doc.roundedRect(MARGINS.left, y, CONTENT_WIDTH, 30, 4, 4, 'F');

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...statusColor);
  doc.text(`${auditResult.overallScore}`, MARGINS.left + 10, y + 20);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`/ 100`, MARGINS.left + 35, y + 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(getStatusLabel(auditResult.status), MARGINS.left + 60, y + 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text(`Generated: ${formatDate(auditResult.timestamp)}`, MARGINS.left + 60, y + 20);

  y += 38;

  // Sub-scores Section
  y = addSection(doc, 'Audit Scores', y);

  const scoreItems = [
    { label: 'Compliance', score: auditResult.scores.compliance },
    { label: 'Nexus', score: auditResult.scores.nexus },
    { label: 'Value for Money', score: auditResult.scores.valueForMoney },
    { label: 'Evidence', score: auditResult.scores.evidence },
    { label: 'Significant Change', score: auditResult.scores.significantChange },
  ];

  const scoreWidth = 70;
  const scoresPerRow = 2;
  let scoreX = MARGINS.left;
  let scoreStartY = y;

  scoreItems.forEach((item, index) => {
    if (index > 0 && index % scoresPerRow === 0) {
      scoreStartY += 20;
      scoreX = MARGINS.left;
    }
    addScoreGauge(doc, item.label, item.score, scoreX, scoreStartY, scoreWidth);
    scoreX += scoreWidth + 20;
  });

  y = scoreStartY + 28;

  // Planner Summary
  y = checkPageBreak(doc, y, 50);
  y = addSection(doc, 'Planner Summary', y);
  y = addParagraph(doc, auditResult.plannerSummary, y);
  y += 6;

  // Strengths
  if (auditResult.strengths.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSection(doc, 'Strengths', y);
    y = addBulletList(doc, auditResult.strengths, y);
    y += 4;
  }

  // Areas for Improvement
  if (auditResult.improvements.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSection(doc, 'Areas for Improvement', y);
    y = addBulletList(doc, auditResult.improvements, y);
    y += 4;
  }

  // Red Flags
  if (auditResult.redFlags.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSection(doc, 'Red Flags', y);
    doc.setTextColor(...COLORS.danger);
    y = addBulletList(doc, auditResult.redFlags, y);
    doc.setTextColor(...COLORS.text);
    y += 4;
  }

  // Language Fixes
  if (auditResult.languageFixes.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = addSection(doc, 'Suggested Language Improvements', y);

    for (const fix of auditResult.languageFixes) {
      y = checkPageBreak(doc, y, 30);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textLight);
      doc.text(`[${fix.category.toUpperCase().replace('_', ' ')}]`, MARGINS.left, y);
      y += 5;

      doc.setFontSize(10);
      doc.setTextColor(...COLORS.danger);
      doc.setFont('helvetica', 'normal');
      const originalLines = doc.splitTextToSize(`Original: "${fix.original}"`, CONTENT_WIDTH - 5);
      doc.text(originalLines, MARGINS.left + 5, y);
      y += originalLines.length * 5 + 2;

      doc.setTextColor(...COLORS.success);
      const suggestedLines = doc.splitTextToSize(`Suggested: "${fix.suggested}"`, CONTENT_WIDTH - 5);
      doc.text(suggestedLines, MARGINS.left + 5, y);
      y += suggestedLines.length * 5 + 2;

      doc.setTextColor(...COLORS.textLight);
      doc.setFontSize(9);
      const reasonLines = doc.splitTextToSize(`Reason: ${fix.reason}`, CONTENT_WIDTH - 5);
      doc.text(reasonLines, MARGINS.left + 5, y);
      y += reasonLines.length * 4 + 6;
    }
  }

  // Planner Questions
  if (auditResult.plannerQuestions.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSection(doc, 'Questions a Planner May Ask', y);
    y = addBulletList(doc, auditResult.plannerQuestions, y);
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  const filename = `audit-${documentName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`;

  if (!skipDownload) {
    doc.save(filename);
  }

  return {
    filename,
    pdfBlob: doc.output('blob'),
  };
}

// ============================================================================
// COC (CHANGE OF CIRCUMSTANCES) ASSESSOR PDF
// ============================================================================

export function generateCoCPDF(options: CoCPDFOptions): PDFExportResult {
  const { assessmentResult, viewMode, skipDownload = false } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const title = viewMode === 'sc'
    ? 'Change of Circumstances Assessment'
    : 'Your Change of Circumstances Summary';

  const subtitle = viewMode === 'sc'
    ? 'Support Coordinator Report'
    : 'Participant-Friendly Report';

  let y = addPageHeader(doc, title, subtitle);

  // Confidence & Verdict Box
  const verdictColor = assessmentResult.eligibilityVerdict === 'likely_eligible'
    ? COLORS.success
    : assessmentResult.eligibilityVerdict === 'possibly_eligible'
      ? COLORS.warning
      : COLORS.danger;

  doc.setFillColor(verdictColor[0], verdictColor[1], verdictColor[2], 0.1);
  doc.roundedRect(MARGINS.left, y, CONTENT_WIDTH, 35, 4, 4, 'F');

  // Confidence Score
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...verdictColor);
  doc.text(`${assessmentResult.confidenceScore}%`, MARGINS.left + 10, y + 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text('Confidence', MARGINS.left + 10, y + 26);

  // Verdict
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...verdictColor);
  doc.text(getVerdictLabel(assessmentResult.eligibilityVerdict), MARGINS.left + 60, y + 12);

  // Pathway
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(`Recommended: ${getPathwayLabel(assessmentResult.recommendedPathway)}`, MARGINS.left + 60, y + 20);

  // Date
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  doc.text(`Generated: ${formatDate(assessmentResult.timestamp)}`, MARGINS.left + 60, y + 28);

  y += 43;

  // Main Report Content
  y = addSection(doc, viewMode === 'sc' ? 'Assessment Summary' : 'What This Means', y);
  const reportContent = viewMode === 'sc' ? assessmentResult.scReport : assessmentResult.participantReport;
  y = addParagraph(doc, reportContent, y);
  y += 8;

  // Evidence Suggestions
  if (assessmentResult.evidenceSuggestions.length > 0) {
    y = checkPageBreak(doc, y, 50);
    y = addSection(doc, viewMode === 'sc' ? 'Evidence Requirements' : 'What You Need to Gather', y);

    for (const suggestion of assessmentResult.evidenceSuggestions) {
      y = checkPageBreak(doc, y, 25);

      // Priority badge
      const priorityColor = suggestion.priority === 'essential'
        ? COLORS.danger
        : suggestion.priority === 'recommended'
          ? COLORS.warning
          : COLORS.textLight;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...priorityColor);
      doc.text(`[${suggestion.priority.toUpperCase()}]`, MARGINS.left, y);

      // Title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(suggestion.title, MARGINS.left + 25, y);
      y += 5;

      // Description
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(suggestion.description, CONTENT_WIDTH - 10);
      doc.text(descLines, MARGINS.left + 5, y);
      y += descLines.length * 5 + 4;

      // Examples
      if (suggestion.examples && suggestion.examples.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textLight);
        doc.text('Examples:', MARGINS.left + 5, y);
        y += 4;
        for (const example of suggestion.examples) {
          const exLines = doc.splitTextToSize(`- ${example}`, CONTENT_WIDTH - 15);
          doc.text(exLines, MARGINS.left + 10, y);
          y += exLines.length * 4;
        }
        y += 2;
      }
      y += 2;
    }
  }

  // Next Steps / Action Timeline
  if (assessmentResult.nextSteps.length > 0) {
    y = checkPageBreak(doc, y, 50);
    y = addSection(doc, viewMode === 'sc' ? 'Action Timeline' : 'What Happens Next', y);

    for (const step of assessmentResult.nextSteps.sort((a, b) => a.order - b.order)) {
      y = checkPageBreak(doc, y, 25);

      // Step number
      doc.setFillColor(...COLORS.primary);
      doc.circle(MARGINS.left + 4, y - 1, 4, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${step.order}`, MARGINS.left + 2.5, y + 0.5);

      // Title and timeframe
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(step.title, MARGINS.left + 12, y);

      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textLight);
      doc.text(`(${step.timeframe})`, MARGINS.left + 12 + doc.getTextWidth(step.title) + 2, y);
      y += 5;

      // Description
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
      const stepLines = doc.splitTextToSize(step.description, CONTENT_WIDTH - 15);
      doc.text(stepLines, MARGINS.left + 12, y);
      y += stepLines.length * 5 + 4;

      // Responsible party
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.textLight);
      const responsibleLabel = {
        participant: 'Your responsibility',
        sc: 'Support Coordinator',
        provider: 'Service Provider',
        ndia: 'NDIA',
      }[step.responsible] || step.responsible;
      doc.text(`Responsible: ${responsibleLabel}`, MARGINS.left + 12, y);
      y += 8;
    }
  }

  // NDIS References (SC view only)
  if (viewMode === 'sc' && assessmentResult.ndisReferences.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSection(doc, 'NDIS References', y);

    for (const ref of assessmentResult.ndisReferences) {
      y = checkPageBreak(doc, y, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(`${ref.title} - ${ref.section}`, MARGINS.left, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textLight);
      const refLines = doc.splitTextToSize(ref.relevance, CONTENT_WIDTH);
      doc.text(refLines, MARGINS.left + 5, y);
      y += refLines.length * 4 + 4;
    }
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  const filename = `coc-assessment-${viewMode}-${Date.now()}.pdf`;

  if (!skipDownload) {
    doc.save(filename);
  }

  return {
    filename,
    pdfBlob: doc.output('blob'),
  };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const PDFExport = {
  generateSeniorPlannerPDF,
  generateCoCPDF,
};

export default PDFExport;
