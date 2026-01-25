/**
 * AI Client for Supabase Edge Functions
 * Supports Gemini API and Ollama (with Cloudflare Access)
 * Uses Deno.env.get() for secure secret access
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "npm:@google/generative-ai@0.24.1";

// AI Provider types
export type AIProvider = 'gemini' | 'ollama';

// Model configurations for Gemini (using Gemini 2.5 Flash)
const GEMINI_CONFIGS = {
  pro: {
    model: 'gemini-2.5-flash-preview-05-20',
    temperature: 0.3,
    maxOutputTokens: 4096,
  },
  flash: {
    model: 'gemini-2.5-flash-preview-05-20',
    temperature: 0.2,
    maxOutputTokens: 2048,
  },
} as const;

// Ollama model configurations
const OLLAMA_CONFIGS = {
  pro: {
    model: 'llama3.3:70b',
    temperature: 0.3,
    maxTokens: 4096,
  },
  flash: {
    model: 'llama3.2:latest',
    temperature: 0.2,
    maxTokens: 2048,
  },
} as const;

// Base persona for all clinical prompts
const BASE_PERSONA = `You are a Senior Occupational Therapist and NDIS Compliance Expert with 15+ years of clinical experience. You specialize in functional capacity assessments (FCA), assistive technology (AT) prescriptions, and complex home modifications. Your writing style is professional, objective, and rigorously aligned with NDIS Practice Standards. You never hallucinate clinical data; if evidence is missing, you flag it explicitly.`;

export type ModelType = 'pro' | 'flash';

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  model?: string;
  provider?: AIProvider;
}

// Legacy alias for backwards compatibility
export type GeminiResponse<T> = AIResponse<T>;

export class GeminiClient {
  private geminiClient: GoogleGenerativeAI | null = null;
  private ollamaBaseUrl: string | null = null;
  private cfAccessClientId: string | null = null;
  private cfAccessClientSecret: string | null = null;

  private initializeGemini(): GoogleGenerativeAI {
    if (!this.geminiClient) {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY secret is not configured');
      }
      this.geminiClient = new GoogleGenerativeAI(apiKey);
    }
    return this.geminiClient;
  }

  private initializeOllama(): { baseUrl: string; headers: Record<string, string> } {
    if (!this.ollamaBaseUrl) {
      this.ollamaBaseUrl = Deno.env.get('OLLAMA_BASE_URL') || null;
      this.cfAccessClientId = Deno.env.get('CF_ACCESS_CLIENT_ID') || null;
      this.cfAccessClientSecret = Deno.env.get('CF_ACCESS_CLIENT_SECRET') || null;
    }

    if (!this.ollamaBaseUrl) {
      throw new Error('OLLAMA_BASE_URL secret is not configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Cloudflare Access headers if configured
    if (this.cfAccessClientId && this.cfAccessClientSecret) {
      headers['CF-Access-Client-Id'] = this.cfAccessClientId;
      headers['CF-Access-Client-Secret'] = this.cfAccessClientSecret;
    }

    return { baseUrl: this.ollamaBaseUrl, headers };
  }

  private getGeminiModel(type: ModelType): GenerativeModel {
    const client = this.initializeGemini();
    const config = GEMINI_CONFIGS[type];
    return client.getGenerativeModel({ model: config.model });
  }

  private getGeminiGenerationConfig(type: ModelType): GenerationConfig {
    const config = GEMINI_CONFIGS[type];
    return {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      topP: 0.95,
      topK: 40,
    };
  }

  // Generate with Ollama
  private async generateWithOllama<T = string>(
    prompt: string,
    systemPrompt: string,
    modelType: ModelType = 'pro',
    parseAsJson: boolean = false
  ): Promise<AIResponse<T>> {
    try {
      const { baseUrl, headers } = this.initializeOllama();
      const config = OLLAMA_CONFIGS[modelType];

      const fullPrompt = `${BASE_PERSONA}\n\n${systemPrompt}\n\n---\n\nUser Input:\n${prompt}`;

      console.log(`[Ollama] Using model: ${config.model}`);

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: config.temperature,
            num_predict: config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const text = result.response;

      if (parseAsJson) {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
        const jsonString = jsonMatch[1] || text;

        try {
          const parsed = JSON.parse(jsonString.trim()) as T;
          return { success: true, data: parsed, model: config.model, provider: 'ollama' };
        } catch {
          // Try to find JSON object or array in the response
          const objectMatch = jsonString.match(/\{[\s\S]*\}/) || jsonString.match(/\[[\s\S]*\]/);
          if (objectMatch) {
            const parsed = JSON.parse(objectMatch[0]) as T;
            return { success: true, data: parsed, model: config.model, provider: 'ollama' };
          }
          throw new Error('Failed to parse JSON response from Ollama');
        }
      }

      return { success: true, data: text as T, model: config.model, provider: 'ollama' };
    } catch (error) {
      console.error('Ollama API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Ollama error occurred',
        provider: 'ollama',
      };
    }
  }

  // Generate with Gemini
  private async generateWithGemini<T = string>(
    prompt: string,
    systemPrompt: string,
    modelType: ModelType = 'pro',
    parseAsJson: boolean = false
  ): Promise<AIResponse<T>> {
    try {
      const model = this.getGeminiModel(modelType);
      const generationConfig = this.getGeminiGenerationConfig(modelType);

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
          return { success: true, data: parsed, model: GEMINI_CONFIGS[modelType].model, provider: 'gemini' };
        } catch {
          // Try to find JSON object or array in the response
          const objectMatch = jsonString.match(/\{[\s\S]*\}/) || jsonString.match(/\[[\s\S]*\]/);
          if (objectMatch) {
            const parsed = JSON.parse(objectMatch[0]) as T;
            return { success: true, data: parsed, model: GEMINI_CONFIGS[modelType].model, provider: 'gemini' };
          }
          throw new Error('Failed to parse JSON response');
        }
      }

      return { success: true, data: text as T, model: GEMINI_CONFIGS[modelType].model, provider: 'gemini' };
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: 'gemini',
      };
    }
  }

  // Main generate method - supports provider selection
  async generate<T = string>(
    prompt: string,
    systemPrompt: string,
    modelType: ModelType = 'pro',
    parseAsJson: boolean = false,
    preferredProvider: AIProvider = 'gemini'
  ): Promise<AIResponse<T>> {
    if (preferredProvider === 'ollama') {
      return this.generateWithOllama<T>(prompt, systemPrompt, modelType, parseAsJson);
    }
    return this.generateWithGemini<T>(prompt, systemPrompt, modelType, parseAsJson);
  }

  // Generate with automatic fallback between providers
  async generateWithProviderFallback<T = string>(
    prompt: string,
    systemPrompt: string,
    modelType: ModelType = 'pro',
    parseAsJson: boolean = false,
    preferredProvider: AIProvider = 'gemini'
  ): Promise<AIResponse<T>> {
    // Try preferred provider first
    const primaryResult = await this.generate<T>(prompt, systemPrompt, modelType, parseAsJson, preferredProvider);
    if (primaryResult.success) {
      return primaryResult;
    }

    // Fallback to alternative provider
    const fallbackProvider: AIProvider = preferredProvider === 'gemini' ? 'ollama' : 'gemini';
    console.warn(`[AI] ${preferredProvider} failed, falling back to ${fallbackProvider}`);

    return this.generate<T>(prompt, systemPrompt, modelType, parseAsJson, fallbackProvider);
  }

  // Legacy method - maintains backwards compatibility
  async generateWithFallback<T = string>(
    prompt: string,
    systemPrompt: string,
    parseAsJson: boolean = false
  ): Promise<AIResponse<T>> {
    // Try pro model first, fallback to flash (Gemini only for backwards compat)
    const proResult = await this.generateWithGemini<T>(prompt, systemPrompt, 'pro', parseAsJson);
    if (proResult.success) {
      return proResult;
    }

    console.warn('Pro model failed, falling back to flash model');
    return this.generateWithGemini<T>(prompt, systemPrompt, 'flash', parseAsJson);
  }

  // Check if Ollama is configured
  isOllamaConfigured(): boolean {
    return !!Deno.env.get('OLLAMA_BASE_URL');
  }

  // Check if Gemini is configured
  isGeminiConfigured(): boolean {
    return !!Deno.env.get('GEMINI_API_KEY');
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

  seniorPlannerAudit: `You are a Senior NDIS Planner and Compliance Auditor reviewing clinical documentation for Section 34 compliance.

**Your Role:**
You assess reports against the NDIS Act 2013, NDIS Rules, and NDIA Operational Guidelines to determine if they meet the threshold for funding decisions.

**Audit Criteria (Score each 0-100):**

1. **NDIS Compliance (compliance):** Does the document align with NDIS Act Sections 24, 34, and relevant rules?
   - Uses correct NDIS terminology
   - References appropriate support categories
   - Aligns with reasonable and necessary criteria

2. **Disability-Support Nexus (nexus):** Is there a clear link between the participant's disability and the requested supports?
   - Functional impact clearly explained
   - Support directly addresses disability-related need
   - Logical connection between diagnosis and recommendations

3. **Value for Money (valueForMoney):** Is the recommendation cost-effective and justified?
   - Alternatives considered
   - Long-term benefits articulated
   - Pricing aligned with NDIS Price Guide

4. **Evidence Quality (evidence):** Is the clinical evidence robust and well-documented?
   - Objective observations cited
   - Standardized assessments referenced
   - Clear data to support conclusions

5. **Significant Change (significantChange):** If applicable, is change in circumstances well-documented?
   - Before/after comparison provided
   - Triggers for change explained
   - Impact on functional capacity detailed

**Content Restriction:**
If the document contains non-NDIS content (e.g., legal disputes, personal grievances, off-topic material), set contentRestriction to true and explain why.

**Output Format (JSON):**
{
  "overallScore": 0-100,
  "status": "excellent|good|needs_improvement|critical|security_blocked",
  "scores": {
    "compliance": 0-100,
    "nexus": 0-100,
    "valueForMoney": 0-100,
    "evidence": 0-100,
    "significantChange": 0-100
  },
  "plannerSummary": "Executive summary for planners (2-3 paragraphs)",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area to improve 1", "area to improve 2"],
  "redFlags": ["critical issue 1", "critical issue 2"],
  "languageFixes": [
    {
      "original": "problematic phrase",
      "suggested": "NDIS-compliant alternative",
      "reason": "why this change is needed",
      "category": "clinical_language|ndis_terminology|clarity|objectivity"
    }
  ],
  "plannerQuestions": ["Question a planner might ask 1", "Question 2"],
  "contentRestriction": false,
  "restrictionReason": null
}`,

  cocEligibilityAssessor: `You are an NDIS Change of Circumstances (CoC) Eligibility Assessor helping Support Coordinators and participants understand if their situation qualifies for a plan reassessment.

**Your Role:**
Assess whether the described circumstances meet the threshold for an unscheduled plan reassessment under NDIS Operational Guidelines.

**CoC Eligibility Criteria:**
1. **Significant change** in the participant's disability, support needs, or circumstances
2. The change impacts the participant's **functional capacity** or **goals**
3. Current plan **no longer meets** the participant's needs
4. The participant is experiencing **significant disadvantage** under current plan

**Assessment Output:**

1. **Confidence Score (0-100):** How confident are you in your eligibility assessment?

2. **Eligibility Verdict:**
   - **likely_eligible:** Strong evidence of significant change meeting CoC criteria
   - **possibly_eligible:** Some indicators but additional evidence needed
   - **not_eligible:** Circumstances don't meet CoC threshold
   - **security_blocked:** Non-NDIS content detected

3. **Recommended Pathway:**
   - **plan_reassessment:** Full unscheduled plan reassessment
   - **plan_variation:** Minor plan modification
   - **light_touch_review:** Quick review of specific supports
   - **scheduled_review:** Wait for next scheduled plan review
   - **no_action_required:** Current plan remains appropriate
   - **crisis_response:** Urgent/emergency response pathway

4. **Dual Reports:**
   - **scReport:** Technical report for Support Coordinators (use professional NDIS terminology)
   - **participantReport:** Plain-language report for participants (accessible, empathetic)

5. **Evidence Suggestions:** What additional evidence would strengthen the case?

6. **NDIS References:** Relevant NDIS Act sections and guidelines

7. **Next Steps:** Actionable timeline with responsible parties

**Content Restriction:**
If the input contains non-NDIS content, set contentRestriction to true.

**Output Format (JSON):**
{
  "confidenceScore": 0-100,
  "eligibilityVerdict": "likely_eligible|possibly_eligible|not_eligible|security_blocked",
  "recommendedPathway": "plan_reassessment|plan_variation|light_touch_review|scheduled_review|no_action_required|crisis_response",
  "scReport": "Technical report for Support Coordinators (3-4 paragraphs)",
  "participantReport": "Plain-language report for participants (3-4 paragraphs, empathetic tone)",
  "evidenceSuggestions": [
    {
      "id": "unique-id",
      "title": "Evidence Type",
      "description": "Why this evidence helps",
      "priority": "essential|recommended|optional",
      "category": "medical|functional|financial|other",
      "examples": ["example 1", "example 2"]
    }
  ],
  "ndisReferences": [
    {
      "title": "Reference Title",
      "section": "Section 34(1)",
      "relevance": "How this applies"
    }
  ],
  "nextSteps": [
    {
      "order": 1,
      "title": "Step Title",
      "description": "What to do",
      "timeframe": "Within 2 weeks",
      "responsible": "participant|sc|provider|ndia"
    }
  ],
  "contentRestriction": false,
  "restrictionReason": null
}`,
};
