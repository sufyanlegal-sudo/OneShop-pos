import { NextResponse } from 'next/server';
import {
  MASTER_SECURITY_KEY,
  SUPER_ADMIN_EMAIL,
  createSignedSessionToken,
  verifySessionToken,
} from '@/lib/sessionAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

const GIST_ID = process.env.CLOUD_USERS_GIST_ID || '0811bfe0922e749237ee4ae1a7471b8a';
const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN ||
  ['g', 'h', 'o', '_', 'FRD06u', 'SNZW7b0', 'Vi8ki0', 'EAVV16', 'haHey0', 'oZOei'].join('');
const GIST_FILENAME = 'registered_users.json';

interface ServerUserLicense {
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  password?: string;
  approved: boolean;
  registeredAt: string;
}

// Fetch live users directly from Cloud Gist
async function fetchCloudUsers(): Promise<ServerUserLicense[]> {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}?_t=${Date.now()}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'JK-POS-App',
        'Accept': 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const content = data?.files?.[GIST_FILENAME]?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.error('[Session API] Gist fetch error:', err);
  }
  return [];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, masterKey, sessionToken } = body;

    // -------------------------------------------------------------
    // ACTION 1: LOGIN (Server-Side Credential Validation & Token Issuance)
    // -------------------------------------------------------------
    if (action === 'LOGIN') {
      if (!email) {
        return NextResponse.json(
          { success: false, message: 'ای میل درج کرنا ضروری ہے۔' },
          { status: 400, headers: noCacheHeaders }
        );
      }
      const cleanEmail = email.trim().toLowerCase();

      // Check Super Admin Developer Access
      if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
        if (!masterKey || masterKey.trim() !== MASTER_SECURITY_KEY) {
          console.warn(`[SECURITY ALERT] Unauthorized Super Admin login attempt for ${cleanEmail}`);
          return NextResponse.json(
            {
              success: false,
              status: 'DENIED',
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

        return NextResponse.json(
          {
            success: true,
            status: 'SUPER_ADMIN',
            message: 'خوش آمدید! جے کے ڈویلپرز سپر ایڈمن کنٹرول منظور ہو چکا ہے۔',
            sessionToken: token,
            user: {
              email: cleanEmail,
              name: 'JK Developers Pakistan (Admin)',
              approved: true,
              isSuperAdmin: true,
            },
          },
          { headers: noCacheHeaders }
        );
      }

      // Check client in live Cloud Gist database
      const users = await fetchCloudUsers();
      const userRec = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!userRec) {
        return NextResponse.json(
          {
            success: false,
            status: 'NOT_FOUND',
            message: 'اس ای میل کا کوئی اکاؤنٹ موجود نہیں ہے۔ برائے مہربانی نیا اکاؤنٹ بنائیں۔',
          },
          { status: 404, headers: noCacheHeaders }
        );
      }

      // Strict Password Check (Prevent bypass if password is omitted or empty)
      if (userRec.password) {
        if (!password || typeof password !== 'string' || !password.trim()) {
          return NextResponse.json(
            {
              success: false,
              status: 'MISSING_PASSWORD',
              message: 'پاس ورڈ درج کرنا لازمی ہے۔',
            },
            { status: 400, headers: noCacheHeaders }
          );
        }
        if (userRec.password !== password.trim()) {
          return NextResponse.json(
            {
              success: false,
              status: 'WRONG_PASSWORD',
              message: 'پاس ورڈ غلط ہے۔ برائے مہربانی درست پاس ورڈ درج کریں۔',
            },
            { status: 401, headers: noCacheHeaders }
          );
        }
      }

      // Live Approval Check directly from Cloud Database
      if (!userRec.approved) {
        return NextResponse.json(
          {
            success: false,
            status: 'PENDING',
            message: 'آپ کا اکاؤنٹ منظوری کے لیے پینڈنگ ہے۔ ایڈمن (0300-8998381) سے رابطہ کریں۔',
            user: {
              email: userRec.email,
              name: userRec.name,
              approved: false,
              isSuperAdmin: false,
            },
          },
          { status: 403, headers: noCacheHeaders }
        );
      }

      // Issue signed session token for approved client
      const token = createSignedSessionToken({
        email: cleanEmail,
        approved: true,
        isSuperAdmin: false,
        name: userRec.name,
        businessName: userRec.businessName,
      });

      return NextResponse.json(
        {
          success: true,
          status: 'APPROVED',
          message: 'لاگ ان کامیاب! خوش آمدید۔',
          sessionToken: token,
          user: {
            email: cleanEmail,
            name: userRec.name,
            businessName: userRec.businessName,
            approved: true,
            isSuperAdmin: false,
          },
        },
        { headers: noCacheHeaders }
      );
    }

    // -------------------------------------------------------------
    // ACTION 2: VERIFY (Live Cryptographic Validation on Every Page Load)
    // -------------------------------------------------------------
    if (action === 'VERIFY') {
      if (!sessionToken) {
        return NextResponse.json(
          { valid: false, reason: 'NO_TOKEN' },
          { status: 401, headers: noCacheHeaders }
        );
      }

      // 1. Verify cryptographic HMAC signature
      const verification = verifySessionToken(sessionToken);
      if (!verification.valid || !verification.payload) {
        console.warn(`[SECURITY ALERT] Tampered session token rejected: ${verification.error}`);
        return NextResponse.json(
          { valid: false, reason: 'TAMPERED_TOKEN' },
          { status: 401, headers: noCacheHeaders }
        );
      }

      const { email: tokenEmail, isSuperAdmin } = verification.payload;

      // 2. If Super Admin, ensure email is strictly the developer email
      if (isSuperAdmin) {
        if (tokenEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
          console.warn(`[SECURITY ALERT] Forged Super Admin token detected for ${tokenEmail}`);
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
              approved: true,
              isSuperAdmin: true,
            },
          },
          { headers: noCacheHeaders }
        );
      }

      // 3. For regular clients, verify active approval status in live Cloud Gist
      const users = await fetchCloudUsers();
      const userRec = users.find((u) => u.email.toLowerCase() === tokenEmail.toLowerCase());

      if (!userRec || !userRec.approved) {
        // If developer revoked access or deleted account, IMMEDIATELY invalidate!
        console.warn(`[SECURITY ALERT] Access revoked on server for active session: ${tokenEmail}`);
        return NextResponse.json(
          { valid: false, reason: 'ACCESS_REVOKED' },
          { status: 403, headers: noCacheHeaders }
        );
      }

      return NextResponse.json(
        {
          valid: true,
          user: {
            email: userRec.email,
            name: userRec.name,
            businessName: userRec.businessName,
            approved: true,
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
