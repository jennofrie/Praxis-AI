"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Loader2,
  FileText,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  Target,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractTextFromPDF, isPDFFile } from "@/lib/pdf-parser";

interface ExtractedGoal {
  id: string;
  goalNumber: number;
  title: string;
  description: string;
  category: string;
  currentSituation?: string;
  desiredOutcome?: string;
  strategies?: string[];
  supportCategories?: string[];
  targetDate?: string;
}

interface ExtractedPlanData {
  participantName: string;
  ndisNumber: string;
  dateOfBirth?: string;
  planStartDate: string;
  planEndDate: string;
  planApprovalDate?: string;
  planManagementType: 'agency' | 'plan-managed' | 'self-managed' | 'combination';
  funding: {
    total: number;
    core: number;
    capacityBuilding: number;
    capital: number;
  };
  goals: ExtractedGoal[];
  supportCoordinatorName?: string;
  planManagerName?: string;
  extractionConfidence: number;
  warnings?: string[];
}

interface ExistingParticipant {
  id: string;
  full_name: string;
  ndis_number: string;
}

interface LinkPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStep = 'upload' | 'extracting' | 'review' | 'saving';

export function LinkPlanModal({ isOpen, onClose, onSuccess }: LinkPlanModalProps) {
  const [step, setStep] = useState<ModalStep>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted data
  const [extractedData, setExtractedData] = useState<ExtractedPlanData | null>(null);

  // Editable form fields
  const [participantName, setParticipantName] = useState('');
  const [ndisNumber, setNdisNumber] = useState('');
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [planManagementType, setPlanManagementType] = useState<string>('plan-managed');
  const [coreFunding, setCoreFunding] = useState<number>(0);
  const [capacityFunding, setCapacityFunding] = useState<number>(0);
  const [capitalFunding, setCapitalFunding] = useState<number>(0);
  const [goals, setGoals] = useState<ExtractedGoal[]>([]);

  // Participant linking
  const [linkMode, setLinkMode] = useState<'existing' | 'new'>('new');
  const [existingParticipants, setExistingParticipants] = useState<ExistingParticipant[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [participantSearch, setParticipantSearch] = useState('');
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);

  // Goals expansion
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Load existing participants
  useEffect(() => {
    const loadParticipants = async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('id, full_name, ndis_number')
        .order('full_name');

      if (!error && data) {
        setExistingParticipants(data);
      }
    };

    if (isOpen) {
      loadParticipants();
    }
  }, [isOpen, supabase]);

  // Reset modal when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setFileName(null);
      // fileContent removed (was unused)
      setExtractedData(null);
      setError(null);
      setParticipantName('');
      setNdisNumber('');
      setPlanStartDate('');
      setPlanEndDate('');
      setPlanManagementType('plan-managed');
      setCoreFunding(0);
      setCapacityFunding(0);
      setCapitalFunding(0);
      setGoals([]);
      setLinkMode('new');
      setSelectedParticipantId(null);
      setExpandedGoals(new Set());
    }
  }, [isOpen]);

  // Populate form fields when data is extracted
  useEffect(() => {
    if (extractedData) {
      setParticipantName(extractedData.participantName || '');
      setNdisNumber(extractedData.ndisNumber || '');
      setPlanStartDate(extractedData.planStartDate || '');
      setPlanEndDate(extractedData.planEndDate || '');
      setPlanManagementType(extractedData.planManagementType || 'plan-managed');
      setCoreFunding(extractedData.funding?.core || 0);
      setCapacityFunding(extractedData.funding?.capacityBuilding || 0);
      setCapitalFunding(extractedData.funding?.capital || 0);
      setGoals(extractedData.goals || []);

      // Check if participant already exists by NDIS number
      if (extractedData.ndisNumber) {
        const existing = existingParticipants.find(
          p => p.ndis_number === extractedData.ndisNumber
        );
        if (existing) {
          setLinkMode('existing');
          setSelectedParticipantId(existing.id);
        }
      }
    }
  }, [extractedData, existingParticipants]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      if (!isPDFFile(file)) {
        throw new Error('Please upload a PDF file');
      }

      setFileName(file.name);

      const result = await extractTextFromPDF(file);
      if (!result.success) {
        throw new Error(result.error || 'Failed to extract text from PDF');
      }

      if (!result.text || result.text.trim().length < 200) {
        throw new Error('Could not extract sufficient text from the PDF. The document may be image-based or encrypted.');
      }

      // fileContent removed (was unused)
      setStep('extracting');
      await extractPlanData(result.text);
    } catch (err) {
      console.error('File upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const extractPlanData = async (content: string) => {
    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/ndis-plan-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract plan data');
      }

      setExtractedData(data.data);
      setStep('review');
    } catch (err) {
      console.error('Extraction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract plan data');
      setStep('upload');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let participantId = selectedParticipantId;

      // Create new participant if needed
      if (linkMode === 'new') {
        const { data: newParticipant, error: participantError } = await supabase
          .from('participants')
          .insert({
            user_id: user.id,
            full_name: participantName,
            ndis_number: ndisNumber,
            status: 'active',
          })
          .select('id')
          .single();

        if (participantError) throw participantError;
        participantId = newParticipant.id;
      }

      if (!participantId) throw new Error('No participant selected');

      // Calculate total funding
      const totalFunding = coreFunding + capacityFunding + capitalFunding;

      // Create the NDIS plan
      const { error: planError } = await supabase
        .from('ndis_plans')
        .insert({
          participant_id: participantId,
          plan_number: ndisNumber,
          start_date: planStartDate,
          end_date: planEndDate,
          plan_type: planManagementType,
          total_budget: totalFunding,
          core_budget: coreFunding,
          capacity_building_budget: capacityFunding,
          capital_budget: capitalFunding,
          goals: goals,
          status: 'active',
        });

      if (planError) throw planError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGoalExpansion = (goalId: string) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const filteredParticipants = existingParticipants.filter(p =>
    p.full_name.toLowerCase().includes(participantSearch.toLowerCase()) ||
    p.ndis_number.includes(participantSearch)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Link New NDIS Plan</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {step === 'upload' && 'Upload an NDIS plan PDF to get started'}
                {step === 'extracting' && 'Extracting plan data with AI...'}
                {step === 'review' && 'Review and confirm extracted data'}
                {step === 'saving' && 'Saving plan...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExtracting || isSaving}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="plan-upload"
              />
              <label
                htmlFor="plan-upload"
                className={`flex flex-col items-center justify-center w-full max-w-md p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isParsing
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
                }`}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <p className="text-lg font-medium text-indigo-600">Parsing PDF...</p>
                    <p className="text-sm text-slate-500 mt-1">{fileName}</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                      Drop your NDIS Plan PDF here
                    </p>
                    <p className="text-sm text-slate-500 mt-1">or click to browse</p>
                  </>
                )}
              </label>

              <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>AI will automatically extract participant details, funding, and goals</span>
              </div>
            </div>
          )}

          {/* Extracting Step */}
          {step === 'extracting' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-slate-900 rounded-full">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-6">
                AI is analyzing your NDIS Plan
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-center max-w-md">
                Extracting participant details, funding amounts, and goals. This may take a moment...
              </p>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && extractedData && (
            <div className="space-y-6">
              {/* Confidence Indicator */}
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                extractedData.extractionConfidence >= 70
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                  : extractedData.extractionConfidence >= 50
                  ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                {extractedData.extractionConfidence >= 70 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Extraction Confidence: {extractedData.extractionConfidence}%
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {extractedData.extractionConfidence >= 70
                      ? 'High confidence extraction. Please verify the details below.'
                      : 'Some data may need manual correction. Please review carefully.'}
                  </p>
                </div>
              </div>

              {/* Warnings */}
              {extractedData.warnings && extractedData.warnings.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-2">Extraction Notes:</h4>
                  <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                    {extractedData.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Participant Linking */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Link to Participant
                </h3>

                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setLinkMode('new')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      linkMode === 'new'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Plus className={`w-5 h-5 mx-auto mb-1 ${linkMode === 'new' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <p className={`text-sm font-medium ${linkMode === 'new' ? 'text-indigo-600' : 'text-slate-600 dark:text-slate-400'}`}>
                      Create New Participant
                    </p>
                  </button>
                  <button
                    onClick={() => setLinkMode('existing')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      linkMode === 'existing'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Search className={`w-5 h-5 mx-auto mb-1 ${linkMode === 'existing' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <p className={`text-sm font-medium ${linkMode === 'existing' ? 'text-indigo-600' : 'text-slate-600 dark:text-slate-400'}`}>
                      Link Existing Participant
                    </p>
                  </button>
                </div>

                {linkMode === 'existing' && (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={participantSearch}
                        onChange={(e) => {
                          setParticipantSearch(e.target.value);
                          setShowParticipantDropdown(true);
                        }}
                        onFocus={() => setShowParticipantDropdown(true)}
                        placeholder="Search by name or NDIS number..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    {showParticipantDropdown && filteredParticipants.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredParticipants.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedParticipantId(p.id);
                              setParticipantSearch(p.full_name);
                              setShowParticipantDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                              selectedParticipantId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                            }`}
                          >
                            <p className="font-medium text-slate-900 dark:text-white">{p.full_name}</p>
                            <p className="text-sm text-slate-500">NDIS #{p.ndis_number}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {linkMode === 'new' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Participant Name
                      </label>
                      <input
                        type="text"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        NDIS Number
                      </label>
                      <input
                        type="text"
                        value={ndisNumber}
                        onChange={(e) => setNdisNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Plan Details */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Plan Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={planStartDate}
                      onChange={(e) => setPlanStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={planEndDate}
                      onChange={(e) => setPlanEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Management Type
                    </label>
                    <select
                      value={planManagementType}
                      onChange={(e) => setPlanManagementType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="agency">Agency Managed</option>
                      <option value="plan-managed">Plan Managed</option>
                      <option value="self-managed">Self Managed</option>
                      <option value="combination">Combination</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Funding */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  Funding Breakdown
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Core Supports
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        value={coreFunding}
                        onChange={(e) => setCoreFunding(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Capacity Building
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        value={capacityFunding}
                        onChange={(e) => setCapacityFunding(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Capital Supports
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        value={capitalFunding}
                        onChange={(e) => setCapitalFunding(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Total Funding:</span>
                    <span className="text-indigo-600">${(coreFunding + capacityFunding + capitalFunding).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Goals */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  NDIS Goals ({goals.length})
                </h3>
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleGoalExpansion(goal.id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div>
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            Goal {goal.goalNumber}
                          </span>
                          <p className="font-medium text-slate-900 dark:text-white">{goal.title}</p>
                        </div>
                        {expandedGoals.has(goal.id) ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      {expandedGoals.has(goal.id) && (
                        <div className="px-4 pb-4 space-y-3">
                          <div>
                            <label className="text-xs font-medium text-slate-500">Description</label>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{goal.description}</p>
                          </div>
                          {goal.strategies && goal.strategies.length > 0 && (
                            <div>
                              <label className="text-xs font-medium text-slate-500">Strategies from Plan</label>
                              <ul className="mt-1 space-y-1">
                                {goal.strategies.map((s, i) => (
                                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="text-indigo-600">•</span>
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {goals.length === 0 && (
                    <p className="text-center text-slate-500 py-4">
                      No goals were extracted from the document
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExtracting || isSaving}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {step === 'review' && (
            <button
              onClick={handleSave}
              disabled={isSaving || (!participantName && linkMode === 'new') || (!selectedParticipantId && linkMode === 'existing')}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Plan
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
