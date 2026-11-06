import Groq from 'groq-sdk';
import { BusinessProfile, Product } from '@/types';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export const groqClient = new Groq({
  apiKey: GROQ_API_KEY || 'not_configured',
});

export function sanitizeChatbotReply(text: string): string {
  if (!text) return '';

  // 1. Convert all Eastern Arabic / Urdu numerals to standard math digits (0-9)
  const easternDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let clean = text;
  for (let i = 0; i < 10; i++) {
    clean = clean.replaceAll(easternDigits[i], i.toString());
    clean = clean.replaceAll(arabicDigits[i], i.toString());
  }

  // 2. Strip JSON code block
  clean = clean.replace(/```json[\s\S]*?```/gi, '').trim();

  // 3. Remove technical leakages like "JSON", "پروڈکٹ آئی ڈی: ...", "ID: ..."
  clean = clean.replace(/تصدیقی\s*JSON/gi, 'تصدیقی بل');
  clean = clean.replace(/\bJSON\b/gi, 'بل');
  clean = clean.replace(/[-*•]?\s*پروڈکٹ\s*(آئی\s*ڈی|ID)\s*:\s*[^\n\r]+/gi, '');
  clean = clean.replace(/[-*•]?\s*ID\s*:\s*[^\n\r]+/gi, '');

  // 4. Remove bold markdown asterisks (**word** -> word) for clean Urdu text
  clean = clean.replace(/\*\*(.*?)\*\*/g, '$1');
  clean = clean.replace(/\*(.*?)\*/g, '$1');

  // Clean empty lines
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();

  return clean;
}

