import { serve } from 'bun';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import logger from './util/logger';
import { handleCliArgs, version } from './util/cli';
import { ensureBuilt } from './util/build';
import tagSearchRouter from './src/routes/tagSearchRouter';
import createDebugRouter from './src/routes/debugRouter';

const cliArgs = handleCliArgs();
const PORT = Number(process.env.PORT) || cliArgs.port;
const HOST = process.env.HOST || cliArgs.host;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

function startServer() {
    const app = new Hono();
    app.use(
        '*',
        cors({
            origin: allowedOrigins,
            allowMethods: ['GET', 'POST'],
        })
    );

    // API routes
    app.route('/api/tags', tagSearchRouter);
    app.route('/api/debug', createDebugRouter(cliArgs));

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
    logger.info('Server Startup', '----------------------------------');
}

logger.info('Server Startup', `Starting ComfyUIMini, v${version}`);
await ensureBuilt(cliArgs.buildPath, cliArgs.forceBuild);
startServer();
