const IS_PROD = import.meta.env.PROD;
const INGEST_URL = '/api/logs/ingest';

const sendLogToBackend = (level: 'info' | 'warn' | 'error', message: string, extra: any = {}) => {
  if (!IS_PROD) return;

  const payload = JSON.stringify({
    level,
    message,
    url: window.location.href,
    user: localStorage.getItem('user_email') || 'anonymous',
    stack: extra.stack || null,
  });

  // Use sendBeacon for reliable delivery, falling back to standard fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon(INGEST_URL, new Blob([payload], { type: 'application/json' }));
  } else {
    fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).catch(() => {}); // Suppress errors to prevent infinite loop logging
  }
};

const logger = {
  debug: (message: string, ...args: any[]) => {
    if (!IS_PROD) console.debug(`[DEBUG] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (!IS_PROD) console.info(`[INFO] ${message}`, ...args);
    sendLogToBackend('info', message);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
    sendLogToBackend('warn', message);
  },
  error: (message: string, errorObj: any = {}) => {
    console.error(`[ERROR] ${message}`, errorObj);
    sendLogToBackend('error', message, {
      stack: errorObj?.stack || errorObj?.message || errorObj
    });
  }
};

export default logger;
