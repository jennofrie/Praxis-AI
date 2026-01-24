"use client";

import { useState } from "react";
import { FCASessionData } from "./types";
import { Sparkles, ChevronLeft, Save, Copy, RefreshCw, AlertCircle } from "lucide-react";

interface Props {
  data: FCASessionData;
  updateData: (d: FCASessionData) => void;
  back: () => void;
}

export function NarrativeBuilder({ data, updateData, back }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrative, setNarrative] = useState(data.generatedNarrative || "");

  const handleGenerate = () => {
    setIsGenerating(true);
    // SIMULATION: Call /api/ai/generate-narrative
    setTimeout(() => {
      const draft = `
**Functional Capacity Assessment Summary**

**Participant:** ${data.participantName}
**Diagnosis:** ${data.diagnosis}

**Executive Summary**
The participant presents with significant functional impacts related to ${data.diagnosis}. Observations from today's session indicate primary challenges in mobility and self-care domains, necessitating ongoing support.

**Mobility**
Observed gait velocity was approximately 0.5m/s, which places the participant at increased risk of community ambulation failure [Observed: "slow gait"]. Difficulty rising from a seated position suggests reduced lower limb strength (quadriceps), requiring the use of upper limbs for support [Observed: "difficulty standing"]. This limitation impacts their ability to independently transfer in the home environment.

**Self-Care**
Fine motor tremors were noted to interfere with fastening buttons, indicating a need for adaptive clothing or dressing aids [Observed: "inability to fasten buttons"]. Verbal prompting is currently required for grooming tasks to ensure sequencing is completed correctly [Observed: "requires prompting"].

**Clinical Reasoning & Recommendations**
Based on the observed functional deficits, it is recommended to:
1. Trial a seat-lift chair to assist with transfers.
2. Introduce button hooks or velcro-adapted clothing.
3. Continue weekly OT to address fine motor coordination.
      `.trim();
      
      setNarrative(draft);
      updateData({ ...data, generatedNarrative: draft });
      setIsGenerating(false);
    }, 2500);
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
             <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Copy className="w-4 h-4" />
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
          
          <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-md shadow-emerald-600/20">
            <Save className="w-4 h-4" /> Save & Finish
          </button>
        </div>
      </div>
    </div>
  );
}
