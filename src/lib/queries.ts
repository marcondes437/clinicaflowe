import { createClient } from "@/lib/supabase/server";
import { fimDoDia, inicioDoDia } from "@/lib/format";

export const CONSULTA_SELECT =
  "id, data_hora, status, motivo, pacientes(id, nome_completo), profissionais(nome), especialidades(nome), unidades(nome)";

export async function getIndicadores() {
  const supabase = await createClient();
  const hojeInicio = inicioDoDia();
  const hojeFim = fimDoDia();

  const contagem = (q: PromiseLike<{ count: number | null }>) => q;

  const [pacientes, profissionais, unidades, hoje, agendadas, concluidas, canceladas, valores] =
    await Promise.all([
      supabase.from("pacientes").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("profissionais").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("unidades").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("consultas").select("id", { count: "exact", head: true }).gte("data_hora", hojeInicio).lte("data_hora", hojeFim),
      supabase.from("consultas").select("id", { count: "exact", head: true }).in("status", ["agendada", "confirmada"]),
      supabase.from("consultas").select("id", { count: "exact", head: true }).eq("status", "concluida"),
      supabase.from("consultas").select("id", { count: "exact", head: true }).eq("status", "cancelada"),
      supabase.from("consultas").select("valor").eq("status", "concluida"),
    ]);

  void contagem;

  const faturamento = (valores.data ?? []).reduce(
    (soma: number, c: { valor: number | null }) => soma + Number(c.valor ?? 0),
    0
  );

  return {
    pacientes: pacientes.count ?? 0,
    profissionais: profissionais.count ?? 0,
    unidades: unidades.count ?? 0,
    consultasHoje: hoje.count ?? 0,
    agendadas: agendadas.count ?? 0,
    concluidas: concluidas.count ?? 0,
    canceladas: canceladas.count ?? 0,
    faturamento,
  };
}

export async function getOpcoes({ paciente = false }: { paciente?: boolean } = {}) {
  const supabase = await createClient();
  const [pacientes, profissionais, especialidades, unidades, agenda] = await Promise.all([
    paciente ? Promise.resolve({ data: [] }) : supabase.from("pacientes").select("id, nome_completo").eq("status", "ativo").order("nome_completo"),
    paciente ? Promise.resolve({ data: [] }) : supabase.from("profissionais").select("id, nome").eq("status", "ativo").order("nome"),
    supabase.from("especialidades").select("id, nome").eq("status", "ativo").order("nome"),
    supabase.from("unidades").select("id, nome").eq("status", "ativo").order("nome"),
    supabase.rpc("horarios_disponiveis_por_especialidade"),
  ]);

  const horariosMap = new Map<
    string,
    { especialidade_id: string; unidade_id: string; data_hora: string; vagas: number }
  >();

  for (const item of (agenda.data ?? []) as { especialidade_id: string; unidade_id: string; data_hora: string; vagas: number }[]) {
    const key = `${item.especialidade_id}:${item.unidade_id}:${item.data_hora}`;
    const atual = horariosMap.get(key);
    if (atual) atual.vagas += Number(item.vagas);
    else horariosMap.set(key, { ...item, vagas: Number(item.vagas) });
  }

  return {
    pacientes: (pacientes.data ?? []).map((p) => ({ id: p.id, nome: p.nome_completo })),
    profissionais: profissionais.data ?? [],
    especialidades: especialidades.data ?? [],
    unidades: unidades.data ?? [],
    horarios: [...horariosMap.values()],
    erroAgenda: Boolean(agenda.error || especialidades.error || unidades.error),
  };
}
