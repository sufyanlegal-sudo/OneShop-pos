import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ServerUserLicense {
  email: string;
  name: string;
  businessName?: string;
  shopName?: string;
  phone?: string;
  password?: string;
  approved: boolean;
  registeredAt: string;
  approvedAt?: string;
}

const DEFAULT_SUPER_ADMIN: ServerUserLicense = {
  email: 'jkdevelopers.pk@gmail.com',
  name: 'JK Developers Pakistan (Admin)',
  businessName: 'JK Developers Pakistan',
  phone: '0300-8998381',
  password: 'JK@8998381',
  approved: true,
  registeredAt: '2026-01-01T00:00:00.000Z',
};

// Global in-memory cache to ensure instant persistence across serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var __global_registered_users: ServerUserLicense[] | undefined;
}

if (!global.__global_registered_users) {
  global.__global_registered_users = [DEFAULT_SUPER_ADMIN];
}

function getUsersFilePath(): string {
  // In serverless / production environments, write to /tmp or data directory
  const dataDir = path.join(process.cwd(), 'data');
  if (fs.existsSync(dataDir)) {
    return path.join(dataDir, 'registered_users.json');
  }
  return path.join('/tmp', 'registered_users.json');
}

function loadUsers(): ServerUserLicense[] {
  try {
    const filePath = getUsersFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default super admin is present
        if (!parsed.some((u) => u.email.toLowerCase() === DEFAULT_SUPER_ADMIN.email.toLowerCase())) {
          parsed.unshift(DEFAULT_SUPER_ADMIN);
        }
        global.__global_registered_users = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading registered users from file:', err);
  }
  return global.__global_registered_users || [DEFAULT_SUPER_ADMIN];
}

function saveUsers(users: ServerUserLicense[]) {
  global.__global_registered_users = users;
  try {
    const filePath = getUsersFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving registered users to file:', err);
  }
}

// GET: Return all registered users (used by Super Admin panel and status check)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkEmail = searchParams.get('email');

    const users = loadUsers();

    if (checkEmail) {
      const cleanEmail = checkEmail.trim().toLowerCase();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        return NextResponse.json({ success: false, found: false });
      }
      return NextResponse.json({
        success: true,
        found: true,
        approved: user.approved,
        user: {
          email: user.email,
          name: user.name,
          businessName: user.businessName || user.shopName,
          phone: user.phone,
          approved: user.approved,
        },
      });
    }

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: Add new client registration or toggle approval
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, name, businessName, phone, password, approved } = body;

    const users = loadUsers();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required.' },
        { status: 400 }
      );
    }

    // ACTION 1: TOGGLE / UPDATE APPROVAL STATUS (By Super Admin)
    if (action === 'TOGGLE_APPROVAL' || action === 'SET_APPROVAL') {
      const updated = users.map((u) => {
        if (u.email.toLowerCase() === cleanEmail) {
          const nextState = approved !== undefined ? Boolean(approved) : !u.approved;
          return {
            ...u,
            approved: nextState,
            approvedAt: nextState ? new Date().toISOString() : undefined,
          };
        }
        return u;
      });
      saveUsers(updated);
      return NextResponse.json({
        success: true,
        message: 'Approval status updated successfully.',
        users: updated,
      });
    }

    // ACTION 2: DELETE CLIENT LICENSE
    if (action === 'DELETE_USER') {
      const filtered = users.filter((u) => u.email.toLowerCase() !== cleanEmail);
      saveUsers(filtered);
      return NextResponse.json({
        success: true,
        message: 'User removed successfully.',
        users: filtered,
      });
    }

    // ACTION 3: NEW CLIENT REGISTRATION (From Client's Device)
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    const newUser: ServerUserLicense = {
      email: cleanEmail,
      name: (name || cleanEmail.split('@')[0]).trim(),
      businessName: (businessName || 'Store').trim(),
      shopName: (businessName || 'Store').trim(),
      phone: (phone || '').trim(),
      password: password || undefined,
      approved: cleanEmail === DEFAULT_SUPER_ADMIN.email.toLowerCase(),
      registeredAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Update details if existing
      users[existingIndex] = {
        ...users[existingIndex],
        name: newUser.name,
        businessName: newUser.businessName,
        phone: newUser.phone,
        password: newUser.password || users[existingIndex].password,
      };
    } else {
      users.unshift(newUser);
    }

    saveUsers(users);

    return NextResponse.json({
      success: true,
      message: 'Registration saved centrally on cloud server.',
      user: newUser,
      totalUsers: users.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
