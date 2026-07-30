import winston from 'winston';
import { appConfig } from './config';

const { combine, timestamp, colorize, printf, errors, json } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, ...meta }) => {
    const metaKeys = Object.keys(meta).filter((k) => k !== 'service');
    const metaSuffix =
      metaKeys.length > 0
        ? ` ${JSON.stringify(Object.fromEntries(metaKeys.map((k) => [k, meta[k]])))}`
        : '';
    return `${String(ts)} ${level}: ${String(message)}${metaSuffix}`;
  })
);

export const logger = winston.createLogger({
  level: appConfig.logging.level,
  defaultMeta: { service: appConfig.logging.serviceName },
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
  ],
});

export function logError(message: string, error?: unknown): void {
  const serialized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
  logger.error(message, { error: serialized });
}
