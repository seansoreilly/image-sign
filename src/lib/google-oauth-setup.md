# Google OAuth Setup Instructions

## Step 1: Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Project name suggestion: "image-sign-auth"

## Step 2: Enable Google OAuth API

1. Navigate to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google OAuth2 API"
3. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "Image Sign"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Web application"
4. Name: "Image Sign NextAuth"
5. Authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`

## Step 5: Get Credentials

After creating, you'll get:

- Client ID (starts with numbers, ends with .apps.googleusercontent.com)
- Client Secret (random string)

## Step 6: Environment Variables

Create a `.env.local` file in the project root with:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**Important:**

- Generate a strong random string for NEXTAUTH_SECRET
- Never commit these credentials to git
- Add `.env.local` to your `.gitignore`

## Step 7: Test Configuration

1. Start the development server: `npm run dev`
2. Navigate to: `http://localhost:3000/api/auth/signin`
3. You should see Google as a sign-in option
