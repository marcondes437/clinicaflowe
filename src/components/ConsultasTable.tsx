import Link from "next/link";
import { dataHora } from "@/lib/format";
import StatusConsulta from "./StatusConsulta";

export type ConsultaRow = {
  id: string;
  data_hora: string;
  status: string;
  motivo: string | null;
  pacientes: { id: string; nome_completo: string } | null;
  profissionais: { nome: string } | null;
  especialidades: { nome: string } | null;
  unidades: { nome: string } | null;
};

export default function ConsultasTable({
  consultas,
  podeAlterarStatus = false,
  linkPaciente,
}: {
  consultas: ConsultaRow[];
  podeAlterarStatus?: boolean;
  linkPaciente?: string;
}) {
  if (!consultas.length) return <p style={{ color: "var(--cx-muted)" }}>Nenhuma consulta encontrada.</p>;

  return (
    <table className="cx-table">
      <thead>
        <tr>
          <th>Data e hora</th>
          <th>Paciente</th>
          <th>Profissional</th>
          <th>Especialidade</th>
          <th>Unidade</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {consultas.map((c) => (
          <tr key={c.id}>
            <td>{dataHora(c.data_hora)}</td>
            <td>
              {linkPaciente && c.pacientes ? (
                <Link href={`${linkPaciente}/${c.pacientes.id}`} style={{ color: "var(--cx-teal-700)", fontWeight: 600 }}>
                  {c.pacientes.nome_completo}
                </Link>
              ) : (
                c.pacientes?.nome_completo ?? "—"
              )}
            </td>
            <td>{c.profissionais?.nome ?? "—"}</td>
            <td>{c.especialidades?.nome ?? "—"}</td>
            <td>{c.unidades?.nome ?? "—"}</td>
            <td><StatusConsulta id={c.id} status={c.status} disabled={!podeAlterarStatus} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
