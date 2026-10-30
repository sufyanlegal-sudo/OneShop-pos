import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getSafeEmail(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '_');
}

function getBackupDir(safeEmail: string): string {
  return path.join(process.cwd(), 'data', 'cloud_backups', safeEmail);
}

// GET: Fetch latest backup for a specific Google Account email
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

    const safeEmail = getSafeEmail(email);
    const backupDir = getBackupDir(safeEmail);
    const latestFilePath = path.join(backupDir, 'latest_backup.json');

    if (!fs.existsSync(latestFilePath)) {
      // Check if there's any file in the directory
      if (fs.existsSync(backupDir)) {
        const files = fs
          .readdirSync(backupDir)
          .filter((f) => f.endsWith('.json'))
          .sort((a, b) => b.localeCompare(a));

        if (files.length > 0) {
          const content = fs.readFileSync(path.join(backupDir, files[0]), 'utf8');
          const parsed = JSON.parse(content);
          return NextResponse.json({
            success: true,
            backup: parsed,
            exportedAt: parsed.exportedAt || new Date().toISOString(),
            stats: {
              products: parsed.products?.length || 0,
              customers: parsed.customers?.length || 0,
              invoices: parsed.invoices?.length || 0,
              roznamcha: parsed.roznamcha?.length || 0,
              vendors: parsed.vendors?.length || 0,
            },
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          message: `گوگل اکاؤنٹ "${email}" کا کوئی سابقہ کلاؤڈ بیک اپ نہیں ملا۔`,
        },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(latestFilePath, 'utf8');
    const parsed = JSON.parse(content);
    const fileStat = fs.statSync(latestFilePath);

    return NextResponse.json({
      success: true,
      backup: parsed,
      exportedAt: parsed.exportedAt || fileStat.mtime.toISOString(),
      stats: {
        products: parsed.products?.length || 0,
        customers: parsed.customers?.length || 0,
        invoices: parsed.invoices?.length || 0,
        roznamcha: parsed.roznamcha?.length || 0,
        vendors: parsed.vendors?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Fetch Google backup error:', error);
    return NextResponse.json(
      { success: false, message: 'بیک اپ فائل تلاش کرنے میں خرابی پیش آگئی: ' + error.message },
      { status: 500 }
    );
  }
}

// POST: Save backup to Google Cloud repository
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

    const safeEmail = getSafeEmail(email);
    const backupDir = getBackupDir(safeEmail);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const jsonString =
      typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);

    // Save latest backup
    const latestFilePath = path.join(backupDir, 'latest_backup.json');
    fs.writeFileSync(latestFilePath, jsonString, 'utf8');

    // Save historical timestamped backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const historyFilePath = path.join(backupDir, `backup_${timestamp}.json`);
    fs.writeFileSync(historyFilePath, jsonString, 'utf8');

    // Parse stats
    let totalProducts = 0;
    let totalInvoices = 0;
    let totalCustomers = 0;
    let totalRoznamcha = 0;
    try {
      const parsed = JSON.parse(jsonString);
      totalProducts = parsed.products?.length || 0;
      totalInvoices = parsed.invoices?.length || 0;
      totalCustomers = parsed.customers?.length || 0;
      totalRoznamcha = parsed.roznamcha?.length || 0;
    } catch {}

    console.log(`[Google Cloud Backup] Saved backup for ${email} (${businessName || 'OneShop POS'})`);

    return NextResponse.json({
      success: true,
      message: `گوگل کلاؤڈ بیک اپ کامیابی کے ساتھ محفوظ ہو گیا (${email})`,
      timestamp: new Date().toISOString(),
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
