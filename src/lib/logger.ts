type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private isDevelopment = import.meta.env.DEV;

    private log(level: LogLevel, ...args: any[]) {
        if (this.isDevelopment || level === 'error') {
            const timestamp = new Date().toISOString();
            const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

            switch (level) {
                case 'info':
                    console.log(prefix, ...args);
                    break;
                case 'warn':
                    console.warn(prefix, ...args);
                    break;
                case 'error':
                    console.error(prefix, ...args);
                    break;
                case 'debug':
                    console.debug(prefix, ...args);
                    break;
            }
        }
    }

    info(...args: any[]) {
        this.log('info', ...args);
    }

    warn(...args: any[]) {
        this.log('warn', ...args);
    }

    error(...args: any[]) {
        this.log('error', ...args);
    }

    debug(...args: any[]) {
        this.log('debug', ...args);
    }
}

export const logger = new Logger();
