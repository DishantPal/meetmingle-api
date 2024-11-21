# Technology Stack

## Backend (Node.js + Hono)

### Core Dependencies
- `hono`: Fast web framework
- `drizzle-orm`: Type-safe ORM
- `mysql2`: MySQL client
- `typescript`: Type safety
- `zod`: Schema validation
- `@hono/zod-validator`: Hono + Zod integration
- `passport`: Authentication
- `passport-google-oauth20`: Google OAuth
- `@hono/jwt`: JWT authentication
- `@scaleler/docs`: API documentation
- `@hono/socket.io`: WebSocket support for real-time features
- `@hono/rate-limit`: Rate limiting
- `ioredis`: Redis client (for rate limiting and caching)
- `@sentry/node`: Error tracking

### Development Dependencies
- `tsx`: TypeScript execution
- `vitest`: Unit testing
- `@types/*`: TypeScript type definitions
- `eslint`: Code linting
- `prettier`: Code formatting
- `husky`: Git hooks

## Admin Panel (Laravel + Filament)

### Core Dependencies
- `filament/filament`: Admin panel
- `filament/notifications`: Admin notifications
- `laravel/telescope`: Debugging and monitoring

### Development Dependencies
- `laravel/pint`: PHP code style fixer
- `phpstan`: Static analysis
- `phpunit`: Testing

## Mobile App (React Native + NativeWind)

### Core Dependencies
- `nativewind`: Tailwind for React Native
- `@react-navigation`: Navigation
- `@tanstack/react-query`: Data fetching
- `zustand`: State management
- `socket.io-client`: Real-time communication
- `@react-native-google-signin`: Google Sign-in
- `react-native-mmkv`: Local storage
- `react-native-image-crop-picker`: Image selection

### Development Dependencies
- `eslint`: Code linting
- `prettier`: Code formatting
- `jest`: Testing
- `@testing-library/react-native`: Component testing