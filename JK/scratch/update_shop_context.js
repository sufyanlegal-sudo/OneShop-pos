const fs = require('fs');

let content = fs.readFileSync('context/ShopContext.tsx', 'utf8');

const targetStr = `    const updatedDB = [newUser, ...usersDB];
    setUsersDB(updatedDB);
    storage.saveUsersDB(updatedDB);

    // If business name was provided, customize shop profile`;

const replacementStr = `    const updatedDB = [newUser, ...usersDB];
    setUsersDB(updatedDB);
    storage.saveUsersDB(updatedDB);

    // Ensure complete clean-slate zero start for new user:
    setCustomers([]);
    storage.saveCustomers([]);
    setInvoices([]);
    storage.saveInvoices([]);
    setRoznamcha([]);
    storage.saveRoznamcha([]);
    setVendors([]);
    storage.saveVendors([]);
    setCart([]);
    const zeroProducts = allProducts.map((p) => ({ ...p, stock: 0 }));
    setAllProducts(zeroProducts);
    storage.saveProducts(zeroProducts);

    // If business name was provided, customize shop profile`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = targetStr.replace(/\r\n/g, '\n');
const normReplacement = replacementStr.replace(/\r\n/g, '\n');

if (!normContent.includes(normTarget)) {
  console.error('Target not found in context/ShopContext.tsx!');
  process.exit(1);
}

const updated = normContent.replace(normTarget, normReplacement);
fs.writeFileSync('context/ShopContext.tsx', updated, 'utf8');
console.log('Successfully updated context/ShopContext.tsx!');
