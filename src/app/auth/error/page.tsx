"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorDetails = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return {
          title: "Server Configuration Error",
          description: "There is a problem with the server configuration.",
          suggestion: "Please contact support if this error persists.",
          icon: "server",
        };
      case "AccessDenied":
        return {
          title: "Access Denied",
          description: "You do not have permission to sign in.",
          suggestion: "Please contact support if you believe this is an error.",
          icon: "shield",
        };
      case "Verification":
        return {
          title: "Verification Error",
          description:
            "The verification token has expired or has already been used.",
          suggestion: "Please try signing in again.",
          icon: "clock",
        };
      case "Default":
      default:
        return {
          title: "Authentication Error",
          description: "An error occurred during the authentication process.",
          suggestion: "Please try signing in again.",
          icon: "warning",
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case "server":
        return (
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
            />
          </svg>
        );
      case "shield":
        return (
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
            />
          </svg>
        );
      case "clock":
        return (
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-500 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
              <div className="relative bg-white rounded-2xl p-4 shadow-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto">
                  {renderIcon(errorDetails.icon)}
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-700 bg-clip-text text-transparent mb-3">
            {errorDetails.title}
          </h2>
        </div>

        {/* Error Details Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
          <div className="text-center space-y-6">
            {/* Error Description */}
            <div className="space-y-3">
              <p className="text-lg text-gray-700 leading-relaxed">
                {errorDetails.description}
              </p>
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-amber-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-amber-800 font-medium">
                    {errorDetails.suggestion}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Signing In Again
              </Link>

              <Link
                href="/"
                className="w-full flex justify-center items-center py-4 px-6 border border-gray-300 text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Return to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        {error && (
          <div className="mt-8 bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6">
            <details className="cursor-pointer">
              <summary className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Technical Details
              </summary>
              <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-sm">
                <p className="text-gray-400">Error Code:</p>
                <p className="font-semibold">{error}</p>
                <p className="text-gray-400 mt-2">Timestamp:</p>
                <p className="font-semibold">{new Date().toISOString()}</p>
              </div>
            </details>
          </div>
        )}

        {/* Support Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{" "}
            <a
              href="#"
              className="font-medium text-blue-600 hover:text-blue-700 underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 flex items-center justify-center">
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
      <AuthErrorContent />
    </Suspense>
  );
}
