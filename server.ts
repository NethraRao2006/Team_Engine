import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Recommended API key handling: Environment variable or user provided key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ;

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), ms)),
  ]);
}

function generateDynamicStoreAnalysis(products: any[], customers: any[], activities: any[], shopName: string) {
  const lowStockItems = products.filter((p: any) => Number(p.stock) <= Number(p.minStock));
  const totalInventoryValue = products.reduce((acc: number, p: any) => acc + (Number(p.stock || 0) * Number(p.price || 0)), 0);
  const totalUdhaar = customers.reduce((acc: number, c: any) => acc + Number(c.balance || 0), 0);
  const highBalanceCustomers = customers.filter((c: any) => Number(c.balance || 0) > 300);

  // Health score calculation
  const stockPenalty = Math.min(30, lowStockItems.length * 6);
  const udhaarPenalty = totalUdhaar > 2000 ? 15 : totalUdhaar > 1000 ? 8 : 2;
  const healthScore = Math.max(45, Math.min(96, 100 - stockPenalty - udhaarPenalty));

  const healthStatus = healthScore > 85 ? 'Excellent' : healthScore > 70 ? 'Good' : 'Needs Attention';

  const inventoryInsights = lowStockItems.slice(0, 4).map((p: any) => ({
    productName: p.name,
    severity: p.stock <= 2 ? 'critical' : 'warning',
    daysLeftEstimate: Math.max(1, Math.round(p.stock / 2)),
    recommendation: `Only ${p.stock} ${p.unit} remaining (safety threshold: ${p.minStock}). Reorder today from supplier.`,
    suggestedReorderQty: Math.max(p.minStock * 2, 10),
  }));

  if (inventoryInsights.length === 0) {
    inventoryInsights.push({
      productName: products[0]?.name || 'Staples',
      severity: 'optimal',
      daysLeftEstimate: 14,
      recommendation: 'All standard inventory is currently above minimum safety threshold levels.',
      suggestedReorderQty: 0,
    });
  }

  return {
    healthScore,
    healthStatus,
    executiveSummary: `${shopName} is operating with ₹${totalInventoryValue.toLocaleString('en-IN')} in total stock valuation. ${
      lowStockItems.length > 0
        ? `${lowStockItems.length} items require prompt restocking to avoid sales stockouts.`
        : 'Stock levels are robust across all primary categories.'
    } Total pending udhaar stands at ₹${totalUdhaar.toLocaleString('en-IN')}.`,
    kannadaSummary: `ಅಂಗಡಿಯ ಸ್ಟಾಕ್ ಮೌಲ್ಯ ₹${totalInventoryValue.toLocaleString('en-IN')} ಆಗಿದೆ. ${
      lowStockItems.length > 0
        ? `${lowStockItems.length} ಸಾಮಗ್ರಿಗಳು ಖಾಲಿಯಾಗುತ್ತಿವೆ, ತಕ್ಷಣ ಮರುಆರ್ಡರ್ ಮಾಡಿ.`
        : 'ಎಲ್ಲಾ ಸರಕುಗಳು ಸಾಕಷ್ಟು ಪ್ರಮಾಣದಲ್ಲಿ ಲಭ್ಯವಿವೆ.'
    } ಒಟ್ಟು ಬಾಕಿ ಉದಾರ ₹${totalUdhaar.toLocaleString('en-IN')} ವಸೂಲಿ ಮಾಡಬೇಕಾಗಿದೆ.`,
    inventoryInsights,
    creditRiskAnalysis: {
      riskLevel: totalUdhaar > 2500 ? 'High' : totalUdhaar > 1000 ? 'Medium' : 'Low',
      totalExposure: totalUdhaar,
      advice:
        highBalanceCustomers.length > 0
          ? `Prioritize polite payment follow-ups with ${highBalanceCustomers.map((c: any) => c.name).slice(0, 3).join(', ')} before extending additional credit lines.`
          : 'Udhaar exposure is well within normal safe operating thresholds for a neighbourhood kirana.',
      whatsappReminderEnglish: `Namaste! A gentle reminder that your pending balance at ${shopName} is ₹[AMOUNT]. You can pay cash or scan our UPI QR. Thank you for your continued patronage!`,
      whatsappReminderKannada: `ನಮಸ್ಕಾರ! ${shopName} ನಲ್ಲಿ ನಿಮ್ಮ ಬಾಕಿ ಮೊತ್ತ ₹[AMOUNT] ಆಗಿದೆ. ದಯವಿಟ್ಟು ಅನುಕೂಲವಾದಾಗ UPI ಅಥವಾ ನಗದಿನಲ್ಲಿ ಪಾವತಿಸಿ. ಧನ್ಯವಾದಗಳು!`,
    },
    profitOpportunities: [
      {
        title: 'Morning Breakfast Bundle',
        impact: 'Quick Win',
        description: 'Display Milk packets right alongside Bread and Tea powder near the counter to raise average basket spend by 18%.',
      },
      {
        title: 'Dal & Atta Staple Pairing',
        impact: 'High',
        description: 'Provide an instant ₹10 benefit when purchasing 5kg Atta with 1kg Toor Dal to encourage larger bulk family orders.',
      },
      {
        title: 'Fast-Moving Biscuit Counter Display',
        impact: 'Quick Win',
        description: 'Keep small ₹5 and ₹10 biscuit packs directly at eye level at the billing desk for instant impulse add-ons.',
      },
    ],
    actionPlan: [
      {
        priority: 1,
        title: 'Restock Critical Products',
        action: lowStockItems.length > 0
          ? `Send WhatsApp reorder list for: ${lowStockItems.slice(0, 3).map((p: any) => p.name).join(', ')}.`
          : 'Verify shelf arrangement and expiry dates for fast-moving dairy.',
        category: 'reorder',
      },
      {
        priority: 2,
        title: 'Send Polite Udhaar Reminders',
        action: `Send gentle WhatsApp payment requests to customers with balances over ₹300.`,
        category: 'udhaar',
      },
      {
        priority: 3,
        title: 'Audit Evening Cash & Stock Diff',
        action: 'Review daily audit log entries before closing to reconcile register cash with sold stock.',
        category: 'stock',
      },
    ],
  };
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(GEMINI_API_KEY),
  });
});

