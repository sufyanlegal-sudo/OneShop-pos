import { NextRequest, NextResponse } from 'next/server';
import { askUrduChatbot } from '@/lib/groq';
import { defaultBusinessProfiles, seedProducts } from '@/lib/seedData';

// Global in-memory storage for incoming WhatsApp orders on serverless instances
declare global {
  // eslint-disable-next-line no-var
  var __whatsapp_incoming_orders: any[] | undefined;
  // eslint-disable-next-line no-var
  var __whatsapp_last_webhook_log: any | undefined;
}

if (!global.__whatsapp_incoming_orders) {
  global.__whatsapp_incoming_orders = [];
}

/**
 * Send an outbound message back to customer's WhatsApp using Meta WhatsApp Cloud API or QR Gateway
 */
async function sendWhatsAppMessage(toPhone: string, textReply: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // 1. Meta WhatsApp Cloud API (Official)
  if (token && phoneId) {
    try {
      // Format number to international digits without + or dashes
      const cleanPhone = toPhone.replace(/[^0-9]/g, '');
      const metaUrl = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

      const res = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: textReply },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('[WhatsApp Cloud API Error]:', data);
        return { success: false, error: JSON.stringify(data) };
      }
      return { success: true, data };
    } catch (err: any) {
      console.error('[WhatsApp Send Exception]:', err);
      return { success: false, error: err.message };
    }
  }

  // 2. UltraMsg QR-Code Gateway Support (Optional fallback if user uses UltraMsg)
  const ultraInstance = process.env.ULTRAMSG_INSTANCE_ID;
  const ultraToken = process.env.ULTRAMSG_TOKEN;
  if (ultraInstance && ultraToken) {
    try {
      const cleanPhone = toPhone.replace(/[^0-9]/g, '');
      const ultraUrl = `https://api.ultramsg.com/${ultraInstance}/messages/chat`;
      const res = await fetch(ultraUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: ultraToken,
          to: cleanPhone,
          body: textReply,
        }),
      });
      const data = await res.json();
      return { success: res.ok, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  console.warn('[WhatsApp Warning]: Outbound tokens (WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID) not configured in Vercel environment variables.');
  return { success: false, error: 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing' };
}

// Verification endpoint for Meta Webhook (GET) + Sync endpoint for POS
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const action = searchParams.get('action');

  // Internal endpoint for POS to sync newly received orders from WhatsApp
  if (action === 'get_orders') {
    const orders = global.__whatsapp_incoming_orders || [];
    return NextResponse.json({
      success: true,
      orders,
      lastLog: global.__whatsapp_last_webhook_log || null,
      isConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    });
  }

  // Meta Webhook Verification
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'jk_erp_secret_token_2026';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook Verified Successfully]');
    return new NextResponse(challenge, { status: 200 });
  }

  // Return diagnostic info if accessed directly in browser
  return NextResponse.json({
    message: 'OneShop POS WhatsApp Webhook Service',
    status: 'online',
    verifyTokenExpected: VERIFY_TOKEN,
    webhookUrl: '/api/webhook/whatsapp',
    ordersInQueue: (global.__whatsapp_incoming_orders || []).length,
    cloudApiConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  });
}

// Inbound webhook event processor (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    global.__whatsapp_last_webhook_log = {
      timestamp: new Date().toISOString(),
      bodyPreview: JSON.stringify(body).slice(0, 300),
    };

    // Check if WhatsApp message event from Meta Cloud API
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    // Alternatively, handle direct generic payloads (e.g. from custom bots / simulators)
    const directFrom = req.headers.get('x-from-number') || body.from || body.phone;
    const directText = body.text || body.message;

    let fromNumber = '';
    let textBody = '';
    let customerName = 'محترم واٹس ایپ گاہک';

    if (message && message.type === 'text') {
      fromNumber = message.from;
      textBody = message.text?.body || '';
      customerName = contact?.profile?.name || 'محترم واٹس ایپ گاہک';
    } else if (directFrom && directText) {
      fromNumber = directFrom;
      textBody = directText;
      customerName = body.name || customerName;
    }

    if (fromNumber && textBody) {
      console.log(`[WhatsApp Inbound] From ${fromNumber} (${customerName}): ${textBody}`);

      // Ask polite Urdu AI Bot (Llama 3.3 / Groq)
      const botResponse = await askUrduChatbot(
        textBody,
        defaultBusinessProfiles.karyana,
        seedProducts
      );

      console.log(`[WhatsApp Reply Generated]:`, botResponse.reply);

      // 1. Send immediate reply back to customer's WhatsApp!
      const sendResult = await sendWhatsAppMessage(fromNumber, botResponse.reply);

      // 2. If an order was parsed, queue it for the POS terminal & dashboard!
      let createdOrder: any = null;
      if (botResponse.parsedOrder && botResponse.parsedOrder.items && botResponse.parsedOrder.items.length > 0) {
        createdOrder = {
          id: 'wa-srv-' + Date.now(),
          orderNo: `WA-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName,
          customerPhone: fromNumber,
          customerAddress: 'واٹس ایپ لوکیشن',
          items: botResponse.parsedOrder.items.map((it: any) => ({
            productId: it.matchedProductId || 'item-' + Math.random().toString(36).substring(7),
            productName: it.name,
            quantity: it.qty || 1,
            unit: it.unit || 'Kg',
            unitPrice: it.price || 0,
            total: it.total || ((it.qty || 1) * (it.price || 0)),
          })),
          grandTotal: botResponse.parsedOrder.grandTotal || 0,
          rawMessage: textBody,
          notes: 'واٹس ایپ کے ذریعے خودکار موصول شدہ لائیو آرڈر (Pending)',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };

        // Add to server queue (keep latest 50 orders)
        global.__whatsapp_incoming_orders = [
          createdOrder,
          ...(global.__whatsapp_incoming_orders || []),
        ].slice(0, 50);

        console.log(`[WhatsApp Order Queued for POS]: ${createdOrder.orderNo} | Total: ${createdOrder.grandTotal} PKR`);
      }

      return NextResponse.json({
        status: 'success',
        processed: true,
        reply: botResponse.reply,
        outboundSent: sendResult.success,
        sendError: sendResult.error,
        parsedOrder: botResponse.parsedOrder,
        queuedOrder: createdOrder,
      });
    }

    return NextResponse.json({ status: 'ignored', reason: 'No text message found' }, { status: 200 });
  } catch (error: any) {
    console.error('WhatsApp Webhook POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
