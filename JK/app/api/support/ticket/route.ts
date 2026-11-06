import { NextResponse } from 'next/server';
import { saveTicket, getAllTickets, SupportTicket } from '@/lib/ticketDb';
import { notifyAdminSupportTicket } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userName, userPhone, userEmail, subject, message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'پیغام درج کرنا لازمی ہے۔' },
        { status: 400 }
      );
    }

    // Generate unique Ticket ID: TICK-${Date.now().toString().slice(-4)}
    const ticketId = `TICK-${Date.now().toString().slice(-4)}`;

    const newTicket: SupportTicket = {
      id: ticketId,
      userName: (userName || 'نامعلوم صارف').trim(),
      userPhone: (userPhone || '').trim(),
      userEmail: (userEmail || '').trim(),
      subject: (subject || 'کسٹمر سپورٹ درخواست').trim(),
      message: message.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    await saveTicket(newTicket);

    // Send immediate WhatsApp & Email alert to Admin with ticket number and message
    notifyAdminSupportTicket({
      ticketId,
      userName: newTicket.userName,
      userPhone: newTicket.userPhone,
      subject: newTicket.subject,
      message: newTicket.message,
    }).catch((err) => console.error('[Ticket API] Notification alert error:', err));

    return NextResponse.json({
      success: true,
      ticketId,
      status: 'open',
      message: 'سپورٹ ٹکٹ کامیابی سے درج ہو چکا ہے، ہیلپ لائن ٹیم جلد رابطہ کرے گی۔',
      ticket: newTicket,
    });
  } catch (error: any) {
    console.error('Support ticket route error:', error);
    return NextResponse.json(
      { success: false, message: 'سرور میں خرابی: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tickets = await getAllTickets();
    return NextResponse.json({
      success: true,
      tickets,
      total: tickets.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
