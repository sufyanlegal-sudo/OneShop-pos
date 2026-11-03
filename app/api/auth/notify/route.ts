import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userEmail, userName, businessName, phone, action } = await req.json();

    const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';
    const ADMIN_PHONE = '+923008998381';

    console.log('====================================================');
    console.log('🚨 [JK DEVELOPERS PAKISTAN - NEW CLIENT REGISTRATION ALERT]');
    console.log(`👤 Client Name: ${userName || 'N/A'}`);
    console.log(`🏪 Business / Store: ${businessName || 'N/A'}`);
    console.log(`📱 Phone / WhatsApp: ${phone || 'N/A'}`);
    console.log(`📧 Client Gmail: ${userEmail}`);
    console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
    console.log(`📩 Notification Recipient: ${SUPER_ADMIN_EMAIL}`);
    console.log(`📲 WhatsApp Target: ${ADMIN_PHONE}`);
    console.log('====================================================');

    const whatsappText = `🚨 *نیا صارف رجسٹریشن الرٹ (OneShop POS)*
━━━━━━━━━━━━━━━━━━
🏪 *ادارہ:* JK Developers Pakistan
👤 *صارف کا نام:* ${userName || 'User'}
🏪 *کاروبار:* ${businessName || 'Store'}
📱 *فون / واٹس ایپ:* ${phone || 'N/A'}
📧 *جی میل:* ${userEmail}
🕒 *وقت:* ${new Date().toLocaleString('ur-PK')}
━━━━━━━━━━━━━━━━━━
⚠️ *اسٹیٹس:* غیر منظور شدہ (Pending Approval)
سپر ایڈمن پینل سے اس صارف کو منظوری (Approve) عنایت فرمائیں۔`;

    const cleanAdminPhone = ADMIN_PHONE.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(whatsappText)}`;

    // 1. Try sending automated WhatsApp message via Meta Cloud API if configured
    const metaToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (metaToken && phoneId) {
      try {
        await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanAdminPhone,
            type: 'text',
            text: { preview_url: false, body: whatsappText },
          }),
        });
        console.log('✓ Meta Cloud WhatsApp alert dispatched to admin.');
      } catch (e) {
        console.error('Meta WhatsApp dispatch error:', e);
      }
    }

    // 2. Try UltraMsg if configured
    const ultraInstance = process.env.ULTRAMSG_INSTANCE_ID;
    const ultraToken = process.env.ULTRAMSG_TOKEN;
    if (ultraInstance && ultraToken) {
      try {
        await fetch(`https://api.ultramsg.com/${ultraInstance}/messages/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: ultraToken,
            to: cleanAdminPhone,
            body: whatsappText,
          }),
        });
        console.log('✓ UltraMsg WhatsApp alert dispatched to admin.');
      } catch (e) {
        console.error('UltraMsg dispatch error:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `نوٹیفکیشن کامیابی سے JK Developers پاکستان کے لیے تیار ہو گیا۔`,
      company: 'JK Developers Pakistan',
      notifiedEmail: SUPER_ADMIN_EMAIL,
      adminPhone: ADMIN_PHONE,
      registeredUser: userEmail,
      whatsappUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Auth notify error:', error);
    return NextResponse.json(
      { success: false, message: 'نوٹیفکیشن پراسیس میں خرابی: ' + error.message },
      { status: 500 }
    );
  }
}
