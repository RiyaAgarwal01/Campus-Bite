import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

interface MenuItemInput {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  availability: boolean;
  preparationTime: number;
  isVeg: boolean;
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'CampusBite API',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  });
});

app.get('/api/payments/config', (_req, res) => {
  const configured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  res.json({
    razorpayConfigured: configured,
    keyId: configured ? process.env.RAZORPAY_KEY_ID : null,
    supportedMethods: configured ? ['COD', 'UPI', 'RAZORPAY'] : ['COD'],
  });
});

app.post('/api/payments/create-order', async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    res.status(503).json({
      mode: 'unconfigured',
      error: 'Razorpay keys are not configured on the server.',
      message:
        'Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment secrets to accept live UPI/Card payments, or place your order via Cash on Delivery.',
    });
    return;
  }

  const amount = Number(req.body?.amount);
  const receipt = String(req.body?.receipt || `cb_${Date.now()}`).slice(0, 40);

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Invalid order amount.' });
    return;
  }

  try {
    const authToken = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt,
      }),
    });

    const data = await rzpRes.json();
    if (!rzpRes.ok) {
      res.status(rzpRes.status).json({
        error: data?.error?.description || 'Failed to initialize Razorpay order.',
      });
      return;
    }

    res.json({
      mode: 'live',
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ error: 'Unable to reach Razorpay payment gateway.' });
  }
});

app.post('/api/payments/verify', (req, res) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(503).json({ verified: false, error: 'Razorpay secret not configured.' });
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ verified: false, error: 'Missing payment verification fields.' });
    return;
  }

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const verified = expected === razorpay_signature;
  res.json({ verified });
});

app.post('/api/ai/recommend', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY in Secrets.',
    });
    return;
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 500) : '';
  const budget = req.body?.budget ? Number(req.body.budget) : null;
  const dietaryPreference = typeof req.body?.dietaryPreference === 'string' ? req.body.dietaryPreference : 'any';
  const menuItems: MenuItemInput[] = Array.isArray(req.body?.menuItems) ? req.body.menuItems : [];

  if (!message) {
    res.status(400).json({ error: 'Please ask a question or share your meal budget.' });
    return;
  }

  const availableMenu = menuItems
    .filter((item) => item && item.availability === true)
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      isVeg: item.isVeg,
      preparationTime: item.preparationTime,
      description: item.description,
    }));

  if (availableMenu.length === 0) {
    res.status(400).json({ error: 'No available menu items were provided for recommendation.' });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are CampusBite Meal Guide, a helpful student nutrition and food assistant for college students in Dehradun, Uttarakhand.
STRICT GROUNDING RULES:
1. You MUST ONLY recommend items that exist in the AVAILABLE_MENU list below.
2. NEVER invent menu items, combos, dishes, or prices not explicitly listed in AVAILABLE_MENU.
3. Always state exact prices in Indian Rupees (₹) matching AVAILABLE_MENU.
4. Respect any budget or vegetarian preference stated by the student. If a combo is requested, ensure the sum of prices fits the budget.
5. Keep your reply warm, practical, and under 120 words.
6. Return only IDs from AVAILABLE_MENU in recommendedFoodIds.`;

    const prompt = `AVAILABLE_MENU:
${JSON.stringify(availableMenu, null, 2)}

Student preferences:
- Budget constraint: ${budget ? `₹${budget}` : 'Not specified'}
- Dietary preference: ${dietaryPreference}
- Student query: "${message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Helpful student-friendly meal recommendation using exact menu names and ₹ prices.',
            },
            recommendedFoodIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exact id strings from AVAILABLE_MENU for the recommended items.',
            },
            comboSummary: {
              type: Type.STRING,
              description: 'Short summary label of the suggested meal or combo.',
            },
            estimatedTotal: {
              type: Type.NUMBER,
              description: 'Sum of the recommended items in INR.',
            },
          },
          required: ['reply', 'recommendedFoodIds'],
        },
      },
    });

    const rawText = (response.text || '{}').trim();
    const parsed = JSON.parse(rawText);
    const validIdSet = new Set(availableMenu.map((m) => m.id));
    const safeIds: string[] = Array.isArray(parsed.recommendedFoodIds)
      ? parsed.recommendedFoodIds.filter((id: unknown): id is string => typeof id === 'string' && validIdSet.has(id))
      : [];

    const computedTotal = safeIds.reduce((sum, id) => {
      const found = availableMenu.find((m) => m.id === id);
      return sum + (found ? found.price : 0);
    }, 0);

    res.json({
      reply: typeof parsed.reply === 'string' ? parsed.reply : 'Here are the best matches from our current kitchen menu.',
      recommendedFoodIds: safeIds,
      comboSummary: typeof parsed.comboSummary === 'string' ? parsed.comboSummary : 'Curated CampusBite Pick',
      estimatedTotal: computedTotal > 0 ? computedTotal : Number(parsed.estimatedTotal) || 0,
    });
  } catch (err) {
    console.error('Gemini recommendation error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate meal recommendation.';
    res.status(502).json({ error: msg });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusBite server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CampusBite server:', err);
  process.exit(1);
});
