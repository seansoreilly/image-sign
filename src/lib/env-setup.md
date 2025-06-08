# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Custom App URL for production
# NEXTAUTH_URL=https://yourdomain.com
```

## How to Generate Values

### GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET

- Follow the Google OAuth setup guide in `google-oauth-setup.md`
- Obtain from Google Cloud Console > APIs & Services > Credentials

### NEXTAUTH_SECRET

Generate a secure random string using one of these methods:

**Option 1: OpenSSL (recommended)**

```bash
openssl rand -base64 32
```

**Option 2: Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Online Generator**
Visit: https://generate-secret.vercel.app/32

### NEXTAUTH_URL

- **Development:** `http://localhost:3000`
- **Production:** Your actual domain (e.g., `https://yourdomain.com`)

## Environment File Examples

### .env.local (for local development)

```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijk123456789
NEXTAUTH_SECRET=generated_random_string_here
NEXTAUTH_URL=http://localhost:3000
```

### Production Environment

For production deployment, set these same variables in your hosting platform:

- Vercel: Project Settings > Environment Variables
- Netlify: Site Settings > Environment Variables
- Heroku: Settings > Config Vars
- Docker: Use environment variables or secrets

## Security Notes

⚠️ **IMPORTANT SECURITY PRACTICES:**

1. **Never commit credentials to git**

   - `.env.local` is gitignored by default
   - Double-check your `.gitignore` includes `.env*`

2. **Use different credentials for different environments**

   - Development: localhost URLs
   - Production: actual domain URLs

3. **Rotate secrets regularly**

   - Generate new NEXTAUTH_SECRET periodically
   - Update Google OAuth credentials if compromised

4. **Validate environment variables**
   - Application includes runtime validation
   - Server won't start with missing required variables

## Validation

The application automatically validates required environment variables on startup. Missing variables will cause clear error messages pointing to this documentation.

## Troubleshooting

### Common Issues

**Error: "NEXTAUTH_SECRET is not set"**

- Ensure `.env.local` exists in project root
- Verify NEXTAUTH_SECRET is set and not empty

**Error: "Google OAuth credentials missing"**

- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
- Verify credentials are correct from Google Cloud Console

**Error: "Callback URL mismatch"**

- Ensure NEXTAUTH_URL matches your current environment
- Update Google Cloud Console redirect URIs if needed
