import { CustomHono, Env } from './types/app.js'
import { app as testUserRoutes } from './modules/user/index.js'
import { app as authRoutes } from './modules/auth/index.js'

export function setupRoutes(app: CustomHono<Env>) {
  // Register routes
  app.route('/users', testUserRoutes)
  app.route('/auth', authRoutes)

  return app
}