/**
 * Environment Variable Validation
 * Validates required environment variables for authentication
 */

interface RequiredEnvVars {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  NEXTAUTH_SECRET: string
  SIGNING_PRIVATE_KEY: string
  SIGNING_PUBLIC_KEY: string
  NEXTAUTH_URL?: string
  ENCRYPTION_SECRET?: string
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvironmentError'
  }
}

/**
 * Validates and returns required environment variables
 * Throws detailed error messages if variables are missing
 */
export function validateEnvironmentVariables(): RequiredEnvVars {
  const errors: string[] = []

  // Determine if we are running in debug authentication mode
  const isDebugAuth = process.env.DEBUG_AUTH === 'true'

  // Check for required variables
  // In debug mode we bypass Google OAuth, so GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not required.
  const requiredVars = {
    GOOGLE_CLIENT_ID: isDebugAuth ? 'debug-mode-bypass' : process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: isDebugAuth ? 'debug-mode-bypass' : process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    SIGNING_PRIVATE_KEY: process.env.SIGNING_PRIVATE_KEY,
    SIGNING_PUBLIC_KEY: process.env.SIGNING_PUBLIC_KEY,
  }

  // Validate each required variable
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value.trim() === '') {
      errors.push(`❌ ${key} is not set or empty`)
    }
  }

  // Check for common mistakes
  if (!isDebugAuth && process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
    errors.push('❌ GOOGLE_CLIENT_ID contains placeholder value')
  }

  if (!isDebugAuth && process.env.GOOGLE_CLIENT_SECRET === 'your_google_client_secret_here') {
    errors.push('❌ GOOGLE_CLIENT_SECRET contains placeholder value')
  }

  if (process.env.NEXTAUTH_SECRET === 'your_nextauth_secret_here') {
    errors.push('❌ NEXTAUTH_SECRET contains placeholder value')
  }

  if (
    !process.env.SIGNING_PRIVATE_KEY ||
    process.env.SIGNING_PRIVATE_KEY.trim() === ''
  ) {
    errors.push('❌ SIGNING_PRIVATE_KEY is not set or empty')
  } else if (
    process.env.SIGNING_PRIVATE_KEY === 'your_private_key_here'
  ) {
    errors.push('❌ SIGNING_PRIVATE_KEY contains placeholder value')
  }

  if (
    !process.env.SIGNING_PUBLIC_KEY ||
    process.env.SIGNING_PUBLIC_KEY.trim() === ''
  ) {
    errors.push('❌ SIGNING_PUBLIC_KEY is not set or empty')
  } else if (
    process.env.SIGNING_PUBLIC_KEY === 'your_public_key_here'
  ) {
    errors.push('❌ SIGNING_PUBLIC_KEY contains placeholder value')
  }

  // If there are errors, provide helpful guidance
  if (errors.length > 0) {
    const errorMessage = [
      '🚨 ENVIRONMENT CONFIGURATION ERROR',
      '',
      'Missing or invalid environment variables:',
      ...errors,
      '',
      '📝 TO FIX THIS ISSUE:',
      '1. Create a .env.local file in your project root',
      '2. Add the required environment variables',
      '3. See src/lib/env-setup.md for detailed instructions',
      '',
      '📋 REQUIRED VARIABLES:',
      '   GOOGLE_CLIENT_ID=your_client_id',
      '   GOOGLE_CLIENT_SECRET=your_client_secret',
      '   NEXTAUTH_SECRET=your_secret_key',
      '   SIGNING_PRIVATE_KEY=your_private_key_in_base64',
      '   SIGNING_PUBLIC_KEY=your_public_key_in_base64',
      '   NEXTAUTH_URL=http://localhost:3000',
      '',
      '🔗 For setup help, see:',
      '   - src/lib/google-oauth-setup.md (Google OAuth setup)',
      '   - src/lib/env-setup.md (Environment variables guide)',
    ].join('\n')

    throw new EnvironmentError(errorMessage)
  }

  return {
    GOOGLE_CLIENT_ID: isDebugAuth ? '' : requiredVars.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: isDebugAuth ? '' : requiredVars.GOOGLE_CLIENT_SECRET!,
    NEXTAUTH_SECRET: requiredVars.NEXTAUTH_SECRET!,
    SIGNING_PRIVATE_KEY: requiredVars.SIGNING_PRIVATE_KEY!,
    SIGNING_PUBLIC_KEY: requiredVars.SIGNING_PUBLIC_KEY!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  }
}

/**
 * Safe getter for environment variables with validation
 */
export function getValidatedEnv() {
  try {
    return validateEnvironmentVariables()
  } catch (error) {
    // Log error to console for development
    console.error('\n' + (error as Error).message + '\n')
    
    // Re-throw to stop the application
    throw error
  }
} 