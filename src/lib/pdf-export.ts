/**
 * PDF Export utilities for Senior Planner and CoC Assessor
 * Enterprise-quality PDF generation with professional NDIS clinical theme
 * Uses jsPDF for client-side PDF generation
 */

import { jsPDF } from 'jspdf';
import type {
  AuditStatus,
  StrengthItem,
  ImprovementItem,
  RedFlagItem,
  LanguageFix,
  SeniorPlannerPDFOptions,
  CoCPDFOptions,
  PDFExportResult,
} from '@/types/senior-planner';
import { getPathwayLabel } from '@/types/senior-planner';

// ============================================================================
// CONSTANTS — Professional Navy/Blue Clinical Theme
// ============================================================================

const COLORS = {
  primary: [20, 35, 65] as [number, number, number],       // Navy #142341
  accent: [37, 98, 180] as [number, number, number],       // Blue #2562B4
  success: [22, 163, 74] as [number, number, number],      // Green #16A34A
  warning: [217, 119, 6] as [number, number, number],      // Amber #D97706
  danger: [220, 38, 38] as [number, number, number],       // Red #DC2626
  text: [30, 41, 59] as [number, number, number],          // Slate #1E293B
  muted: [100, 116, 139] as [number, number, number],      // Slate #64748B
  lightBg: [248, 250, 252] as [number, number, number],    // #F8FAFC
  white: [255, 255, 255] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],     // Slate 200
  lightBlue: [239, 246, 255] as [number, number, number],  // Blue-50
  lightGreen: [240, 253, 244] as [number, number, number], // Green-50
  lightAmber: [255, 251, 235] as [number, number, number], // Amber-50
  lightRed: [254, 242, 242] as [number, number, number],   // Red-50
  lightPurple: [245, 243, 255] as [number, number, number],// Purple-50
  purple: [124, 58, 237] as [number, number, number],      // Purple #7C3AED
};

const MARGIN = {
  left: 15,
  right: 15,
  top: 15,
  bottom: 20,
};

const PAGE_W = 210; // A4 width mm
const PAGE_H = 297; // A4 height mm
const CONTENT_W = PAGE_W - MARGIN.left - MARGIN.right; // 180mm

// ============================================================================
// UTILITY HELPERS
// ============================================================================

function formatTimestamp(date?: Date): string {
  const d = date instanceof Date ? date : new Date();
  return new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatDateShort(date?: Date): string {
  const d = date instanceof Date ? date : new Date();
  return new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

function getStatusLabel(status: AuditStatus): string {
  switch (status) {
    case 'excellent': return 'APPROVED FOR LODGEMENT';
    case 'good': return 'APPROVED FOR LODGEMENT';
    case 'needs_improvement': return 'REVISION REQUIRED';
    case 'critical': return 'CRITICAL REWORK';
    case 'security_blocked': return 'CONTENT RESTRICTED';
    default: return 'UNKNOWN';
  }
}

function getStatusColor(status: AuditStatus): [number, number, number] {
  switch (status) {
    case 'excellent': return COLORS.success;
    case 'good': return COLORS.success;
    case 'needs_improvement': return COLORS.warning;
    case 'critical': return COLORS.danger;
    case 'security_blocked': return COLORS.muted;
    default: return COLORS.muted;
  }
}

function scoreColor(score: number): [number, number, number] {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.danger;
}

/** Ensure page break if needed, returns new Y. Adds footer to current page before break. */
function ensureSpace(doc: jsPDF, y: number, needed: number, footerFn: () => void): number {
  if (y + needed > PAGE_H - MARGIN.bottom - 10) {
    footerFn();
    doc.addPage();
    return MARGIN.top + 5;
  }
  return y;
}

// ============================================================================
// DRAWING PRIMITIVES
// ============================================================================

/** Draw a solid navy header bar */
function drawHeaderBar(doc: jsPDF, dateStr: string): number {
  const barH = 25;

  // Solid navy bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_W, barH, 'F');

  // Accent stripe at bottom of bar
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, barH - 1.5, PAGE_W, 1.5, 'F');

  // Title text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.white);
  doc.text('PRAXIS-AI SENIOR NDIS PLANNER AUDIT', MARGIN.left, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 230);
  doc.text('Section 34 Compliance Analysis Report', MARGIN.left, 18);

  // Date on the right
  doc.setFontSize(8);
  doc.setTextColor(180, 190, 210);
  doc.text(dateStr, PAGE_W - MARGIN.right, 18, { align: 'right' });

  return barH + 6;
}

/** Draw a metadata info row */
function drawDocumentInfo(doc: jsPDF, y: number, docName: string, docType: string, timestamp: string): number {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);

  doc.text(`Document: ${docName}`, MARGIN.left, y);
  doc.text(`Type: ${docType}`, MARGIN.left + 90, y);
  doc.text(`Generated: ${timestamp}`, MARGIN.left, y + 4.5);

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN.left, y + 8, PAGE_W - MARGIN.right, y + 8);

  return y + 12;
}