export async function askUrduChatbot(
  userMessage: string,
  businessProfile: BusinessProfile,
  inventory: Product[],
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{ reply: string; parsedOrder?: any }> {
  try {
    const inventorySummary = inventory
      .slice(0, 50)
      .map(
        (p) =>
          `- ${p.nameUr} (${p.nameEn}): ریٹ ${p.salePrice} روپے فی ${p.unit} (موجودہ اسٹاک: ${p.stock})`
      )
      .join('\n');

    const systemPrompt = `آپ "${businessProfile.nameUr} (${businessProfile.nameEn})" کے آفیشل واٹس ایپ بزنس اسسٹنٹ ہیں۔
دکان کا پتہ: ${businessProfile.addressUr} | فون و واٹس ایپ: ${businessProfile.whatsapp}

لازمی اور انتہائی اہم ہدایات:
1. تمام اعداد و شمار، قیمت، ریٹ، مقدار اور فون نمبر ہمیشہ عام ریاضی کی انگریزی گنتی (Math Digits: 1, 2, 3, 4, 5, 6, 7, 8, 9, 0) میں لکھیں (مثلاً: 240 روپے، 120 باکس)۔ مشرقی عربی یا اردو ہندسے (۰، ۱، ۲، ۳، ۴، ۵، ۶، ۷، ۸، ۹) ہرگز استعمال نہ کریں۔
2. کسٹمر کے سامنے گفتگو میں کبھی بھی تکنیکی الفاظ جیسے "JSON", "پروڈکٹ آئی ڈی", "ID", "کوڈ", "API" وغیرہ کا ہرگز ذکر نہ کریں۔
3. مارک ڈاؤن ستارے (جیسے **240**) نہ لگائیں، سیدھی اور صاف اردو لکھیں۔
4. گفتگو نہایت باادب، شائستہ، روایتی اور مہذب پاکستانی کاروباری انداز میں ہو (مثلاً: "وعلیکم السلام ورحمۃ اللہ و برکاتہ! محترم جناب، تشریف لانے کا شکریہ۔ ہم آپ کی کیا خدمت کر سکتے ہیں؟")۔
5. گاہک کے ساتھ عزت و احترام سے پیش آئیں اور ہمیشہ "آپ"، "جناب"، "محترم" کا صیغہ استعمال کریں۔
6. اگر گاہک اشیاء کے ریٹس، قیمت یا دستیابی پوچھے تو نیچے دیے گئے موجودہ اسٹاک اور ریٹس میں سے معلومات شائستگی سے بتائیں (صرف آئٹم کا نام، قیمت روپوں میں، اور اسٹاک بتائیں)۔
7. اگر گاہک کوئی آرڈر لکھ کر بھیجے (مثلاً: "مجھے 2 کلو مکس مٹھائی اور 1 گلاب جامن چاہیے" یا "5 کلو چینی اور 2 کلو گھی بھیج دیں") تو:
   - گاہک کو ادب سے شکریہ ادا کریں اور آرڈر کی تفصیلات و کل رقم بتائیں۔
   - سسٹم کیلئے آرڈر کو خودکار پی او ایس کارٹ میں لوڈ کرنے کیلئے اپنے جواب کے بالکل آخر میں پوشیدہ JSON بلاک شامل کریں (کسٹمر کو اس کا ذکر نہ کریں):
\`\`\`json
{
  "isOrder": true,
  "items": [
    { "name": "آئٹم کا نام", "qty": 2, "unit": "Kg", "price": 1400, "total": 2800, "matchedProductId": "swt-01" }
  ],
  "grandTotal": 2800,
  "estimatedTime": "30 سے 45 منٹ"
}
\`\`\`

دکان میں موجود اشیاء اور ان کے سرکاری ریٹس کی فہرست:
${inventorySummary}
`;

    const formattedMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage },
    ];

    let response: any = null;
    const modelsToTry = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

    for (const model of modelsToTry) {
      try {
        response = await groqClient.chat.completions.create({
          model,
          messages: formattedMessages,
          temperature: 0.3,
          max_tokens: 800,
        });
        if (response && response.choices && response.choices.length > 0) {
          break;
        }
      } catch (err: any) {
        console.warn(`[Groq Model ${model} failed, trying fallback]:`, err?.message || err);
      }
    }

    if (!response) {
      throw new Error('All Groq AI models failed to respond');
    }

    const rawReply = response.choices[0]?.message?.content || 'معذرت، میں آپ کی بات سمجھ نہیں سکا۔ دوبارہ ارشاد فرمائیں۔';

    // Check if JSON order is included
    let parsedOrder = null;
    const jsonMatch = rawReply.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        parsedOrder = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('Error parsing order json from chatbot:', e);
      }
    }

    // Clean and sanitize the user-facing reply so all digits are English/Math digits and no technical leaks
    const reply = sanitizeChatbotReply(rawReply);

    return { reply, parsedOrder };
  } catch (error: any) {
    console.warn('[Groq AI offline, using high-speed local Urdu parser]:', error?.message || error);
    const localOrder = parseUrduOrderLocally(userMessage, inventory);
    if (localOrder) {
      const itemsText = localOrder.items.map((it: any) => `${it.qty} ${it.unit} ${it.name}`).join('، ');
      return {
        reply: `وعلیکم السلام محترم گاہک! آپ کا آرڈر موصول ہو چکا ہے (${itemsText})۔ کل بل: ${localOrder.grandTotal} PKR۔ آپ کا بل اور آرڈر کاؤنٹر پر پینڈنگ لسٹ میں شامل کر دیا گیا ہے۔ شکریہ!`,
        parsedOrder: localOrder,
      };
    }
    return {
      reply: `السلام علیکم و رحمتہ اللہ و برکاتہ! ${businessProfile.nameUr} میں خوش آمدید۔ ہم آپ کی کیا خدمت کر سکتے ہیں؟ آپ کسی بھی چیز کا ریٹ معلوم کر سکتے ہیں یا مطلوبہ اشیاء کی فہرست اور تعداد لکھ کر بھیج سکتے ہیں۔`,
    };
  }
}

/**
 * High-speed local Urdu Order Parser for 100% offline & instantaneous WhatsApp order processing
 */
