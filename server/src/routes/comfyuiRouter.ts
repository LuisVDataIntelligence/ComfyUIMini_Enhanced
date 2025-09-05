import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ComfyUIPromptSchema } from '../schemas/comfyui.js';

const router = new Hono();

// Enable CORS for ComfyUI proxy routes
router.use('*', cors());

// Default ComfyUI URL (can be overridden by environment)
const getComfyUIUrl = () => process.env.COMFYUI_URL || 'http://localhost:8188';

// Proxy ComfyUI object_info endpoint
router.get('/object_info', async (c) => {
  try {
    const comfyuiUrl = getComfyUIUrl();
    const response = await fetch(`${comfyuiUrl}/api/object_info`);
    if (!response.ok) throw new Error(`ComfyUI responded with ${response.status}`);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error proxying ComfyUI object_info:', error);
    return c.json({
      error: 'Failed to fetch ComfyUI object_info',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Proxy ComfyUI prompt endpoint
router.post('/prompt', async (c) => {
  try {
    const rawBody = await c.req.json();
    
    // Validate request payload with Zod schema
    const validationResult = ComfyUIPromptSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error('Invalid ComfyUI prompt payload:', validationResult.error.format());
      return c.json({
        error: 'Invalid prompt payload',
        details: 'Request does not match expected schema',
        validation_errors: validationResult.error.format(),
      }, 400);
    }
    
    const body = validationResult.data;
    const comfyuiUrl = getComfyUIUrl();
    const response = await fetch(`${comfyuiUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`ComfyUI responded with ${response.status}`);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error proxying ComfyUI prompt:', error);
    return c.json({
      error: 'Failed to submit prompt to ComfyUI',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Proxy ComfyUI queue endpoint
router.get('/queue', async (c) => {
  try {
    const comfyuiUrl = getComfyUIUrl();
    const response = await fetch(`${comfyuiUrl}/queue`);
    if (!response.ok) throw new Error(`ComfyUI responded with ${response.status}`);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error proxying ComfyUI queue:', error);
    return c.json({
      error: 'Failed to fetch ComfyUI queue',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Proxy ComfyUI history endpoints
router.get('/history', async (c) => {
  try {
    const comfyuiUrl = getComfyUIUrl();
    const response = await fetch(`${comfyuiUrl}/history`);
    if (!response.ok) throw new Error(`ComfyUI responded with ${response.status}`);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error proxying ComfyUI history:', error);
    return c.json({ error: 'Failed to fetch ComfyUI history' }, 500);
  }
});

router.get('/history/:promptId', async (c) => {
  try {
    const comfyuiUrl = getComfyUIUrl();
    const promptId = c.req.param('promptId');
    const response = await fetch(`${comfyuiUrl}/history/${promptId}`);
    if (!response.ok) throw new Error(`ComfyUI responded with ${response.status}`);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error proxying ComfyUI history by id:', error);
    return c.json({ error: 'Failed to fetch ComfyUI history item' }, 500);
  }
});

// Proxy ComfyUI interrupt endpoint
router.post('/interrupt', async (c) => {
  try {
    const comfyuiUrl = getComfyUIUrl();
    const response = await fetch(`${comfyuiUrl}/interrupt`, { method: 'POST' });
    if (!response.ok) throw new Error(`ComfyUI responded with ${response.status}`);
    return c.json({ success: true, message: 'Interrupt signal sent' });
  } catch (error) {
    console.error('Error proxying ComfyUI interrupt:', error);
    return c.json({ error: 'Failed to interrupt ComfyUI' }, 500);
  }
});

// Proxy ComfyUI view endpoint for images
router.get('/view', async (c) => {
  try {
    const comfyuiUrl = getComfyUIUrl();
    const query = c.req.query();
    const searchParams = new URLSearchParams(query);
    const response = await fetch(`${comfyuiUrl}/api/view?${searchParams.toString()}`);
    return new Response(response.body, { status: response.status, headers: response.headers });
  } catch (error) {
    console.error('Error proxying ComfyUI view:', error);
    return c.text('Failed to fetch image', 500);
  }
});

export default router;