/** Draw score circle approximation using filled arc segments */
function drawScoreCircle(doc: jsPDF, cx: number, cy: number, radius: number, score: number, color: [number, number, number]): void {
  // Background circle (light gray)
  doc.setDrawColor(220, 225, 235);
  doc.setLineWidth(2.5);
  doc.circle(cx, cy, radius, 'S');

  // Score arc — draw colored segments
  const segments = Math.round((score / 100) * 60);
  if (segments > 0) {
    doc.setDrawColor(...color);
    doc.setLineWidth(2.5);
    for (let i = 0; i < segments; i++) {
      const angle = (-Math.PI / 2) + (i / 60) * 2 * Math.PI;
      const nextAngle = (-Math.PI / 2) + ((i + 1) / 60) * 2 * Math.PI;
      const x1 = cx + radius * Math.cos(angle);
      const y1 = cy + radius * Math.sin(angle);
      const x2 = cx + radius * Math.cos(nextAngle);
      const y2 = cy + radius * Math.sin(nextAngle);
      doc.line(x1, y1, x2, y2);
    }
  }

  // Score text in center
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...color);
  doc.text(`${score}`, cx, cy + 2, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text('/ 100', cx, cy + 7.5, { align: 'center' });
}

/** Draw horizontal score gauge bar */
function drawScoreGauge(doc: jsPDF, label: string, score: number, x: number, y: number, width: number): number {
  const barH = 5;
  const safeScore = Math.max(0, Math.min(100, score || 0));
  const color = scoreColor(safeScore);

  // Label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(label, x, y);

  // Background bar
  doc.setFillColor(230, 235, 242);
  doc.roundedRect(x, y + 2, width, barH, 1.5, 1.5, 'F');

  // Fill bar
  const fillW = (safeScore / 100) * width;
  if (fillW > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y + 2, fillW, barH, 1.5, 1.5, 'F');
  }

  // Score value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  doc.text(`${safeScore}`, x + width + 3, y + 6);

  return y + barH + 8;
}

/** Draw a section header with left accent bar */
function drawSectionHeader(doc: jsPDF, y: number, title: string, accentColor: [number, number, number], icon?: string): number {
  // Accent bar
  doc.setFillColor(...accentColor);
  doc.rect(MARGIN.left, y, 3, 7, 'F');

  // Icon/symbol
  if (icon) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...accentColor);
    doc.text(icon, MARGIN.left + 6, y + 5.5);
  }

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text(title.toUpperCase(), MARGIN.left + (icon ? 14 : 6), y + 5.5);

  // Underline
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.3);
  doc.line(MARGIN.left, y + 9, PAGE_W - MARGIN.right, y + 9);

  return y + 13;
}

/** Draw a category/severity badge */
function drawBadge(doc: jsPDF, text: string, x: number, y: number, bgColor: [number, number, number], textColor: [number, number, number]): number {
  const badgeText = text.toUpperCase();
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  const tw = doc.getTextWidth(badgeText);
  const pw = tw + 4;
  const ph = 4.5;

  doc.setFillColor(...bgColor);
  doc.roundedRect(x, y - 3.2, pw, ph, 1, 1, 'F');
  doc.setTextColor(...textColor);
  doc.text(badgeText, x + 2, y);

  return pw + 2; // Return badge width + spacing
}

