import type { NavItem } from "@/components/AppShell";
import type { AppRole } from "@/lib/roles";

const admin: NavItem[] = [
 {href:"/admin",label:"Dashboard"},{href:"/admin/pacientes",label:"Pacientes"},{href:"/admin/profissionais",label:"Profissionais"},
 {href:"/admin/especialidades",label:"Especialidades"},{href:"/admin/unidades",label:"UBS"},{href:"/admin/agenda",label:"Agendas"},
 {href:"/admin/vagas",label:"Vagas externas"},{href:"/admin/encaminhamentos",label:"Encaminhamentos"},{href:"/admin/transportes",label:"Transportes"},{href:"/admin/usuarios",label:"Usuários"},
 {href:"/admin/relatorios",label:"Relatórios"},{href:"/admin/auditoria",label:"Auditoria"}
];
export const NAV_BY_ROLE: Record<AppRole,NavItem[]> = {
 admin, administrativo:admin, atendente:admin,
 gestor:[{href:"/gestor",label:"Indicadores"},{href:"/gestor/agenda",label:"Agenda"}],
 medico:[{href:"/medico",label:"Minha agenda"},{href:"/medico/pacientes",label:"Meus pacientes"},{href:"/medico/perfil",label:"Meu perfil"}],
 enfermeiro:[{href:"/enfermagem",label:"Atendimentos"}], tecnico_enfermagem:[{href:"/enfermagem",label:"Atendimentos / ECG"}],
 recepcionista:[{href:"/recepcao",label:"Painel do dia"},{href:"/recepcao/pacientes",label:"Pacientes"},{href:"/recepcao/agenda",label:"Agendamentos"}],
 paciente:[{href:"/paciente/dados",label:"Meus dados"},{href:"/paciente",label:"Meu painel"},{href:"/paciente/agendar",label:"Agendar consulta"},{href:"/paciente/historico",label:"Meu histórico"},{href:"/paciente/prescricoes",label:"Prescrições"},{href:"/paciente/exames",label:"Exames e resultados"},{href:"/paciente/encaminhamentos",label:"Encaminhamentos"},{href:"/paciente/transporte",label:"Transporte"}],
 farmaceutico:[{href:"/farmacia",label:"Dispensações"}], laboratorio:[{href:"/laboratorio",label:"Exames laboratoriais"}],
 radiologista:[{href:"/radiologia",label:"Laudos"}], tecnico_radiologia:[{href:"/radiologia",label:"Exames de imagem"}],
};
