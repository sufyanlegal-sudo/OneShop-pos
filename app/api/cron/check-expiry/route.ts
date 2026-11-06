import { NextResponse } from 'next/server';
import { getAllUsers, saveAllUsers, calculateRemainingDays, UserRecord } from '@/lib/userDb';
import { notifyAdminSubscriptionExpiry } from '@/lib/notifications';
import { SUPER_ADMIN_EMAIL } from '@/lib/sessionAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function runExpiryCheck() {
  const users = await getAllUsers();
  const nowTime = Date.now();
  let expiredCount = 0;
  let warnedCount = 0;
  let updatedAny = false;

  const updatedUsers: UserRecord[] = [];

  for (const user of users) {
    // Skip super admin
    if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      updatedUsers.push(user);
      continue;
    }

    if (user.status === 'active' && user.expiry_date) {
      const expiryTime = new Date(user.expiry_date).getTime();
      const remainingDays = calculateRemainingDays(user.expiry_date);

      // Check if expired
      if (expiryTime <= nowTime) {
        user.status = 'expired';
        user.approved = false;
        expiredCount++;
        updatedAny = true;

        // Trigger alert to Admin for expired account
        notifyAdminSubscriptionExpiry({
          email: user.email,
          ownerName: user.name || user.ownerName,
          shopName: user.shopName || user.businessName,
          expiryDate: user.expiry_date,
          remainingDays: 0,
          status: 'expired',
        }).catch((err) => console.error('[Cron] Expiry notification error:', err));
      } else if (remainingDays <= 5) {
        // Impending expiry alert (5 days or less)
        warnedCount++;
        notifyAdminSubscriptionExpiry({
          email: user.email,
          ownerName: user.name || user.ownerName,
          shopName: user.shopName || user.businessName,
          expiryDate: user.expiry_date,
          remainingDays,
          status: 'active',
        }).catch((err) => console.error('[Cron] Impending expiry warning error:', err));
      }
    }

    updatedUsers.push(user);
  }

  if (updatedAny) {
    await saveAllUsers(updatedUsers);
  }

  return {
    success: true,
    checkedAt: new Date().toISOString(),
    totalUsers: users.length,
    expiredCount,
    warnedCount,
    message: `چیکنگ مکمل: ${expiredCount} اکاؤنٹس ایکسپائر ہو کر بلاک ہوئے، اور ${warnedCount} وارننگ جاری کی گئیں۔`,
  };
}

export async function GET() {
  try {
    const result = await runExpiryCheck();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Check expiry cron error:', error);
    return NextResponse.json(
      { success: false, message: 'Cron error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await runExpiryCheck();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Check expiry cron error:', error);
    return NextResponse.json(
      { success: false, message: 'Cron error: ' + error.message },
      { status: 500 }
    );
  }
}
