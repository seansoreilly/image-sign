import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getValidatedEnv } from '@/lib/env-validation';
import crypto from 'crypto';
import sharp from 'sharp';
import piexif from 'piexifjs';
import extract from 'png-chunks-extract';
import encode from 'png-chunks-encode';
import { encode as encodeText, decode as decodeText } from 'png-chunk-text';
import { logAuditEvent, LogEvent } from '@/lib/logging';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

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

    // Get validated environment variables
    const env = getValidatedEnv();

    // Process the image
    const signedImageBuffer = await processImage(
      file, 
      session.user.email,
      env.SIGNING_PRIVATE_KEY
    );
    
    // Calculate image hash for logging
    const imageHash = crypto.createHash('sha256').update(signedImageBuffer).digest('hex');

    // Log the audit event
    await logAuditEvent(
      LogEvent.SIGN,
      session.user.email,
      imageHash,
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      }
    );

    // Return the signed image
    return new NextResponse(signedImageBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.type,
        'Content-Disposition': `attachment; filename="signed_${file.name}"`,
      },
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
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

function encryptEmail(email: string): string {
  // Get validated environment variables
  const env = getValidatedEnv();
  const secretKey = env.ENCRYPTION_SECRET || env.NEXTAUTH_SECRET;
  
  // Use simple but secure encryption for demo purposes
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(email, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return iv:encrypted format
  return `${iv.toString('hex')}:${encrypted}`;
}

async function processImage(
  file: File, 
  userEmail: string,
  privateKey: string
): Promise<Buffer> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Encrypt the user's email
  const encryptedEmail = encryptEmail(userEmail);
  
  // Create metadata
  const timestamp = new Date().toISOString();
  
  // Handle private key formatting - the key might be base64 encoded with or without PEM headers
  let formattedPrivateKey: string;
  
  try {
    // First, try to decode the base64 to see if it contains PEM headers
    const decodedKey = Buffer.from(privateKey, 'base64').toString('utf-8');
    
    if (decodedKey.includes('-----BEGIN PRIVATE KEY-----')) {
      // Key already has PEM headers, use as-is
      formattedPrivateKey = decodedKey;
    } else {
      // Key is raw base64 without headers, add them
      const keyWithLineBreaks = privateKey.replace(/(.{64})/g, '$1\n');
      formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${keyWithLineBreaks}\n-----END PRIVATE KEY-----`;
    }
  } catch (error) {
    // If base64 decoding fails, assume it's already a PEM formatted string
    if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      formattedPrivateKey = privateKey;
    } else {
      // Last resort: treat as raw base64 and add headers
      const keyWithLineBreaks = privateKey.replace(/(.{64})/g, '$1\n');
      formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${keyWithLineBreaks}\n-----END PRIVATE KEY-----`;
    }
  }
  
  // Create the data to be signed
  const dataToSign = Buffer.concat([
    buffer,
    Buffer.from(encryptedEmail, 'utf8'),
    Buffer.from(timestamp, 'utf8')
  ]);
  
  console.log('📝 Signing data details:', {
    bufferSize: buffer.length,
    encryptedEmailLength: encryptedEmail.length,
    timestampLength: timestamp.length,
    totalDataSize: dataToSign.length,
    encryptedEmail: encryptedEmail,
    timestamp: timestamp
  });
  
  // Create a digital signature - handle both RSA and Ed25519 keys
  let signature: string;
  
  console.log('🔐 Starting signature creation...');
  
  try {
    // Try Ed25519 signing first (no hash algorithm needed for Ed25519)
    console.log('🔐 Attempting Ed25519 signing...');
    signature = crypto.sign(null, dataToSign, formattedPrivateKey).toString('base64');
    console.log('🔐 Ed25519 signing successful');
  } catch (ed25519Error) {
    console.log('⚠️ Ed25519 signing failed:', ed25519Error.message);
    try {
      // Fallback to RSA/ECDSA signing with SHA-256
      console.log('🔐 Attempting RSA/ECDSA signing...');
      const sign = crypto.createSign('sha256');
      sign.update(buffer);
      sign.update(encryptedEmail);
      sign.update(timestamp);
      signature = sign.sign(formattedPrivateKey, 'base64');
      console.log('🔐 RSA/ECDSA signing successful');
    } catch (rsaError) {
      console.error('❌ Ed25519 signing failed:', ed25519Error);
      console.error('❌ RSA signing failed:', rsaError);
      throw new Error('Unable to sign with either Ed25519 or RSA methods');
    }
  }

  // Create signature metadata payload
  const signaturePayload = {
    signature,
    email: encryptedEmail,
    timestamp,
  };

  const signatureString = JSON.stringify(signaturePayload);

  // Get image metadata
  const metadata = await sharp(buffer).metadata();
  
  if (metadata.format === 'jpeg') {
    // For JPEG files, embed signature in EXIF data
    try {
      const jpegBuffer = await sharp(buffer)
        .withMetadata()
        .jpeg({ quality: 95 })
        .toBuffer();
      
      // Convert buffer to base64 for piexif
      const jpegBase64 = jpegBuffer.toString('base64');
      const jpegDataUrl = `data:image/jpeg;base64,${jpegBase64}`;
      
      // Load existing EXIF data or create new
      let exifDict;
      try {
        exifDict = piexif.load(jpegDataUrl);
      } catch {
        exifDict = {};
      }
      
      // Ensure required EXIF sections exist
      if (!exifDict['0th']) exifDict['0th'] = {};
      if (!exifDict['Exif']) exifDict['Exif'] = {};
      
      // Add our signature to EXIF data
      exifDict['0th'][piexif.ImageIFD.ImageDescription] = signatureString;
      exifDict['0th'][piexif.ImageIFD.Software] = 'Image-Sign Application';
      exifDict['0th'][piexif.ImageIFD.DateTime] = timestamp.replace('T', ' ').split('.')[0];
      exifDict['Exif'][piexif.ExifIFD.UserComment] = `Signed by: ${userEmail}`;
      
      // Insert EXIF data back into image
      const exifBytes = piexif.dump(exifDict);
      const signedImageDataUrl = piexif.insert(exifBytes, jpegDataUrl);
      
      // Convert back to buffer
      const base64Data = signedImageDataUrl.replace(/^data:image\/jpeg;base64,/, '');
      return Buffer.from(base64Data, 'base64');
      
    } catch (exifError) {
      console.warn('EXIF embedding failed, falling back to basic processing:', exifError);
      // Fallback to basic processing without EXIF
      return await sharp(buffer)
        .withMetadata()
        .jpeg({ quality: 95 })
        .toBuffer();
    }
  } else if (metadata.format === 'png') {
    // For PNG files, embed signature in a text chunk
    try {
        const chunks = extract(buffer);

        // Filter out any existing signature chunks
        const otherChunks = chunks.filter(chunk => {
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

        // Add our new signature chunk
        const textChunk = encodeText('Signature', signatureString);
        otherChunks.splice(-1, 0, textChunk); // Insert before IEND chunk

        return Buffer.from(encode(otherChunks));
    } catch (pngError) {
        console.warn('PNG metadata embedding failed, falling back to original buffer:', pngError);
        return buffer;
    }
  } else {
    // For other non-JPEG formats (GIF, WEBP), we currently don't have a metadata solution
    // The watermark approach was flawed because of truncation.
    // For now, we will return the original image buffer without a signature for these formats.
    console.warn(`Signature embedding not implemented for ${metadata.format}, returning original image.`);
    return buffer;
  }
} 