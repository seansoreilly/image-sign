/**
 * Environment Variable Validation
 * Validates required environment variables for authentication
 */

interface RequiredEnvVars {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  NEXTAUTH_SECRET: string
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

  // Check for required variables
  const requiredVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  }

  // Validate each required variable
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value.trim() === '') {
      errors.push(`❌ ${key} is not set or empty`)
    }
  }

  // Check for common mistakes
  if (process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
    errors.push('❌ GOOGLE_CLIENT_ID contains placeholder value')
  }

  if (process.env.GOOGLE_CLIENT_SECRET === 'your_google_client_secret_here') {
    errors.push('❌ GOOGLE_CLIENT_SECRET contains placeholder value')
  }

  if (process.env.NEXTAUTH_SECRET === 'your_nextauth_secret_here') {
    errors.push('❌ NEXTAUTH_SECRET contains placeholder value')
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
      '   NEXTAUTH_URL=http://localhost:3000',
      '',
      '🔗 For setup help, see:',
      '   - src/lib/google-oauth-setup.md (Google OAuth setup)',
      '   - src/lib/env-setup.md (Environment variables guide)',
    ].join('\n')

    throw new EnvironmentError(errorMessage)
  }

  return {
    GOOGLE_CLIENT_ID: requiredVars.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: requiredVars.GOOGLE_CLIENT_SECRET!,
    NEXTAUTH_SECRET: requiredVars.NEXTAUTH_SECRET!,
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