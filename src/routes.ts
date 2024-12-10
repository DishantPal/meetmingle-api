import { CustomHono, Env } from './types/app.js'
import { app as testUserRoutes } from './modules/user/index.js'
import { app as authRoutes } from './modules/auth/index.js'
import { app as settingRoutes } from './modules/settings/index.js'
import { app as contentRoutes } from './modules/content/index.js'

export function setupRoutes(app: CustomHono<Env>) {
  // Register routes
  // app.route('/users', testUserRoutes)
  app.route('/auth', authRoutes)
  app.route('/settings', settingRoutes)
  app.route('/content', contentRoutes)

  return app
}