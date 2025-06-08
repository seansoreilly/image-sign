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

    // Process the image
    const signedImageBuffer = await processImage(file, session.user.email);
    
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

async function encryptEmail(email: string): Promise<string> {
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

async function processImage(file: File, userEmail: string): Promise<Buffer> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Encrypt the user's email
  const encryptedEmail = await encryptEmail(userEmail);
  
  // Create signature metadata
  const timestamp = new Date().toISOString();
  const signature = `signed:${encryptedEmail}:${timestamp}`;
  
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
      exifDict['0th'][piexif.ImageIFD.ImageDescription] = signature;
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
        const textChunk = encodeText('Signature', signature);
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