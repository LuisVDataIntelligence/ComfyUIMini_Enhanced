import { serve } from 'bun';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { existsSync, readFileSync } from 'fs';
import logger from './util/logger';
import { handleCliArgs, version } from './util/cli';
import { ensureBuilt } from './util/build';
import createDebugRouter from './src/routes/debugRouter';
import tagSearchRouter from './src/routes/tagSearchRouter';
import comfyuiRouter, { websocket } from './src/routes/comfyuiRouter';
import versionRouter from './src/routes/versionRouter';

const cliArgs = handleCliArgs();
const PORT = Number(process.env.PORT) || cliArgs.port;
const HOST = process.env.HOST || cliArgs.host;
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === 'true';
const CERT_PATH = process.env.HTTPS_CERT || '../certs/cert.pem';
const KEY_PATH = process.env.HTTPS_KEY || '../certs/key.pem';

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,https://localhost:5173')
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
    app.route('/api/version', versionRouter);

    app.use('/assets/*', serveStatic({ root: cliArgs.buildPath }))
    app.use('/icons/*', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.js', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.css', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.ico', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.png', serveStatic({ root: cliArgs.buildPath }))

    app.use('*', serveStatic({ root: cliArgs.buildPath, path: './index.html' }))

    logger.info('Server Startup', 'Starting server...');
    
    // Configure server options
    const serverOptions: any = {
        port: PORT,
        fetch: app.fetch,
        websocket,
        hostname: HOST,
        development: false,
    };

    // Add HTTPS configuration if enabled
    if (HTTPS_ENABLED) {
        if (!existsSync(CERT_PATH) || !existsSync(KEY_PATH)) {
            logger.error('HTTPS Setup', `Certificate files not found:`);
            logger.error('HTTPS Setup', `  Cert: ${CERT_PATH}`);
            logger.error('HTTPS Setup', `  Key: ${KEY_PATH}`);
            logger.error('HTTPS Setup', 'Run ./run.sh generate-certs to create development certificates');
            process.exit(1);
        }

        try {
            const cert = readFileSync(CERT_PATH, 'utf8');
            const key = readFileSync(KEY_PATH, 'utf8');
            
            serverOptions.tls = {
                cert: cert,
                key: key,
            };
            
            logger.info('HTTPS Setup', 'HTTPS enabled with certificate files');
            logger.info('HTTPS Setup', `Certificate path: ${CERT_PATH}`);
            logger.info('HTTPS Setup', `Key path: ${KEY_PATH}`);
        } catch (error) {
            logger.error('HTTPS Setup', `Failed to load certificates: ${error}`);
            process.exit(1);
        }
    }

    const server = serve(serverOptions);
    const protocol = HTTPS_ENABLED ? 'https' : 'http';
    const serverUrl = `${protocol}://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;

    logger.info('Server Startup', '----------------------------------');
    logger.info('Server Startup', `Running on ${serverUrl}`);
    logger.info('Server Startup', `Protocol: ${protocol.toUpperCase()}`);
    logger.info('Server Startup', `Debug mode: ${cliArgs.debug ? 'enabled' : 'disabled'}`);
    logger.info('Server Startup', '----------------------------------');
}

logger.info('Server Startup', `Starting ComfyUIMini, v${version}`);
await ensureBuilt(cliArgs.buildPath, cliArgs.forceBuild);
startServer();
