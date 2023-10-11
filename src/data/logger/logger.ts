import winston from 'winston';
import 'winston-daily-rotate-file';
import ConfigService from '../../bot/config/ConfigService';
import { loggerColors } from './constants';
import { defaultTransport } from './transports';

const config = new ConfigService();
const { combine, timestamp, printf } = winston.format;

// eslint-disable-next-line
const myFormat = printf(({ message, timestamp, level }) => `[${timestamp}] [${level}]: ${message}`);

const logger = winston.createLogger({
  level: config.get('LOGGER_LEVEL') || 'info',
  format: combine(timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }), myFormat),
  transports: [defaultTransport],
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
