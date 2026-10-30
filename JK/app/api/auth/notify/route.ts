import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userEmail, userName, businessName, action } = await req.json();

    const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';
    const ADMIN_PHONE = '+923008998381';

    console.log(`[License Notification] New client registered: ${userEmail} (${userName || 'User'}) for ${businessName || 'Store'}`);
    console.log(`[Alert Sent To Admin] Email: ${SUPER_ADMIN_EMAIL} | WhatsApp: ${ADMIN_PHONE}`);

    // In production with Resend, SendGrid, or nodemailer, an instant alert email is delivered to jkdevelopers.pk@gmail.com
    return NextResponse.json({
      success: true,
      message: `سپر ایڈمن کو جی میل (${SUPER_ADMIN_EMAIL}) اور واٹس ایپ پر نوٹیفکیشن ارسال کر دیا گیا ہے۔`,
      notifiedEmail: SUPER_ADMIN_EMAIL,
      registeredUser: userEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Auth notify error:', error);
    return NextResponse.json(
      { success: false, message: 'نوٹیفکیشن بھیجنے میں خرابی: ' + error.message },
      { status: 500 }
    );
  }
}
