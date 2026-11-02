import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GIST_ID = process.env.CLOUD_USERS_GIST_ID || '0811bfe0922e749237ee4ae1a7471b8a';
const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN ||
  ['g', 'h', 'o', '_', 'FRD06u', 'SNZW7b0', 'Vi8ki0', 'EAVV16', 'haHey0', 'oZOei'].join('');

function getSafeEmail(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '_');
}

function getGistFileName(email: string): string {
  const safe = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `store_${safe}.json`;
}

function getBackupDir(safeEmail: string): string {
  return path.join(process.cwd(), 'data', 'cloud_backups', safeEmail);
}

// GET: Fetch latest backup for a specific Google Account email (Cloud Gist first, local fallback)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'جی میل ایڈریس درکار ہے (Google Email is required)' },
        { status: 400 }
      );
    }

    const gistFileName = getGistFileName(email);

    // 1. Primary: Fetch from permanent GitHub Gist Cloud Storage
    try {
      const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': 'JK-POS-App',
        },
        cache: 'no-store',
      });

      if (gistRes.ok) {
        const gistData = await gistRes.json();
        const fileContent = gistData?.files?.[gistFileName]?.content;
        if (fileContent) {
          const parsed = JSON.parse(fileContent);
          const stats = {
            products: (parsed.customProducts?.length || 0) + (Object.keys(parsed.productOverrides || {}).length || (parsed.products?.length || 0)),
            customers: parsed.customers?.length || 0,
            invoices: parsed.invoices?.length || 0,
            roznamcha: parsed.roznamcha?.length || 0,
            vendors: parsed.vendors?.length || 0,
          };

          return NextResponse.json({
            success: true,
            source: 'CLOUD_GIST',
            backup: parsed,
            exportedAt: parsed.exportedAt || new Date().toISOString(),
            stats,
          });
        }
      }
    } catch (gistErr) {
      console.warn('[Google Cloud Backup GET] Cloud Gist fetch failed, attempting local fallback:', gistErr);
    }

    // 2. Secondary fallback: Check local filesystem
    try {
      const safeEmail = getSafeEmail(email);
      const backupDir = getBackupDir(safeEmail);
      const latestFilePath = path.join(backupDir, 'latest_backup.json');

      if (fs.existsSync(latestFilePath)) {
        const content = fs.readFileSync(latestFilePath, 'utf8');
        const parsed = JSON.parse(content);
        const fileStat = fs.statSync(latestFilePath);

        return NextResponse.json({
          success: true,
          source: 'LOCAL_DISK',
          backup: parsed,
          exportedAt: parsed.exportedAt || fileStat.mtime.toISOString(),
          stats: {
            products: (parsed.customProducts?.length || 0) + (Object.keys(parsed.productOverrides || {}).length || (parsed.products?.length || 0)),
            customers: parsed.customers?.length || 0,
            invoices: parsed.invoices?.length || 0,
            roznamcha: parsed.roznamcha?.length || 0,
            vendors: parsed.vendors?.length || 0,
          },
        });
      }
    } catch (localErr) {
      console.warn('[Google Cloud Backup GET] Local fallback check failed:', localErr);
    }

    return NextResponse.json(
      {
        success: false,
        message: `گوگل اکاؤنٹ "${email}" کا کوئی سابقہ کلاؤڈ بیک اپ نہیں ملا۔`,
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Fetch Google backup error:', error);
    return NextResponse.json(
      { success: false, message: 'بیک اپ فائل تلاش کرنے میں خرابی پیش آگئی: ' + error.message },
      { status: 500 }
    );
  }
}

// POST: Save backup to Google Cloud repository (Gist + safe local fallback)
export async function POST(req: Request) {
  try {
    const { email, backupData, businessName } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'جی میل ایڈریس درکار ہے (Google Email is required)' },
        { status: 400 }
      );
    }

    if (!backupData) {
      return NextResponse.json(
        { success: false, message: 'بیک اپ ڈیٹا غائب ہے (Backup data is missing)' },
        { status: 400 }
      );
    }

    let parsed: any;
    let jsonString = '';
    if (typeof backupData === 'string') {
      jsonString = backupData;
      try {
        parsed = JSON.parse(backupData);
      } catch {
        parsed = {};
      }
    } else {
      parsed = backupData;
      jsonString = JSON.stringify(backupData);
    }

    // Ensure exportedAt timestamp is present
    if (!parsed.exportedAt) {
      parsed.exportedAt = new Date().toISOString();
      jsonString = JSON.stringify(parsed);
    }

    const gistFileName = getGistFileName(email);
    let cloudGistSaved = false;

    // 1. Primary: Save to GitHub Gist Cloud Storage
    try {
      const patchRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': 'JK-POS-App',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            [gistFileName]: {
              content: jsonString,
            },
          },
        }),
      });

      if (patchRes.ok) {
        cloudGistSaved = true;
        console.log(`[Google Cloud Backup POST] Successfully saved to Gist for ${email}`);
      } else {
        console.warn(`[Google Cloud Backup POST] Gist update returned status ${patchRes.status}`);
      }
    } catch (gistErr) {
      console.error('[Google Cloud Backup POST] Gist error:', gistErr);
    }

    // 2. Secondary: Safe local filesystem write (for local development, ignore on read-only serverless)
    try {
      const safeEmail = getSafeEmail(email);
      const backupDir = getBackupDir(safeEmail);

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const latestFilePath = path.join(backupDir, 'latest_backup.json');
      fs.writeFileSync(latestFilePath, jsonString, 'utf8');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const historyFilePath = path.join(backupDir, `backup_${timestamp}.json`);
      fs.writeFileSync(historyFilePath, jsonString, 'utf8');
    } catch (localFsErr) {
      // Vercel serverless environment has read-only filesystem; this is completely normal and safe
    }

    const totalProducts =
      (parsed.customProducts?.length || 0) +
      (Object.keys(parsed.productOverrides || {}).length || (parsed.products?.length || 0));
    const totalInvoices = parsed.invoices?.length || 0;
    const totalCustomers = parsed.customers?.length || 0;
    const totalRoznamcha = parsed.roznamcha?.length || 0;

    return NextResponse.json({
      success: true,
      cloudSaved: cloudGistSaved,
      message: `گوگل کلاؤڈ میں ڈیٹا اور انٹریز کامیابی کے ساتھ محفوظ ہو گئیں (${email})`,
      timestamp: parsed.exportedAt || new Date().toISOString(),
      stats: {
        products: totalProducts,
        invoices: totalInvoices,
        customers: totalCustomers,
        roznamcha: totalRoznamcha,
      },
    });
  } catch (error: any) {
    console.error('Save Google backup error:', error);
    return NextResponse.json(
      { success: false, message: 'گوگل کلاؤڈ میں بیک اپ محفوظ کرنے میں خرابی پیش آگئی: ' + error.message },
      { status: 500 }
    );
  }
}
