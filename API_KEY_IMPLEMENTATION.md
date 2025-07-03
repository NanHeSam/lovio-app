# API Key Implementation Guide

This document explains the implementation of API key generation and authentication for the Lovio app.

## 🚀 Features Implemented

### 1. Database Schema Changes
- Added API key fields to the `users` table:
  - `api_key`: Hashed API key (VARCHAR 64, UNIQUE)
  - `api_key_created_at`: Timestamp when the key was created
  - `api_key_last_used_at`: Timestamp when the key was last used
  - `api_key_active`: Boolean flag to enable/disable the key

### 2. Automatic API Key Generation
- API keys are automatically generated when users sign up via Clerk webhook
- Keys follow the format: `lv_live_<32-character-hex-string>`
- Keys are securely hashed using SHA-256 before storage

### 3. API Key Management Utilities
Located in `lib/utils/api-keys.ts`:

- `generateApiKey()`: Creates a new API key
- `hashApiKey()`: Hashes an API key for secure storage
- `validateApiKey()`: Validates and authenticates an API key
- `generateUserApiKey()`: Generates and stores an API key for a user
- `revokeApiKey()`: Revokes a user's API key
- `regenerateApiKey()`: Generates a new API key (revokes old one)
- `getApiKeyInfo()`: Gets API key metadata (without revealing the key)

### 4. Authentication Middleware
Located in `lib/middleware/api-auth.ts`:

- `authenticateApiKey()`: Validates API key from request headers
- `withApiKeyAuth()`: Higher-order function to protect API routes
- `createAuthErrorResponse()`: Helper for authentication error responses

### 5. API Endpoints
#### User API Key Management (`/api/user/api-key`)
- `GET`: Get API key information
- `POST`: Regenerate API key
- `DELETE`: Revoke API key

#### Protected API Routes Example (`/api/v1/activities`)
- Demonstrates how to use API key authentication
- `GET`: Retrieve user's activities
- `POST`: Create new activities

### 6. User Interface
#### Dashboard Page (`/dashboard/api-keys`)
- View API key status and metadata
- Generate/regenerate API keys
- Revoke API keys
- Copy keys to clipboard
- Usage instructions

#### Components
- `ApiKeyManager`: React component for API key management

## 🔧 Usage

### For Users

1. **Access API Key Management**
   - Navigate to `/dashboard/api-keys`
   - Your API key is automatically generated on signup

2. **Generate/Regenerate API Key**
   - Click "Generate API Key" or "Regenerate API Key"
   - Copy the key immediately (it won't be shown again)
   - Store it securely

3. **Using the API Key**
   ```bash
   curl -H "Authorization: Bearer lv_live_your_api_key_here" \
        http://localhost:3000/api/v1/activities
   ```

### For Developers

1. **Protecting API Routes**
   ```typescript
   import { withApiKeyAuth } from '@/lib/middleware/api-auth';
   
   export const GET = withApiKeyAuth(async (request, user) => {
     // user.id and user.fullName are available
     // Route is automatically protected
     return NextResponse.json({ message: 'Success' });
   });
   ```

2. **Manual Authentication**
   ```typescript
   import { authenticateApiKey } from '@/lib/middleware/api-auth';
   
   export async function GET(request: NextRequest) {
     const authResult = await authenticateApiKey(request);
     
     if (!authResult.isAuthenticated) {
       return NextResponse.json({ error: authResult.error }, { status: 401 });
     }
     
     // Use authResult.user
   }
   ```

3. **API Key Utilities**
   ```typescript
   import { generateUserApiKey, validateApiKey } from '@/lib/utils/api-keys';
   
   // Generate API key for a user
   const apiKey = await generateUserApiKey(userId);
   
   // Validate an API key
   const user = await validateApiKey(apiKey);
   ```

## 🔒 Security Features

### 1. Secure Key Generation
- Uses Node.js `crypto.randomBytes()` for cryptographically secure random generation
- 128-bit entropy (32 hex characters)
- Unique prefix `lv_live_` for easy identification

### 2. Secure Storage
- API keys are hashed using SHA-256 before database storage
- Only hashed versions are stored in the database
- Original keys are never logged or stored in plain text

### 3. Access Control
- API keys are tied to specific users
- Automatic validation of user permissions
- Keys can be revoked instantly
- Last usage tracking for monitoring

### 4. Authentication Flow
1. Client sends request with `Authorization: Bearer <api_key>` header
2. Middleware extracts and validates the API key format
3. Key is hashed and looked up in the database
4. User permissions are verified
5. Last used timestamp is updated
6. Request proceeds with authenticated user context

## 📋 Database Migration

To apply the API key schema changes:

```bash
# Generate migration (already done)
npm run db:generate

# Run migration
npm run db:migrate:run
```

**Migration file**: `drizzle/0003_add_api_key_fields_to_users.sql`

## 🧪 Testing

### Manual Testing
1. Start the development server: `npm run dev`
2. Sign up a new user (API key auto-generated)
3. Navigate to `/dashboard/api-keys`
4. Generate/regenerate API key
5. Test API calls:

```bash
# Get activities
curl -H "Authorization: Bearer your_api_key" \
     http://localhost:3000/api/v1/activities

# Create activity
curl -X POST \
     -H "Authorization: Bearer your_api_key" \
     -H "Content-Type: application/json" \
     -d '{"childId":"child_id","type":"sleep","startTime":"2024-01-01T10:00:00Z"}' \
     http://localhost:3000/api/v1/activities
```

### Error Scenarios
- Missing Authorization header → 401 error
- Invalid API key format → 401 error
- Revoked API key → 401 error
- Expired or non-existent key → 401 error

## 🔄 Integration Points

### 1. Clerk Webhook Integration
- `app/api/webhooks/clerk/route.ts` automatically generates API keys on user creation
- Existing users will need to manually generate their first API key

### 2. Database Integration
- Uses existing Drizzle ORM setup
- Leverages existing user authentication flow
- Maintains consistency with existing data patterns

### 3. UI Integration
- Integrates with existing dashboard layout
- Uses existing UI components and styling
- Follows established design patterns

## 🚀 Next Steps

### Potential Enhancements
1. **Multiple API Keys**: Allow users to have multiple named API keys
2. **Scoped Permissions**: Different API keys with different permission levels
3. **Rate Limiting**: Implement rate limiting per API key
4. **API Key Expiration**: Add expiration dates to API keys
5. **Usage Analytics**: Track API usage patterns and quotas
6. **Webhook Integration**: API keys for webhook endpoints

### Production Considerations
1. **Environment Variables**: Ensure proper environment setup
2. **Monitoring**: Add logging and monitoring for API key usage
3. **Documentation**: Create public API documentation
4. **Testing**: Add comprehensive test coverage
5. **Security Audit**: Regular security reviews of the implementation

## 📝 Files Created/Modified

### New Files
- `lib/utils/api-keys.ts` - API key utilities
- `lib/middleware/api-auth.ts` - Authentication middleware
- `app/api/user/api-key/route.ts` - API key management endpoints
- `app/dashboard/api-keys/page.tsx` - API key management UI
- `components/dashboard/ApiKeyManager.tsx` - API key management component
- `app/api/v1/activities/route.ts` - Example protected API route
- `drizzle/0003_add_api_key_fields_to_users.sql` - Database migration

### Modified Files
- `lib/db/schema.ts` - Added API key fields to users table
- `app/api/webhooks/clerk/route.ts` - Auto-generate API keys on signup

This implementation provides a complete, secure, and user-friendly API key system that integrates seamlessly with your existing Lovio application architecture.