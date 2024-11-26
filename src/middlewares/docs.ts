import { config } from "@/config/index.js";
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
        servers: [{ url: config.app.url }],
        info: {
            title: `${config.app.name} API`,
            version: 'v1.1.1',
            description: `This doc contains the apis used in the ${config.app.name} app`,
        },
        openapi: '3.1.0',
        // tags,
        // security: [{ bearerAuth: [] }],  // Changed from cookieAuth to bearerAuth
    });

    app.get(
        '/docs',
        apiReference({
            pageTitle: `${config.app.name} API Reference`,
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