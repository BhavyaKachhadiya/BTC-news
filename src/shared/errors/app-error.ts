export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;

  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ProviderError extends AppError {
  public readonly statusCode = 502;
  public readonly code = "PROVIDER_ERROR";

  constructor(
    public readonly provider: string,
    message: string,
    cause?: unknown,
  ) {
    super(`[${provider}] ${message}`, cause);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly code = "VALIDATION_ERROR";

  constructor(
    message: string,
    public readonly issues?: unknown,
  ) {
    super(message);
  }
}

export class IndicatorError extends AppError {
  public readonly statusCode = 422;
  public readonly code = "INDICATOR_ERROR";

  constructor(
    public readonly indicator: string,
    message: string,
  ) {
    super(`Indicator calculation error [${indicator}]: ${message}`);
  }
}

export class JevError extends AppError {
  public readonly statusCode = 502;
  public readonly code = "JEV_ERROR";

  constructor(message: string, cause?: unknown) {
    super(`Jev interpretation error: ${message}`, cause);
  }
}

export class SignalError extends AppError {
  public readonly statusCode = 500;
  public readonly code = "SIGNAL_ERROR";

  constructor(message: string) {
    super(`Signal generation error: ${message}`);
  }
}

export class DatabaseError extends AppError {
  public readonly statusCode = 500;
  public readonly code = "DATABASE_ERROR";

  constructor(message: string, cause?: unknown) {
    super(`Database error: ${message}`, cause);
  }
}