/** Get severity badge colors */
function severityColors(severity: string): { bg: [number, number, number]; text: [number, number, number] } {
  switch (severity) {
    case 'critical': return { bg: [254, 226, 226], text: COLORS.danger };
    case 'high': return { bg: [254, 243, 199], text: [161, 98, 7] };
    case 'medium': return { bg: [254, 249, 195], text: [133, 100, 4] };
    case 'low': return { bg: [220, 252, 231], text: [21, 128, 61] };
    default: return { bg: [241, 245, 249], text: COLORS.muted };
  }
}

/** Add page footer */
function addPageFooter(doc: jsPDF): void {
  const pageNum = doc.getCurrentPageInfo().pageNumber;
  const totalPages = doc.getNumberOfPages();

  // Footer line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN.left, PAGE_H - 14, PAGE_W - MARGIN.right, PAGE_H - 14);

  // Left: branding
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text('Generated by Praxis-AI Senior NDIS Planner Audit', MARGIN.left, PAGE_H - 10);

  // Right: page number
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN.right, PAGE_H - 10, { align: 'right' });

  // Disclaimer
  doc.setFontSize(6);
  doc.setTextColor(150, 160, 175);
  doc.text(
    'This audit is AI-generated guidance and should be reviewed by a qualified NDIS professional before lodgement.',
    PAGE_W / 2,
    PAGE_H - 6,
    { align: 'center' }
  );
}

// ============================================================================
// NDIS GLOSSARY DATA
// ============================================================================

const NDIS_GLOSSARY: [string, string][] = [
  ['§34(1)(a)', "Supports participant's goals & aspirations"],
  ['§34(1)(b)', 'Facilitates social/economic participation'],
  ['§34(1)(c)', 'Represents value for money'],
  ['§34(1)(d)', 'Effective and beneficial for participant'],
  ['§34(1)(e)', 'Informal supports appropriately considered'],
  ['§34(1)(f)', 'Most appropriately funded by NDIS (APTOS)'],
  ['§34(1)(g)', "Related to participant's disability"],
  ['FCA', 'Functional Capacity Assessment'],
  ['AT', 'Assistive Technology'],
  ['CoC', 'Change of Circumstances'],
  ['TAC/Medicare', 'Transport Accident/Medicare (mainstream)'],
  ['APTOS', 'Applied Principles & Tables of Support'],
  ['RFI', 'Request for Information from NDIA'],
  ['VfM', 'Value for Money'],
  ['NDIA', 'National Disability Insurance Agency'],
];

// ============================================================================
// SENIOR PLANNER PDF — ENTERPRISE QUALITY
// ============================================================================

