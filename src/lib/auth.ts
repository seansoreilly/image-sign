import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getValidatedEnv } from './env-validation'
import CredentialsProvider from 'next-auth/providers/credentials'

// Validate environment variables at module load time
const env = getValidatedEnv()

const isDebugAuth = process.env.DEBUG_AUTH === 'true'

export const authOptions: NextAuthOptions = {
  providers: isDebugAuth
    ? [
        CredentialsProvider({
          // The name displays on the sign-in button
          name: 'Debug Credentials',
          // No credentials are required, user is auto-authorized
          credentials: {},
          async authorize() {
            // Return a hardcoded user object for debug mode
            return {
              id: 'debug-user',
              name: 'Debug User',
              email: 'seansoreilly@gmail.com.au',
            }
          },
        }),
      ]
    : [
        GoogleProvider({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              prompt: "consent",
              access_type: "offline",
              response_type: "code"
            }
          }
        }),
      ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      return {
        ...session,
        accessToken: token.accessToken,
        idToken: token.idToken,
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: env.NEXTAUTH_SECRET,
} 