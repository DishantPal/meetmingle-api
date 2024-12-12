import { CustomHono, Env } from './types/app.js'
import { app as testUserRoutes } from './modules/testuser/index.js'
import { contentRoutes } from './modules/content/index.js'
import { authRoutes } from './modules/auth/index.js'
import { settingRoutes } from './modules/settings/index.js'
import { userRoutes } from './modules/user/index.js'
import { coinRoutes } from './modules/coins/index.js'

export function setupRoutes(app: CustomHono<Env>) {
  // Register routes
  // app.route('/users', testUserRoutes)
  app.route('/auth', authRoutes)
  app.route('/settings', settingRoutes)
  app.route('/content', contentRoutes)
  app.route('/user', userRoutes)
  app.route('/coins', coinRoutes)

  return app
}