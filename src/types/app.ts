import { OpenAPIHono } from "@hono/zod-openapi";
import { AuthUser } from "./user.js";

export type Env = {
    Variables: {
        user: AuthUser;
        requestId: string;
    };
};

export class CustomHono<E extends Env = Env> extends OpenAPIHono<E> {}