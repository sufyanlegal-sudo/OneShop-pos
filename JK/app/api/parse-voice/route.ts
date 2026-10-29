import { NextRequest, NextResponse } from 'next/server';
import { parseVoiceOrderWithAI } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, inventory } = body;

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const result = await parseVoiceOrderWithAI(transcript, inventory || []);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /parse-voice error:', error);
    return NextResponse.json(
      {
        items: [],
        confidence: 0,
        notes: 'Failed to process voice command: ' + error.message,
      },
      { status: 500 }
    );
  }
}
