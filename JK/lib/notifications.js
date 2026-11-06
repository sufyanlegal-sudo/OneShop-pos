import { Resend } from 'resend';

// Initialize Resend safely with API key check
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey && resendApiKey !== 'your_resend_api_key'
  ? new Resend(resendApiKey)
  : {
      emails: {
        send: async (payload) => {
          console.warn('[Notifications] RESEND_API_KEY is not configured. Email payload logged:', payload);
          return { data: null, error: 'RESEND_API_KEY_NOT_CONFIGURED' };
        },
      },
    };

export async function sendAdminEmail({ subject, htmlContent }) {
  try {
    const fromAddress = process.env.SYSTEM_SENDER_EMAIL || 'onboarding@resend.dev';
    const toAddress = process.env.ADMIN_EMAIL || 'jkdevelopers.pk@gmail.com';
    return await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Email error:', error);
    return { error: error.message };
  }
}

export async function sendAdminWhatsApp(messageText) {
  try {
    const instanceId = process.env.WHATSAPP_INSTANCE_ID;
    const token = process.env.WHATSAPP_TOKEN;
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || '923008998381';

    if (!instanceId || !token || instanceId === 'your_ultramsg_instance_id' || token === 'your_ultramsg_token') {
      console.warn('[Notifications] UltraMsg WhatsApp credentials not configured. Message:', messageText);
      return { success: false, reason: 'WHATSAPP_CREDENTIALS_NOT_CONFIGURED' };
    }

    const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: token,
        to: adminNumber,
        body: messageText,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('WhatsApp error:', error);
    return { error: error.message };
  }
}

/**
 * 1. Alert Super Admin on New User Registration
 */
export async function notifyAdminNewRegistration({ shopName, ownerName, email, phone }) {
  const timestamp = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
  const waText = `🔔 *نیا صارف رجسٹر ہوا ہے (منظوری درکار)*
━━━━━━━━━━━━━━━━━━
👤 *مالک:* ${ownerName || 'نامعلوم'}
🏪 *دکان/ادارہ:* ${shopName || 'نامعلوم'}
📧 *ای میل:* ${email}
📱 *فون:* ${phone || 'درج نہیں'}
⏰ *وقت:* ${timestamp}
📌 *اسٹیٹس:* زیرِ جائزہ (Pending)
━━━━━━━━━━━━━━━━━━
براہ کرم سپر ایڈمن ڈیش بورڈ سے مدت منتخب کر کے منظوری (Approve) فرمائیں۔`;

  const htmlContent = `
    <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: #0f172a; color: #ffffff; padding: 20px 24px; text-align: right;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">⚡ نیا صارف رجسٹر ہوا ہے (منظوری کی درخواست)</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">OneShop POS - جے کے ڈویلپرز پاکستان</p>
        </div>
        <div style="padding: 24px; line-height: 1.8;">
          <p style="font-size: 15px; margin-bottom: 16px;">محترم سپر ایڈمن! سسٹم میں ایک نیا صارف رجسٹر ہوا ہے جس کا اکاؤنٹ اس وقت <strong>زیرِ جائزہ (Pending)</strong> ہے۔</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; width: 35%; color: #475569;">دکان / کاروبار:</td>
              <td style="padding: 10px; color: #0f172a; font-weight: bold;">${shopName || '-'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #475569;">مالک کا نام:</td>
              <td style="padding: 10px; color: #0f172a;">${ownerName || '-'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #475569;">ای میل:</td>
              <td style="padding: 10px; color: #2563eb; font-family: monospace;">${email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #475569;">فون / واٹس ایپ:</td>
              <td style="padding: 10px; color: #0f172a;" dir="ltr">${phone || '-'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #475569;">اسٹیٹس:</td>
              <td style="padding: 10px;"><span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px;">منظوری کا منتظر (Pending)</span></td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #475569;">تاریخ و وقت:</td>
              <td style="padding: 10px; color: #64748b;">${timestamp}</td>
            </tr>
          </table>
          <p style="font-size: 13px; color: #64748b; margin-top: 16px;">
            سپر ایڈمن کنٹرول پینل سے صارف کا دورانیہ (1 ماہ، 3 ماہ، 6 ماہ، 1، 3، یا 5 سال) منتخب کر کے منظوری فرمائیں۔
          </p>
        </div>
      </div>
    </div>
  `;

  await Promise.allSettled([
    sendAdminWhatsApp(waText),
    sendAdminEmail({
      subject: `[نیا رجسٹریشن] ${shopName || ownerName || email} - منظوری درکار`,
      htmlContent,
    }),
  ]);
}

/**
 * 2. Alert Super Admin on Subscription Expiry
 */