export function generateSeniorPlannerPDF(options: SeniorPlannerPDFOptions): PDFExportResult {
  const { auditResult, documentName, documentTypeLabel, skipDownload = false } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Track which pages have had footers added (to avoid duplicates)
  const footeredPages = new Set<number>();

  const addFooterToCurrentPage = () => {
    const pageNum = doc.getCurrentPageInfo().pageNumber;
    if (!footeredPages.has(pageNum)) {
      footeredPages.add(pageNum);
    }
  };

  const timestamp = formatTimestamp(auditResult.timestamp);
  const dateShort = formatDateShort(auditResult.timestamp);
  const statusColor = getStatusColor(auditResult.status);
  const statusLabel = getStatusLabel(auditResult.status);

  // ──────────── PAGE 1: HEADER + SCORES ────────────

  let y = drawHeaderBar(doc, dateShort);
  y = drawDocumentInfo(doc, y, documentName, documentTypeLabel, timestamp);

  // ── OVERALL COMPLIANCE SCORE BOX ──
  const scoreBoxY = y;
  const scoreBoxH = 52;

  // Box background
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(MARGIN.left, scoreBoxY, CONTENT_W, scoreBoxH, 3, 3, 'F');

  // Box border
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN.left, scoreBoxY, CONTENT_W, scoreBoxH, 3, 3, 'S');

  // Section label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text('OVERALL COMPLIANCE SCORE', MARGIN.left + 5, scoreBoxY + 6);

  // Score circle (left side)
  const circleCx = MARGIN.left + 25;
  const circleCy = scoreBoxY + 30;
  drawScoreCircle(doc, circleCx, circleCy, 13, auditResult.overallScore, statusColor);

  // Status badge (right of circle)
  const badgeX = circleCx + 22;
  const badgeY = scoreBoxY + 18;
  doc.setFillColor(...statusColor);
  const badgeLabel = statusLabel;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const badgeTw = doc.getTextWidth(badgeLabel);
  doc.roundedRect(badgeX, badgeY, badgeTw + 8, 7, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.text(badgeLabel, badgeX + 4, badgeY + 5);

  // Sub-scores on the right half
  const gaugeStartX = MARGIN.left + 95;
  const gaugeW = 35;
  let gaugeY = scoreBoxY + 10;

  const scores = auditResult.scores;
  const scoreItems = [
    { label: '§34 Compliance', score: scores.compliance },
    { label: 'Nexus Quality', score: scores.nexus },
    { label: 'Value for Money', score: scores.valueForMoney },
    { label: 'Evidence Quality', score: scores.evidence },
    { label: 'Significant Change', score: scores.significantChange },
  ];

  // Two columns of gauges
  const col1X = gaugeStartX;
  const col2X = gaugeStartX + gaugeW + 18;

  for (let i = 0; i < scoreItems.length; i++) {
    const col = i < 3 ? col1X : col2X;
    const row = i < 3 ? gaugeY + (i * 13) : gaugeY + ((i - 3) * 13);
    drawScoreGauge(doc, scoreItems[i]!.label, scoreItems[i]!.score, col, row, gaugeW);
  }

  y = scoreBoxY + scoreBoxH + 6;

  // ── PLANNER SUMMARY BOX ──
  y = ensureSpace(doc, y, 30, addFooterToCurrentPage);

  doc.setFillColor(...COLORS.lightBlue);
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.setLineWidth(0.3);

  const summaryText = auditResult.plannerSummary || 'No summary available.';
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(summaryText, CONTENT_W - 14);
  const summaryBoxH = 10 + summaryLines.length * 4.2;

  doc.roundedRect(MARGIN.left, y, CONTENT_W, summaryBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.accent);
  doc.text("SENIOR NDIS PLANNER'S ASSESSMENT", MARGIN.left + 5, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text(summaryLines, MARGIN.left + 5, y + 11);

  y += summaryBoxH + 6;

  // ── STRENGTHS SECTION ──
  const strengths = auditResult.strengths || [];
  if (strengths.length > 0) {
    y = ensureSpace(doc, y, 25, addFooterToCurrentPage);
    y = drawSectionHeader(doc, y, "What's Working", COLORS.success);

    for (let i = 0; i < strengths.length; i++) {
      y = ensureSpace(doc, y, 20, addFooterToCurrentPage);

      const item = strengths[i];
      const isStr = typeof item === 'string';
      const finding = isStr ? item : (item as StrengthItem).finding;
      const category = isStr ? 'General' : ((item as StrengthItem).category || 'General');
      const quote = isStr ? '' : ((item as StrengthItem).quote || '');
      const s34Ref = isStr ? '' : ((item as StrengthItem).section34Reference || '');

      // Alternating row background
      if (i % 2 === 0) {
        doc.setFillColor(...COLORS.lightGreen);
        doc.rect(MARGIN.left, y - 2, CONTENT_W, quote ? 16 : 10, 'F');
      }

      // Green left accent
      doc.setFillColor(...COLORS.success);
      doc.rect(MARGIN.left, y - 2, 2, quote ? 16 : 10, 'F');

      // Category badge
      let bx = MARGIN.left + 5;
      const badgeW = drawBadge(doc, category, bx, y + 1, [220, 252, 231], [21, 128, 61]);
      bx += badgeW;

      // S34 reference badge
      if (s34Ref) {
        drawBadge(doc, s34Ref, bx, y + 1, [219, 234, 254], COLORS.accent);
      }

      // Finding text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.text);
      const findingLines = doc.splitTextToSize(finding, CONTENT_W - 10);
      doc.text(findingLines, MARGIN.left + 5, y + 6);

      y += 4 + findingLines.length * 3.8;

      // Quote (if present)
      if (quote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.muted);
        const quoteLines = doc.splitTextToSize(`"${quote}"`, CONTENT_W - 15);
        doc.text(quoteLines, MARGIN.left + 8, y + 2);
        y += 2 + quoteLines.length * 3.5;
      }

      y += 3;
    }
    y += 3;
  }

  // ── IMPROVEMENTS SECTION ──
  const improvements = auditResult.improvements || [];
  if (improvements.length > 0) {
    y = ensureSpace(doc, y, 25, addFooterToCurrentPage);
    y = drawSectionHeader(doc, y, 'Improvements Required', COLORS.warning);

    for (let i = 0; i < improvements.length; i++) {
      y = ensureSpace(doc, y, 28, addFooterToCurrentPage);

      const item = improvements[i];
      const isStr = typeof item === 'string';
      const finding = isStr ? item : (item as ImprovementItem).finding;
      const category = isStr ? 'General' : ((item as ImprovementItem).category || 'General');
      const severity = isStr ? 'medium' : ((item as ImprovementItem).severity || 'medium');
      const remediation = isStr ? '' : ((item as ImprovementItem).remediation || '');
      const quote = isStr ? '' : ((item as ImprovementItem).quote || '');
      const s34Ref = isStr ? '' : ((item as ImprovementItem).section34Reference || '');

      // Amber left accent
      doc.setFillColor(...COLORS.warning);
      doc.rect(MARGIN.left, y - 2, 2, 8, 'F');

      // Severity badge
      let bx = MARGIN.left + 5;
      const sevColors = severityColors(severity);
      const sevW = drawBadge(doc, severity, bx, y + 1, sevColors.bg, sevColors.text);
      bx += sevW;

      // Category badge
      const catW = drawBadge(doc, category, bx, y + 1, [255, 251, 235], [161, 98, 7]);
      bx += catW;

      // S34 reference
      if (s34Ref) {
        drawBadge(doc, s34Ref, bx, y + 1, [219, 234, 254], COLORS.accent);
      }

      y += 5;

      // Issue text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.text);
      doc.text('Issue:', MARGIN.left + 5, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const findingLines = doc.splitTextToSize(finding, CONTENT_W - 20);
      doc.text(findingLines, MARGIN.left + 17, y);
      y += findingLines.length * 3.8 + 1.5;

      // Remediation text
      if (remediation) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.success);
        doc.text('Action:', MARGIN.left + 5, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...COLORS.text);
        const remLines = doc.splitTextToSize(remediation, CONTENT_W - 22);
        doc.text(remLines, MARGIN.left + 20, y);
        y += remLines.length * 3.8 + 1.5;
      }

      // Quote
      if (quote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.muted);
        const quoteLines = doc.splitTextToSize(`"${quote}"`, CONTENT_W - 15);
        doc.text(quoteLines, MARGIN.left + 8, y);
        y += quoteLines.length * 3.5 + 1;
      }

      y += 4;
    }
    y += 2;
  }

  // ── RED FLAGS SECTION ──
  const redFlags = auditResult.redFlags || [];
  if (redFlags.length > 0) {
    y = ensureSpace(doc, y, 25, addFooterToCurrentPage);
    y = drawSectionHeader(doc, y, 'Planner Red Flags', COLORS.danger);

    for (let i = 0; i < redFlags.length; i++) {
      y = ensureSpace(doc, y, 22, addFooterToCurrentPage);

      const item = redFlags[i];
      const isStr = typeof item === 'string';
      const flag = isStr ? item : (item as RedFlagItem).flag;
      const reason = isStr ? '' : ((item as RedFlagItem).reason || '');
      const riskLevel = isStr ? 'high' : ((item as RedFlagItem).riskLevel || 'high');
      const s34Ref = isStr ? '' : ((item as RedFlagItem).section34Reference || '');
      const quote = isStr ? '' : ((item as RedFlagItem).quote || '');

      // Light red background
      doc.setFillColor(...COLORS.lightRed);
      doc.rect(MARGIN.left, y - 2, CONTENT_W, 7, 'F');

      // Red left accent
      doc.setFillColor(...COLORS.danger);
      doc.rect(MARGIN.left, y - 2, 2, 7, 'F');

      // Risk level badge
      let bx = MARGIN.left + 5;
      const rlColors = riskLevel === 'critical'
        ? { bg: [254, 202, 202] as [number, number, number], text: COLORS.danger }
        : { bg: [254, 243, 199] as [number, number, number], text: [161, 98, 7] as [number, number, number] };
      const rlW = drawBadge(doc, riskLevel, bx, y + 1, rlColors.bg, rlColors.text);
      bx += rlW;

      // Flag title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.danger);
      doc.text(flag, bx, y + 1.5);

      y += 7;

      // Reason
      if (reason) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.text);
        doc.text('Reason:', MARGIN.left + 5, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const reasonLines = doc.splitTextToSize(reason, CONTENT_W - 22);
        doc.text(reasonLines, MARGIN.left + 20, y);
        y += reasonLines.length * 3.8 + 1.5;
      }

      // S34 reference
      if (s34Ref) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.accent);
        doc.text(`§34 Reference: ${s34Ref}`, MARGIN.left + 5, y);
        y += 4;
      }

      // Quote
      if (quote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.muted);
        const quoteLines = doc.splitTextToSize(`"${quote}"`, CONTENT_W - 15);
        doc.text(quoteLines, MARGIN.left + 8, y);
        y += quoteLines.length * 3.5 + 1;
      }

      y += 4;
    }
    y += 2;
  }

  // ── LANGUAGE CONVERTER SECTION ──
  const languageFixes = auditResult.languageFixes || [];
  if (languageFixes.length > 0) {
    y = ensureSpace(doc, y, 30, addFooterToCurrentPage);
    y = drawSectionHeader(doc, y, 'Suggested Language Improvements', COLORS.accent);

    for (let i = 0; i < languageFixes.length; i++) {
      y = ensureSpace(doc, y, 22, addFooterToCurrentPage);

      const fix = languageFixes[i] as LanguageFix;
      const original = fix.original || '';
      const suggested = fix.suggested || '';
      const reason = fix.reason || '';
      const fixLabel = (fix.category || fix.section34Impact || 'general').toUpperCase().replace(/_/g, ' ');

      // Two-column table layout
      const colW = (CONTENT_W - 4) / 2;
      const tableY = y;

      // Left column header: ORIGINAL (red-tinted)
      doc.setFillColor(254, 226, 226);
      doc.rect(MARGIN.left, tableY, colW, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.danger);
      doc.text('ORIGINAL', MARGIN.left + 2, tableY + 3.5);

      // Right column header: SUGGESTED (green-tinted)
      doc.setFillColor(220, 252, 231);
      doc.rect(MARGIN.left + colW + 4, tableY, colW, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.success);
      doc.text('SUGGESTED', MARGIN.left + colW + 6, tableY + 3.5);

      y = tableY + 7;

      // Original text (left col)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.danger);
      const origLines = doc.splitTextToSize(`"${original}"`, colW - 6);
      doc.text(origLines, MARGIN.left + 2, y);

      // Suggested text (right col)
      doc.setTextColor(...COLORS.success);
      const sugLines = doc.splitTextToSize(`"${suggested}"`, colW - 6);
      doc.text(sugLines, MARGIN.left + colW + 6, y);

      const maxLines = Math.max(origLines.length, sugLines.length);
      y += maxLines * 3.8 + 2;

      // Reason below
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      const reasonLines = doc.splitTextToSize(`[${fixLabel}] ${reason}`, CONTENT_W - 10);
      doc.text(reasonLines, MARGIN.left + 3, y);
      y += reasonLines.length * 3.5 + 5;
    }
    y += 2;
  }

  // ── PLANNER QUESTIONS SECTION ──
  const plannerQuestions = auditResult.plannerQuestions || [];
  if (plannerQuestions.length > 0) {
    y = ensureSpace(doc, y, 25, addFooterToCurrentPage);
    y = drawSectionHeader(doc, y, 'Questions A Planner Will Likely Ask', COLORS.purple);

    for (let i = 0; i < plannerQuestions.length; i++) {
      y = ensureSpace(doc, y, 10, addFooterToCurrentPage);

      const q = plannerQuestions[i];

      // Number circle
      doc.setFillColor(...COLORS.purple);
      doc.circle(MARGIN.left + 6, y + 1, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.white);
      doc.text(`${i + 1}`, MARGIN.left + 6, y + 2, { align: 'center' });

      // Question text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.text);
      const qLines = doc.splitTextToSize(q ?? '', CONTENT_W - 18);
      doc.text(qLines, MARGIN.left + 12, y + 2);
      y += qLines.length * 4 + 3;
    }
    y += 3;
  }

  // ── MAINSTREAM INTERFACE CHECK ──
  const mic = auditResult.mainstreamInterfaceCheck;
  if (mic) {
    y = ensureSpace(doc, y, 30, addFooterToCurrentPage);
    y = drawSectionHeader(doc, y, 'Mainstream Interface Check', COLORS.accent);

    // Grid of 4 risk domains
    const gridW = (CONTENT_W - 12) / 4;
    const risks = [
      { label: 'Health System', active: mic.healthSystemRisk },
      { label: 'Education', active: mic.educationSystemRisk },
      { label: 'Housing', active: mic.housingSystemRisk },
      { label: 'Justice', active: mic.justiceSystemRisk },
    ];

    for (let i = 0; i < risks.length; i++) {
      const gx = MARGIN.left + 3 + i * (gridW + 3);

      // Box
      const risk = risks[i]!;
      const boxColor = risk.active ? COLORS.lightRed : COLORS.lightGreen;
      doc.setFillColor(...boxColor);
      doc.roundedRect(gx, y, gridW, 12, 2, 2, 'F');

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.text);
      doc.text(risk.label, gx + gridW / 2, y + 5, { align: 'center' });

      // YES/NO
      const statusText = risk.active ? 'RISK' : 'CLEAR';
      const stColor = risk.active ? COLORS.danger : COLORS.success;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...stColor);
      doc.text(statusText, gx + gridW / 2, y + 10, { align: 'center' });
    }

    y += 16;

    // Notes
    if (mic.notes) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      const noteLines = doc.splitTextToSize(`Notes: ${mic.notes}`, CONTENT_W - 10);
      doc.text(noteLines, MARGIN.left + 5, y);
      y += noteLines.length * 3.8 + 4;
    }
    y += 3;
  }

  // ── NDIS GLOSSARY ──
  y = ensureSpace(doc, y, 45, addFooterToCurrentPage);
  y = drawSectionHeader(doc, y, 'NDIS Terms & Definitions', COLORS.primary);

  const glossaryColW = (CONTENT_W - 6) / 2;
  const itemsPerCol = Math.ceil(NDIS_GLOSSARY.length / 2);

  for (let i = 0; i < itemsPerCol; i++) {
    y = ensureSpace(doc, y, 7, addFooterToCurrentPage);

    // Row stripe
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.lightBg);
      doc.rect(MARGIN.left, y - 2, CONTENT_W, 5.5, 'F');
    }

    // Left column
    const leftItem = NDIS_GLOSSARY[i];
    if (leftItem) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.primary);
      doc.text(leftItem[0], MARGIN.left + 2, y + 1.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.text);
      doc.text(leftItem[1], MARGIN.left + 22, y + 1.5);
    }

    // Right column
    const rightItem = NDIS_GLOSSARY[i + itemsPerCol];
    if (rightItem) {
      const rx = MARGIN.left + glossaryColW + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.primary);
      doc.text(rightItem[0], rx, y + 1.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.text);
      doc.text(rightItem[1], rx + 22, y + 1.5);
    }

    y += 5.5;
  }

  // ── ADD FOOTERS TO ALL PAGES ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addPageFooter(doc);
  }

  // ── SAVE ──
  const filename = `praxis-audit-${documentName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`;

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
// (Preserved from original with minor styling alignment)
// ============================================================================

