import { Context } from 'hono'
import { StatusCode } from 'hono/utils/http-status'
import { z } from 'zod'
import { ZodError } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { 
  StatusCodes,
  ReasonPhrases 
} from 'http-status-codes'

// Response Status Constants
export const RESPONSE_CODES = {
  SUCCESS: 'SUCCESS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY'
} as const

export type ResponseCode = typeof RESPONSE_CODES[keyof typeof RESPONSE_CODES]

// Response Types
type ErrorResponse = {
  success: false
  message: string
  code: ResponseCode
  data?: Record<string, any>
}

type ValidationError = {
  field: string
  message: string
}

type SuccessResponse<T = any> = {
  success: true
  message?: string
  data: T
}

// Response Schemas for OpenAPI
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.string(),
  data: z.record(z.any()).optional()
})

export const ValidationErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.literal(RESPONSE_CODES.VALIDATION_ERROR),
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
    data: dataSchema
  })

// Response Helpers for Routes
export const sendError = (
  c: Context,
  message: string,
  code: ResponseCode,
  status: StatusCode = StatusCodes.BAD_REQUEST,
  data?: Record<string, any>
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    code,
    ...(data && { data })
  }
  return c.json(response, status)
}

export const sendSuccess = <T>(
  c: Context,
  data: T,
  message?: string,
  status: StatusCode = StatusCodes.OK
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  }
  return c.json(response, status)
}

export const handleZodError = (c: Context, error: ZodError): Response => {
  const validationErrors: ValidationError[] = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))

  return sendError(
    c,
    'Validation failed',
    RESPONSE_CODES.VALIDATION_ERROR,
    StatusCodes.BAD_REQUEST,
    { errors: validationErrors }
  )
}

// OpenAPI Response Helpers
export const createJsonBody = <T extends z.ZodType>(schema: T) => ({
  content: {
    'application/json': {
      schema
    }
  }
})

export const createSuccessResponse = <T extends z.ZodType>(
  dataSchema: T,
  description: string,
  statusCode: number = StatusCodes.OK
) => ({
  [statusCode]: {
    description,
    content: {
      'application/json': {
        schema: SuccessResponseSchema(dataSchema)
      }
    }
  }
})

export const createErrorResponse = (
  description: string,
  statusCode: number = StatusCodes.BAD_REQUEST
) => ({
  [statusCode]: {
    description,
    content: {
      'application/json': {
        schema: ErrorResponseSchema
      }
    }
  }
})

// Default responses for OpenAPI
export const defaultResponses = {
  [StatusCodes.BAD_REQUEST]: {
    description: ReasonPhrases.BAD_REQUEST,
    content: {
      'application/json': {
        schema: ValidationErrorSchema
      }
    }
  },
  [StatusCodes.UNAUTHORIZED]: {
    description: ReasonPhrases.UNAUTHORIZED,
    content: {
      'application/json': {
        schema: ErrorResponseSchema
      }
    }
  },
  [StatusCodes.FORBIDDEN]: {
    description: ReasonPhrases.FORBIDDEN,
    content: {
      'application/json': {
        schema: ErrorResponseSchema
      }
    }
  },
  [StatusCodes.NOT_FOUND]: {
    description: ReasonPhrases.NOT_FOUND,
    content: {
      'application/json': {
        schema: ErrorResponseSchema
      }
    }
  },
  [StatusCodes.TOO_MANY_REQUESTS]: {
    description: ReasonPhrases.TOO_MANY_REQUESTS,
    content: {
      'application/json': {
        schema: ErrorResponseSchema
      }
    }
  },
  [StatusCodes.INTERNAL_SERVER_ERROR]: {
    description: ReasonPhrases.INTERNAL_SERVER_ERROR,
    content: {
      'application/json': {
        schema: ErrorResponseSchema
      }
    }
  }
}