import { withAuth } from "next-auth/middleware"

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // Add any additional middleware logic here
    console.log("Middleware called for:", req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Define which routes require authentication
        const { pathname } = req.nextUrl
        
        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/error',
          '/api/auth',
        ]
        
        // Check if the current path starts with any public route
        const isPublicRoute = publicRoutes.some(route => 
          pathname.startsWith(route)
        )
        
        // If it's a public route, allow access
        if (isPublicRoute) {
          return true
        }
        
        // For protected routes, require a valid token
        return !!token
      },
    },
  }
)

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
} 