/**
 * @file response.ts
 * @description Central utility for handling API responses and errors in a consistent format.
 * This file provides a comprehensive system for API response handling, including:
 * 
 * Core Features:
 * - Standardized error and success response formats
 * - Type-safe error handling with custom error classes
 * - Zod-based response validation
 * - OpenAPI documentation helpers
 * 
 * Key Exports:
 * - ERROR_CODES: Enumeration of all possible error types
 * - AppError: Base error class for application-wide error handling
 * - ValidationError: Specialized error class for handling Zod validation failures
 * - Response Schemas: Zod schemas for validating response structures
 * - Response Functions: Utilities for sending consistent success/error responses
 * - OpenAPI Helpers: Functions for generating OpenAPI documentation
 * 
 * Usage:
 * - For success responses: use sendSuccess() or sendSuccessWithAuthUser()
 * - For error handling: throw new AppError() or ValidationError()
 * - For OpenAPI docs: use defaultResponses and createSuccessRouteDefinition()
 * 
 * All responses follow the format:
 * {
 *   success: boolean
 *   message?: string
 *   data?: any
 *   code?: ErrorCode     // Only for error responses
 *   requestId?: string   // Only for error responses
 *   user?: AuthUser      // Only for authenticated success responses
 * }
 */

import { Context } from 'hono'
import { StatusCode } from 'hono/utils/http-status'
import { z } from 'zod'
import { ZodError } from 'zod'
import { StatusCodes } from 'http-status-codes'
import { AuthUser } from '@/types/user.js'
import { Env } from '@/types/app.js'


// Error Codes
export const ERROR_CODES = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  NOT_FOUND: 'NOT_FOUND',

  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Business Logic
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',

  // Technical/External Services
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

type ErrorResponse = {
  success: false
  message: string
  code: ErrorCode
  requestId: string
  data?: Record<string, any>
}

type ValidationErrorItem = {
  field: string
  message: string
}

type SuccessResponse<T = any> = {
  success: true
  message?: string
  data?: T
  user?: AuthUser
}

// Base Error Class
export class AppError extends Error {
  constructor(
    // public statusCode: number,
    public statusCode: StatusCode,
    public code: ErrorCode,
    message: string,
    public data?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toResponse(requestId: string): ErrorResponse {
    return {
      success: false,
      message: this.message,
      code: this.code,
      requestId,
      ...(this.data && { data: this.data })
    };
  }
}

// Validation Error Class
export class ValidationError extends AppError {
  constructor(input: ZodError | ValidationErrorItem | ValidationErrorItem[]) {
    const errors = ValidationError.normalizeErrors(input);

    super(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      { errors }
    );

    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  private static normalizeErrors(input: ZodError | ValidationErrorItem | ValidationErrorItem[]): ValidationErrorItem[] {
    if (input instanceof ZodError) {
      return input.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
    }

    return Array.isArray(input) ? input : [input];
  }
}

// Response Schemas
export const createErrorResponseSchema = (code: ErrorCode) => z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.literal(code),
  data: z.record(z.any()).optional()
})

export const validationErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.literal(ERROR_CODES.VALIDATION_ERROR),
  data: z.object({
    errors: z.array(z.object({
      field: z.string(),
      message: z.string()
    }))
  })
})

export const SuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string().optional(),
    data: dataSchema.optional(),
    user: z.any().optional() // Replace with proper AuthUserSchema when defined
  })

// Response Functions
export const sendSuccess = <T extends z.ZodType, S extends StatusCode>(
  c: Context<Env>,
  data: z.infer<T>,
  message?: string,
  status?: S
) => {
  return c.json({
    success: true as const,
    data,
    ...(message && { message })
  }, status || 200);
}

export const sendSuccessWithAuthUser = <T extends z.ZodType, S extends StatusCode>(
  c: Context<Env>,
  data: z.infer<T>,
  message?: string,
  status?: S
) => {

  const user = c.get('user');

  return c.json({
    success: true as const,
    data,
    user,
    ...(message && { message })
  }, status || 200);
}


// OpenAPI Doc Helpers
export const createJsonBody = <T extends z.ZodType>(schema: T) => ({
  content: {
    'application/json': {
      schema
    }
  }
})

export const createSuccessRouteDefinition = <T extends z.ZodType>(
  schema: T,
  description: string
) => ({
  content: {
    'application/json': {
      schema: SuccessResponseSchema(schema),
    },
  },
  description: description,
});

export const defaultResponses = {
  // Validation Errors - 400
  [StatusCodes.BAD_REQUEST]: {
    description: 'Validation failed for the request',
    content: {
      'application/json': {
        schema: validationErrorSchema
      }
    }
  },

  // Authentication/Authorization - 401, 403
  [StatusCodes.UNAUTHORIZED]: {
    description: 'Authentication credentials are missing or invalid',
    content: {
      'application/json': {
        schema: createErrorResponseSchema(ERROR_CODES.UNAUTHORIZED)
      }
    }
  },
  [StatusCodes.FORBIDDEN]: {
    description: 'User does not have permission to access this resource',
    content: {
      'application/json': {
        schema: createErrorResponseSchema(ERROR_CODES.FORBIDDEN)
      }
    }
  },

  // Resource Errors - 404, 409
  [StatusCodes.NOT_FOUND]: {
    description: 'The requested resource was not found',
    content: {
      'application/json': {
        schema: createErrorResponseSchema(ERROR_CODES.RESOURCE_NOT_FOUND)
      }
    }
  },
  [StatusCodes.CONFLICT]: {
    description: 'The resource already exists or conflicts with another resource',
    content: {
      'application/json': {
        schema: createErrorResponseSchema(ERROR_CODES.DUPLICATE_RESOURCE)
      }
    }
  },

  // Business Logic Errors - 402, 403
  [StatusCodes.PAYMENT_REQUIRED]: {
    description: 'Insufficient funds or payment required',
    content: {
      'application/json': {
        schema: createErrorResponseSchema(ERROR_CODES.INSUFFICIENT_FUNDS)
      }
    }
  },

  // Technical/Server Errors - 500, 503
  [StatusCodes.INTERNAL_SERVER_ERROR]: {
    description: 'An unexpected error occurred on the server',
    content: {
      'application/json': {
        schema: createErrorResponseSchema(ERROR_CODES.INTERNAL_ERROR)
      }
    }
  },
  [StatusCodes.SERVICE_UNAVAILABLE]: {
    description: 'The service is temporarily unavailable',
    content: {
      'application/json': {
        schema: createErrorResponseSchema(ERROR_CODES.SERVICE_UNAVAILABLE)
      }
    }
  }
}
