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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadState({ uploading: false, error: null, success: false });

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
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
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Sign In Required
          </h2>
          <p className="text-gray-600">
            Please sign in to upload and sign images.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
        Upload & Sign Image
      </h2>

      <div className="space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <button
                onClick={clearSelection}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              File: {selectedFile?.name} (
              {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploadState.uploading}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            !selectedFile || uploadState.uploading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {uploadState.uploading ? "Signing Image..." : "Sign & Download Image"}
        </button>

        {/* Status Messages */}
        {uploadState.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{uploadState.error}</p>
          </div>
        )}

        {uploadState.success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">
              Image signed successfully! Download should start automatically.
            </p>
          </div>
        )}

        {/* User Info */}
        <div className="text-center text-sm text-gray-600">
          Signed in as:{" "}
          <span className="font-medium">{session.user?.email}</span>
        </div>
      </div>
    </div>
  );
}
