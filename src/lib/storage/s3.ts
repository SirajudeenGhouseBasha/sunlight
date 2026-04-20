/**
 * AWS S3 Storage Utilities
 * 
 * Handles file uploads to S3 bucket
 * Requirements: 7.1, 7.2 - File storage and management
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate environment variables
if (!process.env.AWS_REGION) {
  throw new Error('Missing AWS_REGION environment variable');
}
if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error('Missing AWS_ACCESS_KEY_ID environment variable');
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('Missing AWS_SECRET_ACCESS_KEY environment variable');
}
if (!process.env.AWS_S3_BUCKET_NAME) {
  throw new Error('Missing AWS_S3_BUCKET_NAME environment variable');
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const BUCKET_URL = process.env.NEXT_PUBLIC_S3_BUCKET_URL || `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

// Max file sizes (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Generate a unique file name
 */
function generateFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const sanitizedName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9]/g, '-') // Replace special chars with dash
    .toLowerCase()
    .substring(0, 50); // Limit length
  
  const fileName = `${sanitizedName}-${timestamp}-${randomString}.${extension}`;
  return prefix ? `${prefix}/${fileName}` : fileName;
}

/**
 * Validate file type
 */
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

/**
 * Upload file to S3
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  mimeType: string,
  folder?: string
): Promise<{ url: string; key: string }> {
  try {
    const key = folder ? `${folder}/${fileName}` : fileName;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: mimeType,
      // Removed ACL - bucket uses bucket policy for public access
    });
    
    await s3Client.send(command);
    
    const url = `${BUCKET_URL}/${key}`;
    
    return { url, key };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
}

/**
 * Get signed URL for private files (expires in 1 hour)
 */
export async function getSignedS3Url(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Upload image to S3 with validation
 */
export async function uploadImage(
  file: Buffer,
  originalName: string,
  mimeType: string,
  userId?: string
): Promise<{ url: string; key: string }> {
  // Validate file type
  if (!validateFileType(mimeType, ALLOWED_IMAGE_TYPES)) {
    throw new Error('Invalid file type. Only images are allowed.');
  }
  
  // Validate file size
  if (!validateFileSize(file.length, MAX_IMAGE_SIZE)) {
    throw new Error(`File size exceeds maximum of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }
  
  const fileName = generateFileName(originalName, userId ? `users/${userId}` : 'uploads');
  return uploadToS3(file, fileName, mimeType);
}

/**
 * Upload design image to S3
 */
export async function uploadDesignImage(
  file: Buffer,
  originalName: string,
  mimeType: string,
  userId: string
): Promise<{ url: string; key: string }> {
  const fileName = generateFileName(originalName);
  return uploadToS3(file, fileName, mimeType, `designs/${userId}`);
}

/**
 * Upload product image to S3
 */
export async function uploadProductImage(
  file: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ url: string; key: string }> {
  const fileName = generateFileName(originalName);
  return uploadToS3(file, fileName, mimeType, 'products');
}

/**
 * Extract S3 key from URL
 */
export function extractS3Key(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
}

export {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_FILE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_FILE_SIZE,
  generateFileName,
};
