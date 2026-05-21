/**
 * Image URL utilities
 *
 * Converts stored S3 URLs into proxied URLs that work even when the
 * S3 bucket is not publicly accessible. The proxy route signs the
 * request server-side and redirects to a temporary signed URL.
 */

const S3_BUCKET_URL = process.env.NEXT_PUBLIC_S3_BUCKET_URL
  || `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'sunlight-s3-demo'}.s3.ap-south-1.amazonaws.com`;

/**
 * Returns true if the given URL is an S3 URL for our bucket.
 */
export function isS3Url(url: string): boolean {
  if (!url) return false;
  return url.includes('amazonaws.com') || url.includes(S3_BUCKET_URL);
}

/**
 * Converts a stored S3 URL to a proxied URL.
 * Non-S3 URLs (blob:, data:, external) are returned as-is.
 *
 * Usage:
 *   <img src={toProxiedUrl(imageUrl)} />
 */
export function toProxiedUrl(url: string | null | undefined): string {
  if (!url) return '';

  // Blob URLs (local preview before upload) — pass through
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  // Already a proxied URL — pass through
  if (url.startsWith('/api/image-proxy')) return url;

  // Placeholder URLs (via.placeholder.com, etc.) — pass through without proxying
  if (url.includes('placeholder.com') || url.includes('unsplash.com') || url.includes('bing.com')) {
    return url;
  }

  // S3 URL — proxy it
  if (isS3Url(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  // External URL (Supabase storage, etc.) — pass through
  return url;
}
