import { NextRequest, NextResponse } from 'next/server';
import { askUrduChatbot } from '@/lib/groq';
import { defaultBusinessProfiles, seedProducts } from '@/lib/seedData';

// Verification endpoint for Meta Webhook
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'jk_erp_secret_token_2026';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// Inbound webhook event processor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if WhatsApp message event
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message && message.type === 'text') {
      const fromNumber = message.from;
      const textBody = message.text?.body;

      console.log(`[WhatsApp Webhook] Inbound from ${fromNumber}: ${textBody}`);

      // Ask polite Urdu AI Bot
      const botResponse = await askUrduChatbot(
        textBody,
        defaultBusinessProfiles.karyana,
        seedProducts
      );

      console.log(`[WhatsApp Webhook] Outbound Bot Reply:`, botResponse.reply);

      // In production with WhatsApp Cloud API token:
      // await sendWhatsAppCloudMessage(fromNumber, botResponse.reply);

      return NextResponse.json({
        status: 'success',
        processed: true,
        reply: botResponse.reply,
        parsedOrder: botResponse.parsedOrder,
      });
    }

    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  } catch (error: any) {
    console.error('WhatsApp Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
