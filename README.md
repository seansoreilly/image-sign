# Image Sign 🔐

A secure digital image authentication platform that allows users to cryptographically sign images and verify their authenticity. Built with Next.js 15 and powered by modern cryptographic standards.

![Image Sign Hero](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)

## ✨ Features

- **🔒 Secure Authentication** - Google OAuth integration with NextAuth.js
- **✍️ Digital Image Signing** - Embed cryptographic signatures directly into image metadata
- **🔍 Signature Verification** - Instantly verify image authenticity and ownership
- **🎨 Modern UI** - Beautiful, responsive interface with drag-and-drop support
- **🛡️ Advanced Cryptography** - Ed25519/RSA signatures with AES-256-CBC encryption
- **📊 Audit Logging** - Optional AWS DynamoDB integration for audit trails
- **🌐 Multi-Format Support** - JPEG, PNG, GIF, and WebP images (up to 5MB)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Platform account (for OAuth)
- Optional: AWS account (for audit logging)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/image-sign.git
   cd image-sign
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your `.env.local` file**
   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # NextAuth Configuration
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
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Generating Cryptographic Keys

You can generate Ed25519 key pairs using OpenSSL:

```bash
# Generate private key
openssl genpkey -algorithm Ed25519 -out private_key.pem

# Generate public key
openssl pkey -in private_key.pem -pubout -out public_key.pem

# Convert to base64 for environment variables
base64 -w 0 private_key.pem > private_key_base64.txt
base64 -w 0 public_key.pem > public_key_base64.txt
```

### AWS DynamoDB Setup (Optional)

1. Create a DynamoDB table named `image-sign-audit-logs`
2. Set the primary key as `id` (String)
3. Configure AWS credentials in your environment

## 📱 Usage

### Signing Images

1. **Sign in** with your Google account
2. **Upload an image** by dragging and dropping or clicking to browse
3. **Click "Sign & Download Image"** to embed your cryptographic signature
4. **Download** the signed image with embedded metadata

### Verifying Images

1. **Navigate to the verification section**
2. **Upload a signed image**
3. **View the verification results** including:
   - Signature validity
   - Original signer's email
   - Timestamp of signing
   - Any tampering detection

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19, Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **Image Processing**: Sharp, piexifjs, PNG chunks manipulation
- **Cryptography**: Node.js crypto module (Ed25519/RSA)
- **Database**: Optional AWS DynamoDB for audit logs
- **Deployment**: Vercel-ready configuration

### How It Works

1. **Image Signing Process**:
   ```
   User uploads image → Authenticate with Google → Encrypt email address
   → Generate digital signature → Embed in image metadata → Download signed image
   ```

2. **Verification Process**:
   ```
   Upload signed image → Extract metadata → Verify signature authenticity
   → Decrypt email → Display verification results
   ```

3. **Cryptographic Implementation**:
   - User email encrypted with AES-256-CBC
   - Digital signature created over: `[image_buffer + encrypted_email + timestamp]`
   - Signature embedded in EXIF data (JPEG) or tEXt chunks (PNG)

## 🛡️ Security Features

- **End-to-End Cryptographic Integrity** - Images are cryptographically signed
- **Tamper Detection** - Any modification invalidates the signature
- **Identity Verification** - Encrypted email addresses prove ownership
- **Secure Session Management** - JWT-based authentication
- **Audit Trail** - Optional logging of all sign/verify operations

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── sign/          # Image signing endpoint
│   │   ├── verify/        # Image verification endpoint
│   │   └── auth/          # NextAuth configuration
│   ├── page.tsx           # Home page
│   └── layout.tsx         # Root layout
├── components/
│   ├── ImageUpload.tsx    # Image signing interface
│   ├── SignedImageUploader.tsx  # Verification interface
│   ├── AuthStatus.tsx     # Authentication status
│   └── SessionProvider.tsx
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── env-validation.ts # Environment validation
│   ├── logging.ts        # Audit logging system
│   └── utils.ts          # Utility functions
└── types/
    └── verification.ts    # TypeScript interfaces
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in the Vercel dashboard
3. **Deploy** automatically on push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🧪 Development

### Running Tests

```bash
npm test
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Environment Validation

The application includes comprehensive environment validation with helpful error messages. If any required variables are missing, you'll see detailed setup instructions in the console.

## 📊 API Reference

### POST `/api/sign`

Signs an uploaded image with the authenticated user's identity.

**Request**: Multipart form data with `image` field
**Response**: Signed image file download

### POST `/api/verify`

Verifies the authenticity of a signed image.

**Request**: Multipart form data with `image` field
**Response**: JSON verification result

```json
{
  "verified": true,
  "email": "user@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Sharp](https://sharp.pixelplumbing.com/) for image processing
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/image-sign/issues) page
2. Create a new issue with detailed information
3. Join our [Discussions](https://github.com/yourusername/image-sign/discussions) for community support

---

**Built with ❤️ for digital authenticity and security**