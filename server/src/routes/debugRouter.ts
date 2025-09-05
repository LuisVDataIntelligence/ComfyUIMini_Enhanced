import { Hono } from 'hono';

interface DebugConfig {
    enabled: boolean;
    showConnectionLogs: boolean;
    showConfigChanges: boolean;
    buildType: 'development' | 'production' | 'debug';
    environment: string;
}

export function createDebugRouter(cliArgs: any) {
    const app = new Hono();

    // Get debug configuration
    app.get('/config', (c) => {
        const isProduction = process.env.NODE_ENV === 'production';
        const isDevelopment = process.env.NODE_ENV === 'development' || cliArgs.debug;
        
        // Security: No debug features in production
        if (isProduction) {
            return c.json({
                enabled: false,
                showConnectionLogs: false,
                showConfigChanges: false,
                buildType: 'production',
                environment: 'production'
            } as DebugConfig);
        }

        const debugConfig: DebugConfig = {
            enabled: Boolean(cliArgs.debug || isDevelopment),
            showConnectionLogs: Boolean(cliArgs.debugConnection || cliArgs.debug),
            showConfigChanges: Boolean(cliArgs.debugConfig || cliArgs.debug),
            buildType: cliArgs.debug ? 'debug' : (isDevelopment ? 'development' : 'production'),
            environment: process.env.NODE_ENV || 'unknown'
        };

        return c.json(debugConfig);
    });

    // Test connection endpoint for debugging
    app.post('/test-connection', async (c) => {
        if (process.env.NODE_ENV === 'production') {
            return c.json({ error: 'Debug endpoints not available in production' }, 403);
        }

        try {
            const body = await c.req.json();
            const { url } = body;

            if (!url) {
                return c.json({ error: 'URL required' }, 400);
            }

            const startTime = Date.now();
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'text/html,application/json,*/*' }
            });
            const endTime = Date.now();

            const headersObj: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headersObj[key] = value;
            });

            return c.json({
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                responseTime: endTime - startTime,
                headers: headersObj
            });
        } catch (error) {
            return c.json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime: null
            });
        }
    });

    // Get server debug info
    app.get('/info', (c) => {
        if (process.env.NODE_ENV === 'production') {
            return c.json({ error: 'Debug endpoints not available in production' }, 403);
        }

        return c.json({
            version: process.env.npm_package_version || '2.0.0',
            nodeEnv: process.env.NODE_ENV,
            platform: process.platform,
            nodeVersion: process.version,
            uptimeSeconds: process.uptime(),
            memoryUsage: process.memoryUsage(),
            debugFlags: {
                debug: cliArgs.debug,
                debugConnection: cliArgs.debugConnection,
                debugConfig: cliArgs.debugConfig
            }
        });
    });

    return app;
}

export default createDebugRouter;
