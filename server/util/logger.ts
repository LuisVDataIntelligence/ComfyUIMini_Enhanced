class Logger {
    private shouldLog: boolean;

    constructor() {
        this.shouldLog = true;
    }

    info(origin: string, ...data: any) {
        if (!this.shouldLog) return;

        const currentTime = new Date().toLocaleString();

        console.info(
            `[${currentTime}] [%c${origin}%c] [%cINFO%c]`,
            'color: lightblue', '', 'color: #BBBBBB', '',
            ...data
        );
    }

    warn(origin: string, ...data: any) {
        const currentTime = new Date().toLocaleString();

        console.warn(
            `[${currentTime}] [%c${origin}%c] [%cWARN%c]`,
            'color: lightblue', '', 'color: orange', '',
            ...data
        );
    }

    error(origin: string, ...data: any) {
        const currentTime = new Date().toLocaleString();

        console.error(
            `[${currentTime}] [%c${origin}%c] [%cERROR%c]`,
            'color: lightblue', '', 'color: red', '',
            ...data
        );
    }
}

const logger = new Logger();

export default logger;