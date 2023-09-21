import dotenv from 'dotenv';

dotenv.config();

export const loggerColors = {
  error: 'red',
  warn: 'brown',
  info: 'blue',
};

export const loggerLevels = {
  error: 'error',
  warn: 'warn',
  info: 'info',
};

export const transportOptions = {
  datePattern: 'MM-DD-YYYY-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  dirname: `${process.env.LOGS_PATH}`,
};
