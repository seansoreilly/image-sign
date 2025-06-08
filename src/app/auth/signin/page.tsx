"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    const loadProviders = async () => {
      const providers = await getProviders();
      setProviders(providers);
    };
    loadProviders();
  }, []);

  const handleSignIn = async (providerId: string) => {
    setIsLoading(true);
    try {
      await signIn(providerId, { callbackUrl });
    } catch (error) {
      console.error("Sign-in error:", error);
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "OAuthSignin":
        return "Error in constructing an authorization URL";
      case "OAuthCallback":
        return "Error in handling the response from an OAuth provider";
      case "OAuthCreateAccount":
        return "Could not create OAuth account";
      case "EmailCreateAccount":
        return "Could not create email account";
      case "Callback":
        return "Error in the OAuth callback handler route";
      case "OAuthAccountNotLinked":
        return "Email on the account is already linked, but not with this OAuth account";
      case "EmailSignin":
        return "Sending the e-mail with the verification token failed";
      case "CredentialsSignin":
        return "The authorize callback returned null in the Credentials provider";
      case "SessionRequired":
        return "The content of this page requires you to be signed in at all times";
      default:
        return "An error occurred during authentication";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
              <div className="relative bg-white rounded-2xl p-4 shadow-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Welcome to Image Sign
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            Secure image signing with authentication
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Sign in to protect your digital assets with cryptographic signatures
          </p>
        </div>

        {/* Main Sign-In Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-800 mb-1">
                    Authentication Error
                  </h3>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {getErrorMessage(error)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {providers &&
              Object.values(providers).map((provider) => (
                <div key={provider.name}>
                  <button
                    onClick={() => handleSignIn(provider.id)}
                    disabled={isLoading}
                    className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Signing you in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        {provider.name === "Google" && (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        )}
                        <span>Continue with {provider.name}</span>
                      </div>
                    )}
                  </button>
                </div>
              ))}
          </div>

          {/* Security & Privacy Info */}
          <div className="mt-8 space-y-4">
            <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">
                    🔒 Your privacy is protected
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    We use industry-standard OAuth 2.0 security and never store
                    your passwords
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-600 leading-relaxed">
                By signing in, you agree to our{" "}
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-700 underline"
                >
                  terms of service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-700 underline"
                >
                  privacy policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-white/30 flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-700">Secure</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-white/30 flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-700">Fast</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-white/30 flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-700">Verified</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-12 w-48 bg-gray-200 rounded-xl mx-auto"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
              <div className="h-12 w-full bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
