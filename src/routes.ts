import { CustomHono, Env } from './types/app.js'
import { app as userRoutes, moduleDetails as userModuleDetails } from './modules/user/index.js'

export function setupRoutes(app: CustomHono<Env>) {
  // Register routes
  app.route('/users', userRoutes)
  
  // Add more module registrations as needed
  // registry.registerComponent('tags', 'posts', postModuleDetails);
  // registry.registerComponent('tags', 'comments', commentModuleDetails);
  
  return app
}