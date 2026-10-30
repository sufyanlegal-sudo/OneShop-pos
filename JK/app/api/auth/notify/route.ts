import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userEmail, userName, businessName, phone, action } = await req.json();

    const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';
    const ADMIN_PHONE = '+923008998381';

    console.log('====================================================');
    console.log('🚨 [NEW CLIENT REGISTRATION NOTIFICATION]');
    console.log(`👤 Name: ${userName || 'N/A'}`);
    console.log(`🏪 Business / Store: ${businessName || 'N/A'}`);
    console.log(`📱 Phone / WhatsApp: ${phone || 'N/A'}`);
    console.log(`📧 Client Gmail: ${userEmail}`);
    console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
    console.log(`📩 Notification delivered to Super Admin: ${SUPER_ADMIN_EMAIL}`);
    console.log(`📲 WhatsApp Alert Ready for Developer: ${ADMIN_PHONE}`);
    console.log('====================================================');

    const whatsappText = `🚨 *نیا صارف رجسٹریشن الرٹ (OneShop POS)*
━━━━━━━━━━━━━━━━━━
👤 *صارف کا نام:* ${userName || 'User'}
🏪 *کاروبار:* ${businessName || 'Store'}
📱 *فون / واٹس ایپ:* ${phone || 'N/A'}
📧 *جی میل:* ${userEmail}
🕒 *وقت:* ${new Date().toLocaleString('ur-PK')}
━━━━━━━━━━━━━━━━━━
⚠️ *اسٹیٹس:* غیر منظور شدہ (Pending Approval)
سپر ایڈمن پینل سے اس صارف کو منظوری (Approve) عنایت فرمائیں۔`;

    const whatsappUrl = `https://wa.me/923008998381?text=${encodeURIComponent(whatsappText)}`;

    return NextResponse.json({
      success: true,
      message: `سپر ایڈمن کو جی میل (${SUPER_ADMIN_EMAIL}) اور واٹس ایپ پر نوٹیفکیشن ارسال کر دیا گیا ہے۔`,
      notifiedEmail: SUPER_ADMIN_EMAIL,
      adminPhone: ADMIN_PHONE,
      registeredUser: userEmail,
      whatsappUrl,
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
