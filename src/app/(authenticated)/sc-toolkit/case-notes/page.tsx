"use client";

import { useState, useCallback, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { AIProcessingButton } from "@/components/toolkit/AIProcessingButton";
import {
  Camera,
  ArrowLeft,
  AlertTriangle,
  Copy,
  CheckCircle,
  Lightbulb,
  X,
  FileText,
  Image as ImageIcon,
  Type,
} from "lucide-react";
import Link from "next/link";

type TabMode = "text" | "image";

interface CaseNoteResult {
  subject: string;
  date: string;
  interactionType: string;
  goalAlignment: string;
  details: string;
  observations: string;
  actionItems: string[];
  followUp: string;
  riskFlags: string[];
  formattedNote: string;
  modelUsed: string;
}

export default function CaseNotes() {
  const [activeTab, setActiveTab] = useState<TabMode>("text");
  const [rawNotes, setRawNotes] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInstructions, setImageInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CaseNoteResult | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG or PNG).");
      return;
    }

    setImageFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleProcess = useCallback(async () => {
    setError(null);

    if (activeTab === "text") {
      if (!rawNotes.trim()) {
        setError("Please enter your raw notes.");
        return;
      }
      if (rawNotes.trim().length < 20) {
        setError("Please provide at least 20 characters of notes.");
        return;
      }
    } else {
      if (!imageFile) {
        setError("Please upload an image.");
        return;
      }
    }

    setIsProcessing(true);

    try {
      let body: FormData | string;
      let headers: Record<string, string> = {};

      if (activeTab === "text") {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          mode: "text",
          rawNotes,
          customInstructions: customInstructions || undefined,
        });
      } else {
        const formData = new FormData();
        formData.append("mode", "image");
        if (imageFile) {
          formData.append("image", imageFile);
        }
        if (imageInstructions) {
          formData.append("customInstructions", imageInstructions);
        }
        body = formData;
      }

      const response = await fetch("/api/ai/sc-case-notes", {
        method: "POST",
        headers: activeTab === "text" ? headers : undefined,
        body,
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Case note generation failed");
      }

      setResult(payload.data as CaseNoteResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate case note");
    } finally {
      setIsProcessing(false);
    }
  }, [activeTab, rawNotes, customInstructions, imageFile, imageInstructions]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.formattedNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const resetForm = useCallback(() => {
    setRawNotes("");
    setCustomInstructions("");
    setImageFile(null);
    setImagePreview(null);
    setImageInstructions("");
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <>
      <Header title="Visual Case Notes" />

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
                <Camera className="w-6 h-6 text-cyan-600" />
                Visual Case Notes
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Convert raw text or images into professional NDIS-formatted case notes
              </p>
            </div>

            {/* Tab Selector */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all ${
                    activeTab === "text"
                      ? "text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50 dark:bg-cyan-900/20"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Text
                </button>
                <button
                  onClick={() => setActiveTab("image")}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all ${
                    activeTab === "image"
                      ? "text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50 dark:bg-cyan-900/20"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Image
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Text Tab */}
                {activeTab === "text" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Raw Notes
                      </label>
                      <textarea
                        value={rawNotes}
                        onChange={(e) => setRawNotes(e.target.value)}
                        placeholder="Enter your raw notes, quick observations, or voice transcription here..."
                        rows={8}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 text-sm"
                      />
                      <span className="text-xs text-slate-500 mt-1 block">
                        {rawNotes.length} characters {rawNotes.length < 20 ? "(minimum 20)" : ""}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Custom Instructions (Optional)
                      </label>
                      <textarea
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="e.g., Focus on mobility goals, Include medication changes..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Image Tab */}
                {activeTab === "image" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Upload Image (JPEG/PNG)
                      </label>
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Uploaded preview"
                            className="w-full max-h-64 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                          />
                          <button
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-cyan-400 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800">
                          <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-500">Click to upload image</span>
                          <span className="text-xs text-slate-400 mt-1">JPEG, PNG supported</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Custom Instructions (Optional)
                      </label>
                      <textarea
                        value={imageInstructions}
                        onChange={(e) => setImageInstructions(e.target.value)}
                        placeholder="e.g., This is a photo of the participant's home environment..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 text-sm"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <AIProcessingButton
                    isProcessing={isProcessing}
                    onClick={handleProcess}
                    disabled={
                      activeTab === "text"
                        ? rawNotes.trim().length < 20
                        : !imageFile
                    }
                    label="Generate Case Note"
                    variant="indigo"
                    type="audit"
                  />
                  {result && (
                    <button onClick={resetForm} className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 border-b border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-cyan-600" />
                    <h3 className="font-bold text-cyan-800 dark:text-cyan-300">Case Note Generated</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy to Clipboard"}
                    </button>
                    <button onClick={resetForm} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <NoteField label="Subject" value={result.subject} />
                    <NoteField label="Date" value={result.date} />
                    <NoteField label="Interaction Type" value={result.interactionType} />
                    <NoteField label="Goal Alignment" value={result.goalAlignment} />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Details</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg whitespace-pre-wrap">
                      {result.details}
                    </p>
                  </div>

                  {result.observations && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Observations</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg whitespace-pre-wrap">
                        {result.observations}
                      </p>
                    </div>
                  )}

                  {result.actionItems.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2">Action Items ({result.actionItems.length})</h4>
                      <ul className="space-y-1">
                        {result.actionItems.map((item, i) => (
                          <li key={i} className="text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 mt-1 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.followUp && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Follow Up</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                        {result.followUp}
                      </p>
                    </div>
                  )}

                  {result.riskFlags.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-red-700 dark:text-red-300 mb-2">Risk Flags ({result.riskFlags.length})</h4>
                      <ul className="space-y-1">
                        {result.riskFlags.map((flag, i) => (
                          <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 mt-1 shrink-0" />
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Full Formatted Note */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Full Formatted Note
                    </h4>
                    <pre className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg whitespace-pre-wrap font-mono text-xs">
                      {result.formattedNote}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800 p-4">
              <h3 className="font-bold text-cyan-800 dark:text-cyan-300 mb-2">Visual Case Notes</h3>
              <p className="text-sm text-cyan-700 dark:text-cyan-400 mb-3">
                Transform rough notes or images into structured, NDIS-compliant case notes.
              </p>
              <ul className="text-xs text-cyan-600 dark:text-cyan-500 space-y-1">
                <li>• Text and image input modes</li>
                <li>• NDIS-formatted output</li>
                <li>• Action items extraction</li>
                <li>• Risk flag detection</li>
                <li>• Copy to clipboard</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Tips</h3>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Include participant initials, not full names
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Note the interaction type (phone, visit, email)
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Reference specific NDIS goals where possible
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Images of handwritten notes work well
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NoteField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}
