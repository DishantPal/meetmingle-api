import { CustomHono } from "@/types/app.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"

export const app = new CustomHono()

export const moduleDetails = {
    name: 'users',
    description: '`user` is also an entity, but NOT a contextual entity.',
}

// Test User Route
const ParamsSchema = z.object({
    id: z
        .string()
        .min(3)
        .openapi({
            param: {
                name: 'id',
                in: 'path',
            },
            example: '1212121',
        }),
})

const UserSchema = z
    .object({
        id: z.string().openapi({
            example: '123',
        }),
        name: z.string().openapi({
            example: 'John Doe',
        }),
        age: z.number().openapi({
            example: 42,
        }),
    })
    .openapi('User')

const route = createRoute({
    method: 'get',
    path: '/{id}',
    request: {
        params: ParamsSchema,
    },
    tags: ['users'],
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: UserSchema,
                },
            },
            description: 'Retrieve the user',
        },
    },
})

app.openapi(route, (c) => {
    const { id } = c.req.valid('param')
    return c.json(
        {
            id,
            age: 20,
            name: 'Ultra-man',
        },
        200 // You should specify the status code even if it is 200.
    )
})

export default app;