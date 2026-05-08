export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public errors?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
