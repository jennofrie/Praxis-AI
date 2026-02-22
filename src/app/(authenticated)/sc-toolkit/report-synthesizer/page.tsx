"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { extractTextFromPDF, isPDFFile } from "@/lib/pdf-parser";
import { exportReportSynthesizerPdf } from "@/lib/report-synthesizer-pdf";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Upload,
  Loader2,
  AlertTriangle,
  Download,
  Copy,
  CheckCircle,
  ArrowLeft,
  Lightbulb,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2,
  User,
  Hash,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

type PersonaId = 'sc-level-2' | 'ssc-level-3' | 'prc' | 'ot' | 'progress-report';

interface PersonaConfig {
  id: PersonaId;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  reportType: string;
}

interface UploadedFile {
  name: string;
  text: string;
  charCount: number;
  status: 'extracting' | 'ready' | 'error';
}

interface ParsedSection {
  key: string;
  label: string;
  content: string;
  isExpanded?: boolean;
}

interface SynthesisHistoryItem {
  id: string;
  title: string;
  persona_id: PersonaId;
  participant_name?: string;
  synthesized_content: string;
  created_at: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PERSONAS: PersonaConfig[] = [
  {
    id: 'sc-level-2',
    title: 'SC Level 2',
    subtitle: 'Support Coordinator',
    description: 'NDIA Plan Review / Reassessment Report for Support Coordination Level 2',
    color: 'blue',
    reportType: 'NDIA Plan Review / Reassessment Report \u2014 Support Coordination Level 2',
  },
  {
    id: 'ssc-level-3',
    title: 'SSC Level 3',
    subtitle: 'Specialist Support Coordinator',
    description: 'Complex case Specialist Support Coordination report for participants with high-risk and cross-system complexity',
    color: 'purple',
    reportType: 'NDIA Plan Review / Reassessment Report \u2014 Specialist Support Coordination Level 3',
  },
  {
    id: 'prc',
    title: 'Recovery Coach',
    subtitle: 'Psychosocial Recovery Coach',
    description: 'Psychosocial Recovery Coaching Report for participants with mental health disability',
    color: 'violet',
    reportType: 'Psychosocial Recovery Coaching Report',
  },
  {
    id: 'ot',
    title: 'OT Report',
    subtitle: 'Occupational Therapist',
    description: 'Functional Capacity Assessment Report for AT, home modifications, and NDIS plan support',
    color: 'emerald',
    reportType: 'Functional Capacity Assessment Report',
  },
  {
    id: 'progress-report',
    title: 'Progress Report',
    subtitle: 'SC Progress Update',
    description: 'Mid-plan progress report for NDIA \u2014 tracks goals, utilisation, and coordination activities',
    color: 'amber',
    reportType: 'NDIS Support Coordination Progress Report',
  },
];

const SECTION_PATTERNS = [
  'PARTICIPANT SUMMARY', 'PARTICIPANT BACKGROUND AND RECOVERY JOURNEY',
  'CLINICAL FINDINGS SYNTHESIS', 'MENTAL HEALTH AND PSYCHOSOCIAL PROFILE',
  'NDIS GOALS AND ACHIEVEMENT', 'RECOVERY GOALS AND PROGRESS', 'GOAL PROGRESS SUMMARY',
  'EVIDENCE AND BARRIERS',
  'RISK ASSESSMENT AND MITIGATION', 'RISK ASSESSMENT AND SAFETY PLANNING', 'RISK AND SAFEGUARDING UPDATE',
  'SUPPORT UTILISATION', 'SUPPORT UTILISATION AND EFFECTIVENESS', 'SUPPORT UTILISATION AND BUDGET TRACKING',
  'PARTICIPANT VOICE AND FEEDBACK', 'PARTICIPANT VOICE AND SELF-ASSESSMENT',
  'RECOMMENDATIONS - CORE SUPPORTS', 'RECOMMENDATIONS - PSYCHOSOCIAL RECOVERY COACHING', 'RECOMMENDATIONS SUMMARY',
  'RECOMMENDATIONS - CAPACITY BUILDING', 'RECOMMENDATIONS - COMMUNITY PARTICIPATION',
  'RECOMMENDATIONS - CAPITAL SUPPORTS', 'NDIS/MEDICARE BOUNDARY JUSTIFICATION',
  'SAFEGUARDS AND QUALITY ASSURANCE',
  'SERVICE COORDINATION ACTIVITIES', 'COORDINATION ACTIVITIES DURING PLAN PERIOD',
  'NEXT STEPS AND TRANSITION PLANNING', 'NEXT STEPS AND RECOVERY MILESTONES',
  'REFERRAL AND BACKGROUND', 'ASSESSMENT METHODOLOGY AND TOOLS', 'MEDICAL AND DISABILITY PROFILE',
  'OCCUPATIONAL PERFORMANCE ANALYSIS', 'FUNCTIONAL CAPACITY AND DAILY LIVING',
  'SELF-CARE AND PERSONAL ACTIVITIES OF DAILY LIVING', 'INSTRUMENTAL ACTIVITIES OF DAILY LIVING',
  'MOBILITY AND COMMUNITY ACCESS', 'COMMUNICATION AND SOCIAL PARTICIPATION',
  'COGNITIVE AND EMOTIONAL FUNCTIONING', 'ENVIRONMENTAL ASSESSMENT',
  'ASSISTIVE TECHNOLOGY ASSESSMENT AND RECOMMENDATIONS', 'HOME MODIFICATION RECOMMENDATIONS',
  'GOAL SETTING AND OUTCOME MEASURES', 'PROFESSIONAL DECLARATION', 'COORDINATOR DECLARATION',
  'SPECIALIST JUSTIFICATION', 'PARTICIPANT DETAILS AND CURRENT PLAN SUMMARY',
  'CHANGES IN CIRCUMSTANCES OR NEEDS', 'PROVIDER PERFORMANCE AND GAPS',
  'RECOMMENDATIONS FOR REMAINING PLAN PERIOD',
];

const NDIS_TIPS = [
  "Section 34 requires supports to meet ALL six criteria simultaneously \u2014 not just one.",
  "The NDIA 'but for' test: 'But for their disability, would this person need this support?'",
  "Functional language is stronger than clinical language: 'cannot dress independently' beats 'has limited ROM'.",
  "Evidence recency matters: OT assessments older than 2 years carry significantly less weight with planners.",
  "WHODAS 2.0 and FIM scores give planners objective evidence \u2014 reference them by name with scores.",
  "Informal support analysis is mandatory: planners must see that family capacity was considered.",
  "Value for Money doesn't mean cheapest \u2014 it means best long-term outcome per dollar spent.",
  "NDIS funds disability-specific supports, not general health care. Distinguish clearly.",
  "Capacity building supports must have exit strategies \u2014 planners ask 'what is the endpoint?'",
  "Participant voice should appear throughout the report, not just in one dedicated section.",
  "S34(1)(f) APTOS: health system crossover is the #1 reason OT reports are challenged.",
  "Support Coordination Level 3 requires documented evidence of cross-system complexity.",
  "For AT over $1,500: supplier quotes and trial reports are mandatory for NDIA approval.",
  "Home modification reports must include OT assessment, quotes, and photos of the area.",
  "Progress reports should quantify goal achievement: 60% progress, not 'good progress'.",
  "PACE reporting requires structured progress against each individual NDIS plan goal.",
  "Psychosocial disability: distinguish NDIS supports from Better Access / Medicare coverage.",
  "The 'ordinary family' test: what would a typical family reasonably provide for a member?",
  "SIL reports need documented 24/7 support needs, not just preference for supported living.",
  "NDIS plans are reviewed based on evidence, not need \u2014 document everything in writing.",
  "Recovery coaching is funded under CB-Daily Activities, not Core \u2014 make sure reports reflect this.",
  "Unscheduled reviews need documented evidence of significant and material change in circumstances.",
  "Section 34(1)(b): social and economic participation is often the weakest part of SC reports.",
  "Goals must be specific, measurable, and linked to disability \u2014 not generic lifestyle goals.",
  "The NDIS Price Guide updates annually on July 1 \u2014 verify current rates before recommending hours.",
  "L3 justification: document specifically why L2 coordination has been insufficient or would fail.",
  "Evidence of participant engagement strengthens reports: attendance records, signed goal statements.",
  "Supported Decision Making: show how participant's choices and preferences shaped recommendations.",
  "Risk documentation protects participants and practitioners \u2014 never omit known safeguarding concerns.",
  "Australian spelling throughout: organise, behaviour, programme, specialised, recognise, catalogue.",
];

const STATUS_MESSAGES = [
  'Analysing clinical documentation...',
  'Extracting functional impact evidence...',
  'Mapping supports to Section 34 criteria...',
  'Synthesising evidence-based recommendations...',
  'Structuring professional report format...',
  'Applying NDIS compliance framework...',
  'Finalising report sections...',
];

// ============================================================================
// SECTION PARSER
// ============================================================================

function parseReport(text: string): ParsedSection[] {
  const lines = text.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const matchedPattern = SECTION_PATTERNS.find(p =>
      trimmed.toUpperCase() === p ||
      trimmed.toUpperCase().startsWith(p + ':') ||
      trimmed.toUpperCase() === p.replace(/ /g, ' ')
    );

    if (matchedPattern) {
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }
      currentSection = {
        key: matchedPattern,
        label: matchedPattern.split(' ').map(w =>
          w.charAt(0) + w.slice(1).toLowerCase()
        ).join(' '),
        content: '',
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }

  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection);
  }

  // If no sections found, create a single "Full Report" section
  if (sections.length === 0 && text.trim()) {
    sections.push({ key: 'FULL_REPORT', label: 'Full Report', content: text });
  }

  return sections;
}

