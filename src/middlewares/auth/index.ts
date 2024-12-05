import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { AuthUser } from '@/types/user.js'
import { decodeAuthToken, getUserWithProfileByUserId } from './auth.service.js'

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser
  }
}

export const isAuthenticated = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Authorization header missing or invalid' })
  }

  const token = authHeader.split(' ')[1]
  if(!token) throw new HTTPException(401, { message: 'Authorization header missing or invalid' })
  const decoded = await decodeAuthToken(token)

  if (!decoded?.user?.id) {
    throw new HTTPException(401, { message: 'Invalid token' })
  }

  const user = await getUserWithProfileByUserId(Number(decoded.user.id))

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  if (user.is_banned) {
    throw new HTTPException(403, { message: 'User is banned' })
  }

  c.set('user', user)
  await next()
}