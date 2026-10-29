import { NextRequest, NextResponse } from 'next/server';
import { askUrduChatbot } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, businessProfile, inventory, history } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await askUrduChatbot(
      message,
      businessProfile || {
        nameUr: 'المدینہ کریانہ و جنرل سٹور',
        nameEn: 'Al-Madina Karyana',
        addressUr: 'لاہور',
        whatsapp: '0300-1234567',
      },
      inventory || [],
      history || []
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /chat error:', error);
    return NextResponse.json(
      {
        reply: 'معذرت، سسٹم میں عارضی مسئلہ ہے۔ براہ کرم دوبارہ کوشش فرمائیں۔',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
