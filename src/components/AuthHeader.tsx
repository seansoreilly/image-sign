"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function AuthHeader() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  if (status === "loading") {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Image Sign</h1>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse">
                <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Image Sign</h1>
          </div>

          {/* Authentication Section */}
          <div className="flex items-center space-x-4">
            {session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full"
                        unoptimized={false}
                      />
                    ) : (
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {session.user?.name?.charAt(0) ||
                          session.user?.email?.charAt(0) ||
                          "U"}
                      </div>
                    )}
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {session.user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {session.user?.name || "User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {session.user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => setIsDropdownOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Profile Settings
                      </button>
                      <button
                        onClick={() => setIsDropdownOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Account
                      </button>
                    </div>

                    <div className="border-t border-gray-200 py-1">
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => signIn("google")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
