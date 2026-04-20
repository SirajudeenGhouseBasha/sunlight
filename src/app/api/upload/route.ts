/**
 * Image Upload API Route
 * 
 * Handles image uploads to AWS S3
 * Requirements: 4.1, 4.2, 4.3 - Image upload and storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { uploadDesignImage, uploadProductImage, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/src/lib/storage/s3';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'design'; // 'design' or 'product'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to S3 based on type
    let uploadResult;
    if (type === 'product') {
      uploadResult = await uploadProductImage(buffer, file.name, file.type);
    } else {
      uploadResult = await uploadDesignImage(buffer, file.name, file.type, user.id);
    }
    
    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      file_size: file.size,
      file_name: file.name,
      mime_type: file.type,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
