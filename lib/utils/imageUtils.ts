/**
 * Image URL utilities
 * Handles both local paths and external URLs (Supabase Storage, CDN, etc.)
 */

/**
 * Check if a URL is external (not a local path)
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;
  // Check if it starts with http:// or https://
  return /^https?:\/\//i.test(url);
}

/**
 * Check if a URL is a Supabase Storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  if (!url) return false;
  // Supabase Storage URLs typically look like:
  // https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
  return /supabase\.co\/storage/i.test(url);
}

/**
 * Normalize image URL - ensures it's a valid URL or local path
 * @param url The image URL (can be local path like "/images/..." or external URL)
 * @returns The normalized URL
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If it's already a full URL, return as-is
  if (isExternalUrl(url)) {
    return url;
  }
  
  // If it's a local path starting with /, return as-is
  if (url.startsWith('/')) {
    return url;
  }
  
  // If it doesn't start with /, assume it's a local path and add /
  return `/${url}`;
}

/**
 * Get Supabase Storage public URL
 * @param bucket The storage bucket name
 * @param path The file path within the bucket
 * @param supabaseUrl Your Supabase project URL (from env)
 * @returns The public URL for the file
 */
export function getSupabaseStorageUrl(
  bucket: string,
  path: string,
  supabaseUrl?: string
): string {
  const baseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error('Supabase URL not configured');
  }
  
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${cleanBaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

/**
 * Upload file to Supabase Storage
 * @param bucket The storage bucket name
 * @param path The file path within the bucket
 * @param file The file to upload
 * @param supabaseClient The Supabase client instance
 * @returns The public URL of the uploaded file
 */
export async function uploadToSupabaseStorage(
  bucket: string,
  path: string,
  file: File | Blob,
  supabaseClient: any
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get the public URL
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

