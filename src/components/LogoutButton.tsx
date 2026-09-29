"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/portal-paciente");
    router.refresh();
  }

  return (
    <button onClick={sair} className="cx-btn cx-btn-ghost" style={{ padding: "0.45rem 1rem" }}>
      Sair
    </button>
  );
}
