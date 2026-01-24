"use client";

import { useState } from "react";
import { FCASessionData } from "./types";
import { Sparkles, ChevronLeft, Save, Copy, RefreshCw, AlertCircle, Check, Download } from "lucide-react";

interface Props {
  data: FCASessionData;
  updateData: (d: FCASessionData) => void;
  back: () => void;
  onSave: () => void;
}

export function NarrativeBuilder({ data, updateData, back, onSave }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [narrative, setNarrative] = useState(data.generatedNarrative || "");

  const handleCopy = async () => {
    if (narrative) {
      await navigator.clipboard.writeText(narrative);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!narrative) return;
    
    const fileName = `FCA_${data.participantName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.md`;
    const blob = new Blob([narrative], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!narrative) return;
    
    setIsSaving(true);
    
    // Download the file
    handleDownload();
    
    // Simulate save delay for UX feedback
    setTimeout(() => {
      setIsSaving(false);
      onSave();
    }, 500);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Convert observations to domain format for API
      const domains = Object.entries(data.observations).map(([domain, observations]) => ({
        domain,
        observations,
        confidence: 'high' as const, // Default to high since these are clinician-verified
      }));
      
      const response = await fetch('/api/ai/fca-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-narrative',
          participantName: data.participantName,
          diagnosis: data.diagnosis,
          domains,
          goals: data.goals,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('Narrative generation failed:', result.error);
        // Fallback to a basic template if API fails
        const fallbackDraft = `
**Functional Capacity Assessment Summary**

**Participant:** ${data.participantName}
**Diagnosis:** ${data.diagnosis}

[AI generation failed. Please review domain observations and try again.]

**Observations:**
${Object.entries(data.observations).map(([domain, obs]) => 
  `\n**${domain}**\n${(obs as string[]).map(o => `- ${o}`).join('\n')}`
).join('\n')}
        `.trim();
        
        setNarrative(fallbackDraft);
        updateData({ ...data, generatedNarrative: fallbackDraft });
        return;
      }
      
      const generatedNarrative = result.narrative || '';
      setNarrative(generatedNarrative);
      updateData({ ...data, generatedNarrative });
    } catch (error) {
      console.error('Error generating narrative:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Left: Context */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
          <h3 className="font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" /> AI Context
          </h3>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-4">
            The model will use your domain mappings to construct this narrative. Ensure all key evidence is mapped before generating.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Mobility Evidence</span>
              <span>{data.observations["Mobility"]?.length || 0} pts</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Self-Care Evidence</span>
              <span>{data.observations["Self-Care"]?.length || 0} pts</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Social Evidence</span>
              <span>{data.observations["Social Interaction"]?.length || 0} pts</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
           <h3 className="font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" /> Quality Check
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Remember to review the output for NDIS-aligned language. The AI is trained to use &quot;capacity building&quot; terms, but verify all clinical claims.
          </p>
        </div>
      </div>

      {/* Right: Editor */}
      <div className="lg:col-span-2 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Draft Narrative</h3>
          <div className="flex gap-2">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {narrative ? "Regenerate" : "Generate Draft"}
            </button>
             <button 
              onClick={handleCopy}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleDownload}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Download as file"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
           <textarea
            className="w-full h-full p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-none focus:ring-2 focus:ring-indigo-600 outline-none text-sm leading-relaxed font-mono"
            placeholder="Click 'Generate Draft' to create the narrative..."
            value={narrative}
            onChange={(e) => {
              setNarrative(e.target.value);
              updateData({ ...data, generatedNarrative: e.target.value });
            }}
          />
        </div>

        <div className="flex items-center justify-between pt-6">
          <button 
            onClick={back}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          
          <button 
            onClick={handleSave}
            disabled={!narrative || isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-md shadow-emerald-600/20"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : "Save & Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
