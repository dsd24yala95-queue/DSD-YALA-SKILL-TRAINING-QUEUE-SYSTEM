import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dokvvlvlxfzdlgxpkkbd.supabase.co";

// Lazy-init clients to avoid "supabaseKey is required" error during Next.js build
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
        _supabase = createClient(supabaseUrl, key || "placeholder-anon-key-not-used-at-build");
    }
    return _supabase;
}

function getSupabaseAdminClient(): SupabaseClient {
    if (!_supabaseAdmin) {
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;
        _supabaseAdmin = createClient(
            supabaseUrl,
            serviceKey || "placeholder-service-key-not-used-at-build",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );
    }
    return _supabaseAdmin;
}

// Public Supabase client for Browser & Client Components
export const supabase = {
    get storage() { return getSupabaseClient().storage; },
    get auth() { return getSupabaseClient().auth; },
    from: (table: string) => getSupabaseClient().from(table),
};

// Admin Supabase client with Service Role for Server Routes & Admin Tasks
export const supabaseAdmin = {
    get storage() { return getSupabaseAdminClient().storage; },
    get auth() { return getSupabaseAdminClient().auth; },
    from: (table: string) => getSupabaseAdminClient().from(table),
};

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
        const adminClient = getSupabaseAdminClient();

        // Ensure bucket exists or create it using supabaseAdmin
        try {
            await adminClient.storage.createBucket(bucketName, { public: true });
        } catch (e) {
            // Bucket already exists
        }

        const { data, error } = await adminClient.storage
            .from(bucketName)
            .upload(filePath, file, {
                contentType,
                upsert: true,
            });

        if (error) {
            console.error("[Supabase Upload Error]:", error.message);
            return { url: null, error: error.message };
        }

        const { data: publicUrlData } = adminClient.storage
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
    const adminClient = getSupabaseAdminClient();
    const { data } = adminClient.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
}
