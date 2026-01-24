import { NextRequest, NextResponse } from 'next/server';
import { gemini, SYSTEM_PROMPTS } from '@/lib/gemini';

interface AssessmentScore {
  tool: string;
  baseline: number;
  withAT: number;
  scale?: string;
}

interface ATOption {
  name: string;
  cost: number;
  effectiveness: number;
  participantPreference: number;
  maintenanceCost: number;
  description?: string;
}

interface ATJustificationRequest {
  participantName?: string;
  functionalNeed: string;
  diagnosis?: string;
  assessmentScores: AssessmentScore[];
  selectedAT: ATOption;
  alternativeAT: ATOption;
  goals?: string[];
  trialNotes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ATJustificationRequest = await request.json();

    if (!body.functionalNeed || !body.selectedAT || !body.alternativeAT) {
      return NextResponse.json(
        { error: 'Functional need, selected AT, and alternative AT are required' },
        { status: 400 }
      );
    }

    if (!body.assessmentScores || body.assessmentScores.length === 0) {
      return NextResponse.json(
        { error: 'At least one assessment score is required for evidence' },
        { status: 400 }
      );
    }

    // Calculate weighted scores for comparison
    const calculateWeightedScore = (at: ATOption) => {
      const weights = {
        effectiveness: 0.4,
        cost: 0.25,
        preference: 0.2,
        maintenance: 0.15,
      };
      
      // Normalize cost (inverse - lower is better)
      const maxCost = Math.max(body.selectedAT.cost, body.alternativeAT.cost);
      const costScore = ((maxCost - at.cost) / maxCost) * 100;
      
      // Normalize maintenance cost (inverse)
      const maxMaint = Math.max(body.selectedAT.maintenanceCost, body.alternativeAT.maintenanceCost);
      const maintScore = maxMaint > 0 ? ((maxMaint - at.maintenanceCost) / maxMaint) * 100 : 100;

      return Math.round(
        (at.effectiveness * weights.effectiveness) +
        (costScore * weights.cost) +
        (at.participantPreference * weights.preference) +
        (maintScore * weights.maintenance)
      );
    };

    const selectedScore = calculateWeightedScore(body.selectedAT);
    const alternativeScore = calculateWeightedScore(body.alternativeAT);

    // Format assessment improvements
    const assessmentImprovements = body.assessmentScores.map(a => {
      const improvement = a.withAT - a.baseline;
      const percentImprovement = a.baseline > 0 ? Math.round((improvement / a.baseline) * 100) : 0;
      return `- ${a.tool}: ${a.baseline} → ${a.withAT} ${a.scale || ''} (${improvement > 0 ? '+' : ''}${percentImprovement}% improvement)`;
    }).join('\n');

    const prompt = `
**Participant:** ${body.participantName || 'Not specified'}
**Primary Diagnosis:** ${body.diagnosis || 'Not specified'}

**Functional Need:**
${body.functionalNeed}

**Assessment Results (Baseline vs. With AT):**
${assessmentImprovements}

**Selected AT Option:**
- Name: ${body.selectedAT.name}
- Cost: $${body.selectedAT.cost.toLocaleString()}
- Annual Maintenance: $${body.selectedAT.maintenanceCost.toLocaleString()}
- Effectiveness Rating: ${body.selectedAT.effectiveness}/100
- Participant Preference: ${body.selectedAT.participantPreference}/100
- Weighted Score: ${selectedScore}/100
${body.selectedAT.description ? `- Description: ${body.selectedAT.description}` : ''}

**Alternative Option Considered:**
- Name: ${body.alternativeAT.name}
- Cost: $${body.alternativeAT.cost.toLocaleString()}
- Annual Maintenance: $${body.alternativeAT.maintenanceCost.toLocaleString()}
- Effectiveness Rating: ${body.alternativeAT.effectiveness}/100
- Participant Preference: ${body.alternativeAT.participantPreference}/100
- Weighted Score: ${alternativeScore}/100
${body.alternativeAT.description ? `- Description: ${body.alternativeAT.description}` : ''}

${body.trialNotes ? `**Trial Notes:**\n${body.trialNotes}` : ''}

${body.goals ? `**Participant Goals:**\n${body.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : ''}

---

Generate a comprehensive AT justification that addresses NDIS Section 34 criteria.
`;

    const result = await gemini.generate<string>(
      prompt,
      SYSTEM_PROMPTS.atJustification,
      'pro',
      false
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate AT justification' },
        { status: 500 }
      );
    }

    // Calculate cost-benefit metrics
    const costDifference = body.selectedAT.cost - body.alternativeAT.cost;
    const effectivenessDifference = body.selectedAT.effectiveness - body.alternativeAT.effectiveness;
    const fiveYearCostSelected = body.selectedAT.cost + (body.selectedAT.maintenanceCost * 5);
    const fiveYearCostAlternative = body.alternativeAT.cost + (body.alternativeAT.maintenanceCost * 5);

    return NextResponse.json({
      success: true,
      data: {
        justification: result.data,
        comparison: {
          selectedScore,
          alternativeScore,
          recommendation: selectedScore >= alternativeScore ? 'selected' : 'alternative',
          costDifference,
          effectivenessDifference,
          fiveYearCostComparison: {
            selected: fiveYearCostSelected,
            alternative: fiveYearCostAlternative,
            savings: fiveYearCostAlternative - fiveYearCostSelected,
          },
        },
        assessmentSummary: body.assessmentScores.map(a => ({
          tool: a.tool,
          improvement: a.withAT - a.baseline,
          percentImprovement: a.baseline > 0 ? Math.round(((a.withAT - a.baseline) / a.baseline) * 100) : 0,
        })),
      },
      model: result.model,
    });
  } catch (error) {
    console.error('AT Justification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
