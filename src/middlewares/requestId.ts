import { Context, Next } from 'hono'
import { Env } from '@/types/app.js';
import { generateId } from '@/utils/generateId.js';

export const requestId = async (
  c: Context<Env>, 
  next: Next
) => {
  const requestId = generateId();
  c.set('requestId', requestId);
  c.res.headers.set('X-Request-ID', requestId);
  await next();
}