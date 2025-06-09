import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Image Sign - Secure Digital Image Authentication";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          backgroundImage:
            "linear-gradient(45deg, #f8fafc 0%, #e0f2fe 50%, #e0e7ff 100%)",
        }}
      >
        {/* Shield Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "120px",
            height: "120px",
            backgroundColor: "#2563eb",
            borderRadius: "24px",
            marginBottom: "40px",
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "60px",
            fontWeight: "bold",
            background:
              "linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #4f46e5 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            lineHeight: 1.2,
            marginBottom: "20px",
          }}
        >
          Image Sign
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "32px",
            color: "#374151",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.3,
          }}
        >
          Secure Digital Image Authentication
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "20px",
            color: "#6b7280",
            textAlign: "center",
            maxWidth: "700px",
            marginTop: "20px",
            lineHeight: 1.4,
          }}
        >
          Protect your digital assets with cryptographic signatures
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
