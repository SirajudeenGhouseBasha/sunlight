/**
 * Image Proxy Route
 *
 * Generates a short-lived signed S3 URL for a given S3 key or full S3 URL.
 * This avoids needing public bucket access — the browser fetches via this
 * endpoint which signs the request server-side.
 *
 * GET /api/image-proxy?key=products/my-image.jpg
 * GET /api/image-proxy?url=https://sunlight-s3-demo.s3.ap-south-1.amazonaws.com/products/my-image.jpg
 *
 * Redirects to a signed URL valid for 1 hour.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSignedS3Url, extractS3Key } from '@/src/lib/storage/s3';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const url = searchParams.get('url');

    let s3Key: string | null = null;

    if (key) {
      s3Key = key;
    } else if (url) {
      s3Key = extractS3Key(url);
    }

    if (!s3Key) {
      return NextResponse.json({ error: 'Missing key or url parameter' }, { status: 400 });
    }

    const signedUrl = await getSignedS3Url(s3Key, 3600);

    // Redirect to the signed URL — browser caches the image for the session
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to generate image URL' }, { status: 500 });
  }
}
