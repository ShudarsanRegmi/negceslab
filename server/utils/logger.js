const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Resolve log folder path (default: /var/log/negceslab with local fallback)
let logDir = process.env.LOG_DIR || '/var/log/negceslab';

try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (error) {
  // Fallback to local server/logs directory if /var/log is unwritable (e.g. dev system)
  logDir = path.join(__dirname, '../logs');
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (err) {
    // If local mkdir also fails, we'll log to stderr and use console fallback
    console.error("Failed to create log directory:", err.message);
  }
}

const logFormat = winston.format.printf(({ timestamp, level, category, message, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    category: category || 'system',
    message,
    ...meta
  });
});

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, category, message }) => {
    return `[${timestamp}] [${category || 'system'}] ${level}: ${message}`;
  })
);

const transports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : devFormat
  })
];

// Add file transports if the directory was created successfully
if (logDir) {
  transports.push(
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    })
  );
}

const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    logFormat
  ),
  transports: transports
});

// Namespace logger helper
const getLogger = (category) => {
  return {
    fatal: (msg, meta) => winstonLogger.log('crit', msg, { category, ...meta }),
    error: (msg, meta) => winstonLogger.error(msg, { category, ...meta }),
    warn: (msg, meta) => winstonLogger.warn(msg, { category, ...meta }),
    info: (msg, meta) => winstonLogger.info(msg, { category, ...meta }),
    debug: (msg, meta) => winstonLogger.debug(msg, { category, ...meta })
  };
};

module.exports = getLogger;
