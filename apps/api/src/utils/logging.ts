interface LogContext {
  method?: string;
  path?: string;
  status?: number;
  duration?: number;
  error?: string;
  [key: string]: any;
}

export function log(level: 'info' | 'error' | 'warn', message: string, context: LogContext = {}) {
  // Redact sensitive fields
  const sanitized = { ...context };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitized
  };
  
  console.log(JSON.stringify(logEntry));
}

export function logRequest(method: string, path: string, status: number, duration: number) {
  log('info', 'Request processed', { method, path, status, duration });
}

export function logError(message: string, error: Error, context: LogContext = {}) {
  log('error', message, { 
    ...context, 
    error: error.message,
    stack: error.stack 
  });
}
