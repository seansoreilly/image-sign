"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface UploadState {
  uploading: boolean;
  error: string | null;
  success: boolean;
}

interface VerificationResult {
  verified: boolean;
  email?: string;
  timestamp?: string;
  error?: string;
}

export default function SignedImageUploader() {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    error: null,
    success: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadState({ uploading: false, error: null, success: false });
    setVerificationResult(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleVerify = async () => {
    if (!selectedFile) {
      setUploadState((prev) => ({
        ...prev,
        error: "Please select an image first",
      }));
      return;
    }

    setUploadState({ uploading: true, error: null, success: false });
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });

      const resultData: VerificationResult = await response.json();

      if (!response.ok) {
        throw new Error(resultData.error || "Verification failed");
      }

      setVerificationResult(resultData);
      setUploadState({ uploading: false, error: null, success: true });
    } catch (error) {
      console.error("Verification error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";
      setUploadState({
        uploading: false,
        error: errorMessage,
        success: false,
      });
      setVerificationResult({ verified: false, error: errorMessage });
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadState({ uploading: false, error: null, success: false });
    setVerificationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Read Signed Image
          </h2>
          <p className="text-gray-600">
            Upload an image to read its digital signature
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? "border-cyan-400 bg-cyan-50/50 scale-105"
              : selectedFile
              ? "border-green-400 bg-green-50/50"
              : "border-gray-300 bg-gray-50/50 hover:border-cyan-400 hover:bg-cyan-50/30"
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
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                    isDragOver
                      ? "bg-cyan-500"
                      : "bg-gradient-to-br from-teal-500 to-cyan-600"
                  }`}
                >
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm0 13.036h.008v.008h-.008v-.008Z"
                    />
                  </svg>
                </div>
              </div>
              <p className="font-semibold text-gray-700">
                <span className="text-cyan-500">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, etc.</p>
            </div>
          ) : (
            <div>
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={800}
                  height={192}
                  unoptimized={true}
                  className="mx-auto max-h-48 rounded-lg object-contain"
                />
              )}
            </div>
          )}
        </div>

        {/* File Info & Action */}
        {selectedFile && (
          <div className="flex items-center justify-between bg-gray-100/80 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white shadow-md">
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-800">
                  {selectedFile.name}
                </p>
                <p className="text-gray-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleVerify}
                disabled={uploadState.uploading}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {uploadState.uploading ? "Verifying..." : "Verify Image"}
              </button>
              <button
                onClick={clearSelection}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors transform hover:scale-110"
                aria-label="Remove image"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <div
            className={`rounded-xl p-4 text-center ${
              verificationResult.verified
                ? "bg-green-100/80 text-green-800"
                : "bg-red-100/80 text-red-800"
            }`}
          >
            <p className="font-semibold text-lg mb-2">
              {verificationResult.verified
                ? "Signature Valid"
                : "Signature Invalid"}
            </p>
            {verificationResult.email && (
              <p className="text-sm">
                Signed by:{" "}
                <span className="font-mono">{verificationResult.email}</span>
              </p>
            )}
            {verificationResult.timestamp && (
              <p className="text-sm">
                Signed at:{" "}
                <span className="font-mono">
                  {new Date(verificationResult.timestamp).toLocaleString()}
                </span>
              </p>
            )}
            {verificationResult.error && (
              <p className="text-sm mt-2">{verificationResult.error}</p>
            )}
          </div>
        )}

        {/* Error Message */}
        {uploadState.error && !uploadState.success && (
          <div className="bg-red-100/80 text-red-800 rounded-xl p-4 text-center">
            <p className="font-semibold">An error occurred:</p>
            <p className="text-sm">{uploadState.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