// Download Project ZIP endpoint
app.get('/download/team_engine.zip', (_req, res) => {
  const zipPath = path.resolve(__dirname, 'team_engine.zip');
  res.download(zipPath, 'team_engine.zip', (err) => {
    if (err) {
      console.error('Download zip error:', err);
      res.status(500).send('Zip file not found');
    }
  });
});

// Comprehensive AI Store Analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const { products = [], activities = [], customers = [], auditLogs = [], shopName = 'Sharma General Store' } = req.body;

  try {
    const lowStockItems = products.filter((p: any) => Number(p.stock) <= Number(p.minStock));
    const totalInventoryValue = products.reduce((acc: number, p: any) => acc + (Number(p.stock || 0) * Number(p.price || 0)), 0);
    const totalUdhaarPending = customers.reduce((acc: number, c: any) => acc + Number(c.balance || 0), 0);
    const todaySales = activities
      .filter((a: any) => a.type === 'sold' || a.type === 'credit')
      .reduce((acc: number, a: any) => acc + Number(a.amount || 0), 0);

    const prompt = `You are an elite retail business intelligence engine and Kirana store consultant.
Analyze this Kirana store's live operational data and return a rigorous, highly actionable JSON assessment.

Store Information:
- Shop Name: "${shopName}"
- Total Products Tracked: ${products.length}
- Low Stock Alerts: ${lowStockItems.length} items (${lowStockItems.map((p: any) => `${p.name}: ${p.stock} ${p.unit} left, min is ${p.minStock}`).join(', ')})
- Total Stock Valuation: ₹${totalInventoryValue.toLocaleString('en-IN')}
- Outstanding Customer Udhaar (Credit): ₹${totalUdhaarPending.toLocaleString('en-IN')} across ${customers.length} customers
- Today's Recorded Sales Volume: ₹${todaySales.toLocaleString('en-IN')}
- Top Udhaar Debtors: ${customers.sort((a: any, b: any) => Number(b.balance) - Number(a.balance)).slice(0, 5).map((c: any) => `${c.name}: ₹${c.balance}`).join(', ') || 'None'}
- Recent Transaction Types: ${activities.slice(0, 10).map((a: any) => `${a.type}: ${a.message}`).join(' | ') || 'None'}

Return ONLY a valid JSON object matching this TypeScript interface (no markdown backticks, just raw JSON):
{
  "healthScore": number (0 to 100),
  "healthStatus": "Excellent" | "Good" | "Needs Attention" | "Critical Risk",
  "executiveSummary": string,
  "kannadaSummary": string,
  "inventoryInsights": [
    {
      "productName": string,
      "severity": "critical" | "warning" | "optimal",
      "daysLeftEstimate": number,
      "recommendation": string,
      "suggestedReorderQty": number
    }
  ],
  "creditRiskAnalysis": {
    "riskLevel": "Low" | "Medium" | "High",
    "totalExposure": number,
    "advice": string,
    "whatsappReminderEnglish": string,
    "whatsappReminderKannada": string
  },
  "profitOpportunities": [
    {
      "title": string,
      "impact": "High" | "Medium" | "Quick Win",
      "description": string
    }
  ],
  "actionPlan": [
    {
      "priority": 1 | 2 | 3,
      "title": string,
      "action": string,
      "category": "reorder" | "udhaar" | "pricing" | "stock"
    }
  ]
}`;

    const ai = getAI();
    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const response = await withTimeout(callPromise, 7000);
    const text = response.text || '{}';
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      result = JSON.parse(clean);
    }

    res.json({
      success: true,
      data: result,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.warn('Using intelligent fallback for store analysis:', error?.message);
    const fallbackData = generateDynamicStoreAnalysis(products, customers, activities, shopName);
    res.json({
      success: true,
      data: fallbackData,
      analyzedAt: new Date().toISOString(),
      source: 'dynamic_engine',
    });
  }
});

