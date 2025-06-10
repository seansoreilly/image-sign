"use client";

import { useState, useRef, useCallback } from "react";
import { VerificationResult } from "@/types/verification";

interface VerifyState {
  verifying: boolean;
  error: string | null;
  result: VerificationResult | null;
}

export default function ImageVerification() {
  const [verifyState, setVerifyState] = useState<VerifyState>({
    verifying: false,
    error: null,
    result: null,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setVerifyState({ verifying: false, error: null, result: null });
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setVerifyState({ verifying: true, error: null, result: null });

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Verification failed");
      }

      setVerifyState({ verifying: false, error: null, result: responseData });
    } catch (error) {
      setVerifyState({
        verifying: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
        result: null,
      });
    }
  }, []);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      const files = event.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mt-12">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Verify Image Signature
          </h2>
          <p className="text-gray-600">
            Drop an image below to check its digital signature
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? "border-teal-400 bg-teal-50/50 scale-105"
              : selectedFile
              ? "border-gray-400 bg-gray-50/50"
              : "border-gray-300 bg-gray-50/50 hover:border-teal-400 hover:bg-teal-50/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-green-500 to-teal-600">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
              <p className="text-lg font-semibold text-gray-700">
                Drop image here to verify
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <img
                src={previewUrl!}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-md"
              />
            </div>
          )}
        </div>

        {verifyState.verifying && (
          <div className="flex items-center justify-center space-x-3 text-lg font-semibold text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
            <span>Verifying...</span>
          </div>
        )}

        {verifyState.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <h3 className="text-xl font-bold text-red-700">
              Verification Failed
            </h3>
            <p className="text-red-600 mt-1">{verifyState.error}</p>
          </div>
        )}

        {verifyState.result?.verified && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-2xl font-bold text-green-800">
              Image Verified Successfully
            </h3>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong className="font-semibold">Signed by:</strong>{" "}
                {verifyState.result.email}
              </p>
              <p>
                <strong className="font-semibold">Timestamp:</strong>{" "}
                {new Date(verifyState.result.timestamp!).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {(verifyState.error || verifyState.result) && (
          <button
            onClick={resetState}
            className="w-full py-3 px-6 rounded-xl font-semibold text-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Verify Another Image
          </button>
        )}
      </div>
    </div>
  );
}
