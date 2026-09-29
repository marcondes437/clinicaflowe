export function cadastroPacientePendente(paciente: {
  nome_completo?: string | null;
  celular?: string | null;
  data_nascimento?: string | null;
} | null) {
  return !paciente?.nome_completo?.trim() || !paciente.celular?.trim() || !paciente.data_nascimento;
}
