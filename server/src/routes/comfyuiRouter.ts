import { Hono } from 'hono';
import { cors } from 'hono/cors';

const router = new Hono();

// Enable CORS for ComfyUI proxy routes
router.use('*', cors());

// Default ComfyUI URL (can be overridden by environment)
const getComfyUIUrl = () => process.env.COMFYUI_URL || 'http://localhost:8188';

// Proxy ComfyUI object_info endpoint
router.get('/object_info', async (c) => {
    try {
        const comfyuiUrl = getComfyUIUrl();
        console.log(`Proxying object_info request to ${comfyuiUrl}`);
        
        const response = await fetch(`${comfyuiUrl}/api/object_info`);
        
        if (!response.ok) {
            throw new Error(`ComfyUI responded with ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Object info fetched successfully (${Object.keys(data).length} nodes)`);
        
        return c.json(data);
    } catch (error) {
        console.error('Error proxying ComfyUI object_info:', error);
        return c.json({ 
            error: 'Failed to fetch ComfyUI object_info',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Proxy ComfyUI prompt endpoint
router.post('/prompt', async (c) => {
    try {
        const body = await c.req.json();
        const comfyuiUrl = getComfyUIUrl();
        console.log(`Proxying prompt request to ${comfyuiUrl}`);
        
        const response = await fetch(`${comfyuiUrl}/prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        
        if (!response.ok) {
            throw new Error(`ComfyUI responded with ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Prompt submitted with ID: ${data.prompt_id || 'unknown'}`);
        
        return c.json(data);
    } catch (error) {
        console.error('Error proxying ComfyUI prompt:', error);
        return c.json({ 
            error: 'Failed to submit prompt to ComfyUI',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Proxy ComfyUI queue endpoint
router.get('/queue', async (c) => {
    try {
        const comfyuiUrl = getComfyUIUrl();
        const response = await fetch(`${comfyuiUrl}/queue`);
        
        if (!response.ok) {
            throw new Error(`ComfyUI responded with ${response.status}`);
        }
        
        const data = await response.json();
        return c.json(data);
    } catch (error) {
        console.error('Error proxying ComfyUI queue:', error);
        return c.json({ 
            error: 'Failed to fetch ComfyUI queue',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Proxy ComfyUI history endpoint  
router.get('/history', async (c) => {
    try {
        const comfyuiUrl = getComfyUIUrl();
        const response = await fetch(`${comfyuiUrl}/history`);
        
        if (!response.ok) {
            throw new Error(`ComfyUI responded with ${response.status}`);
        }
        
        const data = await response.json();
        return c.json(data);
    } catch (error) {
        console.error('Error proxying ComfyUI history:', error);
        return c.json({ 
            error: 'Failed to fetch ComfyUI history',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Proxy ComfyUI interrupt endpoint
router.post('/interrupt', async (c) => {
    try {
        const comfyuiUrl = getComfyUIUrl();
        const response = await fetch(`${comfyuiUrl}/interrupt`, {
            method: 'POST',
        });
        
        if (!response.ok) {
            throw new Error(`ComfyUI responded with ${response.status}`);
        }
        
        return c.json({ success: true, message: 'Interrupt signal sent' });
    } catch (error) {
        console.error('Error proxying ComfyUI interrupt:', error);
        return c.json({ 
            error: 'Failed to interrupt ComfyUI',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

export default router;