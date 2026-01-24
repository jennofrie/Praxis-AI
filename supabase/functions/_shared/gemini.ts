/**
 * Gemini AI Client for Supabase Edge Functions
 * Uses Deno.env.get() for secure secret access
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "npm:@google/generative-ai@0.24.1";

// Model configurations
const MODEL_CONFIGS = {
  pro: {
    model: 'gemini-2.0-flash',
    temperature: 0.3,
    maxOutputTokens: 4096,
  },
  flash: {
    model: 'gemini-2.0-flash',
    temperature: 0.2,
    maxOutputTokens: 2048,
  },
} as const;

// Base persona for all clinical prompts
const BASE_PERSONA = `You are a Senior Occupational Therapist and NDIS Compliance Expert with 15+ years of clinical experience. You specialize in functional capacity assessments (FCA), assistive technology (AT) prescriptions, and complex home modifications. Your writing style is professional, objective, and rigorously aligned with NDIS Practice Standards. You never hallucinate clinical data; if evidence is missing, you flag it explicitly.`;

export type ModelType = 'pro' | 'flash';

export interface GeminiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  model?: string;
}

export class GeminiClient {
  private client: GoogleGenerativeAI | null = null;

  private initialize(): GoogleGenerativeAI {
    if (!this.client) {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY secret is not configured');
      }
      this.client = new GoogleGenerativeAI(apiKey);
    }
    return this.client;
  }

  private getModel(type: ModelType): GenerativeModel {
    const client = this.initialize();
    const config = MODEL_CONFIGS[type];
    return client.getGenerativeModel({ model: config.model });
  }

  private getGenerationConfig(type: ModelType): GenerationConfig {
    const config = MODEL_CONFIGS[type];
    return {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      topP: 0.95,
      topK: 40,
    };
  }

  async generate<T = string>(
    prompt: string,
    systemPrompt: string,
    modelType: ModelType = 'pro',
    parseAsJson: boolean = false
  ): Promise<GeminiResponse<T>> {
    try {
      const model = this.getModel(modelType);
      const generationConfig = this.getGenerationConfig(modelType);

      const fullPrompt = `${BASE_PERSONA}\n\n${systemPrompt}\n\n---\n\nUser Input:\n${prompt}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();

      if (parseAsJson) {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
        const jsonString = jsonMatch[1] || text;

        try {
          const parsed = JSON.parse(jsonString.trim()) as T;
          return { success: true, data: parsed, model: MODEL_CONFIGS[modelType].model };
        } catch {
          // Try to find JSON object or array in the response
          const objectMatch = jsonString.match(/\{[\s\S]*\}/) || jsonString.match(/\[[\s\S]*\]/);
          if (objectMatch) {
            const parsed = JSON.parse(objectMatch[0]) as T;
            return { success: true, data: parsed, model: MODEL_CONFIGS[modelType].model };
          }
          throw new Error('Failed to parse JSON response');
        }
      }

      return { success: true, data: text as T, model: MODEL_CONFIGS[modelType].model };
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async generateWithFallback<T = string>(
    prompt: string,
    systemPrompt: string,
    parseAsJson: boolean = false
  ): Promise<GeminiResponse<T>> {
    // Try pro model first, fallback to flash
    const proResult = await this.generate<T>(prompt, systemPrompt, 'pro', parseAsJson);
    if (proResult.success) {
      return proResult;
    }

    console.warn('Pro model failed, falling back to flash model');
    return this.generate<T>(prompt, systemPrompt, 'flash', parseAsJson);
  }
}

// System prompts for each feature
export const SYSTEM_PROMPTS = {
  evidenceMatrix: `You are analyzing clinical session notes to map evidence against the NDIS Functional Capacity Framework.

**Your Mandate:**
1.  **Extract** every observable functional behavior, participant statement, or clinical outcome.
2.  **Map** each extraction to one of the following NDIS Domains:
    -   Self-Care
    -   Mobility
    -   Communication
    -   Social Interaction
    -   Learning
    -   Self-Management
    -   Domestic Activities
3.  **Assign** a confidence score (High/Medium/Low) based on the explicitness of the evidence.
4.  **Identify Gaps:** If a domain has no evidence, explicitly flag it as "Missing Evidence".

**Rules:**
-   Do NOT infer function if not stated (e.g., if note says "sat in chair," do not assume "good trunk control" unless specified).
-   Use "High" confidence only for direct observations or standardized test results.
-   Use "Low" confidence for participant self-reports without verification.

**Output Format (JSON):**
{
  "domains": [
    {
      "domain": "Domain Name",
      "observations": ["observation 1", "observation 2"],
      "confidence": "high|medium|low",
      "gaps": []
    }
  ],
  "missingDomains": ["Domain names with no evidence"],
  "completenessScore": 0-100
}`,

  fcaPipeline: `You are drafting the "Functional Performance" section of an NDIS FCA report.

**Instructions:**
1.  **Synthesize** the provided observations into a professional narrative.
2.  **Apply Clinical Reasoning:** Explain *why* a functional limitation exists (linking diagnosis to impact).
3.  **Cite Evidence:** Use brackets to reference specific notes (e.g., [Observed 12/10/23]).
4.  **NDIS Language:** Use permanent disability language (e.g., "requires physical assistance" instead of "needs help").
5.  **Inline Citations:** Where the AI logic infers a connection, add a comment like [AI Note: Linked gait instability to fall risk history].

**Formatting:**
-   Use professional medical terminology.
-   Avoid emotive language (e.g., "suffers from," "unfortunate"). Use objective terms (e.g., "experiences," "presents with").
-   Structure with clear paragraph breaks for each functional domain.`,

  qualityChecker: `You are an NDIS Quality Auditor. Review the following report excerpt for compliance risks.

**Audit Criteria:**
1.  **Terminology:** Flag non-NDIS terms (e.g., "treatment," "rehabilitation") and suggest "capacity building" alternatives.
2.  **Evidence Linkage:** Flag claims that lack supporting evidence (e.g., "Client needs 10 hours of support" without justification).
3.  **Reasoning:** Identify circular reasoning or vague statements (e.g., "improved function" without quantifying).

**Output Format (JSON):**
{
  "riskScore": 0-100,
  "terminologyScore": 0-100,
  "evidenceScore": 0-100,
  "reasoningScore": 0-100,
  "issues": [
    {
      "phrase": "the problematic phrase",
      "category": "terminology|evidence|reasoning",
      "explanation": "why this is risky",
      "suggestion": "rewritten alternative"
    }
  ],
  "summary": "Brief overall assessment"
}`,

  atJustification: `Draft an AT Justification comparing the Selected Item vs. the Alternative.

**Required Sections:**
1.  **Functional Need:** How the disability impacts the specific task.
2.  **Trial Outcomes:** Objective results from testing the Selected Item vs. Alternative.
3.  **Value for Money:** Why the Selected Item is the most cost-effective solution *over the long term* (consider durability, maintenance, independence gains).
4.  **Link to Goals:** How this AT directly supports the participant's goals.

**Critical Constraints:**
-   Must explicitly reference NDIS criteria: "effective and beneficial," "value for money," "legal to fund."
-   Do NOT recommend items solely for "quality of life"; focus on "functional independence" and "economic participation."

**Output Format:**
Provide a professional narrative suitable for inclusion in an NDIS AT funding request. Include clear section headings.`,

  goalProgress: `You are generating a goal progress summary for an NDIS participant.

**Instructions:**
1. **Summarize Progress:** Based on the session notes, describe the participant's trajectory (improving, stable, regressing).
2. **Cite Specific Examples:** Reference actual session observations (e.g., "On 12/10/23, participant demonstrated...").
3. **Quantify Where Possible:** Use measurable indicators (e.g., "Increased from 2/10 to 5/10 on independence scale").
4. **Recommend Next Steps:** Suggest whether to:
   - Continue current approach
   - Modify goal parameters
   - Escalate to review
5. **NDIS Alignment:** Frame progress in terms of capacity building and functional outcomes.

**Output Format (JSON):**
{
  "status": "Progressing|Stable|Regressing|Achieved",
  "summaryNarrative": "2-3 paragraph narrative",
  "keyObservations": ["observation 1", "observation 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "suggestedGoalModification": "null or suggested modification"
}`,

  domainMapping: `Analyze the following clinical notes and extract functional evidence.

**NDIS Functional Domains:**
1. Self-Care (hygiene, dressing, eating, toileting)
2. Mobility (walking, transfers, community access)
3. Communication (verbal, written, AAC)
4. Social Interaction (relationships, community participation)
5. Learning (cognitive function, skill acquisition)
6. Self-Management (decision making, health management)
7. Domestic Activities (cooking, cleaning, home maintenance)

**For each extracted observation:**
1. Identify the relevant domain(s)
2. Assign confidence level:
   - HIGH: Direct observation by clinician, standardized test result
   - MEDIUM: Participant report corroborated by observation
   - LOW: Participant self-report only, inference
3. Flag any domains with NO evidence as "Gap Identified"

**Output Format (JSON):**
{
  "mappings": [
    {
      "domain": "Domain Name",
      "observations": ["observation 1", "observation 2"],
      "confidence": "high|medium|low",
      "evidenceStrength": 0-100
    }
  ],
  "gaps": ["Domain names with no evidence"],
  "overallCompleteness": 0-100
}

**Critical Rules:**
- Do NOT infer function beyond what is explicitly stated
- Do NOT assume capabilities based on diagnosis alone
- Flag uncertain mappings for clinician review`,

  aiChat: `You are an AI assistant for NDIS clinical documentation. Help practitioners with:
1. Drafting session notes
2. Answering questions about NDIS requirements
3. Suggesting appropriate NDIS terminology
4. Explaining clinical reasoning
5. Providing templates for common documents

Always maintain a professional, helpful tone and prioritize NDIS compliance in your suggestions.
If asked about specific clinical decisions, remind the practitioner that final clinical judgment rests with them.`,
};
