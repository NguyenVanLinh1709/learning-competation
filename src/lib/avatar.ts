import { supabase, isSupabaseConfigured } from './supabase';

const BUCKET = 'avatars';
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Self-contained base64 → bytes so we don't depend on a global atob (Hermes) or
// an extra dependency. expo-image-picker gives us the base64 string directly.
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = B64_CHARS.indexOf(clean[i]);
    const e2 = B64_CHARS.indexOf(clean[i + 1]);
    const e3 = B64_CHARS.indexOf(clean[i + 2]);
    const e4 = B64_CHARS.indexOf(clean[i + 3]);
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (e3 !== -1 && i + 2 < clean.length) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (e4 !== -1 && i + 3 < clean.length) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

/**
 * Upload a base64 image to the public `avatars` bucket under the user's id and
 * return its public URL (with a cache-busting query so a re-upload to the same
 * path shows immediately). Returns null on any failure — callers should keep the
 * previous avatar rather than block.
 */
export async function uploadAvatar(userId: string, base64: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const path = `${userId}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, base64ToBytes(base64), { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  } catch {
    return null;
  }
}
