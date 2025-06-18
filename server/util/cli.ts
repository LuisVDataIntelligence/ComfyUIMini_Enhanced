import yargs from "yargs";
import { hideBin } from "yargs/helpers";

let port = 1811;
let host = 'localhost';

export function handleCliArgs() {
    const argv = yargs(hideBin(process.argv))
        .version('2.0.0')
        .option('host', {
            alias: 'listen',
            type: 'string',
            description: 'Specify the host to listen on, or listen on all if no args provided.'
        })
        .option('port', {
            alias: 'p',
            type: 'number',
            description: 'Specify the port to listen on',
            default: port
        })
        .option('force-build', {
            type: 'boolean',
            description: 'Force a rebuild of the build folder.',
            default: false
        })
        .option('build-path', {
            type: 'string',
            description: 'The build path to host from.',
            default: './build'
        })
        .check((argv) => {
            if (argv.port && isNaN(argv.port)) {
                throw new Error('Port must be a number');
            }

            if (Object.prototype.hasOwnProperty.call(argv, 'host') && argv.host === '') {
                argv.host = '0.0.0.0';
            } else if (!argv.host) {
                argv.host = host;
            }

            return true;
        })
        .strict()
        .parseSync();

    return argv;
}