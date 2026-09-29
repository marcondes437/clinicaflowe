import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import ConsultasTable, { type ConsultaRow } from "@/components/ConsultasTable";
import EvolucaoForm from "@/components/EvolucaoForm";
import { createClient } from "@/lib/supabase/server";
import { CONSULTA_SELECT } from "@/lib/queries";
import { dataCurta, dataHora } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FichaPaciente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: paciente } = await supabase.from("pacientes").select("*").eq("id", id).maybeSingle();
  if (!paciente) notFound();

  const [{ data: consultas }, { data: evolucoes }] = await Promise.all([
    supabase.from("consultas").select(CONSULTA_SELECT).eq("paciente_id", id).order("data_hora", { ascending: false }),
    supabase.from("evolucoes").select("id, descricao, created_at").eq("paciente_id", id).order("created_at", { ascending: false }),
  ]);

  const info: [string, string][] = [
    ["CPF", paciente.cpf ?? "—"],
    ["Nascimento", dataCurta(paciente.data_nascimento)],
    ["Telefone", paciente.telefone ?? "—"],
    ["Celular", paciente.celular ?? "—"],
    ["E-mail", paciente.email ?? "—"],
    ["Endereço", paciente.endereco ?? "—"],
    ["Cidade/UF", `${paciente.cidade ?? "—"} / ${paciente.estado ?? "—"}`],
    ["CEP", paciente.cep ?? "—"],
    ["Contato de emergência", paciente.contato_emergencia ?? "—"],
    ["Status", paciente.status],
  ];

  return (
    <>
      <Panel titulo={paciente.nome_completo} descricao="Ficha completa do paciente.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.9rem" }}>
          {info.map(([label, valor]) => (
            <div key={label}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--cx-muted)" }}>{label}</div>
              <div style={{ fontWeight: 600 }}>{valor}</div>
            </div>
          ))}
        </div>
        {paciente.observacoes && <p style={{ marginTop: "1rem", color: "var(--cx-muted)" }}>{paciente.observacoes}</p>}
      </Panel>

      <Panel titulo="Consultas do paciente">
        <ConsultasTable consultas={(consultas ?? []) as unknown as ConsultaRow[]} podeAlterarStatus />
      </Panel>

      <Panel titulo="Evoluções e histórico clínico">
        {(evolucoes ?? []).map((e) => (
          <article key={e.id} style={{ borderLeft: "3px solid var(--cx-teal-300)", paddingLeft: "0.9rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>{dataHora(e.created_at)}</div>
            <p style={{ margin: "0.2rem 0 0" }}>{e.descricao}</p>
          </article>
        ))}
        {!evolucoes?.length && <p style={{ color: "var(--cx-muted)" }}>Nenhuma evolução registrada.</p>}
        <EvolucaoForm pacienteId={id} />
      </Panel>
    </>
  );
}
