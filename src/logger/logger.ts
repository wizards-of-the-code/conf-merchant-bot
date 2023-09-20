import winston from 'winston';
import 'winston-daily-rotate-file';
import ConfigService from '../config/ConfigService';
import { loggerColors, transportOptions } from './constants';

const { combine, timestamp, printf } = winston.format;

const config = new ConfigService();

const myFormat = printf(({ message, level }) => `[${timestamp}] [${level}]: ${message}`);

const infoTransport = new winston.transports.DailyRotateFile({
  filename: 'combined-%DATE%.log',
  level: 'info',
  ...transportOptions,
});

const errorTransport = new winston.transports.DailyRotateFile({
  filename: 'error-%DATE%.log',
  level: 'error',
  ...transportOptions,
});

const logger = winston.createLogger({
  level: config.get('LOGGER_LEVEL') || 'info',
  format: combine(timestamp({ format: 'DD-MM-YYYY hh:mm:ss A' }), myFormat),
  transports: [infoTransport, errorTransport],
});

winston.addColors(loggerColors);
if (config.get('MODE') !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.colorize({ all: true }),
    }),
  );
}

export default logger;
