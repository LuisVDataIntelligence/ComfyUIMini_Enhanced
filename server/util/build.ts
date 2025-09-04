import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { promisify } from 'util';
import logger from './logger';

export async function ensureBuilt(buildPath: string, forceBuild: boolean) {
    logger.info('Server Startup', 'Checking build status...');
    
    if (existsSync(buildPath) && !forceBuild) {
        logger.info('Build Check', 'Found build directory, skipping build...');
    } else {
        logger.info('Build Check', 'Building client...');

        // Use Node.js spawn instead of Bun.spawn
        const childProcess = spawn('npm', ['run', 'build'], {
            cwd: '../client',
            stdio: 'inherit'
        });

        // Convert callback-based to Promise
        await new Promise<void>((resolve, reject) => {
            childProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Build process failed with code ${code}`));
                }
            });
            childProcess.on('error', reject);
        });
    }
}