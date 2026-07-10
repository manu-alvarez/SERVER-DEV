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
    // Simple load balancer / round robin logic could go here, for now use Key 1
    const apiKey = process.env.GEMINI_API_KEY_1; 
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    const targetUrl = `https://generativelanguage.googleapis.com/${version}/models/${modelAndAction}?key=${apiKey}`;
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error: any) {
    console.error('Gemini Proxy Error:', error);
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
