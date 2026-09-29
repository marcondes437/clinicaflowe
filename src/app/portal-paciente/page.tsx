import PortalLogin from "@/components/PortalLogin";
import { Suspense } from "react";

export default function PortalPacientePage() {
  return <Suspense fallback={null}><PortalLogin role="paciente" /></Suspense>;
}
