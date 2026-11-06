import crypto from 'crypto';

export const MASTER_SECURITY_KEY = process.env.MASTER_SECURITY_KEY || 'JK@8998381';
export const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';

// Generate cryptographic HMAC-SHA256 signature
export function generateSignature(payloadStr: string): string {
  return crypto.createHmac('sha256', MASTER_SECURITY_KEY).update(payloadStr).digest('hex');
}

// Sign a session token
export function createSignedSessionToken(data: {
  email: string;
  approved: boolean;
  isSuperAdmin: boolean;
  name?: string;
  businessName?: string;
}): string {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 Days
  const payload = {
    email: data.email.toLowerCase(),
    approved: data.approved,
    isSuperAdmin: data.isSuperAdmin,
    name: data.name || data.email.split('@')[0],
    businessName: data.businessName || '',
    issuedAt: Date.now(),
    expiresAt,
  };
  const payloadStr = JSON.stringify(payload);
  const signature = generateSignature(payloadStr);
  const tokenObj = {
    p: Buffer.from(payloadStr).toString('base64url'),
    s: signature,
  };
  return Buffer.from(JSON.stringify(tokenObj)).toString('base64url');
}

// Verify a session token cryptographically with timing-safe comparison
export function verifySessionToken(token: string): {
  valid: boolean;
  payload?: {
    email: string;
    approved: boolean;
    isSuperAdmin: boolean;
    name: string;
    businessName: string;
    expiresAt: number;
  };
  error?: string;
} {
  try {
    const decodedStr = Buffer.from(token, 'base64url').toString('utf8');
    const tokenObj = JSON.parse(decodedStr);
    if (!tokenObj.p || !tokenObj.s) {
      return { valid: false, error: 'MALFORMED_TOKEN' };
    }
    const payloadStr = Buffer.from(tokenObj.p, 'base64url').toString('utf8');
    const expectedSig = generateSignature(payloadStr);

    // Constant-time comparison to prevent timing attacks
    const sigA = Buffer.from(tokenObj.s, 'utf8');
    const sigB = Buffer.from(expectedSig, 'utf8');
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return { valid: false, error: 'SIGNATURE_MISMATCH' };
    }

    const payload = JSON.parse(payloadStr);
    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'TOKEN_EXPIRED' };
    }

    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}
