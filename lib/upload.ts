// lib/upload.ts
import { supabase } from './supabase'

export async function uploadImage(file: File): Promise<string | null> {
  try {
    // 1. Generate a unique safe filename (e.g. 1709823_menu.jpg)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`

    // 2. Upload
    const { error: uploadError } = await supabase.storage
      .from('deals') // Make sure this bucket exists in Supabase!
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload Error:', uploadError)
      return null
    }

    // 3. Get Public URL
    const { data } = supabase.storage
      .from('deals')
      .getPublicUrl(fileName)

    return data.publicUrl
  } catch (error) {
    console.error('Storage Helper Error:', error)
    return null
  }
}