// ============================================================================
// PERSONA COLOR UTILITIES
// ============================================================================

interface PersonaColors { bg: string; border: string; text: string; ring: string; activeBg: string; activeText: string }

function getPersonaColors(color: string): PersonaColors {
  const fallback: PersonaColors = {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    ring: 'ring-blue-500',
    activeBg: 'bg-blue-600',
    activeText: 'text-white',
  };
  const colorMap: Record<string, PersonaColors> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      ring: 'ring-blue-500',
      activeBg: 'bg-blue-600',
      activeText: 'text-white',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-300',
      ring: 'ring-purple-500',
      activeBg: 'bg-purple-600',
      activeText: 'text-white',
    },
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      border: 'border-violet-200 dark:border-violet-800',
      text: 'text-violet-700 dark:text-violet-300',
      ring: 'ring-violet-500',
      activeBg: 'bg-violet-600',
      activeText: 'text-white',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      ring: 'ring-emerald-500',
      activeBg: 'bg-emerald-600',
      activeText: 'text-white',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      ring: 'ring-amber-500',
      activeBg: 'bg-amber-600',
      activeText: 'text-white',
    },
  };
  return colorMap[color] ?? fallback;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReportSynthesizer() {
  // Input state
  const [reportText, setReportText] = useState('');
  const [coordinatorNotes, setCoordinatorNotes] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [ndisNumber, setNdisNumber] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('sc-level-2');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Generation state
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedText, setSynthesizedText] = useState<string | null>(null);
  const [parsedSections, setParsedSections] = useState<ParsedSection[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // History state
  const [history, setHistory] = useState<SynthesisHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Section expand state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Supabase client ----
  const supabase = createClient();

  // ---- Tip & Status rotation during generation ----
  useEffect(() => {
    if (isSynthesizing) {
      setCurrentTipIndex(Math.floor(Math.random() * NDIS_TIPS.length));
      setStatusMessage(STATUS_MESSAGES[0] ?? 'Processing...');

      tipIntervalRef.current = setInterval(() => {
        setCurrentTipIndex(prev => (prev + 1) % NDIS_TIPS.length);
      }, 6000);

      let statusIdx = 0;
      statusIntervalRef.current = setInterval(() => {
        statusIdx = (statusIdx + 1) % STATUS_MESSAGES.length;
        setStatusMessage(STATUS_MESSAGES[statusIdx] ?? 'Processing...');
      }, 8000);
    } else {
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    }

    return () => {
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [isSynthesizing]);

  // ---- Load history on mount ----
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('synthesized_reports')
        .select('id, title, persona_id, participant_name, synthesized_content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setHistory((data as SynthesisHistoryItem[]) || []);
    } catch {
      // History loading is non-critical
    }
  };

  // ---- File Upload ----
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    const newFiles: UploadedFile[] = [];
    const totalExisting = uploadedFiles.length;

    if (totalExisting + files.length > 10) {
      setError('Maximum 10 files allowed.');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f) continue;
      const fileEntry: UploadedFile = {
        name: f.name,
        text: '',
        charCount: 0,
        status: 'extracting',
      };
      newFiles.push(fileEntry);
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const idx = totalExisting + i;

      try {
        let extractedText = '';

        if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
          extractedText = await file.text();
        } else if (isPDFFile(file)) {
          const parsed = await extractTextFromPDF(file);
          if (parsed.success && parsed.text) {
            extractedText = parsed.text;
          } else {
            setUploadedFiles(prev => {
              const updated = [...prev];
              const entry = updated[idx];
              if (entry) {
                updated[idx] = { ...entry, status: 'error' };
              }
              return updated;
            });
            continue;
          }
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.name.toLowerCase().endsWith('.docx')
        ) {
          // Dynamic import mammoth for DOCX
          try {
            const mammoth = await import('mammoth');
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            extractedText = result.value;
          } catch {
            // If mammoth is not available, try reading as text
            extractedText = await file.text();
          }
        } else {
          setUploadedFiles(prev => {
            const updated = [...prev];
            const entry = updated[idx];
            if (entry) {
              updated[idx] = { ...entry, status: 'error' };
            }
            return updated;
          });
          continue;
        }

        setUploadedFiles(prev => {
          const updated = [...prev];
          const entry = updated[idx];
          if (entry) {
            updated[idx] = {
              ...entry,
              text: extractedText,
              charCount: extractedText.length,
              status: 'ready',
            };
          }
          return updated;
        });
      } catch {
        setUploadedFiles(prev => {
          const updated = [...prev];
          const entry = updated[idx];
          if (entry) {
            updated[idx] = { ...entry, status: 'error' };
          }
          return updated;
        });
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadedFiles.length]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ---- Build combined report text ----
  const getCombinedReportText = useCallback((): string => {
    const parts: string[] = [];

    // Add pasted/typed text
    if (reportText.trim()) {
      parts.push(reportText.trim());
    }

    // Add uploaded file text
    for (const file of uploadedFiles) {
      if (file.status === 'ready' && file.text) {
        parts.push(`\n--- Document: ${file.name} ---\n${file.text}`);
      }
    }

    return parts.join('\n\n');
  }, [reportText, uploadedFiles]);

  // ---- Synthesize ----
  const handleSynthesize = useCallback(async () => {
    const combinedText = getCombinedReportText();

    if (combinedText.length < 50) {
      setError('Please provide at least 50 characters of report content (upload files or paste text).');
      return;
    }

    setIsSynthesizing(true);
    setError(null);
    setSynthesizedText(null);
    setParsedSections([]);
    setExpandedSections(new Set());

    try {
      const response = await fetch('/api/ai/sc-report-synthesizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportText: combinedText,
          coordinatorNotes: coordinatorNotes || undefined,
          personaId: selectedPersona,
          participantName: participantName || undefined,
          ndisNumber: ndisNumber || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Synthesis failed');
      }

      const text = payload.synthesizedText;
      if (!text) {
        throw new Error('No synthesized text returned');
      }

      setSynthesizedText(text);
      const sections = parseReport(text);
      setParsedSections(sections);

      // Expand all sections by default
      setExpandedSections(new Set(sections.map(s => s.key)));

      // Reload history
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to synthesize report');
    } finally {
      setIsSynthesizing(false);
    }
  }, [getCombinedReportText, coordinatorNotes, selectedPersona, participantName, ndisNumber]);

  // ---- Copy ----
  const handleCopy = useCallback(async () => {
    if (!synthesizedText) return;
    await navigator.clipboard.writeText(synthesizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [synthesizedText]);

  // ---- Export PDF ----
  const handleExportPDF = useCallback(() => {
    if (!synthesizedText) return;
    const persona = PERSONAS.find(p => p.id === selectedPersona) ?? PERSONAS[0]!;
    exportReportSynthesizerPdf(
      synthesizedText,
      parsedSections,
      { id: persona.id, title: persona.title, reportType: persona.reportType },
      participantName || undefined,
      ndisNumber || undefined
    );
  }, [synthesizedText, parsedSections, selectedPersona, participantName, ndisNumber]);

  // ---- Toggle section expand ----
  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // ---- Load from history ----
  const loadFromHistory = useCallback((item: SynthesisHistoryItem) => {
    setSynthesizedText(item.synthesized_content);
    const sections = parseReport(item.synthesized_content);
    setParsedSections(sections);
    setExpandedSections(new Set(sections.map(s => s.key)));
    if (item.participant_name) setParticipantName(item.participant_name);
    if (item.persona_id) setSelectedPersona(item.persona_id);
    setShowHistory(false);
  }, []);

  // ---- Reset ----
  const resetForm = useCallback(() => {
    setReportText('');
    setCoordinatorNotes('');
    setParticipantName('');
    setNdisNumber('');
    setUploadedFiles([]);
    setSynthesizedText(null);
    setParsedSections([]);
    setExpandedSections(new Set());
    setError(null);
  }, []);

  // ---- Computed ----
  const selectedPersonaConfig = PERSONAS.find(p => p.id === selectedPersona) ?? PERSONAS[0]!;
  const totalChars = getCombinedReportText().length;
  const readyFiles = uploadedFiles.filter(f => f.status === 'ready').length;

  return (
    <>
      <Header title="Report Synthesizer" />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-950">
        {/* Back link */}
        <div className="mb-4">
          <Link
            href="/sc-toolkit"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to SC Toolkit
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ================================================================ */}
          {/* LEFT COLUMN: INPUT (40%) */}
          {/* ================================================================ */}
          <div className="w-full lg:w-[40%] space-y-5">
            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Report Synthesizer
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Upload clinical documents and generate comprehensive NDIS reports with professional personas.
              </p>
            </div>

            {/* File Upload Zone */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Upload Documents (PDF, DOCX, TXT \u2014 up to 10 files)
              </label>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Click to upload or drag files here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, DOCX, TXT \u2014 {10 - uploadedFiles.length} slots remaining
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.doc"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Uploaded file list */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {file.status === 'extracting' ? (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                        ) : file.status === 'error' ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {file.status === 'ready' && (
                          <span className="text-xs text-slate-400">
                            {file.charCount.toLocaleString()} chars
                          </span>
                        )}
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Or paste text */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Or paste report content directly:
                </label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Paste allied health report content here..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Total content: {totalChars.toLocaleString()} characters
                  {totalChars < 50 ? ' (minimum 50)' : ''}
                  {readyFiles > 0 ? ` from ${readyFiles} file${readyFiles > 1 ? 's' : ''} + pasted text` : ''}
                </p>
              </div>
            </div>

            {/* Participant Details */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Participant Details (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    <User className="w-3 h-3 inline mr-1" />Participant Name
                  </label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="e.g. Sarah Johnson"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    <Hash className="w-3 h-3 inline mr-1" />NDIS Number
                  </label>
                  <input
                    type="text"
                    value={ndisNumber}
                    onChange={(e) => setNdisNumber(e.target.value)}
                    placeholder="e.g. 431 234 567"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Persona Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Report Persona
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PERSONAS.map((persona) => {
                  const colors = getPersonaColors(persona.color);
                  const isActive = selectedPersona === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => setSelectedPersona(persona.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isActive
                          ? `${colors.activeBg} ${colors.activeText} border-transparent ring-2 ${colors.ring}`
                          : `${colors.bg} ${colors.border} ${colors.text} hover:ring-1 ${colors.ring}`
                      }`}
                    >
                      <div className="text-xs font-bold">{persona.title}</div>
                      <div className={`text-[10px] mt-0.5 ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                        {persona.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {selectedPersonaConfig.description}
              </p>
            </div>

            {/* Coordinator Context */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Coordinator Context / Instructions (Optional)
              </label>
              <textarea
                value={coordinatorNotes}
                onChange={(e) => setCoordinatorNotes(e.target.value)}
                placeholder="Add context about the participant, specific focus areas, or instructions for the synthesis..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing || totalChars < 50}
              className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all ${
                isSynthesizing || totalChars < 50
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-600/25'
              }`}
            >
              {isSynthesizing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Report...
                </span>
              ) : (
                `Generate ${selectedPersonaConfig.title} Report`
              )}
            </button>

            {/* History Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <Clock className="w-4 h-4" />
                History ({history.length})
              </button>
              {synthesizedText && (
                <button
                  onClick={resetForm}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            {/* History Panel */}
            {showHistory && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 max-h-60 overflow-y-auto">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Recent Reports
                </h3>
                {history.length === 0 ? (
                  <p className="text-xs text-slate-400">No reports generated yet.</p>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(item.created_at).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN: OUTPUT (60%) */}
          {/* ================================================================ */}
          <div className="w-full lg:w-[60%]">
            {/* During Generation */}
            {isSynthesizing && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <div className="flex flex-col items-center text-center">
                  {/* Spinner */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full" />
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                  </div>

                  {/* Status */}
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {statusMessage}
                  </p>
                  <p className="text-xs text-slate-400 mb-6">
                    Generating with Gemini 2.5 Pro \u2014 this may take 30-90 seconds
                  </p>

                  {/* NDIS Tip */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 max-w-md">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                          NDIS Tip
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                          {NDIS_TIPS[currentTipIndex]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Report — Placeholder */}
            {!isSynthesizing && !synthesizedText && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                    No Report Generated
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                    Upload allied health reports, select a professional persona, and generate
                    a comprehensive NDIS-compliant report.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left">
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>5 professional personas (SC, SSC, PRC, OT, Progress)</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Up to 10 files (PDF, DOCX, TXT)</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>12-25 page comprehensive reports</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Section 34 compliance built in</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Professional branded PDF export</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Report history (last 10 saved)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Report */}
            {!isSynthesizing && synthesizedText && (
              <div className="space-y-4">
                {/* Action Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Report Generated
                      </h3>
                      <p className="text-xs text-slate-400">
                        {parsedSections.length} sections \u2014{' '}
                        {synthesizedText.length.toLocaleString()} characters \u2014{' '}
                        ~{Math.ceil(synthesizedText.split(/\s+/).length / 250)} pages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                  </div>
                </div>

                {/* Sections */}
                {parsedSections.map((section) => {
                  const isExpanded = expandedSections.has(section.key);
                  const previewLength = 300;
                  const needsTruncation = section.content.length > previewLength;

                  return (
                    <div
                      key={section.key}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                      {/* Section header */}
                      <button
                        onClick={() => toggleSection(section.key)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {section.label}
                        </h4>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {/* Section content */}
                      <div className="px-4 py-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {isExpanded || !needsTruncation
                            ? section.content.trim()
                            : section.content.trim().slice(0, previewLength) + '...'}
                        </div>
                        {needsTruncation && !isExpanded && (
                          <button
                            onClick={() => toggleSection(section.key)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Expand Section
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
