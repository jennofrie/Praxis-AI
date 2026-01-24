import { NextRequest, NextResponse } from 'next/server';
import { gemini, SYSTEM_PROMPTS } from '@/lib/gemini';

interface EvidenceMatrixRequest {
  notes: string;
  existingEvidence?: {
    domain: string;
    observations: string[];
  }[];
}

interface DomainEvidence {
  domain: string;
  observations: string[];
  confidence: 'high' | 'medium' | 'low';
  gaps: string[];
}

interface EvidenceMatrixResponse {
  domains: DomainEvidence[];
  missingDomains: string[];
  completenessScore: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: EvidenceMatrixRequest = await request.json();

    if (!body.notes || body.notes.trim().length === 0) {
      return NextResponse.json(
        { error: 'Clinical notes are required' },
        { status: 400 }
      );
    }

    let prompt = body.notes;

    // If there's existing evidence, include it for context
    if (body.existingEvidence && body.existingEvidence.length > 0) {
      prompt += `\n\n**Previously Identified Evidence:**\n`;
      body.existingEvidence.forEach(ev => {
        prompt += `\n${ev.domain}:\n${ev.observations.map(o => `- ${o}`).join('\n')}`;
      });
      prompt += `\n\n**Task:** Analyze the new notes above and merge with existing evidence. Identify any additional observations or gaps.`;
    }

    const result = await gemini.generate<EvidenceMatrixResponse>(
      prompt,
      SYSTEM_PROMPTS.evidenceMatrix,
      'pro',
      true
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to analyze evidence' },
        { status: 500 }
      );
    }

    // Ensure all 7 domains are represented
    const allDomains = [
      'Self-Care',
      'Mobility',
      'Communication',
      'Social Interaction',
      'Learning',
      'Self-Management',
      'Domestic Activities',
    ];

    const data = result.data as EvidenceMatrixResponse;
    const existingDomains = data.domains?.map(d => d.domain) || [];
    const missing = allDomains.filter(d => !existingDomains.some(ed => ed.toLowerCase() === d.toLowerCase()));

    // Add missing domains to the response
    if (missing.length > 0) {
      data.missingDomains = [...(data.missingDomains || []), ...missing.filter(m => !data.missingDomains?.includes(m))];
    }

    // Calculate completeness if not provided
    if (!data.completenessScore) {
      const domainsWithEvidence = data.domains?.filter(d => d.observations?.length > 0).length || 0;
      data.completenessScore = Math.round((domainsWithEvidence / allDomains.length) * 100);
    }

    return NextResponse.json({
      success: true,
      data,
      model: result.model,
    });
  } catch (error) {
    console.error('Evidence Matrix API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
