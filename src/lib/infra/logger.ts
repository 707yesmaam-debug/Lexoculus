import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
    level: isProduction ? 'info' : 'debug',
    browser: {
        asObject: true,
    },
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
    },
    // Redact sensitive keys
    redact: {
        paths: [
            'email',
            'password',
            'token',
            'authorization',
            'Authorization',
            'github_oauth_token',
            'api_key'
        ],
        remove: true,
    },
});

export default logger;