export function parseUrduOrderLocally(userMessage: string, inventory: Product[]): any | null {
  const clean = userMessage.trim();
  const numMap: Record<string, number> = {
    'آدھا': 0.5, '0.5': 0.5, 'پاؤ': 0.25, 'ایک': 1, '1': 1, 'دو': 2, '2': 2,
    'تین': 3, '3': 3, 'چار': 4, '4': 4, 'پانچ': 5, '5': 5, 'چھ': 6, '6': 6,
    'سات': 7, '7': 7, 'آٹھ': 8, '8': 8, 'نو': 9, '9': 9, 'دس': 10, '10': 10,
    'گیارہ': 11, '11': 11, 'بارہ': 12, '12': 12, 'درجن': 12,
  };

  const stopWords = new Set([
    'اور', 'بھیج', 'دیں', 'چاہیے', 'لکھ', 'لیں', 'دے', 'دو', 'کرو', 'کریں', 'پیکٹ',
    'کلو', 'گرام', 'لیٹر', 'ڈبہ', 'عدد', 'بوتل', 'درجن', 'پاؤ', 'کا', 'کی', 'کے', 'سے',
    'سلام', 'وعلیکم', 'السلام', 'بھائی', 'جناب', 'شکریہ', 'مہربانی', 'پلیز', 'please', 'kg', 'ltr', 'gm'
  ]);

  // Split into clauses by common Urdu conjunctions and separator phrases
  const clauses = clean.split(/(?:اور|،|,|\n|\r|\+|\bبھیج دیں\b|\bچاہیے\b|\bدے دو\b)/i)
    .map(c => c.trim())
    .filter(c => c.length > 1);

  const matchedItems: any[] = [];
  const addedIds = new Set<string>();
  let grandTotal = 0;

  for (const clause of clauses) {
    let qty = 1;
    let unit = 'عدد';

    const qtyMatch = clause.match(/(\d+|ایک|دو|تین|چار|پانچ|چھ|سات|آٹھ|نو|دس|آدھا|پاؤ|درجن)\s*(کلو|گرام|لیٹر|پیکٹ|ڈبہ|عدد|بوتل|درجن|پاؤ|kg|gm|ltr|pack|pcs)?/i);
    if (qtyMatch) {
      const qStr = qtyMatch[1];
      qty = numMap[qStr] || parseFloat(qStr) || 1;
      if (qtyMatch[2]) {
        unit = qtyMatch[2];
        if (unit === 'درجن' && qty !== 12) qty = qty * 12;
      }
    }

    const tokens = clause.split(/[\s,،؛؟!\.]+/).map(t => t.trim()).filter(t => t.length >= 2 && !stopWords.has(t) && !numMap[t] && !/^\d+$/.test(t));
    if (tokens.length === 0) continue;

    let bestProd: Product | null = null;
    let bestScore = 0;

    for (const prod of inventory) {
      if (addedIds.has(prod.id)) continue;
      const ur = prod.nameUr || '';
      const en = (prod.nameEn || '').toLowerCase();

      let score = 0;
      for (const tok of tokens) {
        if (ur.includes(tok)) {
          score += 5;
          if (ur.startsWith(tok) || ur.includes(' ' + tok)) score += 3;
        }
        if (en.includes(tok.toLowerCase())) {
          score += 3;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestProd = prod;
      }
    }

    if (bestProd && bestScore >= 5) {
      const p = bestProd as Product;
      addedIds.add(p.id);
      const total = qty * p.salePrice;
      grandTotal += total;
      matchedItems.push({
        name: p.nameUr || p.nameEn,
        qty,
        unit: unit || p.unit || 'عدد',
        price: p.salePrice,
        total,
        matchedProductId: p.id,
      });

      if (matchedItems.length >= 20) break;
    }
  }

  if (matchedItems.length > 0) {
    return {
      isOrder: true,
      items: matchedItems,
      grandTotal,
      estimatedTime: '25 سے 40 منٹ',
    };
  }

  return null;
}

export async function parseVoiceOrderWithAI(
  voiceTranscript: string,
  inventory: Product[]
): Promise<{
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }[];
  confidence: number;
  notes: string;
}> {
  try {
    const productsContext = inventory
      .map(
        (p) =>
          `ID: ${p.id} | NameUr: ${p.nameUr} | NameEn: ${p.nameEn} | Unit: ${p.unit} | SalePrice: ${p.salePrice}`
      )
      .join('\n');

    const prompt = `Analyze this spoken order transcription (which may be in spoken Urdu or English) from a shopkeeper or customer:
Spoken text: "${voiceTranscript}"

Match each item mentioned with the closest matching product from this inventory list:
${productsContext}

Extract quantities and units (e.g. 5 kg sugar -> quantity: 5, unit: "Kg").
Return strictly ONLY a valid JSON object with this exact structure:
{
  "items": [
    {
      "productId": "kar-01",
      "productName": "سفید چینی",
      "quantity": 5,
      "unit": "Kg",
      "unitPrice": 155,
      "total": 775
    }
  ],
  "confidence": 0.95,
  "notes": "Parsed successfully"
}
`;

    const response = await groqClient.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (error) {
    console.error('Error parsing voice order with AI:', error);
    return { items: [], confidence: 0, notes: 'Failed to parse speech' };
  }
}
