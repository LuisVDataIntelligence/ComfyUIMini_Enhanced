import { serve } from 'bun';
import { existsSync } from 'fs';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import logger from './logger';
import { parseArgs } from 'util';

const buildPath = './build';

function getArgs() {
    const { values } = parseArgs({
        args: Bun.argv,
        options: {
            'force-build': {
                type: 'boolean',
                default: false
            }
        },
        allowPositionals: true
    });

    return values;
}

async function ensureBuilt() {
    if (existsSync(buildPath) && !getArgs()['force-build']) {
        logger.info('Build Check', 'Found build directory, skipping build...');
    } else {
        logger.info('Build Check', 'Building client...');
        const process = Bun.spawn(['bun', 'run', 'build'], {
            cwd: '../client'
        });

        await process.exited;
    }
}

function startServer() {
    const app = new Hono();

    app.use('/assets/*', serveStatic({ root: buildPath }))
    app.use('/*.js', serveStatic({ root: buildPath }))
    app.use('/*.css', serveStatic({ root: buildPath }))
    app.use('/*.ico', serveStatic({ root: buildPath }))
    app.use('/*.png', serveStatic({ root: buildPath }))

    app.use('*', serveStatic({ root: buildPath, path: './index.html' }))

    logger.info('Server Startup', 'Starting server...');
    const server = serve({
        port: 1811,
        fetch: app.fetch,
        hostname: '0.0.0.0',
        development: false,
    });

    logger.info('Server Startup', '----------------------------------');
    logger.info('Server Startup', `Running on ${server.url.toString()} `);
    logger.info('Server Startup', '----------------------------------');
}

await ensureBuilt();
startServer();