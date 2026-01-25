export interface FCASessionData {
  participantName: string;
  ndisNumber: string;
  sessionDate: string;
  sessionTime: string;
  clinicianName: string;
  sessionType: string;
  location: string;
  diagnosis: string;
  referralReason?: string;
  referrerContact?: string;
  intakeNotes?: string;
  rawNotes?: string;
  attachments?: IntakeAttachment[];
  observations: Record<string, string[]>; // Domain -> Observations
  goals: string[];
  generatedNarrative?: string;
}

export interface IntakeAttachment {
  name: string;
  path: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  extractedText?: string;
}

export type PipelineStep = "intake" | "mapping" | "narrative" | "review";

export const NDIS_DOMAINS = [
  "Self-Care",
  "Mobility",
  "Communication",
  "Social Interaction",
  "Learning",
  "Self-Management",
  "Economic Participation"
];
