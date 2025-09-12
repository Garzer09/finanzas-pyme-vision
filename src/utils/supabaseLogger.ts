interface SupabaseLogEntry {
  id: string;
  timestamp: number;
  operation: string;
  table?: string;
  params?: any;
  error?: {
    message: string;
    code?: string;
  };
  duration?: number;
}

class SupabaseLogger {
  private logs: SupabaseLogEntry[] = [];
  private maxLogs = 50;

  log(operation: string, table?: string, params?: any, error?: any, duration?: number) {
    const entry: SupabaseLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      operation,
      table,
      params,
      error: error ? {
        message: error.message || error.toString(),
        code: error.code
      } : undefined,
      duration
    };

    this.logs.unshift(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SUPABASE] ${operation}`, {
        table,
        params,
        error: error?.message,
        duration: duration ? `${duration}ms` : undefined
      });
    }
  }

  getLogs(): SupabaseLogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Wrapper methods for common operations
  logSelect(table: string, params?: any, error?: any, duration?: number) {
    this.log('SELECT', table, params, error, duration);
  }

  logInsert(table: string, params?: any, error?: any, duration?: number) {
    this.log('INSERT', table, params, error, duration);
  }

  logUpdate(table: string, params?: any, error?: any, duration?: number) {
    this.log('UPDATE', table, params, error, duration);
  }

  logDelete(table: string, params?: any, error?: any, duration?: number) {
    this.log('DELETE', table, params, error, duration);
  }

  logFunction(functionName: string, params?: any, error?: any, duration?: number) {
    this.log('FUNCTION', functionName, params, error, duration);
  }

  logStorage(operation: string, params?: any, error?: any, duration?: number) {
    this.log(`STORAGE_${operation.toUpperCase()}`, undefined, params, error, duration);
  }
}

export const supabaseLogger = new SupabaseLogger();