import { existsSync } from 'fs';
import logger from './logger';

export async function ensureBuilt(buildPath: string, forceBuild: boolean) {
    logger.info('Server Startup', 'Checking build status...');
    
    if (existsSync(buildPath) && !forceBuild) {
        logger.info('Build Check', 'Found build directory, skipping build...');
    } else {
        logger.info('Build Check', 'Building client...');

        const process = Bun.spawn(['bun', 'run', 'build'], {
            cwd: '../client'
        });

        await process.exited; // Make sure build completes before continuing
    }
}