export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

class Logger {
  private format(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>): LogPayload {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      ...(data && { data }),
    };
  }

  public debug(message: string, context?: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(JSON.stringify(this.format("debug", message, context, data)));
    }
  }

  public info(message: string, context?: string, data?: Record<string, unknown>): void {
    console.info(JSON.stringify(this.format("info", message, context, data)));
  }

  public warn(message: string, context?: string, data?: Record<string, unknown>): void {
    console.warn(JSON.stringify(this.format("warn", message, context, data)));
  }

  public error(message: string, context?: string, data?: Record<string, unknown>): void {
    console.error(JSON.stringify(this.format("error", message, context, data)));
  }
}

export const logger = new Logger();
