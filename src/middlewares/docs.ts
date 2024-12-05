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
            // description: "The Scalar Galaxy is an example OpenAPI specification to test OpenAPI tools and libraries. It’s a fictional universe with fictional planets and fictional data. Get all the data for [all planets](#tag/planets/GET/planets).\n\n## Resources\n\n* https://github.com/scalar/scalar\n* https://github.com/OAI/OpenAPI-Specification\n* https://scalar.com\n\n## Markdown Support\n\nAll descriptions *can* contain ~~tons of text~~ **Markdown**. [If GitHub supports the syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax), chances are we’re supporting it, too. You can even create [internal links to reference endpoints](#tag/authentication/POST/user/signup).\n\n<details>\n  <summary>Examples</summary>\n\n  **Blockquotes**\n\n  > I love OpenAPI. <3\n\n  **Tables**\n\n  | Feature          | Availability |\n  | ---------------- | ------------ |\n  | Markdown Support | ✓            |\n\n  **Accordion**\n\n  ```html\n  <details>\n    <summary>Using Details Tags</summary>\n    <p>HTML Example</p>\n  </details>\n  ```\n\n  **Images**\n\n  Yes, there’s support for images, too!\n\n  ![Empty placeholder image showing the width/height](https://images.placeholders.dev/?width=1280&height=720)\n\n</details>\n",
        },
        openapi: '3.1.0',
        // tags,
        // security: [{ bearerAuth: [] }],  // Defined at each route level
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