function addPageHeader(doc: jsPDF, title: string, subtitle?: string): number {
  let y = MARGIN.top;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(title, MARGIN.left, y);
  y += 8;

  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(subtitle, MARGIN.left, y);
    y += 6;
  }

  y += 4;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(MARGIN.left, y, PAGE_W - MARGIN.right, y);
  y += 8;

  return y;
}

function addSection(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text(title, MARGIN.left, y);
  return y + 8;
}

function addParagraph(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, MARGIN.left, y);
  return y + lines.length * 5;
}


function checkPageBreak(doc: jsPDF, y: number, requiredSpace: number = 40): number {
  if (y + requiredSpace > 280) {
    doc.addPage();
    return MARGIN.top;
  }
  return y;
}

function addCoCFooter(doc: jsPDF, pageNumber: number): void {
  const totalPages = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(`Page ${pageNumber} of ${totalPages}`, PAGE_W - MARGIN.right - 20, 290);
  doc.text('Generated by Praxis AI - For clinical use only', MARGIN.left, 290);
}

function getVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'likely_eligible': return 'Likely Eligible';
    case 'possibly_eligible': return 'Possibly Eligible';
    case 'not_eligible': return 'Not Eligible';
    default: return 'Unknown';
  }
}

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
  doc.roundedRect(MARGIN.left, y, CONTENT_W, 35, 4, 4, 'F');

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...verdictColor);
  doc.text(`${assessmentResult.confidenceScore}%`, MARGIN.left + 10, y + 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text('Confidence', MARGIN.left + 10, y + 26);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...verdictColor);
  doc.text(getVerdictLabel(assessmentResult.eligibilityVerdict), MARGIN.left + 60, y + 12);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(`Recommended: ${getPathwayLabel(assessmentResult.recommendedPathway)}`, MARGIN.left + 60, y + 20);

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  const cocTimestamp = formatTimestamp(assessmentResult.timestamp);
  doc.text(`Generated: ${cocTimestamp}`, MARGIN.left + 60, y + 28);

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

      const priorityColor = suggestion.priority === 'essential'
        ? COLORS.danger
        : suggestion.priority === 'recommended'
          ? COLORS.warning
          : COLORS.muted;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...priorityColor);
      doc.text(`[${suggestion.priority.toUpperCase()}]`, MARGIN.left, y);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(suggestion.title, MARGIN.left + 25, y);
      y += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(suggestion.description, CONTENT_W - 10);
      doc.text(descLines, MARGIN.left + 5, y);
      y += descLines.length * 5 + 4;

      if (suggestion.examples && suggestion.examples.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.muted);
        doc.text('Examples:', MARGIN.left + 5, y);
        y += 4;
        for (const example of suggestion.examples) {
          const exLines = doc.splitTextToSize(`- ${example}`, CONTENT_W - 15);
          doc.text(exLines, MARGIN.left + 10, y);
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

      doc.setFillColor(...COLORS.accent);
      doc.circle(MARGIN.left + 4, y - 1, 4, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${step.order}`, MARGIN.left + 2.5, y + 0.5);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(step.title, MARGIN.left + 12, y);

      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text(`(${step.timeframe})`, MARGIN.left + 12 + doc.getTextWidth(step.title) + 2, y);
      y += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
      const stepLines = doc.splitTextToSize(step.description, CONTENT_W - 15);
      doc.text(stepLines, MARGIN.left + 12, y);
      y += stepLines.length * 5 + 4;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.muted);
      const responsibleLabel: Record<string, string> = {
        participant: 'Your responsibility',
        sc: 'Support Coordinator',
        provider: 'Service Provider',
        ndia: 'NDIA',
      };
      doc.text(`Responsible: ${responsibleLabel[step.responsible] || step.responsible}`, MARGIN.left + 12, y);
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
      doc.text(`${ref.title} - ${ref.section}`, MARGIN.left, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.muted);
      const refLines = doc.splitTextToSize(ref.relevance, CONTENT_W);
      doc.text(refLines, MARGIN.left + 5, y);
      y += refLines.length * 4 + 4;
    }
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addCoCFooter(doc, i);
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
