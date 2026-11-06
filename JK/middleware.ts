import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token =
      request.cookies.get('pos_session')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('auth', 'required');
      return NextResponse.redirect(loginUrl);
    }

    // Inspect token payload safely
    try {
      const decodedStr = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
      const tokenObj = JSON.parse(decodedStr);
      if (!tokenObj.p || !tokenObj.s) {
        const loginUrl = new URL('/', request.url);
        loginUrl.searchParams.set('auth', 'invalid');
        return NextResponse.redirect(loginUrl);
      }
      const payloadStr = atob(tokenObj.p.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadStr);

      if (Date.now() > payload.expiresAt || !payload.approved) {
        const loginUrl = new URL('/', request.url);
        loginUrl.searchParams.set('auth', 'expired_or_unapproved');
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('auth', 'invalid');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protected Admin API routes
  if (pathname.startsWith('/api/admin')) {
    const adminKey = request.headers.get('x-super-admin-key');
    const token =
      request.cookies.get('pos_session')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    // Allow if x-super-admin-key or bearer token provided (detailed signature check happens inside route handler)
    if (!adminKey && !token) {
      return NextResponse.json(
        {
          success: false,
          message: '⛔ غیر مجاز رسائی مسترد! صرف سپر ایڈمن ہی اس API کو استعمال کر سکتے ہیں۔',
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
