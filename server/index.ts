import { serve } from 'bun';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import logger from './util/logger';
import { handleCliArgs, version } from './util/cli';
import { ensureBuilt } from './util/build';
import createDebugRouter from './src/routes/debugRouter';
import tagSearchRouter from './src/routes/tagSearchRouter';
import comfyuiRouter from './src/routes/comfyuiRouter';

const cliArgs = handleCliArgs();
const PORT = Number(process.env.PORT) || cliArgs.port;
const HOST = process.env.HOST || cliArgs.host;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

function startServer() {
    const app = new Hono();

    // Strict CORS: allow only configured origins in production
    app.use(
        '*',
        cors({
            origin: (origin) => {
                if (process.env.NODE_ENV !== 'production') return origin ?? '*';
                return allowedOrigins.includes(origin ?? '') ? origin : '';
            },
            allowMethods: ['GET', 'POST', 'OPTIONS'],
        })
    );

    // Simple payload size guard
    app.use('*', async (c, next) => {
        const len = Number(c.req.header('content-length') ?? 0);
        const limit = Number(process.env.BODY_LIMIT_BYTES ?? 1_000_000);
        if (len > limit) {
            return c.text('Payload too large', 413);
        }
        await next();
    });

    // API routes
    app.route('/api/debug', createDebugRouter(cliArgs));
    app.route('/api/tags', tagSearchRouter);
    app.route('/api/comfyui', comfyuiRouter);

    app.use('/assets/*', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.js', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.css', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.ico', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.png', serveStatic({ root: cliArgs.buildPath }))

    app.use('*', serveStatic({ root: cliArgs.buildPath, path: './index.html' }))

    logger.info('Server Startup', 'Starting server...');
    const server = serve({
        port: PORT,
        fetch: app.fetch,
        hostname: HOST,
        development: false,
    });

    logger.info('Server Startup', '----------------------------------');
    logger.info('Server Startup', `Running on ${server.url.toString()} `);
    logger.info('Server Startup', `Debug mode: ${cliArgs.debug ? 'enabled' : 'disabled'}`);
    logger.info('Server Startup', '----------------------------------');
}

logger.info('Server Startup', `Starting ComfyUIMini, v${version}`);
await ensureBuilt(cliArgs.buildPath, cliArgs.forceBuild);
startServer();
