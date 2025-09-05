import { Hono } from 'hono';
import { cors } from 'hono/cors';
// import { debugLog } from '../utils/debug.js';

const app = new Hono();

// Enable CORS for ComfyUI proxy routes
app.use('*', cors());

// Proxy ComfyUI object_info endpoint
app.get('/object_info', async (c) => {
    try {
        // debugLog('comfyui', 'Proxying object_info request to ComfyUI');
        
        // Get ComfyUI URL from environment or default
        const comfyuiUrl = 'http://localhost:49170';
        
        const response = await fetch(`${comfyuiUrl}/api/object_info`);
        const data = await response.json();
        
        // debugLog('comfyui', `Object info fetched successfully (${Object.keys(data).length} nodes)`);
        
        return c.json(data);
    } catch (error) {
        console.error('Error proxying ComfyUI object_info:', error);
        return c.json({ error: 'Failed to fetch ComfyUI object_info' }, 500);
    }
});

// Proxy ComfyUI prompt endpoint
app.post('/prompt', async (c) => {
    try {
        // debugLog('comfyui', 'Proxying prompt request to ComfyUI');
        
        const body = await c.req.json();
        const comfyuiUrl = 'http://localhost:49170';
        
        const response = await fetch(`${comfyuiUrl}/prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        
        const data = await response.json();
        
        // debugLog('comfyui', `Prompt submitted with ID: ${data.prompt_id}`);
        
        return c.json(data);
    } catch (error) {
        console.error('Error proxying ComfyUI prompt:', error);
        return c.json({ error: 'Failed to submit prompt to ComfyUI' }, 500);
    }
});

// Proxy ComfyUI queue endpoint
app.get('/queue', async (c) => {
    try {
        const comfyuiUrl = 'http://localhost:49170';
        
        const response = await fetch(`${comfyuiUrl}/queue`);
        const data = await response.json();
        
        return c.json(data);
    } catch (error) {
        console.error('Error proxying ComfyUI queue:', error);
        return c.json({ error: 'Failed to fetch ComfyUI queue' }, 500);
    }
});

// Proxy ComfyUI history endpoint
app.get('/history/:promptId?', async (c) => {
    try {
        const promptId = c.req.param('promptId');
        const comfyuiUrl = 'http://localhost:49170';
        
        const url = promptId ? `${comfyuiUrl}/history/${promptId}` : `${comfyuiUrl}/history`;
        const response = await fetch(url);
        const data = await response.json();
        
        return c.json(data);
    } catch (error) {
        console.error('Error proxying ComfyUI history:', error);
        return c.json({ error: 'Failed to fetch ComfyUI history' }, 500);
    }
});

// Proxy ComfyUI interrupt endpoint
app.post('/interrupt', async (c) => {
    try {
        const comfyuiUrl = 'http://localhost:49170';
        
        const response = await fetch(`${comfyuiUrl}/interrupt`, {
            method: 'POST',
        });
        
        return new Response(response.body, {
            status: response.status,
            headers: response.headers,
        });
    } catch (error) {
        console.error('Error proxying ComfyUI interrupt:', error);
        return c.json({ error: 'Failed to interrupt ComfyUI' }, 500);
    }
});

// Proxy ComfyUI view endpoint for images
app.get('/view', async (c) => {
    try {
        const comfyuiUrl = 'http://localhost:49170';
        const query = c.req.query();
        const searchParams = new URLSearchParams(query);
        
        const response = await fetch(`${comfyuiUrl}/api/view?${searchParams.toString()}`);
        
        return new Response(response.body, {
            status: response.status,
            headers: response.headers,
        });
    } catch (error) {
        console.error('Error proxying ComfyUI view:', error);
        return c.text('Failed to fetch image', 500);
    }
});

export default app;