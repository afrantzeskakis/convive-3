import { Router, Request, Response } from 'express';

const router = Router();

// Check if Perplexity API key is configured
router.get('/status', (req: Request, res: Response) => {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  res.json({
    available: !!apiKey,
    message: apiKey 
      ? 'Perplexity API key is configured' 
      : 'Perplexity API key is not configured'
  });
});

export default router;