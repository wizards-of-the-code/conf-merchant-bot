import winston from 'winston';

export const defaultTransportOptions = {
  datePattern: 'MM-DD-YYYY-HH',
  zippedArchive: true,
  maxSize: '15m',
  maxFiles: '14d',
  dirname: 'logs',
};

export const defaultTransport = new winston.transports.DailyRotateFile({
  filename: '%DATE%.log',
  ...defaultTransportOptions,
});
