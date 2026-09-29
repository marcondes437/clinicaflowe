import PortalLogin from "@/components/PortalLogin";
import { Suspense } from "react";

export default function PortalMedicoPage() {
  return <Suspense fallback={null}><PortalLogin role="medico" /></Suspense>;
}
