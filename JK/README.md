# JK Shop Management & ERP System
### جے کے انٹرپرائز ای آر پی و کاؤنٹر پوائنٹ آف سیل (POS) سسٹم

A robust, enterprise-grade, offline-first Shop Management & ERP System designed for multi-niche retail and wholesale businesses in Pakistan and international markets.

---

## 🌟 Key Architectural Features

### 1. Dynamic Business Profile Switcher (5 Pre-loaded Niches)
- **Karyana Merchant & General Store (کریانہ و جنرل سٹور)**: Rice, flour, sugar, oil, ghee, pulses, tea, spices, multi-unit conversions (Kg to Grams).
- **Garments & Apparel Store (گارمنٹس و ملبوسات)**: Size, color variety (Men Kurta, Denim Jeans, Lawn 3pc, Kids Baba Suits).
- **Sweets & Bakers (سویٹس اینڈ بیکرز)**: Weight & box variations (Mix Mithai, Gulab Jamun, Cakes, Fresh Patties, Rusk).
- **Wholesale Candy & Confectionery (گول ٹافی و کنفیکشنری تاجر)**: Cartons, Packets, Dozens, Display jars (Milk toffee, bubble gums, choco bars).
- **Restaurant / Cafe / Takeaway (ریسٹورنٹ و کیفے)**: Table management, Kitchen Order Tickets (KOT), Biryani, Shinwari Karahi, BBQ.

### 2. Bilingual Typography & RTL/LTR Engine
- 1-Click instant toggle between **Urdu (اردو)** and **English**.
- Powered by Google Font **Noto Nastaliq Urdu** with customized line-heights (`2.1`) and elegant paddings without text clipping.
- Seamless RTL and LTR layout flipping.

### 3. Voice Command & Speech-to-Text Engine (Web Speech API + Groq AI)
- **Voice Order (Urdu & English)**: Speak direct orders (e.g. *"پانچ کلو چینی اور دو کلو گھی"*) to parse items, detect quantities, and populate the active POS cart automatically.
- **Voice Search**: Dictate customer names or product titles to query ledgers and inventory.
- **Voice Customer Registration**: Dictate customer name and phone number directly into registration fields.

### 4. Real-time Profit Monitoring (Live Margin Transparency)
- Restricted to Admin/Owner role via PIN protection (Default PIN: `1234`, customizable in Settings).
- Real-time per-item profit badge: `Profit = (Sale Price - Cost Price) * Quantity`.
- Live total net profit calculated for the active transaction before finalizing the bill.

### 5. Automated Roznamcha (روزنامچہ) & Daily Cash Book
- Every cash sale, credit recovery, expense (tea, utility, rent, salary), and supplier payout automatically feeds into the daily Roznamcha.
- End-of-Day reconciliation report comparing calculated cash with actual physical drawer notes.

### 6. Automated Khata (کھاتہ جات) & Credit Ledger
- Automatically creates dedicated ledger accounts when partial or credit payments are made.
- Automatically debits unpaid balances into customer khata.
- Instant 1-click WhatsApp notification dispatch with polite Urdu format:
  `"محترم [گاہک کا نام] صاحب! آپ کی آج کی خریداری کا بل [5,000] روپے بنا۔ وصول شدہ رقم: [2,000] روپے، بقایا واجب الادا رقم: [3,000] روپے ہے۔ آپ کے تعاون کا شکریہ۔ [دکان کا نام]"`

### 7. AI WhatsApp Chatbot Engine & Webhook
- Built with **Groq AI** using model `openai/gpt-oss-120b`.
- Exceptionally polite, respectful Urdu tone (*"السلام علیکم ورحمۃ اللہ! [دکان کا نام] میں خوش آمدید۔ ہم آپ کی کیا خدمت کر سکتے ہیں؟"*).
- Answers live pricing and inventory queries.
- Automatically parses customer orders into structured JSON with a 1-click **"Push to POS Cart"** button!
- Webhook endpoint at `/api/webhook/whatsapp` for official Meta WhatsApp Cloud API integration.

### 8. Receipt & Invoice Printing (Mandatory Developer Branding)
- Supports **Thermal 80mm**, **Thermal 58mm**, and **A4 Professional Invoice** formats.
- Complete business branding header: Urdu & English name, address, contact, and NTN.
- Full breakdown: Items table, subtotal, discount, paid amount, balance due, previous khata balance, net total debt.
- **Permanent Developer Branding**:
  Centered at the bottom of every receipt and invoice:
  ```
  JK Software Developer
  ```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (Node v24 is installed)

### Environment Configuration
The `.env.local` file is configured with the user's provided Groq API Key:
```env
GROQ_API_KEY=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
NEXT_PUBLIC_GROQ_API_KEY=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
```

### Running the System
```bash
# Start production server
npm run start
# Or start in development mode
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### Developed By
**JK Software Developer**
