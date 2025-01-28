import { serveStatic } from 'hono/serve-static'
import applyDocsMiddleware from './middlewares/docs.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import applyGlobalMiddlewares from './middlewares/index.js'
import { setupRoutes } from './routes.js'
import { CustomHono, Env } from './types/app.js'

import path from "path";
import fs from "fs";

const baseApp = new CustomHono<Env>

applyGlobalMiddlewares(baseApp)

applyDocsMiddleware(baseApp)

// baseApp.use('/favicon.ico', serveStatic({ path: './favicon.ico' }))

setupRoutes(baseApp)

baseApp.get('/test', (ctx) => {
  const filePath = path.join(process.cwd(), 'public', 'index.html');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return ctx.html(fileContent);
})

// Not found handler
baseApp.notFound((ctx) => {
  return notFoundHandler(ctx);
});

// Error handler
baseApp.onError((err, ctx) => {
  return errorHandler(err, ctx);
});

export default baseApp;
