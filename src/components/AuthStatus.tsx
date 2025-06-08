"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="p-4">Loading authentication status...</div>;
  }

  if (session) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-lg font-semibold text-green-800 mb-2">
          Signed in as {session.user?.email}
        </h2>
        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {session.user?.name}
          </p>
          <p>
            <strong>Email:</strong> {session.user?.email}
          </p>
          {session.user?.image && (
            <img
              src={session.user.image}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
          )}
        </div>
        <button
          onClick={() => signOut()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h2 className="text-lg font-semibold text-blue-800 mb-2">
        Not signed in
      </h2>
      <button
        onClick={() => signIn("google")}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Sign in with Google
      </button>
    </div>
  );
}
