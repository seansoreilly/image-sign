# Image Sign - Repository Documentation

A comprehensive technical overview of the Image Sign application codebase.

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [Technology Stack](#technology-stack)
4. [File Structure](#file-structure)
5. [Core Components](#core-components)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Security](#authentication--security)
8. [Image Processing Pipeline](#image-processing-pipeline)
9. [Testing Strategy](#testing-strategy)
10. [Configuration & Environment](#configuration--environment)
11. [Development Workflow](#development-workflow)
12. [Deployment](#deployment)

---

## Project Overview

**Image Sign** is a Next.js 15 application that provides secure digital image authentication through cryptographic signatures. Users can sign in with Google OAuth, upload images, embed their encrypted identity into image metadata, and verify the authenticity of signed images.

### Key Features

- **Secure Authentication**: Google OAuth integration with NextAuth.js
- **Digital Image Signing**: Cryptographic signatures embedded in EXIF/metadata
- **Image Verification**: Tamper detection and authenticity validation
- **Multi-format Support**: JPEG, PNG, GIF, WebP (up to 5MB)
- **Audit Logging**: Optional AWS DynamoDB integration
- **Modern UI/UX**: Responsive design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation

---

## Architecture & Design

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React/Next)  │◄──►│   (API Routes)  │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
    ┌───▼───┐                ┌───▼───┐                ┌───▼───┐
    │ Auth  │                │ Image │                │Google │
    │Status │                │Process│                │OAuth  │
    └───────┘                └───────┘                └───────┘
        │                        │                        │
    ┌───▼───┐                ┌───▼───┐                ┌───▼───┐
    │Upload │                │Crypto │                │DynamoDB│
    │ UI    │                │Sign/  │                │(Audit)│
    └───────┘                │Verify │                └───────┘
        │                    └───────┘
    ┌───▼───┐
    │Verify │
    │ UI    │
    └───────┘
```

### Design Patterns

1. **Component-Based Architecture**: Modular React components with clear responsibilities
2. **API Route Handlers**: Next.js API routes for backend logic
3. **Middleware Pattern**: Authentication and request processing
4. **Service Layer Pattern**: Separation of concerns for crypto, logging, and validation
5. **Error Boundary Pattern**: Graceful error handling and user feedback

### Data Flow

#### Image Signing Flow
```
User Upload → Authentication Check → Image Validation → 
Encrypt Email → Generate Signature → Embed in Metadata → 
Return Signed Image → Audit Log
```

#### Image Verification Flow
```
User Upload → Image Validation → Extract Metadata → 
Decrypt Email → Verify Signature → Return Result → 
Audit Log
```

---

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: Component library
- **TypeScript 5.8**: Type safety
- **Tailwind CSS 3.4**: Utility-first styling
- **Lucide React**: Icon library

### Backend
- **Next.js API Routes**: Backend endpoints
- **NextAuth.js 4.24**: Authentication framework
- **Node.js Crypto**: Cryptographic operations
- **Sharp**: Image processing
- **piexifjs**: EXIF manipulation

### Authentication & Security
- **Google OAuth 2.0**: User authentication
- **JWT**: Session management
- **Ed25519/RSA**: Digital signatures
- **AES-256-CBC**: Email encryption

### Image Processing
- **Sharp**: Metadata and optimization
- **piexifjs**: JPEG EXIF manipulation
- **png-chunks-***: PNG metadata handling
- **file-type**: MIME type detection

### Database & Logging
- **AWS DynamoDB**: Audit logging (optional)
- **Console Logging**: Development feedback

### Development & Testing
- **Jest**: Testing framework
- **@testing-library**: Component testing
- **ESLint**: Code linting
- **Husky**: Git hooks
- **TypeScript**: Static type checking

### Deployment & Build
- **Vercel**: Hosting platform
- **Next.js Build**: Production optimization
- **PostCSS**: CSS processing

---

## File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   │   ├── auth/                 # Authentication routes
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth configuration
│   │   ├── sign/
│   │   │   └── route.ts         # Image signing endpoint
│   │   └── verify/
│   │       └── route.ts         # Image verification endpoint
│   ├── auth/                     # Authentication pages
│   │   ├── error/
│   │   │   └── page.tsx         # Auth error page
│   │   ├── layout.tsx           # Auth layout
│   │   └── signin/
│   │       └── page.tsx         # Sign-in page
│   ├── favicon/                  # Favicon assets
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── manifest.ts              # PWA manifest
│   ├── opengraph-image.tsx      # OG image generation
│   ├── page.tsx                 # Home page
│   ├── robots.txt               # SEO robots file
│   └── sitemap.ts               # Dynamic sitemap
├── components/                   # React components
│   ├── AuthHeader.tsx           # Authentication header
│   ├── AuthStatus.tsx           # User auth status
│   ├── ImageUpload.tsx          # Image signing interface
│   ├── ImageVerification.tsx    # Image verification UI
│   ├── SessionProvider.tsx      # NextAuth session provider
│   ├── SignedImageUploader.tsx  # Combined upload/verify
│   └── __tests__/               # Component tests
├── hooks/                        # Custom React hooks (empty)
├── lib/                         # Utility libraries
│   ├── auth.ts                  # NextAuth configuration
│   ├── env-setup.md            # Environment setup guide
│   ├── env-validation.ts        # Environment validation
│   ├── google-oauth-setup.md    # OAuth setup guide
│   ├── logging.ts               # Audit logging system
│   └── utils.ts                 # Utility functions
└── types/                        # TypeScript definitions
    ├── image.d.ts               # Image type definitions
    ├── next-auth.d.ts           # NextAuth type extensions
    └── verification.ts          # Verification interfaces
```

### Root Configuration Files

```
├── .env.local                   # Environment variables
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Git ignore rules
├── components.json             # shadcn/ui config
├── jest.config.js              # Jest test configuration
├── jest.setup.js               # Jest setup file
├── middleware.ts               # Next.js middleware
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

---

## Core Components

### 1. AuthStatus (`/components/AuthStatus.tsx`)

**Purpose**: Displays user authentication status and provides sign-in/out controls.

**Features**:
- Real-time session status
- Google OAuth integration
- User profile display
- Sign-in/out buttons

### 2. ImageUpload (`/components/ImageUpload.tsx`)

**Purpose**: Main interface for uploading and signing images.

**Features**:
- Drag & drop interface
- File validation (type, size)
- Image preview
- Progress indicators
- Error handling
- Authentication-gated access

**Key Methods**:
- `handleFileSelect()`: Processes selected files
- `handleUpload()`: Sends files to signing API
- `validateImage()`: Client-side validation

### 3. SignedImageUploader (`/components/SignedImageUploader.tsx`)

**Purpose**: Interface for verifying signed images.

**Features**:
- Image upload and verification
- Signature validation results
- Signer identity display
- Timestamp information
- Error reporting

### 4. ImageVerification (`/components/ImageVerification.tsx`)

**Purpose**: Dedicated verification interface (alternative to SignedImageUploader).

**Features**:
- Real-time verification
- Detailed result display
- Error handling

---

## API Endpoints

### 1. `/api/sign` (POST)

**Purpose**: Signs uploaded images with user's encrypted identity.

**Request**:
```typescript
FormData {
  image: File  // Image file (JPEG, PNG, GIF, WebP)
}
```

**Headers**:
- Authentication required (NextAuth session)

**Response**:
- Success: Binary image data with embedded signature
- Error: JSON error object

**Process Flow**:
1. Session validation
2. File validation (size, type, integrity)
3. Email encryption (AES-256-CBC)
4. Signature generation (Ed25519/RSA)
5. Metadata embedding (EXIF/PNG chunks)
6. Audit logging
7. Return signed image

### 2. `/api/verify` (POST)

**Purpose**: Verifies digital signatures in uploaded images.

**Request**:
```typescript
FormData {
  image: File  // Signed image file
}
```

**Response**:
```typescript
{
  verified: boolean
  email?: string      // Decrypted signer email
  timestamp?: string  // ISO timestamp
  error?: string      // Error message if failed
  details?: string    // Additional error details
}
```

**Process Flow**:
1. File validation
2. Metadata extraction
3. Email decryption
4. Signature verification
5. Audit logging
6. Return results

### 3. `/api/auth/[...nextauth]` (ALL)

**Purpose**: NextAuth.js authentication endpoints.

**Features**:
- Google OAuth flow
- JWT token management
- Session handling
- Debug authentication mode

---

## Authentication & Security

### Authentication System

**Provider**: Google OAuth 2.0 via NextAuth.js

**Configuration** (`/lib/auth.ts`):
```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Authorization parameters for consent
    })
  ],
  callbacks: {
    jwt: // Token handling
    session: // Session management
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
}
```

### Security Features

#### 1. Digital Signatures
- **Algorithms**: Ed25519 (preferred) with RSA fallback
- **Data Signed**: Image buffer + encrypted email + timestamp
- **Key Management**: Environment variable storage

#### 2. Email Encryption
- **Algorithm**: AES-256-CBC
- **Key Derivation**: scrypt with salt
- **Format**: `IV:EncryptedData` (hex encoded)

#### 3. Session Security
- **Strategy**: JWT tokens
- **Storage**: HTTP-only cookies
- **Validation**: NextAuth middleware

#### 4. Input Validation
- **File Size**: 5MB maximum
- **File Types**: Whitelist (JPEG, PNG, GIF, WebP)
- **Magic Numbers**: Binary validation with file-type library
- **Image Integrity**: Sharp metadata validation

#### 5. Environment Security
- **Validation**: Comprehensive env var checking
- **Error Messages**: Detailed setup guidance
- **Key Storage**: Base64 encoded in environment

### Middleware Protection (`/middleware.ts`)

**Protected Routes**: All routes except public paths
**Public Paths**: `/`, `/auth/*`, `/api/auth/*`
**Authorization Logic**: Token-based access control

---

## Image Processing Pipeline

### Signing Pipeline

#### 1. Validation Phase
```typescript
// File size check (5MB limit)
if (file.size > MAX_FILE_SIZE) return error

// MIME type validation
if (!ALLOWED_TYPES.includes(file.type)) return error

// Image integrity check with Sharp
await sharp(buffer).metadata()
```

#### 2. Encryption Phase
```typescript
// Email encryption with AES-256-CBC
const encryptedEmail = encryptEmail(userEmail)
const timestamp = new Date().toISOString()
```

#### 3. Signature Generation
```typescript
// Create signing payload
const dataToSign = Buffer.concat([
  imageBuffer,
  Buffer.from(encryptedEmail, 'utf8'),
  Buffer.from(timestamp, 'utf8')
])

// Generate signature (Ed25519 preferred)
const signature = crypto.sign(null, dataToSign, privateKey)
```

#### 4. Metadata Embedding

**JPEG Files**:
```typescript
// Use piexifjs for EXIF manipulation
const signaturePayload = { signature, email, timestamp, originalBufferHash }
exifDict['0th'][piexif.ImageIFD.ImageDescription] = JSON.stringify(payload)
const finalImage = piexif.insert(exifBytes, imageDataUrl)
```

**PNG Files**:
```typescript
// Use PNG chunks for metadata
const chunks = extract(buffer)
const textChunk = encodeText('Signature', signatureString)
chunks.splice(-1, 0, textChunk) // Insert before IEND
const finalBuffer = encode(chunks)
```

### Verification Pipeline

#### 1. Metadata Extraction

**JPEG**:
```typescript
const exifDict = piexif.load(imageDataUrl)
const signature = exifDict['0th'][piexif.ImageIFD.ImageDescription]
```

**PNG**:
```typescript
const chunks = extract(buffer)
const signatureChunk = chunks.find(chunk => 
  chunk.name === 'tEXt' && 
  decodeText(chunk.data).keyword === 'Signature'
)
```

#### 2. Buffer Reconstruction
- **JPEG**: Recreate image with placeholder signature
- **PNG**: Remove signature chunks to reconstruct original

#### 3. Signature Verification
```typescript
// Reconstruct original signing payload
const dataToVerify = Buffer.concat([
  reconstructedBuffer,
  Buffer.from(encryptedEmail, 'utf8'),
  Buffer.from(timestamp, 'utf8')
])

// Verify signature
const isValid = crypto.verify(null, dataToVerify, publicKey, signature)
```

---

## Testing Strategy

### Test Structure

```
src/components/__tests__/
├── image-signing.integration.test.ts    # End-to-end flow tests
└── images/                              # Test image assets
    ├── sample_jpg.jpg
    ├── sample_png.png
    ├── sample_gif.gif
    └── sample_webp.webp
```

### Test Configuration (`/jest.config.js`)

**Environment**: jsdom for React testing
**Setup**: Custom setup file for test utilities
**Coverage**: Comprehensive component coverage
**Mocking**: Fetch API and NextAuth mocking

### Integration Tests

**Test Files**: Multiple format validation (JPEG, PNG, GIF, WebP)
**Test Scenarios**:
- Successful image signing
- Signature verification
- Unsigned image detection
- Error handling (API failures, network issues)
- File format validation

**Mock Strategy**:
```typescript
global.fetch = jest.fn()
// Mock successful responses
mockResponse = {
  ok: true,
  status: 200,
  json: () => Promise.resolve(mockData)
}
```

### Test Coverage Areas

1. **Component Rendering**: All UI components render correctly
2. **User Interactions**: File uploads, drag & drop, button clicks
3. **API Integration**: Sign and verify endpoint communication
4. **Error Handling**: Graceful failure and user feedback
5. **File Validation**: Size, type, and integrity checks

---

## Configuration & Environment

### Environment Variables

#### Required Variables
```bash
# Google OAuth (skip in DEBUG_AUTH=true mode)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth Configuration
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000

# Cryptographic Keys (base64 encoded)
SIGNING_PRIVATE_KEY=your_private_key_base64
SIGNING_PUBLIC_KEY=your_public_key_base64

# Optional AWS DynamoDB Logging
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
DYNAMODB_TABLE_NAME=image-sign-audit-logs

# Optional Encryption Secret
ENCRYPTION_SECRET=your_encryption_secret

# Debug Mode (bypasses Google OAuth)
DEBUG_AUTH=true
```

### Environment Validation (`/lib/env-validation.ts`)

**Features**:
- Comprehensive validation on app startup
- Detailed error messages with setup instructions
- Debug mode support
- Placeholder value detection

**Error Handling**:
```typescript
if (errors.length > 0) {
  throw new EnvironmentError(`
    🚨 ENVIRONMENT CONFIGURATION ERROR
    Missing variables: ${errors.join(', ')}
    📝 Setup instructions: src/lib/env-setup.md
  `)
}
```

### Build Configuration

#### Next.js Config (`/next.config.js`)
- Git commit hash injection
- Image optimization settings
- Security headers
- Compression settings
- Vercel deployment optimizations

#### TypeScript Config (`/tsconfig.json`)
- Path mapping (`@/*` → `./src/*`)
- Strict type checking
- ES2017 target
- Next.js plugin integration

#### Tailwind Config (`/tailwind.config.js`)
- Custom animations
- Extended color palette
- Backdrop blur utilities
- Font family definitions

---

## Development Workflow

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd image-sign
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Generate Cryptographic Keys**
   ```bash
   # Ed25519 key pair
   openssl genpkey -algorithm Ed25519 -out private_key.pem
   openssl pkey -in private_key.pem -pubout -out public_key.pem
   
   # Convert to base64 for environment variables
   base64 -w 0 private_key.pem > private_key_base64.txt
   base64 -w 0 public_key.pem > public_key_base64.txt
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Scripts

```json
{
  "dev": "next dev",           // Development server
  "build": "next build",       // Production build
  "start": "next start",       // Production server
  "lint": "next lint",         // ESLint checking
  "test": "jest",              // Run tests
  "test:watch": "jest --watch", // Watch mode testing
  "test:coverage": "jest --coverage", // Coverage reports
  "test:ci": "jest --ci --coverage --watchAll=false"
}
```

### Git Workflow

**Pre-commit Hooks** (Husky):
- ESLint validation
- TypeScript compilation
- Test execution

**Branch Strategy**:
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `hotfix/*`: Production fixes

---

## Deployment

### Vercel Deployment

**Configuration**: Automatic deployment from Git
**Environment**: Production environment variables in Vercel dashboard
**Build**: Next.js optimized build process
**Features**:
- Automatic HTTPS
- Global CDN
- Serverless functions
- Git integration

### Build Process

1. **Environment Validation**: Check all required variables
2. **TypeScript Compilation**: Type checking and compilation
3. **Next.js Build**: Production optimization
4. **Asset Generation**: Static assets and images
5. **Git Hash Injection**: Build identification

### Performance Optimizations

- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Compression**: Gzip compression enabled
- **Caching**: Static asset caching
- **Bundle Analysis**: Build size monitoring

### Security Headers

```javascript
headers: [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" }
]
```

---

## Additional Documentation

This documentation provides a comprehensive technical overview of the Image Sign repository. For specific implementation details, refer to:

1. **Setup Guides**: `/src/lib/env-setup.md`, `/src/lib/google-oauth-setup.md`
2. **API Documentation**: Individual route files contain detailed comments
3. **Component Documentation**: JSDoc comments in component files
4. **Type Definitions**: `/src/types/` directory for interfaces

For questions or contributions, please refer to the project's README.md and contribution guidelines.
