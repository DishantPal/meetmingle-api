import { CustomHono, Env } from "@/types/app.js"

export const CustomHonoAppFactory = () => {
    return new CustomHono<Env>({
        defaultHook: (result, c) => {
            if (!result.success) throw result.error
        },
    })  
}