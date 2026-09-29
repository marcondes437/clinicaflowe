import type { Metadata } from "next";
import ServicesWidget from "@/components/ServicesWidget";
import SiteAssistant from "@/components/SiteAssistant";
import supportStyles from "@/components/SupportDock.module.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinicxFlow — Gestão e atendimento em saúde",
  description:
    "Plataforma integrada para clínicas, consultórios e UBS: pacientes, agenda, prontuário, indicadores e gestão em um só lugar.",
  openGraph: {
    title: "ClinicxFlow — Gestão e atendimento em saúde",
    description:
      "Pacientes, agenda, prontuário eletrônico e indicadores integrados em uma única plataforma.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}<div className={supportStyles.dock}><ServicesWidget /><SiteAssistant aiEnabled={Boolean(process.env.OPENAI_API_KEY?.trim())} /></div></body>
    </html>
  );
}
