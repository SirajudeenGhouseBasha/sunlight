/**
 * Image Storage Utilities
 * 
 * Helper functions for image upload, validation, and processing
 * Requirements: 4.1, 4.2, 4.3 - Image handling and validation
 */

import { supabase } from '@/src/lib/supabase/client';

// Image validation constants
export const IMAGE_VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_DIMENSIONS: { width: 500, height: 500 },
  MAX_DIMENSIONS: { width: 5000, height: 5000 },
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
} as const;

// Storage bucket names
export const STORAGE_BUCKETS = {
  DESIGNS: 'designs',
  TEMPLATES: 'templates',
  THUMBNAILS: 'thumbnails',
} as const;

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface UploadImageOptions {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
}

export interface UploadImageResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  const errors: string[] = [];

  // Check file type
  if (!IMAGE_VALIDATION.ALLOWED_TYPES.includes(file.type as any)) {
    errors.push(
      `Invalid file type. Allowed types: ${IMAGE_VALIDATION.ALLOWED_EXTENSIONS.join(', ')}`
    );
  }

  // Check file size
  if (file.size > IMAGE_VALIDATION.MAX_FILE_SIZE) {
    const maxSizeMB = IMAGE_VALIDATION.MAX_FILE_SIZE / (1024 * 1024);
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(dimensions: ImageDimensions): ImageValidationResult {
  const errors: string[] = [];
  const { width, height } = dimensions;
  const { MIN_DIMENSIONS, MAX_DIMENSIONS } = IMAGE_VALIDATION;

  if (width < MIN_DIMENSIONS.width || height < MIN_DIMENSIONS.height) {
    errors.push(
      `Image must be at least ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height} pixels`
    );
  }

  if (width > MAX_DIMENSIONS.width || height > MAX_DIMENSIONS.height) {
    errors.push(
      `Image must not exceed ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height} pixels`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate image file and dimensions
 */
export async function validateImage(file: File): Promise<ImageValidationResult> {
  const errors: string[] = [];

  // Validate file
  const fileValidation = validateImageFile(file);
  if (!fileValidation.valid) {
    errors.push(...fileValidation.errors);
  }

  // Validate dimensions
  try {
    const dimensions = await getImageDimensions(file);
    const dimensionsValidation = validateImageDimensions(dimensions);
    if (!dimensionsValidation.valid) {
      errors.push(...dimensionsValidation.errors);
    }
  } catch (error) {
    errors.push('Failed to read image dimensions');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  options: UploadImageOptions
): Promise<UploadImageResult> {
  try {
    const { bucket, path, file, upsert = false } = options;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    };
  }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete image',
    };
  }
}

/**
 * Get public URL for an image
 */
export function getImageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Generate unique file path for user upload
 */
export function generateFilePath(
  userId: string,
  fileName: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const pathPrefix = prefix ? `${prefix}/` : '';
  
  return `${userId}/${pathPrefix}${timestamp}_${randomStr}_${sanitizedFileName}`;
}

/**
 * Compress image client-side before upload
 */
export async function compressImage(
  file: File,
  maxWidth: number = 2000,
  maxHeight: number = 2000,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create thumbnail from image
 */
export async function createThumbnail(
  file: File,
  size: number = 300
): Promise<File> {
  return compressImage(file, size, size, 0.7);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return IMAGE_VALIDATION.ALLOWED_TYPES.includes(file.type as any);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}
