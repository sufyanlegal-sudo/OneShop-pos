import { NextResponse } from 'next/server';
import {
  MASTER_SECURITY_KEY,
  SUPER_ADMIN_EMAIL,
  createSignedSessionToken,
  verifySessionToken,
} from '@/lib/sessionAuth';
import {
  getAllUsers,
  findUser,
  verifyUserPassword,
  calculateRemainingDays,
  saveAllUsers,
} from '@/lib/userDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, masterKey, sessionToken } = body;

    // -------------------------------------------------------------
    // ACTION 1: LOGIN
    // -------------------------------------------------------------
    if (action === 'LOGIN') {
      if (!email) {
        return NextResponse.json(
          { success: false, message: 'ای میل درج کرنا ضروری ہے۔' },
          { status: 400, headers: noCacheHeaders }
        );
      }
      const cleanEmail = email.trim().toLowerCase();

      // Super Admin Login
      if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
        if (!masterKey || masterKey.trim() !== MASTER_SECURITY_KEY) {
          return NextResponse.json(
            {
              success: false,
              status: 'blocked',
              message: '⛔ غیر مجاز رسائی مسترد! ڈویلپر سیکیورٹی کی غلط ہے۔',
            },
            { status: 403, headers: noCacheHeaders }
          );
        }

        const token = createSignedSessionToken({
          email: cleanEmail,
          approved: true,
          isSuperAdmin: true,
          name: 'JK Developers Pakistan (Admin)',
          businessName: 'JK Developers Pakistan',
        });

        const response = NextResponse.json(
          {
            success: true,
            status: 'active',
            role: 'super_admin',
            message: 'خوش آمدید! جے کے ڈویلپرز سپر ایڈمن کنٹرول منظور ہو چکا ہے۔',
            sessionToken: token,
            user: {
              email: cleanEmail,
              name: 'JK Developers Pakistan (Admin)',
              status: 'active',
              role: 'super_admin',
              approved: true,
              isSuperAdmin: true,
            },
          },
          { headers: noCacheHeaders }
        );

        response.cookies.set('pos_session', token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
        });

        return response;
      }

      // Check client in live Database
      const userRec = await findUser(cleanEmail);

      if (!userRec) {
        return NextResponse.json(
          {
            success: false,
            status: 'not_found',
            message: 'اس ای میل کا کوئی اکاؤنٹ موجود نہیں ہے۔ برائے مہربانی نیا اکاؤنٹ بنائیں۔',
          },
          { status: 404, headers: noCacheHeaders }
        );
      }

      // Password Verification
      if (userRec.password) {
        if (!password || !password.trim()) {
          return NextResponse.json(
            {
              success: false,
              status: 'missing_password',
              message: 'پاس ورڈ درج کرنا لازمی ہے۔',
            },
            { status: 400, headers: noCacheHeaders }
          );
        }

        const isMatch = await verifyUserPassword(userRec, password.trim());
        if (!isMatch) {
          return NextResponse.json(
            {
              success: false,
              status: 'wrong_password',
              message: 'پاس ورڈ غلط ہے۔ برائے مہربانی درست پاس ورڈ درج کریں۔',
            },
            { status: 401, headers: noCacheHeaders }
          );
        }
      }

      // Live Expiry Check
      if (userRec.expiry_date && new Date(userRec.expiry_date).getTime() <= Date.now()) {
        userRec.status = 'expired';
        userRec.approved = false;
        const all = await getAllUsers();
        const idx = all.findIndex((u) => u.email === cleanEmail);
        if (idx >= 0) {
          all[idx] = userRec;
          await saveAllUsers(all);
        }
      }

      // Strict Access Blocking: 'pending', 'blocked', 'expired'
      if (userRec.status === 'pending') {
        return NextResponse.json(
          {
            success: false,
            status: 'pending',
            message: 'آپ کا اکاؤنٹ زیرِ جائزہ (Pending) ہے۔ سپر ایڈمن کی منظوری کے بعد فعال ہو گا۔',
            user: {
              email: userRec.email,
              name: userRec.name,
              status: 'pending',
              approved: false,
            },
          },
          { status: 403, headers: noCacheHeaders }
        );
      }

      if (userRec.status === 'blocked') {
        return NextResponse.json(
          {
            success: false,
            status: 'blocked',
            message: 'آپ کا اکاؤنٹ بلاک کر دیا گیا ہے۔ برائے بحالی ہیلپ لائن (0300-8998381) سے رابطہ کریں۔',
            user: {
              email: userRec.email,
              name: userRec.name,
              status: 'blocked',
              approved: false,
            },
          },
          { status: 403, headers: noCacheHeaders }
        );
      }

      if (userRec.status === 'expired') {
        return NextResponse.json(
          {
            success: false,
            status: 'expired',
            message: 'آپ کی سبسکرپشن کی مدت ختم (Expired) ہو چکی ہے۔ تجدید کے لیے ایڈمن سے رابطہ فرمائیں۔',
            user: {
              email: userRec.email,
              name: userRec.name,
              status: 'expired',
              expiry_date: userRec.expiry_date,
              approved: false,
            },
          },
          { status: 403, headers: noCacheHeaders }
        );
      }

      if (userRec.status !== 'active') {
        return NextResponse.json(
          {
            success: false,
            status: userRec.status,
            message: 'اکاؤنٹ اس وقت فعال نہیں ہے۔ ایڈمن سے رابطہ کریں۔',
          },
          { status: 403, headers: noCacheHeaders }
        );
      }

      // Approved & Active: Issue signed session token
      const token = createSignedSessionToken({
        email: cleanEmail,
        approved: true,
        isSuperAdmin: false,
        name: userRec.name,
        businessName: userRec.businessName || userRec.shopName,
      });

      const response = NextResponse.json(
        {
          success: true,
          status: 'active',
          message: 'لاگ ان کامیاب! خوش آمدید۔',
          sessionToken: token,
          user: {
            id: userRec.id,
            email: cleanEmail,
            name: userRec.name,
            shopName: userRec.shopName || userRec.businessName,
            status: 'active',
            role: userRec.role || 'client',
            approved: true,
            expiry_date: userRec.expiry_date,
            remainingDays: calculateRemainingDays(userRec.expiry_date),
            isSuperAdmin: false,
          },
        },
        { headers: noCacheHeaders }
      );

      response.cookies.set('pos_session', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // -------------------------------------------------------------
    // ACTION 2: VERIFY
    // -------------------------------------------------------------
    if (action === 'VERIFY') {
      if (!sessionToken) {
        return NextResponse.json(
          { valid: false, reason: 'NO_TOKEN' },
          { status: 401, headers: noCacheHeaders }
        );
      }

      const verification = verifySessionToken(sessionToken);
      if (!verification.valid || !verification.payload) {
        return NextResponse.json(
          { valid: false, reason: 'TAMPERED_TOKEN' },
          { status: 401, headers: noCacheHeaders }
        );
      }

      const { email: tokenEmail, isSuperAdmin } = verification.payload;

      if (isSuperAdmin) {
        if (tokenEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
          return NextResponse.json(
            { valid: false, reason: 'HIJACK_ATTEMPT' },
            { status: 403, headers: noCacheHeaders }
          );
        }
        return NextResponse.json(
          {
            valid: true,
            user: {
              email: tokenEmail,
              name: 'JK Developers Pakistan (Admin)',
              status: 'active',
              role: 'super_admin',
              approved: true,
              isSuperAdmin: true,
            },
          },
          { headers: noCacheHeaders }
        );
      }

      // Check live status for regular client
      const userRec = await findUser(tokenEmail);

      if (!userRec) {
        return NextResponse.json(
          { valid: false, reason: 'USER_DELETED' },
          { status: 403, headers: noCacheHeaders }
        );
      }

      // Check if expired dynamically
      if (userRec.expiry_date && new Date(userRec.expiry_date).getTime() <= Date.now()) {
        userRec.status = 'expired';
        userRec.approved = false;
        return NextResponse.json(
          {
            valid: false,
            reason: 'SUBSCRIPTION_EXPIRED',
            status: 'expired',
            message: 'آپ کی سبسکرپشن ختم ہو چکی ہے۔',
          },
          { status: 403, headers: noCacheHeaders }
        );
      }

      if (userRec.status !== 'active') {
        return NextResponse.json(
          {
            valid: false,
            reason: 'STATUS_' + userRec.status.toUpperCase(),
            status: userRec.status,
            message: `اکاؤنٹ اسٹیٹس: ${userRec.status}`,
          },
          { status: 403, headers: noCacheHeaders }
        );
      }

      return NextResponse.json(
        {
          valid: true,
          user: {
            id: userRec.id,
            email: userRec.email,
            name: userRec.name,
            shopName: userRec.shopName || userRec.businessName,
            status: 'active',
            role: userRec.role || 'client',
            approved: true,
            expiry_date: userRec.expiry_date,
            remainingDays: calculateRemainingDays(userRec.expiry_date),
            isSuperAdmin: false,
          },
        },
        { headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400, headers: noCacheHeaders }
    );
  } catch (error: any) {
    console.error('[Session API Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
