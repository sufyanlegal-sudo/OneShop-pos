const fs = require('fs');

let content = fs.readFileSync('components/auth/AuthLicenseGate.tsx', 'utf8');

// 1. Make handleClientLogin async and auto-check for cloud backup if fresh machine
const oldLogin = `  // 1. Handle Client Login
  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLoginError('Please enter a valid Gmail address.');
      return;
    }

    // STRICT ANTI-HIJACK CHECK: Users cannot log into developer's Super Admin email via regular form
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setLoginError('⛔ This email is reserved for Developer Master Access. Please sign in with your own registered account.');
      return;
    }

    setIsLoggingIn(true);
    const res = loginUser({
      email: cleanEmail,
      password: loginPassword,
    });
    setIsLoggingIn(false);

    if (res.status === 'NOT_FOUND') {
      setLoginError(res.message || 'Account not found. Please create a new account.');
      return;
    }

    if (res.status === 'WRONG_PASSWORD') {
      setLoginError(res.message || 'Incorrect password. Please try again.');
      return;
    }

    if (res.status === 'PENDING') {
      setPendingUser({
        name: res.user?.name || cleanEmail.split('@')[0],
        businessName: res.user?.businessName || res.user?.shopName || 'Store',
        phone: res.user?.phone || '',
        email: cleanEmail,
      });
      return;
    }

    if (res.status === 'DENIED') {
      setLoginError(res.message || 'Access has been denied by administrator.');
      return;
    }
  };`;

const newLogin = `  // 1. Handle Client Login (With Auto Stolen Device Recovery)
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLoginError('Please enter a valid Gmail address.');
      return;
    }

    // STRICT ANTI-HIJACK CHECK: Users cannot log into developer's Super Admin email via regular form
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setLoginError('⛔ This email is reserved for Developer Master Access. Please sign in with your own registered account.');
      return;
    }

    setIsLoggingIn(true);
    const res = loginUser({
      email: cleanEmail,
      password: loginPassword,
    });
    setIsLoggingIn(false);

    if (res.status === 'NOT_FOUND') {
      setLoginError(res.message || 'Account not found. Please create a new account.');
      return;
    }

    if (res.status === 'WRONG_PASSWORD') {
      setLoginError(res.message || 'Incorrect password. Please try again.');
      return;
    }

    if (res.status === 'PENDING') {
      setPendingUser({
        name: res.user?.name || cleanEmail.split('@')[0],
        businessName: res.user?.businessName || res.user?.shopName || 'Store',
        phone: res.user?.phone || '',
        email: cleanEmail,
      });
      return;
    }

    if (res.status === 'DENIED') {
      setLoginError(res.message || 'Access has been denied by administrator.');
      return;
    }

    if (res.status === 'APPROVED') {
      // Auto-Restore for Stolen Device / New PC: If this device is clean/empty, check if cloud backup exists
      const { storage } = await import('@/lib/storage');
      const invoices = storage.getInvoices();
      if (invoices.length === 0) {
        try {
          const fetchRes = await fetchGoogleBackup(cleanEmail);
          if (fetchRes.success && fetchRes.backup) {
            await restoreFromGoogleCloud(cleanEmail);
            window.location.reload();
            return;
          }
        } catch (err) {
          console.log('No previous backup to auto-restore', err);
        }
      }
    }
  };`;

// 2. Enhance Restore Tab text for Stolen Device Recovery
const oldRestoreHeader = `                  <div>
                    <h3 className="font-black text-xs text-white">
                      Google Cloud Restore
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                      On a new PC, enter your registered Gmail to automatically restore all inventory, ledgers, and sales data from cloud.
                    </p>
                  </div>`;

const newRestoreHeader = `                  <div>
                    <h3 className="font-black text-xs text-white">
                      کلاؤڈ ریکوری (ڈیوائس چوری یا تبدیلی) / Cloud Recovery
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                      اگر ڈیوائس چوری ہو جائے یا نیا کمپیوٹر استعمال کر رہے ہوں، تو اپنی رجسٹرڈ جی میل درج کریں؛ تمام انوینٹری، بل ہسٹری اور کھاتے وہیں سے شروع ہو جائیں گے جہاں آپ نے چھوڑے تھے۔
                    </p>
                  </div>`;

const normContent = content.replace(/\r\n/g, '\n');
const normOldLogin = oldLogin.replace(/\r\n/g, '\n');
const normNewLogin = newLogin.replace(/\r\n/g, '\n');
const normOldRest = oldRestoreHeader.replace(/\r\n/g, '\n');
const normNewRest = newRestoreHeader.replace(/\r\n/g, '\n');

if (!normContent.includes(normOldLogin)) {
  console.error('normOldLogin not found in components/auth/AuthLicenseGate.tsx!');
  process.exit(1);
}

let updated = normContent.replace(normOldLogin, normNewLogin);

if (!updated.includes(normOldRest)) {
  console.error('normOldRest not found in components/auth/AuthLicenseGate.tsx!');
  process.exit(1);
}

updated = updated.replace(normOldRest, normNewRest);

fs.writeFileSync('components/auth/AuthLicenseGate.tsx', updated, 'utf8');
console.log('Successfully updated components/auth/AuthLicenseGate.tsx!');
