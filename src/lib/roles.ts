export type AppRole =
  | "admin" | "gestor" | "medico" | "enfermeiro" | "recepcionista" | "paciente"
  | "atendente" | "administrativo" | "farmaceutico" | "laboratorio" | "radiologista"
  | "tecnico_radiologia" | "tecnico_enfermagem";

export const ROLE_ROUTES: Record<AppRole, string> = {
  admin: "/admin", gestor: "/gestor", medico: "/medico", enfermeiro: "/enfermagem",
  recepcionista: "/recepcao", paciente: "/paciente", atendente: "/admin",
  administrativo: "/admin", farmaceutico: "/farmacia", laboratorio: "/laboratorio",
  radiologista: "/radiologia", tecnico_radiologia: "/radiologia", tecnico_enfermagem: "/enfermagem",
};
export const HOME_BY_ROLE = ROLE_ROUTES;
const ROLE_PRIORITY: AppRole[] = ["admin","gestor","administrativo","atendente","medico","enfermeiro","tecnico_enfermagem","farmaceutico","laboratorio","radiologista","tecnico_radiologia","recepcionista","paciente"];
export function normalizeRoles(values: unknown[]): AppRole[] {
  const roles=values.filter((v):v is AppRole=>ROLE_PRIORITY.includes(v as AppRole));
  return roles.length?[...new Set(roles)].sort((a,b)=>ROLE_PRIORITY.indexOf(a)-ROLE_PRIORITY.indexOf(b)):["paciente"];
}
export function getPrimaryRole(roles: AppRole[]): AppRole { return normalizeRoles(roles)[0]; }
export const ROLE_LABEL: Record<AppRole,string> = {
 admin:"Administrador",gestor:"Gestor",medico:"Médico(a)",enfermeiro:"Enfermagem",recepcionista:"Recepção",paciente:"Paciente",
 atendente:"Atendente",administrativo:"Administrativo",farmaceutico:"Farmacêutico(a)",laboratorio:"Laboratório",radiologista:"Radiologista",tecnico_radiologia:"Técnico(a) de radiologia",tecnico_enfermagem:"Técnico(a) de enfermagem"
};
export const STATUS_CONSULTA_LABEL: Record<string,string>={agendada:"Agendada",confirmada:"Confirmada",em_atendimento:"Em atendimento",concluida:"Concluída",cancelada:"Cancelada",faltou:"Faltou"};
