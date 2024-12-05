import { Env } from '@/types/app.js';
import { getContext } from 'hono/context-storage';

export const getAuthUser = () => {
  return getContext<Env>().var.user;
};