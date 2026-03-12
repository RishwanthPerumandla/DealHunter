'use client';

import imageCompression from 'browser-image-compression';

// Compress image before upload
export async function compressImage(
  file: File,
  maxWidth: number = 1024,
  maxSizeMB: number = 0.1
): Promise<File> {
  const options = {
    maxWidthOrHeight: maxWidth,
    maxSizeMB: maxSizeMB,
    useWebWorker: true,
    fileType: 'image/webp',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression error:', error);
    return file;
  }
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

// Upload image to Supabase Storage
export async function uploadImage(
  file: File,
  bucket: string = 'restaurant-images',
  path?: string
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Compress before upload
  const compressedFile = await compressImage(file);
  
  // Generate unique filename
  const fileExt = 'webp';
  const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { error, data } = await supabase.storage
    .from(bucket)
    .upload(fileName, compressedFile, {
      contentType: 'image/webp',
      upsert: false,
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return urlData.publicUrl;
}

// Delete image from storage
export async function deleteImage(url: string, bucket: string = 'restaurant-images'): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Extract filename from URL
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  const fileName = pathParts[pathParts.length - 1];
  
  const { error } = await supabase.storage.from(bucket).remove([fileName]);
  if (error) throw error;
}
