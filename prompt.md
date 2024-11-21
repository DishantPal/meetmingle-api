# Dating App Backend API Development Prompt

You are tasked with developing a backend API for a dating app using Node.js with Hono framework. The system uses MySQL for the database and follows a microservices architecture pattern.

## Technology Stack Context
- Framework: Hono (Node.js)
- Database ORM: Drizzle ORM
- Database: MySQL
- Real-time: Socket.IO
- Cache/Rate Limiting: Redis
- Authentication: JWT + Passport
- Validation: Zod
- Documentation: @scaleler/docs
- Error Tracking: Sentry

## Database Schema Overview
The application uses a comprehensive MySQL database with the following core tables:
- users: Core user authentication
- user_profiles: Detailed user information
- matches: User match records
- match_reports: User reporting system
- subscription_plans: Premium plan details
- user_subscriptions: User subscription records
- coin_packages: Virtual currency packages
- user_coins: User coin balances
- coin_transactions: Coin transaction history
- reward_activities: Configurable reward system
- static_pages: CMS content
- content_blocks: Dynamic content
- app_settings: Global configurations

All tables use UUID as primary keys and implement soft deletes where applicable.

## Required API Endpoints

### 1. Authentication Module
```plaintext
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/verify-email
POST /auth/forgot-password
POST /auth/reset-password
GET /auth/me
```

### 2. Profile Module
```plaintext
GET /profile
PUT /profile
POST /profile/image
GET /profile/:id
PUT /profile/interests
PUT /profile/preferences
```

### 3. Matching Module
```plaintext
POST /match/find
POST /match/end
POST /match/report
GET /match/history
```

### 4. Subscription Module
```plaintext
GET /subscription/plans
POST /subscription/purchase
GET /subscription/status
POST /subscription/cancel
```

### 5. Coins Module
```plaintext
GET /coins/balance
GET /coins/packages
POST /coins/purchase
GET /coins/transactions
POST /coins/redeem-reward
```

## Implementation Requirements

### 1. Authentication & Security
- Implement JWT-based authentication
- Google OAuth integration
- Rate limiting on sensitive endpoints
- Input validation using Zod
- Session management with Redis
- Password hashing and security

### 2. Real-time Features
- WebSocket implementation for:
  - Match making
  - Chat/video communication
  - Online status tracking
  - Real-time notifications

### 3. Data Validation
- Implement request validation using Zod
- Create schemas for all request bodies
- Validate file uploads
- Sanitize user inputs

### 4. Error Handling
- Implement global error handler
- Standard error response format
- Sentry integration for error tracking
- Proper HTTP status codes

### 5. Rate Limiting
- Implement rate limiting for:
  - Authentication endpoints
  - Match finding
  - Profile updates
  - Report submission

### 6. Caching Strategy
- Redis caching for:
  - User profiles
  - Match status
  - Configuration settings
  - Static content

### 7. Documentation Requirements
- OpenAPI/Swagger documentation
- Response examples
- Error code documentation
- Authentication flow documentation

## Code Structure Requirements

### 1. Project Organization
```plaintext
src/
├── config/        # Configuration files
├── db/           # Database schemas and migrations
├── middleware/   # Custom middleware
├── services/     # Business logic
├── routes/       # Route definitions
├── utils/        # Helper functions
└── types/        # TypeScript types
```

### 2. Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Consistent error handling
- Unit test coverage
- Comment documentation

### 3. Performance Requirements
- Response time < 100ms for basic operations
- WebSocket latency < 50ms
- Efficient database queries
- Proper indexing
- Cache implementation

### 4. Security Requirements
- Input sanitization
- XSS protection
- SQL injection prevention
- Rate limiting
- CORS configuration
- Helmet security headers

## Development Process

### 1. Initial Setup
1. Project scaffolding
2. Database connection
3. Basic middleware setup
4. Authentication implementation
5. Base route structure

### 2. Core Features
1. User management
2. Profile handling
3. Matching system
4. Subscription processing
5. Coin system

### 3. Advanced Features
1. Real-time communication
2. Report handling
3. Reward system
4. Content management
5. Administrative functions

### 4. Testing & Documentation
1. Unit tests
2. Integration tests
3. API documentation
4. Performance testing
5. Security audit

## Specific Requirements

### 1. Database Interactions
- Use Drizzle ORM for all database operations
- Implement proper transaction handling
- Create efficient queries with proper joins
- Handle soft deletes appropriately

### 2. Authentication Flow
- JWT token generation and validation
- Refresh token mechanism
- Social authentication integration
- Session management
- Password reset flow

### 3. File Handling
- Image upload for profiles
- File validation
- Storage configuration
- CDN integration

### 4. Websocket Implementation
- Socket.IO server setup
- Room management for matches
- Event handling
- Connection management
- Error handling

## API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}
```

## Error Handling Structure
```typescript
interface AppError {
  statusCode: number;
  code: string;
  message: string;
  details?: any;
}
```

This specification serves as a comprehensive guide for developing the backend API. When implementing specific features, refer to the database schema for detailed field information and relationships.