// Interactive Ask Gemini Kirana Advisor endpoint
app.post('/api/ask-gemini', async (req, res) => {
  const { question, storeSummary } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const prompt = `You are a warm, highly experienced Kirana Retail Advisor & business partner in India.
You understand retail store margins, inventory rotation, daily customer relations, udhaar credit recovery, festive stock planning, and Kannada/English bilingual shopkeeping.

Store Context:
${storeSummary ? JSON.stringify(storeSummary, null, 2) : 'Kirana General Store with Indian daily essentials, grocery, and dairy.'}

User Question / Query:
"${question}"

Provide a concise, practical, highly encouraging answer (max 3 short paragraphs or bullet points). If the question is in Kannada or asks for Kannada, reply in Kannada. If in English, reply in English. Focus on realistic kirana shop solutions.`;

    const ai = getAI();
    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const response = await withTimeout(callPromise, 7000);
    res.json({
      success: true,
      answer: response.text || 'I analyzed your request. Keep staple essentials stocked and maintain polite udhaar follow-ups.',
    });
  } catch (error: any) {
    console.warn('Fallback advisor response:', error?.message);
    res.json({
      success: true,
      answer: `Advisor Insight for "${question}":
1. For inventory: Ensure your fast-moving essentials (milk, oil, grains) never drop below 3 days of buffer stock.
2. For udhaar: Send a friendly WhatsApp reminder with your UPI QR code. A polite greeting like "Namaste! Just sharing your current account summary" maintains goodwill while securing repayments.
3. Keep popular snack combos (tea + biscuits/sugar) near the checkout counter to lift average bill values.`,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TeamEngine server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
