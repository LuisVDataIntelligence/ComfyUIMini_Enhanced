import { Hono } from 'hono';
import { cors } from 'hono/cors';
import version from '../version.js';

const router = new Hono();

// Enable CORS
router.use('*', cors());

// Get version information
router.get('/', (c) => {
  return c.json({
    app: 'ComfyUIMini Enhanced',
    version: version.number,
    fullVersion: version.fullVersion,
    timestamp: version.timestamp,
    commit: version.commit,
    buildNumber: version.buildNumber
  });
});

// Health check with version
router.get('/health', (c) => {
  return c.json({
    status: 'ok',
    app: 'ComfyUIMini Enhanced',
    version: version.number,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;