import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY!;

export const storageClient = createClient(supabaseUrl, supabaseAnonKey);

export const CHAT_MEDIA_BUCKET = "chat-media";

/**
 * Uploads a file to the chat-media bucket and returns the public URL.
 * path: e.g. "images/uuid.jpg" or "audio/uuid.webm"
 */
export async function uploadChatMedia(
  file: File | Blob,
  path: string,
  contentType: string
): Promise<string> {
  const { error } = await storageClient.storage
    .from(CHAT_MEDIA_BUCKET)
    .upload(path, file, { contentType, upsert: false });

  if (error) throw new Error("Upload failed: " + error.message);

  const { data } = storageClient.storage
    .from(CHAT_MEDIA_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}
