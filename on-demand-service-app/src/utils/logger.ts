type LogMeta = unknown;

export const logger = {
  info: (message: string, meta?: LogMeta) => {
    if (meta !== undefined) {
      console.info(`[INFO] ${message}`, meta);
      return;
    }
    console.info(`[INFO] ${message}`);
  },
  error: (message: string, meta?: LogMeta) => {
    if (meta !== undefined) {
      console.error(`[ERROR] ${message}`, meta);
      return;
    }
    console.error(`[ERROR] ${message}`);
  },
  debug: (message: string, meta?: LogMeta) => {
    if (meta !== undefined) {
      console.debug(`[DEBUG] ${message}`, meta);
      return;
    }
    console.debug(`[DEBUG] ${message}`);
  },
};

export const logInfo = logger.info;
export const logError = logger.error;
export const logDebug = logger.debug;
