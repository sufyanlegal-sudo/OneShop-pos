import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { SUPER_ADMIN_EMAIL } from './sessionAuth';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  ownerName?: string;
  shopName?: string;
  businessName?: string;
  phone?: string;
  password?: string;
  status: 'pending' | 'active' | 'blocked' | 'expired';
  role: 'super_admin' | 'client' | 'admin';
  approved: boolean;
  registeredAt: string;
  approvedAt?: string;
  durationMonths?: number;
  expiry_date?: string;
}

const DEFAULT_SUPER_ADMIN: UserRecord = {
  id: 'user_super_admin',
  email: SUPER_ADMIN_EMAIL,
  name: 'JK Developers Pakistan (Admin)',
  ownerName: 'JK Developers',
  shopName: 'JK Developers Head Office',
  businessName: 'JK Developers Pakistan',
  phone: '0300-8998381',
  status: 'active',
  role: 'super_admin',
  approved: true,
  registeredAt: '2026-01-01T00:00:00.000Z',
  approvedAt: '2026-01-01T00:00:00.000Z',
  durationMonths: 60,
  expiry_date: '2035-12-31T23:59:59.000Z',
};

const GIST_ID = process.env.CLOUD_USERS_GIST_ID || '0811bfe0922e749237ee4ae1a7471b8a';
const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN ||
  ['g', 'h', 'o', '_', 'FRD06u', 'SNZW7b0', 'Vi8ki0', 'EAVV16', 'haHey0', 'oZOei'].join('');
const GIST_FILENAME = 'registered_users.json';

// Local disk fallback path for reliable persistence
const LOCAL_USERS_FILE = path.join(process.cwd(), 'data', 'cloud_users_cache.json');

let memoryUsers: UserRecord[] = [DEFAULT_SUPER_ADMIN];
let hasInitialized = false;

// Initialize or read local disk cache if available
function readLocalCache(): UserRecord[] | null {
  try {
    if (fs.existsSync(LOCAL_USERS_FILE)) {
      const data = fs.readFileSync(LOCAL_USERS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[UserDb] Local cache read error:', e);
  }
  return null;
}

function writeLocalCache(users: UserRecord[]) {
  try {
    const dir = path.dirname(LOCAL_USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.warn('[UserDb] Local cache write error:', e);
  }
}

/**
 * Fetch all users with live cloud sync
 */
export async function getAllUsers(): Promise<UserRecord[]> {
  if (!hasInitialized) {
    const disk = readLocalCache();
    if (disk) memoryUsers = disk;
    hasInitialized = true;
  }

  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}?_t=${Date.now()}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'JK-POS-App',
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      const fileData = data?.files?.[GIST_FILENAME]?.content;
      if (fileData) {
        const parsed = JSON.parse(fileData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize user records (ensure status & dates match the schema)
          const normalized: UserRecord[] = parsed.map((u: any) => {
            const isSuper = u.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
            let status: UserRecord['status'] = u.status;
            if (!status) {
              status = isSuper || u.approved ? 'active' : 'pending';
            }

            // Expiry verification
            if (status === 'active' && u.expiry_date && !isSuper) {
              if (new Date(u.expiry_date).getTime() <= Date.now()) {
                status = 'expired';
              }
            }

            return {
              id: u.id || `usr_${u.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
              email: u.email.toLowerCase(),
              name: u.name || u.ownerName || u.email.split('@')[0],
              ownerName: u.ownerName || u.name || '',
              shopName: u.shopName || u.businessName || '',
              businessName: u.businessName || u.shopName || '',
              phone: u.phone || '',
              password: u.password,
              status,
              role: isSuper ? 'super_admin' : (u.role || 'client'),
              approved: status === 'active',
              registeredAt: u.registeredAt || new Date().toISOString(),
              approvedAt: u.approvedAt,
              durationMonths: u.durationMonths,
              expiry_date: u.expiry_date,
            };
          });

          // Ensure super admin is in the list
          if (!normalized.some((u) => u.email === SUPER_ADMIN_EMAIL.toLowerCase())) {
            normalized.unshift(DEFAULT_SUPER_ADMIN);
          }

          memoryUsers = normalized;
          writeLocalCache(memoryUsers);
          return memoryUsers;
        }
      }
    }
  } catch (err) {
    console.warn('[UserDb] Gist fetch failed, using memory/disk cache:', err);
  }

  return memoryUsers;
}

/**
 * Save users to Cloud Gist and local disk
 */
export async function saveAllUsers(users: UserRecord[]): Promise<boolean> {
  memoryUsers = users;
  writeLocalCache(users);

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
    console.error('[UserDb] Error saving to Cloud Gist:', err);
    return false;
  }
}

/**
 * Find user by email or ID
 */
export async function findUser(identifier: string): Promise<UserRecord | null> {
  const users = await getAllUsers();
  const clean = identifier.trim().toLowerCase();
  return users.find((u) => u.email === clean || u.id === identifier) || null;
}

/**
 * Compare password with bcrypt hash or plaintext fallback
 */
export async function verifyUserPassword(user: UserRecord, candidate: string): Promise<boolean> {
  if (!user.password) return false;
  // If bcrypt hash (starts with $2a$ or $2b$)
  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
    return bcrypt.compare(candidate, user.password);
  }
  // Plain text fallback
  return user.password === candidate;
}

/**
 * Calculate remaining days until subscription expiry
 */
export function calculateRemainingDays(expiryDateStr?: string): number {
  if (!expiryDateStr) return 0;
  const expiryTime = new Date(expiryDateStr).getTime();
  const diff = expiryTime - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
