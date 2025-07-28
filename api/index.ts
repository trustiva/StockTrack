import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';

// Create Express app instance
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cache for the initialized server
let serverInstance: any = null;

const initializeServer = async () => {
  if (!serverInstance) {
    try {
      serverInstance = await registerRoutes(app);
    } catch (error) {
      console.error('Failed to initialize server:', error);
      throw error;
    }
  }
  return serverInstance;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initializeServer();
    
    // Convert Vercel request to Express-compatible format
    const expressReq = req as any;
    const expressRes = res as any;
    
    // Handle the request with Express
    return app(expressReq, expressRes);
  } catch (error) {
    console.error('API Handler Error:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}