import { NextRequest, NextResponse } from 'next/server';
import { gemini, SYSTEM_PROMPTS } from '@/lib/gemini';

interface DomainObservation {
  domain: string;
  observations: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface FCAPipelineRequest {
  action: 'map-domains' | 'generate-narrative';
  notes?: string;
  participantName?: string;
  diagnosis?: string;
  domains?: DomainObservation[];
  goals?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: FCAPipelineRequest = await request.json();

    if (body.action === 'map-domains') {
      if (!body.notes) {
        return NextResponse.json(
          { error: 'Clinical notes are required for domain mapping' },
          { status: 400 }
        );
      }

      const result = await gemini.generate(
        body.notes,
        SYSTEM_PROMPTS.domainMapping,
        'pro',
        true
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to analyze notes' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        model: result.model,
      });
    }

    if (body.action === 'generate-narrative') {
      if (!body.domains || body.domains.length === 0) {
        return NextResponse.json(
          { error: 'Domain observations are required for narrative generation' },
          { status: 400 }
        );
      }

      const contextPrompt = `
**Participant:** ${body.participantName || 'Not specified'}
**Primary Diagnosis:** ${body.diagnosis || 'Not specified'}

**Domain Observations:**
${body.domains.map(d => `
### ${d.domain} (Confidence: ${d.confidence})
${d.observations.map(o => `- ${o}`).join('\n')}
`).join('\n')}

${body.goals ? `**Goals:**\n${body.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : ''}
`;

      const result = await gemini.generate(
        contextPrompt,
        SYSTEM_PROMPTS.fcaPipeline,
        'pro',
        false
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to generate narrative' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        narrative: result.data,
        model: result.model,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "map-domains" or "generate-narrative"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('FCA Pipeline API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
