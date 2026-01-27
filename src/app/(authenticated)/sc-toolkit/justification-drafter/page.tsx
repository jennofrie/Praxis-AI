"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { AIProcessingButton } from "@/components/toolkit/AIProcessingButton";
import {
  Scale,
  ArrowLeft,
  AlertTriangle,
  Download,
  Copy,
  CheckCircle,
  Lightbulb,
  X,
  User,
  Package,
  Activity,
  Target,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface JustificationResult {
  executiveSummary: string;
  participantBackground: string;
  functionalNeed: string;
  atItemJustification: string;
  goalAlignment: string;
  reasonableAndNecessary: string;
  valueForMoney: string;
  riskAssessment: string;
  recommendation: string;
  modelUsed: string;
}

const IMPAIRMENTS = [
  "Mobility",
  "Communication",
  "Self-care",
  "Cognition",
  "Social interaction",
  "Learning",
  "Psychosocial",
  "Sensory",
] as const;

export default function JustificationDrafter() {
  // Participant details
  const [participantName, setParticipantName] = useState("");
  const [ndisNumber, setNdisNumber] = useState("");
  const [dob, setDob] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [planEndDate, setPlanEndDate] = useState("");
  const [scName, setScName] = useState("");
  const [scOrg, setScOrg] = useState("");

  // AT item details
  const [atItemName, setAtItemName] = useState("");
  const [atCategory, setAtCategory] = useState("");
  const [atAmount, setAtAmount] = useState("");
  const [isReplacement, setIsReplacement] = useState(false);
  const [isLowRisk, setIsLowRisk] = useState(false);

  // Functional need
  const [selectedImpairments, setSelectedImpairments] = useState<string[]>([]);
  const [barriers, setBarriers] = useState("");
  const [dailyLivingImpact, setDailyLivingImpact] = useState("");

  // Goals
  const [participantGoals, setParticipantGoals] = useState("");
  const [goalAlignment, setGoalAlignment] = useState("");

  // Quote info
  const [supplier, setSupplier] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");

  // Additional context
  const [additionalContext, setAdditionalContext] = useState("");

  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JustificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleImpairment = useCallback((imp: string) => {
    setSelectedImpairments((prev) =>
      prev.includes(imp) ? prev.filter((p) => p !== imp) : [...prev, imp]
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!participantName.trim()) {
      setError("Please enter participant name.");
      return;
    }
    if (!atItemName.trim()) {
      setError("Please enter the AT item name.");
      return;
    }
    if (!barriers.trim()) {
      setError("Please describe the functional barriers.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/sc-justification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant: {
            name: participantName,
            ndisNumber: ndisNumber || undefined,
            dob: dob || undefined,
            planStartDate: planStartDate || undefined,
            planEndDate: planEndDate || undefined,
            scName: scName || undefined,
            scOrg: scOrg || undefined,
          },
          atItem: {
            name: atItemName,
            category: atCategory || undefined,
            amount: atAmount || undefined,
            isReplacement,
            isLowRisk,
          },
          functionalNeed: {
            impairments: selectedImpairments,
            barriers,
            dailyLivingImpact: dailyLivingImpact || undefined,
          },
          goals: {
            participantGoals: participantGoals || undefined,
            goalAlignment: goalAlignment || undefined,
          },
          quote: {
            supplier: supplier || undefined,
            amount: quoteAmount || undefined,
          },
          additionalContext: additionalContext || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Justification generation failed");
      }

      setResult(payload.data as JustificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate justification");
    } finally {
      setIsProcessing(false);
    }
  }, [
    participantName, ndisNumber, dob, planStartDate, planEndDate, scName, scOrg,
    atItemName, atCategory, atAmount, isReplacement, isLowRisk,
    selectedImpairments, barriers, dailyLivingImpact,
    participantGoals, goalAlignment,
    supplier, quoteAmount, additionalContext,
  ]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = [
      "=== LC-AT JUSTIFICATION ===",
      "",
      "EXECUTIVE SUMMARY:",
      result.executiveSummary,
      "",
      "PARTICIPANT BACKGROUND:",
      result.participantBackground,
      "",
      "FUNCTIONAL NEED:",
      result.functionalNeed,
      "",
      "AT ITEM JUSTIFICATION:",
      result.atItemJustification,
      "",
      "GOAL ALIGNMENT:",
      result.goalAlignment,
      "",
      "REASONABLE & NECESSARY:",
      result.reasonableAndNecessary,
      "",
      "VALUE FOR MONEY:",
      result.valueForMoney,
      "",
      "RISK ASSESSMENT:",
      result.riskAssessment,
      "",
      "RECOMMENDATION:",
      result.recommendation,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleExportPDF = useCallback(async () => {
    if (!result) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ml = 20;
    const pw = 170;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("LC-AT Justification Document", ml, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Participant: ${participantName} | Generated: ${new Date().toLocaleDateString("en-AU")}`, ml, y);
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(ml, y, 190, y);
    y += 8;

    const addSection = (title: string, text: string) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(title, ml, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(text, pw);
      doc.text(lines, ml, y);
      y += lines.length * 5 + 6;
    };

    addSection("Executive Summary", result.executiveSummary);
    addSection("Participant Background", result.participantBackground);
    addSection("Functional Need", result.functionalNeed);
    addSection("AT Item Justification", result.atItemJustification);
    addSection("Goal Alignment", result.goalAlignment);
    addSection("Reasonable & Necessary", result.reasonableAndNecessary);
    addSection("Value for Money", result.valueForMoney);
    addSection("Risk Assessment", result.riskAssessment);
    addSection("Recommendation", result.recommendation);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Generated by Praxis AI - SC Toolkit", ml, 290);
      doc.text(`Page ${i} of ${totalPages}`, 170, 290);
    }

    doc.save(`justification-${participantName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`);
  }, [result, participantName]);

  const resetForm = useCallback(() => {
    setParticipantName(""); setNdisNumber(""); setDob(""); setPlanStartDate(""); setPlanEndDate("");
    setScName(""); setScOrg(""); setAtItemName(""); setAtCategory(""); setAtAmount("");
    setIsReplacement(false); setIsLowRisk(false); setSelectedImpairments([]);
    setBarriers(""); setDailyLivingImpact(""); setParticipantGoals(""); setGoalAlignment("");
    setSupplier(""); setQuoteAmount(""); setAdditionalContext("");
    setResult(null); setError(null);
  }, []);

  return (
    <>
      <Header title="Justification Drafter" />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
        <div className="mb-6">
          <Link href="/sc-toolkit" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to SC Toolkit
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-6 h-6 text-indigo-600" />
                Justification Drafter
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Generate LC-AT justification documents with Reasonable &amp; Necessary mapping
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              {/* Section: Participant Details */}
              <FormSection icon={User} title="Participant Details" color="blue">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormInput label="Participant Name *" value={participantName} onChange={setParticipantName} placeholder="Full name" />
                  <FormInput label="NDIS Number" value={ndisNumber} onChange={setNdisNumber} placeholder="e.g., 431234567" />
                  <FormInput label="Date of Birth" value={dob} onChange={setDob} type="date" />
                  <FormInput label="Plan Start Date" value={planStartDate} onChange={setPlanStartDate} type="date" />
                  <FormInput label="Plan End Date" value={planEndDate} onChange={setPlanEndDate} type="date" />
                  <FormInput label="SC Name" value={scName} onChange={setScName} placeholder="Your name" />
                  <FormInput label="SC Organisation" value={scOrg} onChange={setScOrg} placeholder="Organisation" />
                </div>
              </FormSection>

              {/* Section: AT Item Details */}
              <FormSection icon={Package} title="AT Item Details" color="indigo">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormInput label="AT Item Name *" value={atItemName} onChange={setAtItemName} placeholder="e.g., Power wheelchair" />
                  <FormInput label="Category" value={atCategory} onChange={setAtCategory} placeholder="e.g., Mobility equipment" />
                  <FormInput label="Estimated Amount ($)" value={atAmount} onChange={setAtAmount} placeholder="e.g., 15000" />
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isReplacement} onChange={(e) => setIsReplacement(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Replacement item</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isLowRisk} onChange={(e) => setIsLowRisk(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Low-risk AT</span>
                  </label>
                </div>
              </FormSection>

              {/* Section: Functional Need */}
              <FormSection icon={Activity} title="Functional Need" color="amber">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Impairment Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {IMPAIRMENTS.map((imp) => (
                      <button
                        key={imp}
                        onClick={() => toggleImpairment(imp)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          selectedImpairments.includes(imp)
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                        }`}
                      >
                        {imp}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Barriers *</label>
                  <textarea value={barriers} onChange={(e) => setBarriers(e.target.value)} placeholder="Describe the functional barriers the participant experiences..." rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Impact on Daily Living</label>
                  <textarea value={dailyLivingImpact} onChange={(e) => setDailyLivingImpact(e.target.value)} placeholder="How the impairments affect daily activities..." rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
              </FormSection>

              {/* Section: Goals */}
              <FormSection icon={Target} title="Goals" color="emerald">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Participant Goals</label>
                    <textarea value={participantGoals} onChange={(e) => setParticipantGoals(e.target.value)} placeholder="Goals as stated in the participant's plan..." rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Goal Alignment</label>
                    <textarea value={goalAlignment} onChange={(e) => setGoalAlignment(e.target.value)} placeholder="How the AT item supports achieving these goals..." rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                </div>
              </FormSection>

              {/* Section: Quote Info */}
              <FormSection icon={DollarSign} title="Quote Information" color="teal">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormInput label="Supplier" value={supplier} onChange={setSupplier} placeholder="Supplier name" />
                  <FormInput label="Quote Amount ($)" value={quoteAmount} onChange={setQuoteAmount} placeholder="e.g., 15000" />
                </div>
              </FormSection>

              {/* Additional Context */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Additional Context</label>
                <textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} placeholder="Any other information relevant to the justification..." rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <AIProcessingButton isProcessing={isProcessing} onClick={handleGenerate} disabled={!participantName.trim() || !atItemName.trim() || !barriers.trim()} label="Generate Justification" variant="indigo" type="audit" />
                {result && <button onClick={resetForm} className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Clear</button>}
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-indigo-800 dark:text-indigo-300">Justification Generated</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                    <button onClick={resetForm} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {[
                    { title: "Executive Summary", content: result.executiveSummary },
                    { title: "Participant Background", content: result.participantBackground },
                    { title: "Functional Need", content: result.functionalNeed },
                    { title: "AT Item Justification", content: result.atItemJustification },
                    { title: "Goal Alignment", content: result.goalAlignment },
                    { title: "Reasonable & Necessary", content: result.reasonableAndNecessary },
                    { title: "Value for Money", content: result.valueForMoney },
                    { title: "Risk Assessment", content: result.riskAssessment },
                    { title: "Recommendation", content: result.recommendation },
                  ].map((section) => (
                    <div key={section.title}>
                      <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-2">{section.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg whitespace-pre-wrap">{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4">
              <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">LC-AT Justification</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-3">
                Generate comprehensive AT justification documents aligned with NDIS Reasonable &amp; Necessary criteria.
              </p>
              <ul className="text-xs text-indigo-600 dark:text-indigo-500 space-y-1">
                <li>• Section 34 R&amp;N criteria mapping</li>
                <li>• Functional impact documentation</li>
                <li>• Goal alignment evidence</li>
                <li>• Value for money assessment</li>
                <li>• Audit-ready output</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Required Fields</h3>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Participant name is required
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  AT item name is required
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Functional barriers description is required
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  More detail produces better justifications
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FormSection({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: typeof User;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600",
    indigo: "text-indigo-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    teal: "text-teal-600",
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${colorMap[color] || colorMap.blue}`} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
      />
    </div>
  );
}
