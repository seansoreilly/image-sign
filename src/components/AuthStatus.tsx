"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <div className="animate-pulse flex items-center space-x-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-sm rounded-2xl shadow-lg border border-green-200/50 p-8">
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-white rounded-full p-3 shadow-lg">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-green-800">Welcome back!</h2>
            <p className="text-green-700 font-medium">
              You're successfully signed in as
            </p>

            {/* User Profile Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200/50 shadow-md">
              <div className="flex items-center space-x-4">
                {session.user?.image ? (
                  <div className="relative">
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="rounded-full border-3 border-white shadow-lg"
                      unoptimized={false}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    {session.user?.name?.charAt(0) ||
                      session.user?.email?.charAt(0) ||
                      "U"}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="text-lg font-bold text-gray-900">
                    {session.user?.name || "User"}
                  </p>
                  <p className="text-sm text-gray-600">{session.user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => signOut()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/50 p-8">
      <div className="text-center space-y-6">
        {/* Sign In Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-3 shadow-lg">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-blue-800">
            Ready to get started?
          </h2>
          <p className="text-blue-700 leading-relaxed">
            Sign in with your Google account to securely sign and authenticate
            your images with cryptographic verification.
          </p>
        </div>

        {/* Sign In Button */}
        <button
          onClick={() => signIn("google")}
          className="inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
          Sign in with Google
        </button>

        {/* Security Note */}
        <p className="text-xs text-blue-600 bg-blue-100/50 rounded-lg p-3 border border-blue-200/50">
          🔒 Your data is protected with industry-standard OAuth 2.0 security
        </p>
      </div>
    </div>
  );
}
