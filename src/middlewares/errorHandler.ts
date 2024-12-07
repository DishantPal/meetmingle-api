import { Env } from "@/types/app.js"
import { AppError, ERROR_CODES, ValidationError } from "@/utils/response.js"
import { Context } from "hono"
import { ZodError } from "zod"

export const notFoundHandler = (c: Context<Env>) => {
  throw new AppError(
    404,
    ERROR_CODES.RESOURCE_NOT_FOUND,
    'Route not found',
    {
      path: c.req.path,
      method: c.req.method
    }
  )
}
// Error Handler
export const errorHandler = (err: Error, c: Context<Env>) => {
  const requestId = c.get('requestId');

  const isSystemError = (err instanceof AppError && (
    err.code === ERROR_CODES.INTERNAL_ERROR ||
    err.code === ERROR_CODES.SERVICE_UNAVAILABLE ||
    err.code === ERROR_CODES.DATABASE_ERROR
  )) || !(err instanceof AppError || err instanceof ValidationError || err instanceof ZodError);
  // Log system errors or technical errors
  if (isSystemError) {
    console.error('Error:', {
      requestId,
      code: err instanceof AppError ? err.code : 'UNKNOWN',
      message: err.message,
      stack: err.stack,
      path: c.req.path
    });
  }

  // Handle Zod Errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError(err);
    return c.json(validationError.toResponse(requestId), validationError.statusCode);
  }

  // Handle App Errors
  if (err instanceof AppError) {
    return c.json(err.toResponse(requestId), err.statusCode);
  }

  // Handle unknown errors
  const internalError = new AppError(
    500,
    ERROR_CODES.INTERNAL_ERROR,
    'Internal server error',
    process.env.NODE_ENV === 'development'
      ? { error: err.message }
      : undefined
  );

  return c.json(internalError.toResponse(requestId), internalError.statusCode);
}