/**
 * AI Utility for Spectra Praxis
 * Handles all AI model interactions with Gemini and Ollama support
 * Includes proper error handling and provider fallback support
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

// AI Provider types
export type AIProvider = 'gemini' | 'ollama';

// Gemini model configurations
const GEMINI_CONFIGS = {
  pro: {
    model: 'gemini-2.5-flash',
    temperature: 0.3,
    maxOutputTokens: 4096,
  },
  flash: {
    model: 'gemini-2.5-flash',
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

// NDIS terminology replacements
const NDIS_TERMINOLOGY = {
  avoid: ['Patient', 'Treatment', 'Rehabilitation', 'Therapy', 'Carer', 'Disabled person', 'Suffers from', 'Wheelchair-bound', 'High-functioning', 'Low-functioning'],
  preferred: ['Participant', 'Capacity building support', 'Skill development', 'Therapeutic support', 'Support worker / Informal support', 'Person with disability', 'Experiences / Presents with', 'Uses a wheelchair', '(Describe specific capabilities)', '(Describe specific support needs)'],
};

export type ModelType = 'pro' | 'flash';

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  model?: string;
  provider?: AIProvider;
}

class AIClient {
  private geminiClient: GoogleGenerativeAI | null = null;
  private geminiInitialized = false;

  private initializeGemini(): GoogleGenerativeAI {
    if (!this.geminiInitialized) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }
      this.geminiClient = new GoogleGenerativeAI(apiKey);
      this.geminiInitialized = true;
    }
    return this.geminiClient!;
  }

  private getOllamaConfig() {
    const baseUrl = process.env.OLLAMA_BASE_URL;
    const cfClientId = process.env.CF_ACCESS_CLIENT_ID;
    const cfClientSecret = process.env.CF_ACCESS_CLIENT_SECRET;

    if (!baseUrl) {
      throw new Error('OLLAMA_BASE_URL environment variable is not set');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Cloudflare Access headers if configured
    if (cfClientId && cfClientSecret) {
      headers['CF-Access-Client-Id'] = cfClientId;
      headers['CF-Access-Client-Secret'] = cfClientSecret;
    }

    return { baseUrl, headers };
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
      const { baseUrl, headers } = this.getOllamaConfig();
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
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
        const jsonString = jsonMatch[1] || text;

        try {
          const parsed = JSON.parse(jsonString.trim()) as T;
          return { success: true, data: parsed, model: config.model, provider: 'ollama' };
        } catch {
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
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
        const jsonString = jsonMatch[1] || text;

        try {
          const parsed = JSON.parse(jsonString.trim()) as T;
          return { success: true, data: parsed, model: GEMINI_CONFIGS[modelType].model, provider: 'gemini' };
        } catch {
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
    preferredProvider: AIProvider = 'gemini',
    enableFallback: boolean = true
  ): Promise<AIResponse<T>> {
    // Try preferred provider first
    const primaryResult = await this.generate<T>(prompt, systemPrompt, modelType, parseAsJson, preferredProvider);
    if (primaryResult.success) {
      return primaryResult;
    }

    if (!enableFallback) {
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
    // Try pro model first, fallback to flash (Gemini only)
    const proResult = await this.generateWithGemini<T>(prompt, systemPrompt, 'pro', parseAsJson);
    if (proResult.success) {
      return proResult;
    }

    console.warn('Pro model failed, falling back to flash model');
    return this.generateWithGemini<T>(prompt, systemPrompt, 'flash', parseAsJson);
  }

  // Check if Ollama is configured
  isOllamaConfigured(): boolean {
    return !!process.env.OLLAMA_BASE_URL;
  }

  // Check if Gemini is configured
  isGeminiConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  // Check Ollama connectivity
  async checkOllamaStatus(): Promise<{ online: boolean; error?: string }> {
    try {
      const { baseUrl, headers } = this.getOllamaConfig();
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers,
      });
      return { online: response.ok };
    } catch (error) {
      return {
        online: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
}

// Singleton instance
export const gemini = new AIClient();

// Export the client class for type purposes
export { AIClient };

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
};

// Export terminology for client-side use
export { NDIS_TERMINOLOGY };
