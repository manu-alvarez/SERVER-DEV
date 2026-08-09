import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8020;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('CRITICAL: ADMIN_TOKEN is not defined in .env. Exiting for security.');
  process.exit(1);
}

// Enable CORS for frontend applications
app.use(cors({
  origin: '*', // Adjust this to be more restrictive if needed (e.g. ['https://appgen.manuelalvarez.dev'])
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-msbross-admin-token']
}));

app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------
// Security Middleware
// ---------------------------------------------------------
const requireAdminToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-msbross-admin-token'];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing admin token' });
  }
  next();
};

// Apply security middleware to all /api routes
app.use('/api', requireAdminToken);

// ---------------------------------------------------------
// Proxies
// ---------------------------------------------------------

// Gemini Proxy
app.post('/api/gemini/:version/models/:modelAndAction', async (req, res) => {
  try {
    const { version, modelAndAction } = req.params;
    const apiKey = process.env.GEMINI_API_KEY_1; 
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

    const targetUrl = `https://generativelanguage.googleapis.com/${version}/models/${modelAndAction}?key=${apiKey}`;
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Proxy Error' });
  }
});

// OpenAI-Compatible Proxy (OpenRouter, DeepSeek, Mistral, etc.)
app.post('/api/openai/:provider/*', async (req, res) => {
  try {
    const provider = req.params.provider; // e.g. openrouter, deepseek, mistral
    const path = req.params[0]; // e.g. chat/completions
    
    let apiKey = '';
    let baseUrl = '';

    switch (provider) {
      case 'openrouter':
        apiKey = process.env.OPENROUTER_API_KEY || '';
        baseUrl = 'https://openrouter.ai/api/v1';
        break;
      case 'deepseek':
        apiKey = process.env.DEEPSEEK_API_KEY || '';
        baseUrl = 'https://api.deepseek.com/v1';
        break;
      case 'mistral':
        apiKey = process.env.MISTRAL_API_KEY || '';
        baseUrl = 'https://api.mistral.ai/v1';
        break;
      case 'anthropic':
        apiKey = process.env.ANTHROPIC_API_KEY || '';
        baseUrl = 'https://api.anthropic.com/v1';
        break;
      default:
        return res.status(400).json({ error: `Provider ${provider} not supported via this proxy` });
    }

    if (!apiKey) return res.status(500).json({ error: `${provider} API key not configured` });

    const targetUrl = `${baseUrl}/${path}`;
    
    // We pass along auth header to the real provider
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // Anthropic uses x-api-key
    if (provider === 'anthropic') {
      delete headers['Authorization'];
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Proxy Error' });
  }
});

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', secure: true });
});

app.listen(PORT, () => {
  console.log(`[LLM Admin Proxy] Vault is active and listening on port ${PORT}`);
  console.log(`[LLM Admin Proxy] SECURITY: Admin Token is REQUIRED for all /api endpoints.`);
});
