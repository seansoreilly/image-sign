import AuthHeader from "@/components/AuthHeader";
import AuthStatus from "@/components/AuthStatus";
import ImageUpload from "@/components/ImageUpload";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AuthHeader />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center space-y-12">
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                Welcome to Image Sign
              </h1>
              <p className="text-xl sm:text-2xl text-gray-700 font-medium">
                Secure image signing with digital authentication
              </p>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Protect your digital assets with cryptographic signatures. Sign
                in with your Google account to embed your verified identity
                directly into your images.
              </p>
            </div>

            {/* Visual accent */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative bg-white rounded-full p-4 shadow-lg">
                  <svg
                    className="w-12 h-12 text-blue-600"
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

          {/* Auth Status Card */}
          <div className="max-w-lg mx-auto">
            <AuthStatus />
          </div>

          {/* Image Upload Section */}
          <div className="max-w-2xl mx-auto">
            <ImageUpload />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
            <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <svg
                  className="w-8 h-8 text-white"
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Secure Authentication
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Your identity is verified using Google OAuth with
                industry-standard security protocols for maximum protection and
                trust.
              </p>
            </div>

            <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Digital Signing
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Embed your encrypted identity directly into image metadata for
                tamper-proof authenticity verification and ownership proof.
              </p>
            </div>

            <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <svg
                  className="w-8 h-8 text-white"
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Instant Verification
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Quickly verify the authenticity and ownership of signed images
                with our advanced cryptographic validation system.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl text-white max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Ready to secure your images?
            </h2>
            <p className="text-blue-100 text-lg mb-6">
              Join thousands of creators protecting their digital assets with
              cryptographic signatures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
                Get Started
              </button>
              <button className="px-8 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
