// utils/authMiddleware.ts
export interface UserProfile {
  email: string;
  whatsapp: string;
  status: 'pending' | 'approved' | 'blocked';
  createdAt: string;
}

// سپر ایڈمن کی تصدیق اور سٹیٹس چیک کرنے کا فنکشن
export function checkUserAccess(userEmail: string, userStatus: string): { allowed: boolean; message: string } {
  const SUPER_ADMIN_EMAIL = "jkdevelopers.pk@gmail.com";

  if (userEmail.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { allowed: true, message: "Welcome Super Admin (خوش آمدید سپر ایڈمن)" };
  }

  if (userStatus === 'approved') {
    return { allowed: true, message: "Access granted (رسائی منظور شدہ)" };
  } else if (userStatus === 'pending') {
    return {
      allowed: false,
      message: "آپ کی درخواست سپر ایڈمن (jkdevelopers.pk@gmail.com) کی منظوری کے لیے منتظر ہے۔"
    };
  } else {
    return {
      allowed: false,
      message: "آپ کا اکاؤنٹ بلاک کر دیا گیا ہے۔ ایڈمن (03008998381) سے رابطہ کریں۔"
    };
  }
}
