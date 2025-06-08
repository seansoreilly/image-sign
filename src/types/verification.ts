/**
 * Verification Result Interface
 * Defines the structure of the response from the image verification API
 */
export interface VerificationResult {
  /** Whether the image signature was successfully verified */
  verified: boolean;
  
  /** The email address extracted from the signature (if verified) */
  email?: string;
  
  /** The timestamp when the image was signed (if verified) */
  timestamp?: string;
  
  /** Error message if verification failed */
  error?: string;
  
  /** Additional details about the verification process */
  details?: string;
}

/**
 * API Error Response Interface
 * Defines the structure of error responses from the verification API
 */
export interface VerificationError {
  /** Error message */
  error: string;
  
  /** Optional additional details about the error */
  details?: string;
} 