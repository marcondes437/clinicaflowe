"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import { supabaseFetch } from "./fetch";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();

  return createBrowserClient(
    supabaseUrl,
    supabasePublishableKey,
    { global: { fetch: supabaseFetch } }
  );
}
