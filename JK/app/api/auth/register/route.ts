import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAllUsers, saveAllUsers, UserRecord } from '@/lib/userDb';
import { notifyAdminNewRegistration } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopName, ownerName, email, phone, password } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'درست ای میل درج کرنا لازمی ہے۔' },
        { status: 400 }
      );
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { success: false, message: 'پاس ورڈ کم از کم 4 ہندسوں پر مشتمل ہونا چاہیے۔' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await getAllUsers();

    // Check if user already exists
    const existingIndex = users.findIndex((u) => u.email === cleanEmail);

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    let registeredUser: UserRecord;

    if (existingIndex >= 0) {
      const existing = users[existingIndex];
      // If already active, do not force back to pending unless blocked/expired
      registeredUser = {
        ...existing,
        name: ownerName?.trim() || existing.name || cleanEmail.split('@')[0],
        ownerName: ownerName?.trim() || existing.ownerName || '',
        shopName: shopName?.trim() || existing.shopName || '',
        businessName: shopName?.trim() || existing.businessName || '',
        phone: phone?.trim() || existing.phone || '',
        password: hashedPassword,
        // Retain existing status if already active, otherwise pending
        status: existing.status === 'active' ? 'active' : 'pending',
        role: existing.role || 'client',
        approved: existing.status === 'active',
      };
      users[existingIndex] = registeredUser;
    } else {
      registeredUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: cleanEmail,
        name: ownerName?.trim() || cleanEmail.split('@')[0],
        ownerName: ownerName?.trim() || '',
        shopName: shopName?.trim() || '',
        businessName: shopName?.trim() || '',
        phone: phone?.trim() || '',
        password: hashedPassword,
        status: 'pending', // Default status MUST be 'pending'
        role: 'client',
        approved: false,
        registeredAt: new Date().toISOString(),
      };
      users.push(registeredUser);
    }

    // Save updated users to database
    await saveAllUsers(users);

    // Trigger instant WhatsApp and Email notifications to Super Admin
    notifyAdminNewRegistration({
      shopName: shopName || registeredUser.shopName,
      ownerName: ownerName || registeredUser.name,
      email: cleanEmail,
      phone: phone || registeredUser.phone,
    }).catch((err) => console.error('[Register] Notification trigger error:', err));

    return NextResponse.json({
      success: true,
      status: registeredUser.status,
      message: 'اکاؤنٹ زیرِ جائزہ ہے، ایڈمن کی منظوری کے بعد فعال ہو گا۔',
      user: {
        id: registeredUser.id,
        email: registeredUser.email,
        name: registeredUser.name,
        shopName: registeredUser.shopName,
        phone: registeredUser.phone,
        status: registeredUser.status,
        role: registeredUser.role,
        registeredAt: registeredUser.registeredAt,
      },
    });
  } catch (error: any) {
    console.error('Registration route error:', error);
    return NextResponse.json(
      { success: false, message: 'سرور میں خرابی: ' + error.message },
      { status: 500 }
    );
  }
}
