// Metadata is used only for display, never for roles or access decisions.
export function getDisplayName(profileName: unknown, metadata: unknown): string {
  const fields = metadata && typeof metadata === "object" ? metadata as Record<string, unknown> : {};
  for (const value of [profileName, fields.nome, fields.full_name, fields.name]) {
    if (typeof value === "string" && value.trim() && !value.includes("@")) return value.trim();
  }
  return "Paciente";
}
