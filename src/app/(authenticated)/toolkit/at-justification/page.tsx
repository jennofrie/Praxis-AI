"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { 
  ChevronRight, 
  Sparkles, 
  Plus,
  Trash2,
  Download,
  Loader2,
  CheckCircle,
  DollarSign,
  Heart,
  Wrench,
  Scale,
  FileText
} from "lucide-react";
import Link from "next/link";

interface ATOption {
  id: string;
  name: string;
  cost: number;
  fundingSource: "NDIS" | "Private" | "Both";
  effectiveness: number; // 1-10
  participantPreference: number; // 1-10
  maintenanceCost: "Low" | "Medium" | "High";
  trialOutcome: string;
}

interface BaselineData {
  functionalNeed: string;
  currentMethod: string;
  limitations: string;
  goalLink: string;
  assessmentTool: string;
  baselineScore: string;
}

export default function ATJustification() {
  const [step, setStep] = useState<"baseline" | "trial" | "comparison" | "justification">("baseline");
  const [baseline, setBaseline] = useState<BaselineData>({
    functionalNeed: "",
    currentMethod: "",
    limitations: "",
    goalLink: "",
    assessmentTool: "FIM",
    baselineScore: ""
  });
  const [options, setOptions] = useState<ATOption[]>([]);
  const [newOption, setNewOption] = useState<Partial<ATOption>>({
    name: "",
    cost: 0,
    fundingSource: "NDIS",
    effectiveness: 5,
    participantPreference: 5,
    maintenanceCost: "Low",
    trialOutcome: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [justification, setJustification] = useState("");

  const ASSESSMENT_TOOLS = ["FIM", "WHODAS 2.0", "COPM", "AMPS", "Barthel Index", "CANS", "AusTOMs"];

  const addOption = () => {
    if (!newOption.name) return;
    setOptions([...options, { ...newOption, id: Date.now().toString() } as ATOption]);
    setNewOption({
      name: "",
      cost: 0,
      fundingSource: "NDIS",
      effectiveness: 5,
      participantPreference: 5,
      maintenanceCost: "Low",
      trialOutcome: ""
    });
  };

  const removeOption = (id: string) => {
    setOptions(options.filter(o => o.id !== id));
  };

  const calculateScore = (option: ATOption) => {
    // Weighted scoring: effectiveness (40%), cost-efficiency (25%), preference (20%), maintenance (15%)
    const costScore = Math.max(0, 10 - (option.cost / 1000)); // Lower cost = higher score
    const maintenanceScore = option.maintenanceCost === "Low" ? 10 : option.maintenanceCost === "Medium" ? 6 : 3;
    
    return Math.round(
      (option.effectiveness * 0.4) + 
      (costScore * 0.25) + 
      (option.participantPreference * 0.2) + 
      (maintenanceScore * 0.15)
    * 10);
  };

  const generateJustification = async () => {
    if (options.length < 2) return;
    
    setIsGenerating(true);
    
    // Sort by score
    const sortedOptions = [...options].sort((a, b) => calculateScore(b) - calculateScore(a));
    const recommended = sortedOptions[0];
    const alternative = sortedOptions[1];
    
    if (!recommended || !alternative) {
      console.error('Insufficient options for justification');
      setIsGenerating(false);
      return;
    }
    
    try {
      // Convert maintenance cost to numeric value
      const getMaintenanceCost = (level: string) => {
        switch (level) {
          case 'Low': return 100;
          case 'Medium': return 300;
          case 'High': return 600;
          default: return 200;
        }
      };
      
      const response = await fetch('/api/ai/at-justification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionalNeed: baseline.functionalNeed,
          diagnosis: baseline.currentMethod,
          assessmentScores: [{
            tool: baseline.assessmentTool,
            baseline: parseInt(baseline.baselineScore?.split('/')[0] ?? '0') || 0,
            withAT: Math.min(10, (parseInt(baseline.baselineScore?.split('/')[0] ?? '0') || 0) + 2),
            scale: baseline.baselineScore?.includes('/') ? baseline.baselineScore.split('/')[1] : undefined,
          }],
          selectedAT: {
            name: recommended.name,
            cost: recommended.cost,
            effectiveness: recommended.effectiveness * 10,
            participantPreference: recommended.participantPreference * 10,
            maintenanceCost: getMaintenanceCost(recommended.maintenanceCost),
            description: recommended.trialOutcome,
          },
          alternativeAT: {
            name: alternative.name,
            cost: alternative.cost,
            effectiveness: alternative.effectiveness * 10,
            participantPreference: alternative.participantPreference * 10,
            maintenanceCost: getMaintenanceCost(alternative.maintenanceCost),
            description: alternative.trialOutcome,
          },
          goals: baseline.goalLink ? [baseline.goalLink] : [],
          trialNotes: `${recommended.name}: ${recommended.trialOutcome}\n${alternative.name}: ${alternative.trialOutcome}`,
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.justification) {
        setJustification(result.data.justification);
      } else {
        // Fallback to template-based generation
        const draft = `
# Assistive Technology Justification Report

## Participant Information
**Functional Need:** ${baseline.functionalNeed}
**Current Method:** ${baseline.currentMethod}
**Assessment Tool:** ${baseline.assessmentTool}
**Baseline Score:** ${baseline.baselineScore}

---

## Functional Impact Statement
${baseline.limitations}

This limitation directly impacts the participant's ability to achieve their NDIS goal: "${baseline.goalLink}"

---

## Equipment Comparison

### Recommended: ${recommended.name}
- **Cost:** $${recommended.cost.toLocaleString()} (${recommended.fundingSource} funded)
- **Effectiveness Rating:** ${recommended.effectiveness}/10
- **Participant Preference:** ${recommended.participantPreference}/10
- **Maintenance:** ${recommended.maintenanceCost}
- **Trial Outcome:** ${recommended.trialOutcome}
- **Overall Score:** ${calculateScore(recommended)}%

### Alternative Considered: ${alternative.name}
- **Cost:** $${alternative.cost.toLocaleString()} (${alternative.fundingSource} funded)
- **Effectiveness Rating:** ${alternative.effectiveness}/10
- **Participant Preference:** ${alternative.participantPreference}/10
- **Maintenance:** ${alternative.maintenanceCost}
- **Trial Outcome:** ${alternative.trialOutcome}
- **Overall Score:** ${calculateScore(alternative)}%

---

## Reasonable and Necessary Justification

### Effective and Beneficial
The ${recommended.name} demonstrated superior effectiveness (${recommended.effectiveness}/10) during the trial period compared to the ${alternative.name} (${alternative.effectiveness}/10). Trial outcomes confirm functional improvement: "${recommended.trialOutcome}"

### Value for Money
At $${recommended.cost.toLocaleString()}, the ${recommended.name} represents optimal value when considering:
- Long-term durability and ${recommended.maintenanceCost.toLowerCase()} maintenance requirements
- Expected functional gains aligned with NDIS goals
- Participant's stated preference (${recommended.participantPreference}/10) ensuring ongoing use

### Link to NDIS Goals
This AT directly supports the participant's goal: "${baseline.goalLink}"

The current method (${baseline.currentMethod}) presents significant limitations that this equipment addresses, enabling greater independence and participation.

---

## Recommendation
Based on the comprehensive comparison, **${recommended.name}** is recommended as the most appropriate AT solution, meeting all NDIS "reasonable and necessary" criteria under Section 34.
        `.trim();
        
        setJustification(draft);
      }
    } catch (error) {
      console.error('Error generating justification:', error);
    } finally {
      setIsGenerating(false);
      setStep("justification");
    }
  };

  const downloadReport = () => {
    const blob = new Blob([justification], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AT_Justification_${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header title="AT Justification" />
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <Link href="/toolkit" className="hover:text-indigo-600 transition-colors">Allied Toolkit</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-semibold text-slate-900 dark:text-white">AT Justification Assistant</span>
          </nav>

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assistive Technology Justification</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Build evidence-based AT recommendations aligned with NDIS reasonable and necessary criteria.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {["baseline", "trial", "comparison", "justification"].map((s, i) => (
              <div key={s} className="flex items-center">
                <button
                  onClick={() => setStep(s as typeof step)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    step === s 
                      ? "bg-indigo-600 text-white" 
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
                {i < 3 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            
            {/* Step 1: Baseline */}
            {step === "baseline" && (
              <div className="space-y-6 max-w-2xl">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Baseline Assessment</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                      Functional Need *
                    </label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm resize-none h-24"
                      placeholder="Describe the specific functional task the participant struggles with..."
                      value={baseline.functionalNeed}
                      onChange={(e) => setBaseline({ ...baseline, functionalNeed: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                        Current Method
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                        placeholder="How do they currently manage?"
                        value={baseline.currentMethod}
                        onChange={(e) => setBaseline({ ...baseline, currentMethod: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                        Assessment Tool
                      </label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                        value={baseline.assessmentTool}
                        onChange={(e) => setBaseline({ ...baseline, assessmentTool: e.target.value })}
                      >
                        {ASSESSMENT_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                      Baseline Score/Measurement
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                      placeholder="e.g., FIM Score: 4/7 for transfers"
                      value={baseline.baselineScore}
                      onChange={(e) => setBaseline({ ...baseline, baselineScore: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                      Current Limitations
                    </label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm resize-none h-20"
                      placeholder="What limitations does the current method present?"
                      value={baseline.limitations}
                      onChange={(e) => setBaseline({ ...baseline, limitations: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                      Link to NDIS Goal
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                      placeholder="Which plan goal does this AT support?"
                      value={baseline.goalLink}
                      onChange={(e) => setBaseline({ ...baseline, goalLink: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep("trial")}
                  disabled={!baseline.functionalNeed}
                  className="px-6 py-2.5 bg-indigo-600 disabled:bg-slate-300 text-white rounded-lg font-medium"
                >
                  Next: AT Options
                </button>
              </div>
            )}

            {/* Step 2: Trial Data */}
            {step === "trial" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">AT Options & Trial Data</h2>
                <p className="text-sm text-slate-500">Add at least 2 AT options to compare.</p>

                {/* Add Option Form */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Equipment Name"
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                      value={newOption.name}
                      onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Cost ($)"
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                        value={newOption.cost || ""}
                        onChange={(e) => setNewOption({ ...newOption, cost: parseInt(e.target.value) || 0 })}
                      />
                      <select
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                        value={newOption.fundingSource}
                        onChange={(e) => setNewOption({ ...newOption, fundingSource: e.target.value as ATOption["fundingSource"] })}
                      >
                        <option value="NDIS">NDIS</option>
                        <option value="Private">Private</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Effectiveness (1-10)</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={newOption.effectiveness}
                        onChange={(e) => setNewOption({ ...newOption, effectiveness: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-center text-sm font-bold text-indigo-600">{newOption.effectiveness}</div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Preference (1-10)</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={newOption.participantPreference}
                        onChange={(e) => setNewOption({ ...newOption, participantPreference: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-center text-sm font-bold text-indigo-600">{newOption.participantPreference}</div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Maintenance</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                        value={newOption.maintenanceCost}
                        onChange={(e) => setNewOption({ ...newOption, maintenanceCost: e.target.value as ATOption["maintenanceCost"] })}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    placeholder="Trial outcome observations..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-none h-20"
                    value={newOption.trialOutcome}
                    onChange={(e) => setNewOption({ ...newOption, trialOutcome: e.target.value })}
                  />

                  <button
                    onClick={addOption}
                    disabled={!newOption.name}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Option
                  </button>
                </div>

                {/* Options List */}
                {options.length > 0 && (
                  <div className="space-y-3">
                    {options.map((option) => (
                      <div key={option.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{option.name}</h4>
                            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{option.fundingSource}</span>
                          </div>
                          <div className="flex gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${option.cost.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {option.effectiveness}/10 eff.</span>
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {option.participantPreference}/10 pref.</span>
                            <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> {option.maintenanceCost} maint.</span>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-indigo-600">{calculateScore(option)}%</div>
                        <button onClick={() => removeOption(option.id)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep("baseline")} className="px-4 py-2 text-slate-500">Back</button>
                  <button
                    onClick={generateJustification}
                    disabled={options.length < 2 || isGenerating}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg font-medium"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate Justification
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Justification */}
            {step === "justification" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" /> Generated Justification
                  </h2>
                  <button
                    onClick={downloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
                  >
                    <Download className="w-4 h-4" /> Download Report
                  </button>
                </div>

                <textarea
                  className="w-full h-[500px] p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono resize-none"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />

                <div className="flex gap-3">
                  <button onClick={() => setStep("trial")} className="px-4 py-2 text-slate-500">Back to Comparison</button>
                  <Link 
                    href="/toolkit"
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Done
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
