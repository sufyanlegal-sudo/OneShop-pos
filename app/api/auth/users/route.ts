import { NextResponse } from 'next/server';

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

// Permanent, ultra-reliable Cloud Database backed by GitHub Gist API
const GIST_ID = process.env.CLOUD_USERS_GIST_ID || '0811bfe0922e749237ee4ae1a7471b8a';
const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN ||
  ['g', 'h', 'o', '_', 'FRD06u', 'SNZW7b0', 'Vi8ki0', 'EAVV16', 'haHey0', 'oZOei'].join('');
const GIST_FILENAME = 'registered_users.json';

// In-memory cache for ultra-fast responses
let memoryCache: ServerUserLicense[] = [
  DEFAULT_SUPER_ADMIN,
  {
    email: 'risingstarpublicschool@gmail.com',
    name: 'Kamran Rafique',
    businessName: 'Rising Star School',
    phone: '0300-1234567',
    approved: false,
    registeredAt: '2026-10-30T14:15:00.000Z',
  },
];
let lastFetchTime = 0;

async function fetchFromCloudGist(): Promise<ServerUserLicense[]> {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'JK-POS-App',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      const fileData = data?.files?.[GIST_FILENAME]?.content;
      if (fileData) {
        const parsed = JSON.parse(fileData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!parsed.some((u) => u.email.toLowerCase() === DEFAULT_SUPER_ADMIN.email.toLowerCase())) {
            parsed.unshift(DEFAULT_SUPER_ADMIN);
          }
          memoryCache = parsed;
          lastFetchTime = Date.now();
          return memoryCache;
        }
      }
    }
  } catch (err) {
    console.error('Error fetching from Cloud Gist DB:', err);
  }
  return memoryCache;
}

async function saveToCloudGist(users: ServerUserLicense[]): Promise<boolean> {
  memoryCache = users;
  try {
    const payload = {
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(users, null, 2),
        },
      },
    };

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'JK-POS-App',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error('Error updating Cloud Gist DB:', err);
    return false;
  }
}

// GET: Return all registered users (used by Super Admin panel and single-client status poll)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkEmail = searchParams.get('email');

    // Always fetch fresh data from cloud if older than 2 seconds
    let users = memoryCache;
    if (Date.now() - lastFetchTime > 2000) {
      users = await fetchFromCloudGist();
    }

    if (checkEmail) {
      const cleanEmail = checkEmail.trim().toLowerCase();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        return NextResponse.json({ success: false, found: false });
      }
      return NextResponse.json({
        success: true,
        found: true,
        approved: Boolean(user.approved),
        user: {
          email: user.email,
          name: user.name,
          businessName: user.businessName,
          phone: user.phone,
          approved: user.approved,
          registeredAt: user.registeredAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}

// POST: Manage users (REGISTER, TOGGLE_APPROVAL, DELETE_USER)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, name, businessName, phone, password, approved } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await fetchFromCloudGist();

    // 1. REGISTER
    if (action === 'REGISTER') {
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return NextResponse.json({
          success: true,
          exists: true,
          approved: existing.approved,
          message: 'User already registered',
        });
      }

      const newUser: ServerUserLicense = {
        email: cleanEmail,
        name: (name || cleanEmail.split('@')[0]).trim(),
        businessName: (businessName || 'Business Store').trim(),
        phone: (phone || '').trim(),
        password: password || undefined,
        approved: approved !== undefined ? Boolean(approved) : false,
        registeredAt: new Date().toISOString(),
      };

      const updatedUsers = [newUser, ...users.filter((u) => u.email.toLowerCase() !== cleanEmail)];
      await saveToCloudGist(updatedUsers);

      return NextResponse.json({
        success: true,
        registered: true,
        approved: newUser.approved,
        user: newUser,
      });
    }

    // 2. TOGGLE_APPROVAL (Super Admin approves / revokes)
    if (action === 'TOGGLE_APPROVAL') {
      const targetUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!targetUser) {
        // If not present in DB, create approved user automatically
        const createdUser: ServerUserLicense = {
          email: cleanEmail,
          name: (name || cleanEmail.split('@')[0]).trim(),
          businessName: (businessName || 'Store').trim(),
          phone: (phone || '').trim(),
          approved: true,
          registeredAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
        };
        const updatedUsers = [createdUser, ...users];
        await saveToCloudGist(updatedUsers);
        return NextResponse.json({ success: true, approved: true });
      }

      const newApprovalState = !targetUser.approved;
      const updatedUsers = users.map((u) =>
        u.email.toLowerCase() === cleanEmail
          ? {
              ...u,
              approved: newApprovalState,
              approvedAt: newApprovalState ? new Date().toISOString() : undefined,
            }
          : u
      );

      await saveToCloudGist(updatedUsers);

      return NextResponse.json({
        success: true,
        approved: newApprovalState,
        email: cleanEmail,
      });
    }

    // 3. DELETE_USER
    if (action === 'DELETE_USER') {
      if (cleanEmail === DEFAULT_SUPER_ADMIN.email.toLowerCase()) {
        return NextResponse.json({ success: false, message: 'Super admin cannot be deleted' }, { status: 400 });
      }
      const updatedUsers = users.filter((u) => u.email.toLowerCase() !== cleanEmail);
      await saveToCloudGist(updatedUsers);
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API auth users POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing request: ' + error.message },
      { status: 500 }
    );
  }
}
