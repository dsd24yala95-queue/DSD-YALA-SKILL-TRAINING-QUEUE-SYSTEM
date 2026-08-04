import { createClient, SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dokvvlvlxfzdlgxpkkbd.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const clientOptions: any = {};
if (typeof window === "undefined") {
    clientOptions.realtime = { transport: ws };
}

// Public Supabase client for Browser & Client Components
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

// Admin Supabase client with Service Role for Server Routes & Admin Tasks
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    ...clientOptions,
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

/**
 * Upload a file/image to Supabase Storage Bucket
 */
export async function uploadToSupabaseBucket(
    file: File | Blob | Buffer,
    bucketName: string = "avatars",
    filePath: string = `image_${Date.now()}.png`,
    contentType: string = "image/png"
): Promise<{ url: string | null; error: string | null }> {
    try {
        // Ensure bucket exists or create it using supabaseAdmin
        try {
            await supabaseAdmin.storage.createBucket(bucketName, { public: true });
        } catch (e) {
            // Bucket already exists
        }

        const { data, error } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(filePath, file, {
                contentType,
                upsert: true,
            });

        if (error) {
            console.error("[Supabase Upload Error]:", error.message);
            return { url: null, error: error.message };
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(data.path);

        return { url: publicUrlData.publicUrl, error: null };
    } catch (err: any) {
        console.error("[Supabase Exception]:", err);
        return { url: null, error: err.message || "Failed to upload file to Supabase" };
    }
}

/**
 * Get public URL for a file in Supabase Storage
 */
export function getSupabasePublicUrl(bucketName: string, filePath: string): string {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
}