export async function notifyAdminSubscriptionExpiry({ email, ownerName, shopName, expiryDate, remainingDays, status = 'expired' }) {
  const isExpiringSoon = remainingDays > 0;
  const waText = isExpiringSoon
    ? `⚠️ *سبسکرپشن ایکسپائری وارننگ (${remainingDays} دن باقی)*
━━━━━━━━━━━━━━━━━━
🏪 *ادارہ:* ${shopName || 'نامعلوم'}
👤 *صارف:* ${ownerName || email}
📧 *ای میل:* ${email}
📅 *ایکسپائری تاریخ:* ${new Date(expiryDate).toLocaleDateString('en-GB')}
⏳ *باقی دن:* ${remainingDays}
━━━━━━━━━━━━━━━━━━
صارف سے تجدید کے لیے فوری رابطہ کریں۔`
    : `🚫 *سبسکرپشن ختم ہو گئی ہے (Expired)*
━━━━━━━━━━━━━━━━━━
🏪 *ادارہ:* ${shopName || 'نامعلوم'}
👤 *صارف:* ${ownerName || email}
📧 *ای میل:* ${email}
📅 *ختم ہونے کی تاریخ:* ${new Date(expiryDate).toLocaleDateString('en-GB')}
🔒 *اسٹیٹس:* ایکسپائرڈ (لاگ ان بلاک کر دیا گیا ہے)
━━━━━━━━━━━━━━━━━━
تجدید کے بعد سپر ایڈمن پینل سے دوبارہ فعال کریں۔`;

  const htmlContent = `
    <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: ${isExpiringSoon ? '#d97706' : '#be123c'}; color: #ffffff; padding: 20px 24px; text-align: right;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold;">
            ${isExpiringSoon ? '⚠️ سبسکرپشن جلد ختم ہونے والی ہے' : '🚫 سبسکرپشن ختم ہو گئی ہے (Account Expired)'}
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #fecdd3;">OneShop POS - سبسکرپشن منیجر</p>
        </div>
        <div style="padding: 24px; line-height: 1.8;">
          <p style="font-size: 14px; margin-bottom: 16px;">
            صارف <strong>${ownerName || email}</strong> (${shopName || 'اسٹور'}) کا پلان ${isExpiringSoon ? `${remainingDays} دنوں میں ایکسپائر ہونے والا ہے` : 'ایکسپائر ہو چکا ہے اور رسائی بلاک کر دی گئی ہے'}۔
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; width: 35%; color: #475569;">ای میل:</td>
              <td style="padding: 10px; color: #2563eb; font-family: monospace;">${email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #475569;">ایکسپائری تاریخ:</td>
              <td style="padding: 10px; color: #0f172a;">${new Date(expiryDate).toLocaleDateString('en-GB')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #475569;">باقی دن:</td>
              <td style="padding: 10px; color: ${isExpiringSoon ? '#d97706' : '#be123c'}; font-weight: bold;">${remainingDays} دن</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #475569;">اسٹیٹس:</td>
              <td style="padding: 10px;"><span style="background: ${isExpiringSoon ? '#fef3c7' : '#ffe4e6'}; color: ${isExpiringSoon ? '#92400e' : '#9f1239'}; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px;">${status.toUpperCase()}</span></td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `;

  await Promise.allSettled([
    sendAdminWhatsApp(waText),
    sendAdminEmail({
      subject: `[سبسکرپشن الرٹ] ${shopName || email} - ${isExpiringSoon ? `ایکسپائری میں ${remainingDays} دن باقی` : 'ایکسپائرڈ'}`,
      htmlContent,
    }),
  ]);
}

/**
 * 3. Alert Super Admin on New Support Ticket Submitted
 */
export async function notifyAdminSupportTicket({ ticketId, userName, userPhone, subject, message }) {
  const timestamp = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
  const waText = `🎫 *نیا کسٹمر سپورٹ ٹکٹ درج ہوا ہے*
━━━━━━━━━━━━━━━━━━
🆔 *ٹکٹ نمبر:* ${ticketId}
👤 *صارف کا نام:* ${userName || 'نامعلوم'}
📱 *فون:* ${userPhone || 'درج نہیں'}
📑 *عنوان:* ${subject || 'کوئی عنوان نہیں'}
💬 *پیغام:*
${message}
⏰ *وقت:* ${timestamp}
━━━━━━━━━━━━━━━━━━
فوری رابطہ کے لیے صارف کے نمبر پر واٹس ایپ کریں۔`;

  const htmlContent = `
    <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: #0284c7; color: #ffffff; padding: 20px 24px; text-align: right;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold;">🎫 نیا کسٹمر سپورٹ ٹکٹ #${ticketId}</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #bae6fd;">OneShop POS کسٹمر ہیلپ ڈیسک</p>
        </div>
        <div style="padding: 24px; line-height: 1.8;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; width: 30%; color: #475569;">ٹکٹ نمبر:</td>
              <td style="padding: 10px; color: #0284c7; font-weight: bold; font-family: monospace;">${ticketId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #475569;">صارف کا نام:</td>
              <td style="padding: 10px; color: #0f172a; font-weight: bold;">${userName || '-'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #475569;">فون / واٹس ایپ:</td>
              <td style="padding: 10px; color: #0f172a;" dir="ltr">${userPhone || '-'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #475569;">عنوان:</td>
              <td style="padding: 10px; color: #0f172a;">${subject || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #475569; vertical-align: top;">پیغام:</td>
              <td style="padding: 10px; color: #334155; background: #f1f5f9; border-radius: 8px;">${message || '-'}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `;

  await Promise.allSettled([
    sendAdminWhatsApp(waText),
    sendAdminEmail({
      subject: `[سپورٹ ٹکٹ ${ticketId}] ${subject || userName}`,
      htmlContent,
    }),
  ]);
}
