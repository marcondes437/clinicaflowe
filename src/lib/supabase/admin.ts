import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";
export function createAdminClient(){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key) return null;
 const {supabaseUrl}=getSupabaseConfig();
 return createClient(supabaseUrl,key,{auth:{autoRefreshToken:false,persistSession:false}});
}
