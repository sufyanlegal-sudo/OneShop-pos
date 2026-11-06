import { NextResponse } from 'next/server';
import { getAllUsers, saveAllUsers, calculateRemainingDays, UserRecord } from '@/lib/userDb';
import { MASTER_SECURITY_KEY, verifySessionToken, SUPER_ADMIN_EMAIL } from '@/lib/sessionAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, action, durationMonths, masterKey } = body;

    // Strict Authorization Verification
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
          message: '⛔ غیر مجاز رسائی مسترد! صرف جے کے ڈویلپرز سپر ایڈمن ہی صارفین کے لائسنس کا دورانیہ اور منظوری تبدیل کر سکتے ہیں۔',
        },
        { status: 403 }
      );
    }

    const identifier = (userId || email || '').trim().toLowerCase();
    if (!identifier) {
      return NextResponse.json(
        { success: false, message: 'صارف کی شناخت (User ID یا Email) درکار ہے۔' },
        { status: 400 }
      );
    }

    const users = await getAllUsers();
    const userIndex = users.findIndex(
      (u) => u.email.toLowerCase() === identifier || u.id.toLowerCase() === identifier
    );

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'صارف ریکارڈ میں نہیں ملا۔' },
        { status: 404 }
      );
    }

    const targetUser = users[userIndex];

    // Protect Super Admin from being blocked
    if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'سپر ایڈمن کو بلاک نہیں کیا جا سکتا۔' },
        { status: 400 }
      );
    }

    const cleanAction = (action || 'approve').toLowerCase();

    if (cleanAction === 'approve') {
      const months = Number(durationMonths) || 12;
      const now = new Date();
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + months);

      const updatedUser: UserRecord = {
        ...targetUser,
        status: 'active',
        approved: true,
        approvedAt: now.toISOString(),
        durationMonths: months,
        expiry_date: expiry.toISOString(),
      };

      users[userIndex] = updatedUser;
      await saveAllUsers(users);

      return NextResponse.json({
        success: true,
        message: `اکاؤنٹ ${months} ماہ کے لیے کامیابی سے منظور و فعال ہو گیا۔`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          shopName: updatedUser.shopName,
          phone: updatedUser.phone,
          status: updatedUser.status,
          approved: updatedUser.approved,
          durationMonths: updatedUser.durationMonths,
          expiry_date: updatedUser.expiry_date,
          remainingDays: calculateRemainingDays(updatedUser.expiry_date),
        },
      });
    } else if (cleanAction === 'block') {
      const updatedUser: UserRecord = {
        ...targetUser,
        status: 'blocked',
        approved: false,
      };

      users[userIndex] = updatedUser;
      await saveAllUsers(users);

      return NextResponse.json({
        success: true,
        message: 'صارف کو کامیابی سے بلاک کر دیا گیا ہے۔',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          status: updatedUser.status,
          approved: updatedUser.approved,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: `نامعلوم ایکشن: ${action}۔ صرف 'approve' یا 'block' قابلِ قبول ہیں۔` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Approve user route error:', error);
    return NextResponse.json(
      { success: false, message: 'سرور میں خرابی: ' + error.message },
      { status: 500 }
    );
  }
}
