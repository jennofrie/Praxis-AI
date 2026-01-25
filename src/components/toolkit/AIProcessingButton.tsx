"use client";

import { useState, useEffect } from "react";
import { Sparkles, Brain, Zap, CheckCircle2, Scan, FileSearch } from "lucide-react";

interface AIProcessingButtonProps {
  isProcessing: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  variant?: "emerald" | "indigo";
  type?: "audit" | "assess";
}

// Processing stage messages for different types
const AUDIT_STAGES = [
  { icon: Scan, text: "Scanning document...", duration: 2000 },
  { icon: Brain, text: "Analyzing Section 34 compliance...", duration: 3000 },
  { icon: FileSearch, text: "Evaluating evidence quality...", duration: 2500 },
  { icon: Zap, text: "Running 3-pass analysis...", duration: 3000 },
  { icon: CheckCircle2, text: "Generating report...", duration: 2000 },
];

const ASSESS_STAGES = [
  { icon: Scan, text: "Processing circumstances...", duration: 2000 },
  { icon: Brain, text: "Analyzing CoC triggers...", duration: 2500 },
  { icon: FileSearch, text: "Evaluating eligibility criteria...", duration: 3000 },
  { icon: Zap, text: "Determining pathway...", duration: 2500 },
  { icon: CheckCircle2, text: "Generating reports...", duration: 2000 },
];

export function AIProcessingButton({
  isProcessing,
  onClick,
  disabled = false,
  label,
  variant = "emerald",
  type = "audit",
}: AIProcessingButtonProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const stages = type === "audit" ? AUDIT_STAGES : ASSESS_STAGES;
  const safeStageIndex = Math.min(currentStage, stages.length - 1);
  const currentStageData = stages[safeStageIndex]!;
  const CurrentIcon = isProcessing ? currentStageData.icon : Sparkles;

  // Cycle through stages during processing
  useEffect(() => {
    if (!isProcessing) {
      setCurrentStage(0);
      setProgress(0);
      return;
    }

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 0.5;
      });
    }, 50);

    // Stage cycling
    let stageIndex = 0;
    const cycleStages = () => {
      stageIndex = (stageIndex + 1) % stages.length;
      setCurrentStage(stageIndex);
    };

    const stageInterval = setInterval(cycleStages, stages[stageIndex]!.duration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, [isProcessing, stages]);

  const baseClasses = variant === "emerald"
    ? "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25"
    : "from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/25";

  const glowClasses = variant === "emerald"
    ? "shadow-emerald-500/50"
    : "shadow-indigo-500/50";

  return (
    <div className="relative">
      {/* Glow effect during processing */}
      {isProcessing && (
        <div
          className={`absolute -inset-1 bg-gradient-to-r ${baseClasses} rounded-xl blur-lg opacity-75 animate-pulse`}
        />
      )}

      <button
        onClick={onClick}
        disabled={disabled || isProcessing}
        className={`relative flex flex-col items-center gap-1 px-8 py-3 bg-gradient-to-r ${baseClasses} text-white rounded-xl font-medium
          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
          ${isProcessing ? `shadow-xl ${glowClasses}` : "shadow-lg hover:shadow-xl hover:-translate-y-0.5"}
          min-w-[220px] overflow-hidden`}
      >
        {/* Shimmer effect during processing */}
        {isProcessing && (
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}

        {/* Main content */}
        <div className="flex items-center gap-2">
          <CurrentIcon
            className={`w-5 h-5 ${
              isProcessing ? "animate-pulse" : ""
            }`}
          />
          <span className="font-semibold">
            {isProcessing ? currentStageData.text : label}
          </span>
        </div>

        {/* Progress bar during processing */}
        {isProcessing && (
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </button>

      {/* Floating particles during processing */}
      {isProcessing && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${
                variant === "emerald" ? "bg-emerald-300" : "bg-indigo-300"
              } animate-float`}
              style={{
                left: `${15 + i * 15}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Add these styles to your global CSS or tailwind config:
// @keyframes shimmer {
//   100% { transform: translateX(100%); }
// }
// @keyframes float {
//   0%, 100% { transform: translateY(100%) scale(0); opacity: 0; }
//   50% { transform: translateY(-100%) scale(1); opacity: 1; }
// }
