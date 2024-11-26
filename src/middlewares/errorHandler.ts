import { handleZodError, RESPONSE_CODES, sendError } from "@/utils/response.js"
import { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { StatusCode } from "hono/utils/http-status"
import { StatusCodes } from "http-status-codes"
import { ZodError } from "zod"

export const notFoundHandler = (c: Context) => {
    return sendError(
      c,
      'Route not found',
      RESPONSE_CODES.NOT_FOUND,
      StatusCodes.NOT_FOUND,
      {
        path: c.req.path,
        method: c.req.method
      }
    )
  }
  
  export const errorHandler = (err: Error, c: Context) => {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      path: c.req.path
    })
  
    if (err instanceof ZodError) {
      return handleZodError(c, err)
    }
  
    if (err instanceof HTTPException) {
      return sendError(
        c,
        err.message,
        RESPONSE_CODES.INTERNAL_ERROR,
        err.status as StatusCode
      )
    }
  
    return sendError(
      c,
      'Internal server error',
      RESPONSE_CODES.INTERNAL_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR,
      process.env.NODE_ENV === 'development' 
        ? { error: err.message }
        : undefined
    )
  }