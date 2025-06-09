import { NextRequest, NextResponse } from 'next/server';
import { getValidatedEnv } from '@/lib/env-validation';
import { VerificationResult } from '@/types/verification';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import piexif from 'piexifjs';
import extract from 'png-chunks-extract';
import encode from 'png-chunks-encode';
import { decode as decodeText } from 'png-chunk-text';
import { logAuditEvent, LogEvent } from '@/lib/logging';

// export const runtime = 'edge'; // Re-add later

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

  // Additional validation using file-type to check magic numbers
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !ALLOWED_TYPES.includes(type.mime)) {
      return 'Invalid or corrupted image file (magic number mismatch)';
    }
  } catch (error) {
    return 'Invalid or corrupted image file';
  }

  return null;
}

async function extractMetadata(file: File): Promise<string | null> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = await fileTypeFromBuffer(buffer);
  
  console.log('🔍 Extracting metadata from file:', {
    fileName: file.name,
    fileSize: file.size,
    detectedType: type?.mime,
    bufferSize: buffer.length
  });
  
  if (type && type.mime === 'image/jpeg') {
    try {
      // Convert buffer to base64 for piexif
      const jpegBase64 = buffer.toString('base64');
      const jpegDataUrl = `data:image/jpeg;base64,${jpegBase64}`;
      
      // Load EXIF data
      const exifDict = piexif.load(jpegDataUrl);
      
      console.log('📋 JPEG EXIF data loaded:', {
        has0th: !!exifDict['0th'],
        hasExif: !!exifDict['Exif'],
        hasGPS: !!exifDict['GPS'],
        imageDescriptionExists: !!(exifDict['0th'] && exifDict['0th'][piexif.ImageIFD.ImageDescription])
      });
      
      // Extract signature from EXIF ImageDescription
      if (exifDict['0th'] && exifDict['0th'][piexif.ImageIFD.ImageDescription]) {
        const imageDescription = exifDict['0th'][piexif.ImageIFD.ImageDescription];
        
        // Check if this is our signature format (JSON payload)
        if (typeof imageDescription === 'string') {
          try {
            // Try to parse as JSON first
            JSON.parse(imageDescription);
            return imageDescription;
          } catch {
            // If not JSON, check for legacy format
            if (imageDescription.startsWith('signed:')) {
              return imageDescription;
            }
          }
        }
      }
    } catch (exifError) {
      console.warn('Failed to extract EXIF data:', exifError);
      return null;
    }
  } else if (type && type.mime === 'image/png') {
    try {
      const chunks = extract(buffer);
      const textChunks = chunks.filter(chunk => chunk.name === 'tEXt');

      console.log('📋 PNG chunks extracted:', {
        totalChunks: chunks.length,
        textChunks: textChunks.length,
        chunkNames: chunks.map(c => c.name)
      });

      for (const chunk of textChunks) {
        try {
          const decoded = decodeText(chunk.data);
          if (decoded.keyword === 'Signature') {
            // Check if this is our signature format (JSON payload)
            if (typeof decoded.text === 'string') {
              try {
                // Try to parse as JSON first
                JSON.parse(decoded.text);
                return decoded.text;
              } catch {
                // If not JSON, check for legacy format
                if (decoded.text.startsWith('signed:')) {
                  return decoded.text;
                }
              }
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
  console.log('🔍 Starting image verification process...');
  console.log(`📁 File details: name=${file.name}, size=${file.size}, type=${file.type}`);
  
  try {
    const metadata = await extractMetadata(file);
    console.log('📋 Extracted metadata:', metadata ? 'Found' : 'Not found');
    
    if (!metadata) {
      console.log('❌ No signature metadata found in image');
      return {
        verified: false,
        error: 'No signature metadata found in the image.',
      };
    }

    console.log('📋 Raw metadata:', metadata.substring(0, 200) + (metadata.length > 200 ? '...' : ''));

    let parsedMetadata: any;
    if (metadata.startsWith('signed:')) {
      console.log('🔄 Processing legacy format metadata...');
      // Handle legacy format
      const parts = metadata.split(',');
      const encryptedEmail = parts.find(p => p.startsWith('signed:'))?.split(':')[1] || '';
      const timestamp = parts.find(p => p.startsWith('timestamp:'))?.split(':')[1] || '';
      const digitalSignature = parts.find(p => p.startsWith('signature:'))?.split(':')[1] || '';
      
      parsedMetadata = {
        email: encryptedEmail,
        timestamp: timestamp,
        signature: digitalSignature,
        version: '1.0' // Legacy version
      };
      console.log('📋 Legacy metadata parsed:', { 
        hasEmail: !!encryptedEmail, 
        hasTimestamp: !!timestamp, 
        hasSignature: !!digitalSignature 
      });

    } else {
      console.log('🔄 Processing JSON format metadata...');
      // Handle JSON format
      try {
        parsedMetadata = JSON.parse(metadata);
        console.log('📋 JSON metadata parsed:', { 
          hasEmail: !!parsedMetadata.email, 
          hasTimestamp: !!parsedMetadata.timestamp, 
          hasSignature: !!parsedMetadata.signature,
          version: parsedMetadata.version
        });
      } catch (e) {
        console.log('❌ Failed to parse JSON metadata:', e);
        return {
          verified: false,
          error: 'Failed to parse signature metadata.',
        };
      }
    }

    const { 
      email: encryptedEmail, 
      timestamp, 
      signature: digitalSignature,
      publicKey: providedPublicKey,
      version 
    } = parsedMetadata;

    console.log('🔑 Signature components check:', {
      hasEncryptedEmail: !!encryptedEmail,
      hasTimestamp: !!timestamp,
      hasDigitalSignature: !!digitalSignature,
      hasProvidedPublicKey: !!providedPublicKey,
      timestampValue: timestamp
    });

    if (!encryptedEmail || !timestamp || !digitalSignature) {
      console.log('❌ Incomplete signature data');
      return {
        verified: false,
        error: 'Incomplete signature data in image metadata.',
      };
    }

    // Decrypt the email address
    console.log('🔓 Attempting to decrypt email...');
    const email = await decryptEmail(encryptedEmail);
    console.log('🔓 Email decryption result:', email ? 'Success' : 'Failed');
    
    if (!email) {
      console.log('❌ Email decryption failed');
      return {
        verified: false,
        error: 'Failed to decrypt email from signature.',
      };
    }
    
    console.log('👤 Decrypted email:', email);
    
    const publicKeyRaw = providedPublicKey || getValidatedEnv().SIGNING_PUBLIC_KEY;
    console.log('🔑 Using public key:', providedPublicKey ? 'From metadata' : 'From environment');
    console.log('🔑 Public key preview:', publicKeyRaw.substring(0, 50) + '...');
    
    // Handle public key formatting - similar to private key handling in signing
    let formattedPublicKey: string;
    
    try {
      // First, try to decode the base64 to see if it contains PEM headers
      const decodedKey = Buffer.from(publicKeyRaw, 'base64').toString('utf-8');
      
      if (decodedKey.includes('-----BEGIN PUBLIC KEY-----')) {
        // Key already has PEM headers, use as-is
        formattedPublicKey = decodedKey;
        console.log('🔑 Public key format: Base64 with PEM headers');
      } else {
        // Key is raw base64 without headers, add them
        const keyWithLineBreaks = publicKeyRaw.replace(/(.{64})/g, '$1\n');
        formattedPublicKey = `-----BEGIN PUBLIC KEY-----\n${keyWithLineBreaks}\n-----END PUBLIC KEY-----`;
        console.log('🔑 Public key format: Raw base64, added PEM headers');
      }
    } catch (error) {
      // If base64 decoding fails, assume it's already a PEM formatted string
      if (publicKeyRaw.includes('-----BEGIN PUBLIC KEY-----')) {
        formattedPublicKey = publicKeyRaw;
        console.log('🔑 Public key format: Already PEM formatted');
      } else {
        // Last resort: treat as raw base64 and add headers
        const keyWithLineBreaks = publicKeyRaw.replace(/(.{64})/g, '$1\n');
        formattedPublicKey = `-----BEGIN PUBLIC KEY-----\n${keyWithLineBreaks}\n-----END PUBLIC KEY-----`;
        console.log('🔑 Public key format: Fallback raw base64 with added PEM headers');
      }
    }

    console.log('🔑 Formatted public key preview:', formattedPublicKey.substring(0, 100) + '...');

    // Get the original image buffer (before signature was added)
    const currentBuffer = Buffer.from(await file.arrayBuffer());
    console.log('📄 Current image buffer size:', currentBuffer.length);
    
    // For PNG files, we need to reconstruct the original buffer by removing the signature chunk
    let originalBuffer: Buffer;
    const fileType = await fileTypeFromBuffer(currentBuffer);
    
    if (fileType && fileType.mime === 'image/png') {
      console.log('🔄 PNG detected: Reconstructing original buffer by removing signature chunk...');
      try {
        const chunks = extract(currentBuffer);
        
        // Filter out signature chunks to get the original image
        const originalChunks = chunks.filter(chunk => {
          if (chunk.name === 'tEXt') {
            try {
              const decoded = decodeText(chunk.data);
              return decoded.keyword !== 'Signature';
            } catch (e) {
              return true; // Keep malformed chunks
            }
          }
          return true;
        });
        
        // Reconstruct the original PNG without signature chunks
        originalBuffer = Buffer.from(encode(originalChunks));
        console.log('🔄 Original PNG buffer reconstructed, size:', originalBuffer.length);
      } catch (pngError) {
        console.log('⚠️ Failed to reconstruct original PNG, using current buffer:', pngError);
        originalBuffer = currentBuffer;
      }
    } else {
      console.log('📄 Non-PNG image, using current buffer as original');
      originalBuffer = currentBuffer;
    }

    let isValidSignature = false;

    // The data that was originally signed - should match exactly what was signed
    const dataToSign = Buffer.concat([
      originalBuffer,  // Use original buffer, not current buffer!
      Buffer.from(encryptedEmail, 'utf8'),
      Buffer.from(timestamp, 'utf8')
    ]);
    
    console.log('📝 Data to verify details:', {
      originalBufferSize: originalBuffer.length,
      currentBufferSize: currentBuffer.length,
      encryptedEmailLength: encryptedEmail.length,
      timestampLength: timestamp.length,
      totalDataSize: dataToSign.length
    });

    console.log('🔐 Starting signature verification...');
    
    try {
      // Try Ed25519 verification first (no hash algorithm needed for Ed25519)
      console.log('🔐 Attempting Ed25519 verification...');
      isValidSignature = crypto.verify(null, dataToSign, formattedPublicKey, Buffer.from(digitalSignature, 'base64'));
      console.log('🔐 Ed25519 verification result:', isValidSignature);
    } catch (ed25519Error) {
      console.log('⚠️ Ed25519 verification failed:', ed25519Error instanceof Error ? ed25519Error.message : 'Unknown error');
      try {
        // Fallback to RSA/ECDSA verification with SHA-256
        console.log('🔐 Attempting RSA/ECDSA verification...');
        const verify = crypto.createVerify('sha256');
        verify.update(originalBuffer);  // Use original buffer, not current buffer!
        verify.update(encryptedEmail);
        verify.update(timestamp);
        isValidSignature = verify.verify(formattedPublicKey, digitalSignature, 'base64');
        console.log('🔐 RSA/ECDSA verification result:', isValidSignature);
      } catch (rsaError) {
        console.error("❌ Ed25519 verification failed:", ed25519Error);
        console.error("❌ RSA verification failed:", rsaError);
        const ed25519Message = ed25519Error instanceof Error ? ed25519Error.message : 'Unknown error';
        const rsaMessage = rsaError instanceof Error ? rsaError.message : 'Unknown error';
        return {
          verified: false,
          error: 'Unable to verify signature with either Ed25519 or RSA methods.',
          details: `Ed25519: ${ed25519Message}, RSA: ${rsaMessage}`
        };
      }
    }
    
    console.log('🏁 Final verification result:', isValidSignature);
    
    if (isValidSignature) {
      console.log('✅ Signature verification successful!');
      logAuditEvent(LogEvent.VERIFY_SUCCESS, email, 'Signature validated');
      return {
        verified: true,
        email: email,
        timestamp: timestamp, // timestamp is already an ISO string from signing
      };
    } else {
      console.log('❌ Signature verification failed - signature is invalid');
      logAuditEvent(LogEvent.VERIFY_FAIL, email, 'Invalid signature');
      return {
        verified: false,
        error: 'Invalid signature. The image content or metadata may have been tampered with.',
      };
    }
  } catch (error) {
    console.error('💥 Error in verifyImage:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logAuditEvent(LogEvent.VERIFY_FAIL, 'unknown', `Verification failed: ${errorMessage}`);
    return {
      verified: false,
      error: 'An unexpected error occurred during image verification.',
      details: errorMessage,
    };
  }
} 