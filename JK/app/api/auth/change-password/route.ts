import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAllUsers, saveAllUsers, findUser, verifyUserPassword } from '@/lib/userDb';
import { MASTER_SECURITY_KEY, SUPER_ADMIN_EMAIL, verifySessionToken } from '@/lib/sessionAuth';

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
    const { email, currentPassword, newPassword, masterKey } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'ای میل درج کرنا ضروری ہے۔' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return NextResponse.json(
        { success: false, message: 'نیا پاس ورڈ کم از کم 4 حروف پر مشتمل ہونا چاہیے۔' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await findUser(cleanEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'صارف کا اکاؤنٹ موجود نہیں ہے۔' },
        { status: 404, headers: noCacheHeaders }
      );
    }

    // Check if Super Admin is resetting the password directly
    const authHeader = req.headers.get('authorization') || '';
    const adminKeyHeader = req.headers.get('x-super-admin-key') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    let isAuthorizedSuperAdmin = false;
    if (masterKey && masterKey.trim() === MASTER_SECURITY_KEY) {
      isAuthorizedSuperAdmin = true;
    } else if (adminKeyHeader && adminKeyHeader.trim() === MASTER_SECURITY_KEY) {
      isAuthorizedSuperAdmin = true;
    } else if (token) {
      const verifyRes = verifySessionToken(token);
      if (verifyRes.valid && verifyRes.payload?.isSuperAdmin) {
        isAuthorizedSuperAdmin = true;
      }
    }

    // If not super admin, verify the current password
    if (!isAuthorizedSuperAdmin) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: 'موجودہ (پرانا) پاس ورڈ درج کرنا لازمی ہے۔' },
          { status: 400, headers: noCacheHeaders }
        );
      }

      // If user had an existing password, verify it
      if (user.password) {
        const isMatch = await verifyUserPassword(user, currentPassword.trim());
        if (!isMatch) {
          return NextResponse.json(
            { success: false, message: 'موجودہ (پرانا) پاس ورڈ غلط ہے۔ برائے مہربانی درست پاس ورڈ درج کریں۔' },
            { status: 401, headers: noCacheHeaders }
          );
        }
      }
    }

    // Hash the new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

    // Update in Database & Cloud Gist
    const allUsers = await getAllUsers();
    const userIndex = allUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);

    if (userIndex >= 0) {
      allUsers[userIndex].password = hashedPassword;
      await saveAllUsers(allUsers);
    } else {
      user.password = hashedPassword;
      allUsers.push(user);
      await saveAllUsers(allUsers);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'پاس ورڈ کامیابی کے ساتھ تبدیل کر دیا گیا ہے!',
      },
      { headers: noCacheHeaders }
    );
  } catch (error: any) {
    console.error('[ChangePassword] Error:', error);
    return NextResponse.json(
      { success: false, message: 'سرور پر مسئلہ آگیا: ' + error.message },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
