# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run dev` - Start development server (runs on localhost:3000)
- `npm run build` - Create production build
- `npm start` - Start production server

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests in CI mode (no watch, coverage enabled)

### Code Quality
- `npm run lint` - Run ESLint
- Check TypeScript errors: `npx tsc --noEmit`

## Architecture Overview

This is a Next.js 15 application that provides cryptographic image signing and verification capabilities. The core architecture consists of:

### Authentication System
- Uses NextAuth.js with Google OAuth provider
- Supports debug mode authentication (DEBUG_AUTH=true bypasses OAuth)
- Session management via JWT tokens
- Configuration in `src/lib/auth.ts`

### Image Processing Flow
1. **Signing**: Images are cryptographically signed with Ed25519/RSA signatures
2. **Metadata Embedding**: Signatures stored in EXIF data (JPEG) or tEXt chunks (PNG)
3. **Verification**: Extracts and validates signatures against public keys

### Key Components

#### API Endpoints (`src/app/api/`)
- `/api/sign` - Signs uploaded images with user's encrypted email
- `/api/verify` - Verifies signed images and extracts signer information
- `/api/auth/[...nextauth]` - NextAuth.js authentication handler

#### Core Libraries (`src/lib/`)
- `auth.ts` - NextAuth configuration and session management
- `env-validation.ts` - Environment variable validation with detailed error messages
- `logging.ts` - Audit logging system (optional AWS DynamoDB integration)
- `utils.ts` - Utility functions (Tailwind CSS class merging)

#### React Components (`src/components/`)
- `ImageUpload.tsx` - Main image signing interface
- `SignedImageUploader.tsx` - Image verification interface  
- `AuthStatus.tsx` - Authentication status display
- `SessionProvider.tsx` - NextAuth session provider wrapper

### Cryptographic Implementation
- **Email Encryption**: AES-256-CBC with user email address
- **Digital Signatures**: Ed25519 (primary) with RSA fallback
- **Signature Payload**: `[image_buffer + encrypted_email + timestamp]`
- **Key Management**: Base64-encoded keys in environment variables

### Image Format Support
- **JPEG**: Signature embedded in EXIF ImageDescription field
- **PNG**: Signature stored in tEXt chunks with "Signature" keyword
- **Other formats**: GIF and WebP supported for upload but limited metadata embedding

## Environment Setup

### Required Variables
```bash
# Google OAuth (not required in DEBUG_AUTH mode)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000

# Cryptographic Keys (base64 encoded)
SIGNING_PRIVATE_KEY=your_private_key_base64
SIGNING_PUBLIC_KEY=your_public_key_base64

# Optional: AWS DynamoDB Logging
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
DYNAMODB_TABLE_NAME=image-sign-audit-logs

# Debug Mode (bypasses Google OAuth)
DEBUG_AUTH=true
```

### Key Generation
Generate Ed25519 keys with OpenSSL:
```bash
openssl genpkey -algorithm Ed25519 -out private_key.pem
openssl pkey -in private_key.pem -pubout -out public_key.pem
base64 -w 0 private_key.pem > private_key_base64.txt
base64 -w 0 public_key.pem > public_key_base64.txt
```

## Testing Strategy

### Test Structure
- Integration tests: `src/components/__tests__/`
- Unit tests: `src/lib/__tests__/`
- Test images: `src/components/__tests__/images/`

### Test Configuration
- Jest with Next.js integration
- jsdom environment for React component testing
- Path mapping: `@/` resolves to `src/`
- Coverage collection excludes page/layout files

### Running Specific Tests
```bash
# Run specific test file
npm test -- src/components/__tests__/image-signing.integration.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="verification"
```

## Analytics Integration

Google Analytics is configured with tracking ID `G-6E5QK5DY7P` using the gtag.js implementation directly in the layout. This provides:
- Page view tracking
- User interaction analytics
- Performance metrics

## Development Notes

### Common Debugging
- Set `DEBUG_AUTH=true` for development without Google OAuth setup
- Check console logs for cryptographic operation details (🔐, 📝, 🔍 prefixed)
- Environment validation provides detailed setup instructions on failure

### Image Processing Gotchas
- JPEG processing uses piexifjs and requires careful buffer handling
- PNG chunk manipulation requires exact reconstruction for verification
- Signature verification requires identical buffer reconstruction as during signing

### Security Considerations
- User emails are encrypted before embedding in image metadata
- Private keys should be properly secured in production
- Audit logging can be enabled for compliance requirements