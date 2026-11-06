import { NextResponse } from 'next/server';
import {
  MASTER_SECURITY_KEY,
  SUPER_ADMIN_EMAIL,
  verifySessionToken,
} from '@/lib/sessionAuth';
import {
  getAllUsers,
  saveAllUsers,
  calculateRemainingDays,
  UserRecord,
} from '@/lib/userDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// GET: Return all users for Super Admin panel or single user status poll
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkEmail = searchParams.get('email');

    const users = await getAllUsers();

    if (checkEmail) {
      const cleanEmail = checkEmail.trim().toLowerCase();
      const user = users.find((u) => u.email === cleanEmail);
      if (!user) {
        return NextResponse.json({ success: false, found: false }, { headers: noCacheHeaders });
      }

      return NextResponse.json(
        {
          success: true,
          found: true,
          status: user.status,
          approved: user.status === 'active',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            shopName: user.shopName || user.businessName,
            phone: user.phone,
            status: user.status,
            role: user.role,
            approved: user.status === 'active',
            registeredAt: user.registeredAt,
            approvedAt: user.approvedAt,
            durationMonths: user.durationMonths,
            expiry_date: user.expiry_date,
            remainingDays: calculateRemainingDays(user.expiry_date),
          },
        },
        { headers: noCacheHeaders }
      );
    }

    // Strict Authorization check for full user directory
    const authHeader = req.headers.get('authorization') || '';
    const adminKeyHeader = req.headers.get('x-super-admin-key') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    let isAuthorizedAdmin = false;
    if (adminKeyHeader && adminKeyHeader.trim() === MASTER_SECURITY_KEY) {
      isAuthorizedAdmin = true;
    } else if (token) {
      const verifyRes = verifySessionToken(token);
      if (verifyRes.valid && verifyRes.payload?.isSuperAdmin) {
        isAuthorizedAdmin = true;
      }
    }

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: '⛔ غیر مجاز رسائی مسترد! صارفین کی مکمل فہرست دیکھنے کی اجازت صرف تصدیق شدہ سپر ایڈمن کو ہے۔',
        },
        { status: 403, headers: noCacheHeaders }
      );
    }

    const sanitizedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      ownerName: u.ownerName || u.name,
      shopName: u.shopName || u.businessName || '',
      businessName: u.businessName || u.shopName || '',
      phone: u.phone || '',
      status: u.status,
      role: u.role,
      approved: u.status === 'active',
      registeredAt: u.registeredAt,
      approvedAt: u.approvedAt,
      durationMonths: u.durationMonths,
      expiry_date: u.expiry_date,
      remainingDays: calculateRemainingDays(u.expiry_date),
    }));

    return NextResponse.json(
      {
        success: true,
        users: sanitizedUsers,
        total: sanitizedUsers.length,
        timestamp: new Date().toISOString(),
      },
      { headers: noCacheHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

// POST: Manage users (REGISTER, TOGGLE_APPROVAL, DELETE_USER)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, name, businessName, phone, password, masterKey } = body;

    // Strict Authorization for Admin actions
    if (action === 'TOGGLE_APPROVAL' || action === 'DELETE_USER') {
      const authHeader = req.headers.get('authorization') || '';
      const adminKeyHeader = req.headers.get('x-super-admin-key') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

      let isAuthorized = false;
      if (masterKey && masterKey.trim() === MASTER_SECURITY_KEY) {
        isAuthorized = true;
      } else if (adminKeyHeader && adminKeyHeader.trim() === MASTER_SECURITY_KEY) {
        isAuthorized = true;
      } else if (token) {
        const verifyRes = verifySessionToken(token);
        if (verifyRes.valid && verifyRes.payload?.isSuperAdmin) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          {
            success: false,
            message: '⛔ غیر مجاز رسائی مسترد! صرف سپر ایڈمن ہی یہ کارروائی کر سکتے ہیں۔',
          },
          { status: 403, headers: noCacheHeaders }
        );
      }
    }

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400, headers: noCacheHeaders });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await getAllUsers();

    if (action === 'TOGGLE_APPROVAL') {
      const targetUser = users.find((u) => u.email === cleanEmail);
      if (!targetUser) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404, headers: noCacheHeaders });
      }

      const isNowActive = targetUser.status !== 'active';
      const updatedStatus = isNowActive ? 'active' : 'blocked';
      const now = new Date();
      const expiry = new Date(now);
      expiry.setFullYear(expiry.getFullYear() + 1);

      const updatedUsers = users.map((u) =>
        u.email === cleanEmail
          ? {
              ...u,
              status: updatedStatus as UserRecord['status'],
              approved: isNowActive,
              approvedAt: isNowActive ? now.toISOString() : undefined,
              expiry_date: isNowActive ? (u.expiry_date || expiry.toISOString()) : u.expiry_date,
              durationMonths: isNowActive ? (u.durationMonths || 12) : u.durationMonths,
            }
          : u
      );

      await saveAllUsers(updatedUsers);

      return NextResponse.json({
        success: true,
        approved: isNowActive,
        status: updatedStatus,
        email: cleanEmail,
      }, { headers: noCacheHeaders });
    }

    if (action === 'DELETE_USER') {
      if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
        return NextResponse.json({ success: false, message: 'Super admin cannot be deleted' }, { status: 400, headers: noCacheHeaders });
      }
      const updatedUsers = users.filter((u) => u.email !== cleanEmail);
      await saveAllUsers(updatedUsers);
      return NextResponse.json({ success: true, deleted: true }, { headers: noCacheHeaders });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400, headers: noCacheHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
