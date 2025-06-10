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
  
  // Encrypt the user's email and create timestamp
  const encryptedEmail = encryptEmail(userEmail);
  const timestamp = new Date().toISOString();
  
  // Handle private key formatting
  let formattedPrivateKey: string;
  try {
    const decodedKey = Buffer.from(privateKey, 'base64').toString('utf-8');
    if (decodedKey.includes('-----BEGIN PRIVATE KEY-----')) {
      formattedPrivateKey = decodedKey;
    } else {
      const keyWithLineBreaks = privateKey.replace(/(.{64})/g, '$1\n');
      formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${keyWithLineBreaks}\n-----END PRIVATE KEY-----`;
    }
  } catch (error) {
    if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      formattedPrivateKey = privateKey;
    } else {
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
    console.log('⚠️ Ed25519 signing failed:', ed25519Error instanceof Error ? ed25519Error.message : 'Unknown error');
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
  const originalBufferHash = crypto.createHash('sha256').update(buffer).digest('hex');
  const signaturePayload = {
    signature,
    email: encryptedEmail,
    timestamp,
    originalBufferHash: originalBufferHash
  };

  const signatureString = JSON.stringify(signaturePayload);

  // Get image metadata
  const metadata = await sharp(buffer).metadata();
  
  if (metadata.format === 'jpeg') {
    // For JPEG files, embed signature in EXIF data
    try {
      // Work directly with the original buffer, avoid Sharp processing for JPEG
      // Convert buffer to base64 for piexif
      const jpegBase64 = buffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${jpegBase64}`;
      
      // 1. Load existing EXIF data or create a new structure
      let exifDict;
      try {
        exifDict = piexif.load(dataUrl);
      } catch {
        console.log('No existing EXIF found, creating new structure.');
        exifDict = { '0th': {}, 'Exif': {}, 'GPS': {}, '1st': {}, 'thumbnail': undefined };
      }

      // 2. Prepare the signature payload, but the signature itself is empty for now
      const originalBufferHash = crypto.createHash('sha256').update(buffer).digest('hex');
      const signaturePayload = { signature: '', email: encryptedEmail, timestamp, originalBufferHash };
      const placeholderSignatureString = JSON.stringify(signaturePayload);

      // 3. Add our metadata (with the placeholder) to the existing EXIF data
      if (!exifDict['0th']) exifDict['0th'] = {};
      if (!exifDict['Exif']) exifDict['Exif'] = {};
      exifDict['0th'][piexif.ImageIFD.ImageDescription] = placeholderSignatureString;
      exifDict['0th'][piexif.ImageIFD.Software] = 'Image-Sign Application';
      
      // 4. Create the image body that will actually be signed
      const exifBytesWithPlaceholder = piexif.dump(exifDict);
      const imageWithPlaceholderDataUrl = piexif.insert(exifBytesWithPlaceholder, dataUrl);
      const imageBodyToSign = Buffer.from(imageWithPlaceholderDataUrl.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
      console.log('🖼️ JPEG body with placeholder EXIF created for signing, size:', imageBodyToSign.length);

      // 5. Create the data payload for the real signature
      // This is the image buffer with placeholder + email + timestamp
      const dataToSign = Buffer.concat([
        imageBodyToSign,
        Buffer.from(encryptedEmail, 'utf8'),
        Buffer.from(timestamp, 'utf8')
      ]);

      // 6. Create the actual digital signature
      let signature: string;
      try {
        console.log('🔐 Attempting Ed25519 signing for JPEG...');
        signature = crypto.sign(null, dataToSign, formattedPrivateKey).toString('base64');
        console.log('🔐 Ed25519 signing successful for JPEG');
      } catch (ed25519Error) {
        console.log('⚠️ Ed25519 signing failed for JPEG, falling back to RSA/ECDSA...');
        const sign = crypto.createSign('sha256');
        sign.update(dataToSign);
        signature = sign.sign(formattedPrivateKey, 'base64');
        console.log('🔐 RSA/ECDSA signing successful for JPEG');
      }

      // 7. Now, create the final EXIF data with the REAL signature
      signaturePayload.signature = signature;
      const finalSignatureString = JSON.stringify(signaturePayload);
      if (!exifDict['0th']) exifDict['0th'] = {};
      exifDict['0th'][piexif.ImageIFD.ImageDescription] = finalSignatureString;

      // 8. Embed the final EXIF block into the original image buffer
      const finalExifBytes = piexif.dump(exifDict);
      const finalImageDataUrl = piexif.insert(finalExifBytes, dataUrl);
      
      // Convert back to buffer
      const base64Data = finalImageDataUrl.replace(/^data:image\/jpeg;base64,/, '');
      
      console.log('✅ JPEG EXIF signature embedded successfully');
      return Buffer.from(base64Data, 'base64');
      
    } catch (exifError) {
      console.warn('EXIF embedding failed:', exifError);
      // Return original buffer if EXIF fails
      return buffer;
    }
  } else if (metadata.format === 'png') {
    // PNG logic - sign a normalized version that can be reconstructed during verification
    console.log('🖼️ Processing PNG...');
    
    try {
      // First, extract chunks and remove any existing signature
      const chunks = extract(buffer);
      const chunksWithoutSignature = chunks.filter(chunk => {
        if (chunk.name === 'tEXt') {
          try {
            const decoded = decodeText(chunk.data);
            return decoded.keyword !== 'Signature';
          } catch (e) {
            return true;
          }
        }
        return true;
      });
      
      // Create a normalized buffer without signature
      const normalizedBuffer = Buffer.from(encode(chunksWithoutSignature));
      console.log('📄 Normalized PNG buffer size:', normalizedBuffer.length, '(original:', buffer.length, ')');
      
      // Now sign the normalized buffer
      const dataToSign = Buffer.concat([
        normalizedBuffer, // Sign the normalized buffer
        Buffer.from(encryptedEmail, 'utf8'),
        Buffer.from(timestamp, 'utf8')
      ]);

      // Debug: Log PNG signing details
      const bufferHash = crypto.createHash('sha256').update(normalizedBuffer).digest('hex');
      const emailHash = crypto.createHash('sha256').update(Buffer.from(encryptedEmail, 'utf8')).digest('hex');
      const timestampHash = crypto.createHash('sha256').update(Buffer.from(timestamp, 'utf8')).digest('hex');
      const dataToSignHash = crypto.createHash('sha256').update(dataToSign).digest('hex');
      
      console.log('🔍 PNG Signing component hashes:', {
        normalizedBufferHash: bufferHash.substring(0, 16) + '...',
        emailHash: emailHash.substring(0, 16) + '...',
        timestampHash: timestampHash.substring(0, 16) + '...',
        dataToSignHash: dataToSignHash.substring(0, 16) + '...',
        normalizedBufferSize: normalizedBuffer.length,
        encryptedEmail: encryptedEmail,
        timestamp: timestamp
      });

      let signature: string;
      try {
        console.log('🔐 Attempting Ed25519 signing for PNG...');
        signature = crypto.sign(null, dataToSign, formattedPrivateKey).toString('base64');
        console.log('🔐 Ed25519 signing successful for PNG');
      } catch (ed25519Error) {
        console.log('⚠️ Ed25519 signing failed for PNG, falling back to RSA/ECDSA...');
        const sign = crypto.createSign('sha256');
        sign.update(dataToSign); // Update with the full payload
        signature = sign.sign(formattedPrivateKey, 'base64');
        console.log('🔐 RSA/ECDSA signing successful for PNG');
      }

      // Include the normalized buffer hash for verification purposes
      const normalizedBufferHash = crypto.createHash('sha256').update(normalizedBuffer).digest('hex');
      const signaturePayload = { 
        signature, 
        email: encryptedEmail, 
        timestamp,
        originalBufferHash: normalizedBufferHash // This is now the hash of the normalized buffer
      };
      const signatureString = JSON.stringify(signaturePayload);

      // Now add the signature chunk to the normalized chunks
      const textChunk = encodeText('Signature', signatureString);
      chunksWithoutSignature.splice(-1, 0, textChunk); // Insert before IEND chunk
      
      const finalBuffer = Buffer.from(encode(chunksWithoutSignature));
      console.log('✅ PNG signature embedded successfully, final size:', finalBuffer.length);
      
      return finalBuffer;
    } catch (pngError) {
      console.warn('PNG metadata embedding failed, falling back to original buffer:', pngError);
      return buffer;
    }
  } else {
    console.warn(`Signature embedding not implemented for ${metadata.format}, returning original image.`);
    return buffer;
  }
} 