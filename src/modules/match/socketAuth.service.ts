import { config } from '@/config/index.js'
import { verify } from 'hono/jwt'

export const decodeSocketAuthToken = async (token: string): Promise<any> => {
    try {
        return await verify(token, config.jwt.secret)
    } catch (error) {
        return null
    }
}