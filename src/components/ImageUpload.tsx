"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";

interface UploadState {
  uploading: boolean;
  error: string | null;
  success: boolean;
}

export default function ImageUpload() {
  const { data: session, status } = useSession();
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    error: null,
    success: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadState({ uploading: false, error: null, success: false });

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

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadState((prev) => ({
        ...prev,
        error: "Please select an image first",
      }));
      return;
    }

    if (!session?.user?.email) {
      setUploadState((prev) => ({
        ...prev,
        error: "Please sign in to upload images",
      }));
      return;
    }

    setUploadState({ uploading: true, error: null, success: false });

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/sign", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      // Get the signed image as a blob
      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed_${selectedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setUploadState({ uploading: false, error: null, success: true });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadState({
        uploading: false,
        error: error instanceof Error ? error.message : "Upload failed",
        success: false,
      });
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadState({ uploading: false, error: null, success: false });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (status === "loading") {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-10 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <div className="text-center space-y-6">
          {/* Lock Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gray-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-white rounded-full p-3 shadow-lg">
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-800">
              Authentication Required
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Please sign in with your Google account to upload and digitally
              sign your images with cryptographic verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Upload & Sign Image
          </h2>
          <p className="text-gray-600">
            Drag and drop your image or click to browse
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
              ? "border-blue-400 bg-blue-50/50 scale-105"
              : selectedFile
              ? "border-green-400 bg-green-50/50"
              : "border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30"
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
                      ? "bg-blue-500"
                      : "bg-gradient-to-br from-blue-500 to-purple-600"
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
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-700">
                  {isDragOver
                    ? "Drop your image here"
                    : "Choose an image to sign"}
                </p>
                <p className="text-sm text-gray-500">
                  Supports JPEG, PNG, GIF, WebP • Max 5MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-lg font-semibold text-green-700">
                Image selected successfully!
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-xl border border-gray-200 shadow-md"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* File Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white p-3 rounded-b-xl">
                <p className="text-sm font-medium truncate">
                  {selectedFile?.name}
                </p>
                <p className="text-xs text-gray-300">
                  {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploadState.uploading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform ${
            !selectedFile || uploadState.uploading
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105"
          }`}
        >
          {uploadState.uploading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Signing Image...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-5 h-5"
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
              <span>Sign & Download Image</span>
            </div>
          )}
        </button>

        {/* Status Messages */}
        {uploadState.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-500"
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
              <p className="text-red-700 font-medium">{uploadState.error}</p>
            </div>
          </div>
        )}

        {uploadState.success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-green-500"
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
              <div>
                <p className="text-green-700 font-medium">
                  Image signed successfully!
                </p>
                <p className="text-green-600 text-sm">
                  Your download should start automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">
                Signing as: {session.user?.name || "User"}
              </p>
              <p className="text-xs text-blue-600">{session.user?.email}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
