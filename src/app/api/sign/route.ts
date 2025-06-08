import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getValidatedEnv } from '@/lib/env-validation';
import crypto from 'crypto';
import sharp from 'sharp';
import piexif from 'piexifjs';

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
  } else {
    // For non-JPEG formats, add a subtle watermark with the signature
    const { width = 1000, height = 1000 } = metadata;
    
    // Create a subtle watermark
    const watermarkSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text x="10" y="${height - 10}" 
              font-family="Arial" 
              font-size="12" 
              fill="rgba(255,255,255,0.3)"
              transform="rotate(-45 ${width/2} ${height/2})">
          ${signature.substring(0, 50)}...
        </text>
      </svg>
    `;
    
    const watermarkBuffer = Buffer.from(watermarkSvg);
    
    return await sharp(buffer)
      .composite([{ 
        input: watermarkBuffer, 
        gravity: 'southeast',
        blend: 'over'
      }])
      .withMetadata()
      .toBuffer();
  }
} 