"use client";

import { useState } from "react";
import { FCASessionData, NDIS_DOMAINS } from "./types";
import { Sparkles, Check, AlertTriangle, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

interface Props {
  data: FCASessionData;
  updateData: (d: FCASessionData) => void;
  next: () => void;
  back: () => void;
}

export function DomainMapper({ data, updateData, next, back }: Props) {
  const [rawNotes, setRawNotes] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // SIMULATION: In production, call /api/ai/map-domains with rawNotes
    setTimeout(() => {
      // Mock result
      const mockObservations: Record<string, string[]> = {
        "Mobility": [
          "Observed difficulty standing from seated position without armrest support.",
          "Gait appears steady but slow (approx 0.5m/s)."
        ],
        "Self-Care": [
          "Reported inability to fasten buttons on shirt due to fine motor tremor.",
          "Requires verbal prompting for grooming sequence."
        ],
        "Social Interaction": [
          "Maintained good eye contact during interview.",
          "Expressed anxiety about attending community groups."
        ]
      };
      
      updateData({
        ...data,
        observations: mockObservations
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const domainCompleteness = NDIS_DOMAINS.map(d => ({
    name: d,
    count: data.observations[d]?.length || 0,
    status: (data.observations[d]?.length || 0) > 0 ? "Complete" : "Missing"
  }));

  const completionScore = Math.round(
    (domainCompleteness.filter(d => d.status === "Complete").length / NDIS_DOMAINS.length) * 100
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left: Input */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Clinical Observations</h3>
          <p className="text-sm text-slate-500">Paste your raw session notes or dictation transcript here.</p>
        </div>
        
        <textarea
          className="flex-1 w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-none focus:ring-2 focus:ring-indigo-600 outline-none text-sm leading-relaxed min-h-[400px]"
          placeholder="e.g. Participant arrived on time. Observed using a walking stick. Stated that 'cooking is getting harder because I can't stand for long'. Demonstrated making a tea..."
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
        />

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !rawNotes}
          className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-bold transition-all hover:bg-indigo-700 shadow-md"
        >
          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isAnalyzing ? "Analyzing with Gemini Pro..." : "Map to NDIS Domains"}
        </button>
      </div>

      {/* Right: Analysis */}
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Evidence Matrix</h3>
          <div className="flex items-center gap-2 mt-1">
             <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${completionScore >= 80 ? "bg-emerald-500" : "bg-amber-500"}`} 
                 style={{ width: `${completionScore}%` }}
               ></div>
             </div>
             <span className={`text-xs font-bold ${completionScore >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
               {completionScore}% Coverage
             </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {NDIS_DOMAINS.map((domain) => {
            const obs = data.observations[domain] || [];
            const hasEvidence = obs.length > 0;

            return (
              <div key={domain} className={`p-4 rounded-xl border transition-all ${
                hasEvidence 
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" 
                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-70"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{domain}</h4>
                  {hasEvidence ? (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> {obs.length} Points
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </div>
                
                {hasEvidence ? (
                  <ul className="space-y-2">
                    {obs.map((o, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-300 pl-3 border-l-2 border-indigo-200 dark:border-indigo-800">
                        &quot;{o}&quot;
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">No evidence detected for this domain.</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={back}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button 
            onClick={next}
            disabled={completionScore < 20}
            className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Next: Draft Narrative <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
