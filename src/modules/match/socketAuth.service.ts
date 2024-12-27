import { config } from '@/config/index.js'
import { verify } from 'hono/jwt'

export const decodeSocketAuthToken = async (token: string): Promise<any> => {
    const tokenWithoutBearerKeyword = token.includes("Bearer ") ? token.replace("Bearer ","") : token;

    try {
        return await verify(tokenWithoutBearerKeyword, config.jwt.secret)
    } catch (error) {
        console.log("🚀 ~ decodeSocketAuthToken ~ error:", error)
        return null
    }
}