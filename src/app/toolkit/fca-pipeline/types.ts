export interface FCASessionData {
  participantName: string;
  ndisNumber: string;
  date: string;
  diagnosis: string;
  observations: Record<string, string[]>; // Domain -> Observations
  goals: string[];
  generatedNarrative?: string;
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
