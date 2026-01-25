import { NextResponse } from 'next/server';
import { gemini } from '@/lib/gemini';

export async function GET() {
  try {
    const geminiConfigured = gemini.isGeminiConfigured();
    const ollamaConfigured = gemini.isOllamaConfigured();

    let ollamaOnline = false;
    let ollamaError: string | undefined;

    if (ollamaConfigured) {
      const ollamaStatus = await gemini.checkOllamaStatus();
      ollamaOnline = ollamaStatus.online;
      ollamaError = ollamaStatus.error;
    }

    return NextResponse.json({
      gemini: {
        configured: geminiConfigured,
      },
      ollama: {
        configured: ollamaConfigured,
        online: ollamaOnline,
        error: ollamaError,
      },
    });
  } catch (error) {
    console.error('AI Status API error:', error);
    return NextResponse.json(
      { error: 'Failed to check AI status' },
      { status: 500 }
    );
  }
}
