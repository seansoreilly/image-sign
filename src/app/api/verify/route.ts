import { NextRequest, NextResponse } from 'next/server';
import { getValidatedEnv } from '@/lib/env-validation';
import { VerificationResult } from '@/types/verification';
import crypto from 'crypto';
import sharp from 'sharp';
import piexif from 'piexifjs';
import extract from 'png-chunks-extract';
import { decode as decodeText } from 'png-chunk-text';
import { logAuditEvent, LogEvent } from '@/lib/logging';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' }, 
        { status: 400 }
      );
    }

    // Validate image
    const validationError = await validateImage(file);
    if (validationError) {
      return NextResponse.json(
        { error: validationError }, 
        { status: 400 }
      );
    }

    // Extract and verify the image
    const verificationResult = await verifyImage(file);
    
    // Calculate image hash for logging
    const buffer = Buffer.from(await file.arrayBuffer());
    const imageHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Log the audit event
    await logAuditEvent(
      LogEvent.VERIFY,
      verificationResult.email || 'anonymous',
      imageHash,
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        verified: verificationResult.verified,
        error: verificationResult.error,
      }
    );

    return NextResponse.json(verificationResult, { status: 200 });

  } catch (error) {
    console.error('Error verifying image:', error);
    return NextResponse.json(
      { 
        verified: false,
        error: 'Internal server error',
        details: 'Unable to process the image for verification'
      }, 
      { status: 500 }
    );
  }
}

async function validateImage(file: File): Promise<string | null> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File size too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`;
  }

  // Additional validation using sharp to ensure it's a valid image
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await sharp(buffer).metadata();
  } catch (error) {
    return 'Invalid or corrupted image file';
  }

  return null;
}

async function extractMetadata(file: File): Promise<string | null> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(buffer).metadata();
  
  if (metadata.format === 'jpeg') {
    try {
      // Convert buffer to base64 for piexif
      const jpegBase64 = buffer.toString('base64');
      const jpegDataUrl = `data:image/jpeg;base64,${jpegBase64}`;
      
      // Load EXIF data
      const exifDict = piexif.load(jpegDataUrl);
      
      // Extract signature from EXIF ImageDescription
      if (exifDict['0th'] && exifDict['0th'][piexif.ImageIFD.ImageDescription]) {
        const imageDescription = exifDict['0th'][piexif.ImageIFD.ImageDescription];
        
        // Check if this is our signature format
        if (typeof imageDescription === 'string' && imageDescription.startsWith('signed:')) {
          return imageDescription;
        }
      }
    } catch (exifError) {
      console.warn('Failed to extract EXIF data:', exifError);
      return null;
    }
  } else if (metadata.format === 'png') {
    try {
      const chunks = extract(buffer);
      const textChunks = chunks.filter(chunk => chunk.name === 'tEXt');

      for (const chunk of textChunks) {
        try {
          const decoded = decodeText(chunk.data);
          if (decoded.keyword === 'Signature') {
            // Check if this is our signature format
            if (typeof decoded.text === 'string' && decoded.text.startsWith('signed:')) {
              return decoded.text;
            }
          }
        } catch (e) {
          // Ignore malformed text chunks
        }
      }
    } catch (pngError) {
      console.warn('Failed to extract PNG metadata:', pngError);
      return null;
    }
  } else {
    // For non-JPEG/PNG formats, we currently don't support verification
    // This is more complex and would require OCR or pattern matching
    // For now, we'll return null indicating no signature found
    console.warn('Non-JPEG verification not fully implemented');
    return null;
  }
  
  return null;
}

async function decryptEmail(encryptedData: string): Promise<string | null> {
  try {
    // Get validated environment variables
    const env = getValidatedEnv();
    const secretKey = env.ENCRYPTION_SECRET || env.NEXTAUTH_SECRET;
    
    // Split the iv and encrypted data
    const [ivHex, encrypted] = encryptedData.split(':');
    
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    
    // Use the same algorithm as encryption
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

async function verifyImage(file: File): Promise<VerificationResult> {
  try {
    // Extract metadata from the image
    const signature = await extractMetadata(file);
    
    if (!signature) {
      return {
        verified: false,
        details: 'No digital signature found in image metadata'
      };
    }
    
    // Parse the signature format: "signed:encryptedEmail:timestamp"
    const signatureParts = signature.split(':');
    
    if (signatureParts.length !== 3 || signatureParts[0] !== 'signed') {
      return {
        verified: false,
        error: 'Invalid signature format',
        details: 'The image contains unrecognized signature data'
      };
    }
    
    const [, encryptedEmail, timestamp] = signatureParts;
    
    // Decrypt the email
    const decryptedEmail = await decryptEmail(encryptedEmail);
    
    if (!decryptedEmail) {
      return {
        verified: false,
        error: 'Decryption failed',
        details: 'Unable to decrypt the embedded email address'
      };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(decryptedEmail)) {
      return {
        verified: false,
        error: 'Invalid email format',
        details: 'The decrypted data does not contain a valid email address'
      };
    }
    
    // Validate timestamp format
    const timestampDate = new Date(timestamp);
    if (isNaN(timestampDate.getTime())) {
      return {
        verified: false,
        error: 'Invalid timestamp',
        details: 'The signature contains an invalid timestamp'
      };
    }
    
    // Check if the signature is not too old (optional expiration check)
    const now = new Date();
    const daysDiff = (now.getTime() - timestampDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // If signature is older than 365 days, warn but still verify
    let ageWarning = '';
    if (daysDiff > 365) {
      ageWarning = `Signature is ${Math.floor(daysDiff)} days old`;
    }
    
    return {
      verified: true,
      email: decryptedEmail,
      timestamp: timestamp,
      details: ageWarning || 'Image signature successfully verified'
    };
    
  } catch (error) {
    console.error('Verification error:', error);
    return {
      verified: false,
      error: 'Verification failed',
      details: 'An error occurred while verifying the image signature'
    };
  }
} 