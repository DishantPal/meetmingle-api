import { CustomHono } from "@/types/app.js";
import { apiReference } from "@scalar/hono-api-reference";

const applyDocsMiddleware = (app: CustomHono) => {
    const registry = app.openAPIRegistry;

    registry.registerComponent('securitySchemes', 'bearerAuth', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',  // if you're using JWT tokens
        description: 'Enter your Bearer token in the format: Bearer <token>'
    });


    app.doc('/openapi.json', {
        servers: [{ url: 'http://localhost:3000' }],
        info: {
            title: `App API`,
            version: 'v1.1.1',
            description: 'This is apps description',
        },
        openapi: '3.1.0',
        // tags,
        // security: [{ bearerAuth: [] }],  // Changed from cookieAuth to bearerAuth
    });

    app.get(
        '/docs',
        apiReference({
            pageTitle: 'Video Call API Reference',
            spec: {
                url: '/openapi.json',
            },
            defaultHttpClient: {
                targetKey: 'node',
                clientKey: 'fetch',
            }
        }),
    );


};



export default applyDocsMiddleware;