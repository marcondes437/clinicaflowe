const SUPABASE_URL = "https://bpeeabwursdnibbfvabh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lMJNV7HgD_W2f1XzXQBqQA_lyi5xqeW";

export function getSupabaseConfig() {
  return {
    supabaseUrl: SUPABASE_URL,
    supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
  };
}
