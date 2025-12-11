/**
 * Local test server for Lambda function
 * Run: npm run dev
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import { resolve } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load .env from the lambda directory
dotenv.config({ path: resolve(__dirname, '../.env') });

import express, { Request, Response } from 'express';
import { handler } from './index';
import { 
  getBalance, 
  getHistory, 
  getStats, 
  grantSubscription, 
  grantPurchase, 
  getProducts 
} from './handlers/creditHandlers';
import { handleRevenueCatWebhook } from './handlers/revenuecatWebhook';
import os from 'os';

const app = express();
const PORT = 3000;

/**
 * Get local IP address automatically
 */
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  
  // Look for non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  
  return 'localhost';
}

/**
 * Kill any process using PORT before starting
 */
async function killPortProcess(port: number) {
  try {
    console.log(`🔍 Checking if port ${port} is in use...`);
    
    // Find process using the port
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    const pid = stdout.trim();
    
    if (pid) {
      console.log(`🔪 Killing process ${pid} on port ${port}...`);
      await execAsync(`kill -9 ${pid}`);
      console.log(`✅ Port ${port} is now free`);
      
      // Wait a bit for the port to be fully released
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log(`✅ Port ${port} is already free`);
    }
  } catch (error) {
    // If lsof returns nothing, the port is free (this throws an error)
    console.log(`✅ Port ${port} is free`);
  }
}

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`\n📥 ${req.method} ${req.path}`);
  console.log('Query:', req.query);
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']?.substring(0, 50),
  });
  next();
});

// CORS for testing from React Native
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Lambda test server running' });
});

// Lambda endpoint - Generate Image
app.post('/generate-image', async (req: Request, res: Response) => {
  console.log('📥 Received request:', {
    userId: req.body.userId,
    descriptionLength: req.body.description?.length,
    imageBase64Length: req.body.imageBase64?.length,
    model: req.body.model,
  });

  try {
    // Create Lambda event object
    const event = {
      body: JSON.stringify(req.body),
      headers: req.headers,
      httpMethod: 'POST',
      path: '/generate-image',
      requestContext: {
        requestId: `local-${Date.now()}`,
        identity: {
          sourceIp: req.ip,
        },
      },
    };

    // Call Lambda handler
    const result = await handler(event as any);

    // Parse Lambda response
    const statusCode = result.statusCode || 200;
    const body = JSON.parse(result.body);

    console.log('📤 Response:', { statusCode, success: body.success });

    // Send response
    res.status(statusCode).json(body);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Credit endpoints
app.get('/credits/balance', async (req: Request, res: Response) => {
  console.log('💰 GET /credits/balance');
  console.log('  userId:', req.query.userId);
  
  try {
    const event = {
      queryStringParameters: req.query,
      httpMethod: 'GET',
    };
    
    console.log('  Calling getBalance handler...');
    const result = await getBalance(event as any);
    
    console.log('  Response status:', result.statusCode);
    console.log('  Response body:', result.body.substring(0, 200));
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('  ❌ Error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

app.get('/credits/history', async (req: Request, res: Response) => {
  try {
    const event = {
      queryStringParameters: req.query,
      httpMethod: 'GET',
    };
    const result = await getHistory(event as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

app.get('/credits/stats', async (req: Request, res: Response) => {
  try {
    const event = {
      queryStringParameters: req.query,
      httpMethod: 'GET',
    };
    const result = await getStats(event as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

app.post('/credits/grant-subscription', async (req: Request, res: Response) => {
  try {
    const event = {
      body: JSON.stringify(req.body),
      httpMethod: 'POST',
    };
    const result = await grantSubscription(event as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

app.post('/credits/grant-purchase', async (req: Request, res: Response) => {
  console.log('💰 POST /credits/grant-purchase');
  console.log('  Body:', req.body);
  
  try {
    const event = {
      body: JSON.stringify(req.body),
      httpMethod: 'POST',
    };
    
    console.log('  Calling grantPurchase handler...');
    const result = await grantPurchase(event as any);
    
    console.log('  Response status:', result.statusCode);
    console.log('  Response body:', result.body);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('  ❌ Error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

app.get('/credits/products', async (req: Request, res: Response) => {
  try {
    const event = {
      httpMethod: 'GET',
    };
    const result = await getProducts(event as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

app.post('/revenuecat-webhook', async (req: Request, res: Response) => {
  try {
    const event = {
      body: JSON.stringify(req.body),
      headers: req.headers,
      httpMethod: 'POST',
    };
    const result = await handleRevenueCatWebhook(event as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// Start server with port cleanup
(async () => {
  try {
    // Kill any process using the port
    await killPortProcess(PORT);

// Start server
app.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🚀 Moovia Lambda Local Server       ║
  ╠════════════════════════════════════════╣
  ║   Port: ${PORT}                          ║
  ║   Local IP: ${localIP}             ║
  ║   URL: http://${localIP}:${PORT}     ║
  ╠════════════════════════════════════════╣
  ║   Endpoints:                           ║
  ║   • POST /generate-image               ║
  ║   • GET  /credits/balance              ║
  ║   • GET  /credits/history              ║
  ║   • GET  /credits/stats                ║
  ║   • POST /credits/grant-subscription   ║
  ║   • POST /credits/grant-purchase       ║
  ║   • POST /revenuecat-webhook           ║
  ║   • GET  /health                       ║
  ╚════════════════════════════════════════╝
  
  ✅ Server ready for testing!
  💡 Update BACKEND_IP in src/constants/config.ts to: ${localIP}
  `);
});
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();

