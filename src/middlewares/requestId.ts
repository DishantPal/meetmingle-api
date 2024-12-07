import { nanoid } from 'nanoid'
import { Context, Next } from 'hono'
import { Env } from '@/types/app.js';

export const requestId = async (
  c: Context<Env>, 
  next: Next
) => {
  const requestId = nanoid();
  c.set('requestId', requestId);
  c.res.headers.set('X-Request-ID', requestId);
  await next();
}