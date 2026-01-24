import { NextRequest, NextResponse } from 'next/server';
import { gemini, SYSTEM_PROMPTS } from '@/lib/gemini';

interface QualityCheckerRequest {
  reportContent: string;
  reportType?: 'fca' | 'at-justification' | 'progress-note' | 'general';
}

interface QualityIssue {
  phrase: string;
  category: 'terminology' | 'evidence' | 'reasoning';
  explanation: string;
  suggestion: string;
}

interface QualityCheckerResponse {
  riskScore: number;
  terminologyScore: number;
  evidenceScore: number;
  reasoningScore: number;
  issues: QualityIssue[];
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: QualityCheckerRequest = await request.json();

    if (!body.reportContent || body.reportContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'Report content is required' },
        { status: 400 }
      );
    }

    // Add context about report type if provided
    let prompt = body.reportContent;
    if (body.reportType && body.reportType !== 'general') {
      const typeContext = {
        'fca': 'This is a Functional Capacity Assessment (FCA) report. Pay special attention to functional domain coverage and clinical reasoning.',
        'at-justification': 'This is an Assistive Technology justification. Focus on Section 34 compliance and value-for-money arguments.',
        'progress-note': 'This is a progress note. Focus on measurable outcomes and goal alignment.',
      };
      prompt = `**Report Type:** ${typeContext[body.reportType]}\n\n**Report Content:**\n${body.reportContent}`;
    }

    const result = await gemini.generate<QualityCheckerResponse>(
      prompt,
      SYSTEM_PROMPTS.qualityChecker,
      'pro',
      true
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to analyze report quality' },
        { status: 500 }
      );
    }

    const data = result.data as QualityCheckerResponse;

    // Ensure all scores are within valid range
    const normalizeScore = (score: number) => Math.max(0, Math.min(100, score));
    
    data.riskScore = normalizeScore(data.riskScore ?? 50);
    data.terminologyScore = normalizeScore(data.terminologyScore ?? 50);
    data.evidenceScore = normalizeScore(data.evidenceScore ?? 50);
    data.reasoningScore = normalizeScore(data.reasoningScore ?? 50);

    // Ensure issues array exists
    data.issues = data.issues || [];

    // Add severity classification based on category
    const issuesWithSeverity = data.issues.map(issue => ({
      ...issue,
      severity: issue.category === 'evidence' ? 'high' : 
                issue.category === 'reasoning' ? 'medium' : 'low',
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        issues: issuesWithSeverity,
        passThreshold: data.riskScore <= 25, // 75+ quality score means pass
        qualityScore: 100 - data.riskScore,
      },
      model: result.model,
    });
  } catch (error) {
    console.error('Quality Checker API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
