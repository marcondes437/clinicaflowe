# ClinicxFlow

Plataforma de gestão para clínicas de saúde.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · CSS Modules / CSS tradicional · Supabase (Banco de dados, Auth, RLS)

---

## 1. Pré-requisitos

- Node.js 18.18 ou superior
- Uma conta gratuita no [Supabase](https://supabase.com)

## 2. Criar o projeto no Supabase

1. Acesse https://supabase.com e crie um novo projeto.
2. No painel, abra **SQL Editor**.
3. Execute, em ordem, os arquivos de `supabase/migrations/`.
   Eles criam tabelas, agenda médica, atribuição automática, funções, políticas de RLS,
   o gatilho de cadastro e os dados iniciais.
4. Em **Project Settings → API**, copie a `Project URL` e a chave `Publishable`.

## 3. Configurar as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (use `.env.example` como base):

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

## 4. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse **http://localhost:3000**.

Para produção:

```bash
npm run build
npm run start
```

## 5. Criar o primeiro administrador

Todo cadastro feito pela tela pública nasce com o cargo **paciente** (regra de segurança).
Para promover um usuário a administrador, cadastre-se normalmente em `/cadastro` e depois
execute no **SQL Editor** do Supabase:

```sql
update public.user_roles
set role = 'admin'
where user_id = (select id from auth.users where email = 'seu@email.com');
```

Faça logout e login novamente para entrar na área `/admin`.

## 6. Vincular usuários a profissionais

Para que um médico ou enfermeiro veja a própria agenda, o registro em `public.profissionais`
precisa ter o campo `user_id` preenchido com o id do usuário em `auth.users`:

```sql
update public.profissionais
set user_id = (select id from auth.users where email = 'medico@email.com')
where nome = 'Nome do Profissional';
```

## 7. Estrutura

```
src/
  app/
    page.tsx                landing page pública (dados reais do banco)
    login/ cadastro/ recuperar-senha/ nova-senha/
    admin/                  dashboard, pacientes, profissionais, especialidades, unidades, agenda
    gestor/                 indicadores e agenda geral
    medico/                 agenda própria, pacientes e prontuário
    enfermagem/             atendimentos do dia
    recepcao/               painel do dia, pacientes e agendamentos
    paciente/               painel, agendamento e histórico
  components/               AppShell, painéis, tabelas e formulários
  lib/
    supabase/               clientes browser, server e middleware de sessão
    actions.ts              server actions (escrita no banco)
    queries.ts              indicadores e listagens
    roles.ts nav.ts auth.ts controle de acesso por cargo
  middleware.ts             proteção de rotas por cargo
supabase/migrations/        schema + RLS + seed
```

## 8. Cargos

`admin`, `gestor`, `medico`, `enfermeiro`, `recepcionista`, `paciente`.

Cada cargo é redirecionado automaticamente para sua área após o login, e o middleware
bloqueia o acesso a áreas de outros cargos. Todas as regras também são aplicadas no
banco por Row Level Security.

## 9. Fluxo de agendamento

1. O administrador cadastra o profissional com especialidade e unidade.
2. Em `/admin/agenda`, libera os horários daquele profissional.
3. O paciente escolhe apenas especialidade, unidade e horário.
4. O banco reserva uma vaga e atribui automaticamente um profissional livre.
5. O nome do profissional aparece somente após a consulta ser confirmada.

A reserva é feita em uma transação no banco para impedir que duas pessoas ocupem a
mesma vaga. Pacientes não têm permissão para definir diretamente o profissional.

## Assistente virtual

O botão flutuante Clara aparece nas páginas públicas. Sem configuração de IA, funciona em modo de demonstração com respostas básicas, identificado na interface.

Para ativar respostas por IA, configure `OPENAI_API_KEY` e, opcionalmente, `OPENAI_MODEL` em `.env.local` (ou nas variáveis do servidor) e reinicie o Next.js. Use um modelo compatível com a Responses API disponível na sua conta. Nunca use o prefixo `NEXT_PUBLIC_` para a chave.

A integração usa a [Responses API](https://developers.openai.com/api/reference/cli/resources/responses/methods/create), com `store: false`. A conversa fica no estado da página, sem gravação no banco ou localStorage. Quando a IA está ativa, o histórico recente é enviado à OpenAI. O assistente orienta sobre navegação e serviços; não acessa dados de pacientes nem realiza agendamentos. A base de orientações fica em `src/lib/assistant.ts`.

O endpoint limita o tamanho do histórico e aplica um limite global de 30 requisições por minuto por processo. Para publicar com múltiplas instâncias, aplique também limitação distribuída no gateway e limites de gastos do provedor. O limite em memória reinicia com o servidor.

### Configuração da Clara

A Clara agora está integrada ao layout público, com respostas em streaming, links internos clicáveis, cópia de respostas, interrupção e nova conversa. O botão fica separado do menu de serviços, inclusive no celular.

Configure no servidor:

```dotenv
OPENAI_API_KEY=sua-chave-secreta
OPENAI_MODEL=gpt-6-astra
```

`OPENAI_MODEL` é opcional: o padrão é `gpt-6-astra`. O modelo precisa estar disponível na conta da API, com faturamento habilitado. Para alterar custo e latência, escolha outro modelo compatível com a Responses API. A chave nunca é enviada ao navegador. Reinicie o servidor após configurar as variáveis; em produção, gere um novo build para atualizar também o indicador inicial de IA.

Sem chave, a interface identifica o modo de demonstração. Com chave inválida ou provedor indisponível, apresenta um erro e permite reenviar a pergunta. Respostas interrompidas são identificadas. Interromper cancela a requisição em andamento, mas o provedor pode cobrar tokens já processados.

A conversa permanece apenas na memória da página. A Clara usa os últimos dez itens (até 1.200 caracteres por item), não consulta prontuários e não executa agendamentos. A API aceita até 64 KB por requisição e mantém o limite global por processo descrito acima.

Referências: [modelo GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra) e [streaming da Responses API](https://developers.openai.com/api/docs/guides/streaming-responses).

## Integração final — administração e regulação (28/09/2026)

A migration `20260928120000_clinicxflow_final_integration.sql` amplia o projeto sem apagar as Partes 1 e 2. Ela adiciona perfis internos, regras recorrentes de agenda, regulação de vagas externas, encaminhamentos, transporte, prescrições/dispensações, exames/resultados/laudos e auditoria.

### Aplicação da atualização
1. Aplique as migrations do Supabase na ordem dos nomes, incluindo a migration final.
2. Copie `.env.example` para `.env.local` e mantenha URL/chave pública do projeto.
3. Para o administrador criar contas internas pelo painel, configure `SUPABASE_SERVICE_ROLE_KEY` **somente no servidor**. Nunca use essa chave em variáveis `NEXT_PUBLIC_*`.
4. Execute `npm install` e `npm run dev`.

### Segurança
O acesso é protegido em duas camadas: layouts/rotas no Next.js e RLS no PostgreSQL. Pacientes só enxergam seus próprios registros nos módulos clínicos e de transporte. Operações administrativas relevantes chamam `registrar_auditoria`.

### Módulos finais
- `/admin`: indicadores gerais.
- `/admin/pacientes`, `/profissionais`, `/unidades`, `/especialidades`, `/agenda`.
- `/admin/vagas`: vagas fora do município.
- `/admin/transportes`: veículos, viagens e análise de solicitações.
- `/admin/usuarios`: criação segura de usuários internos.
- `/admin/relatorios` e `/admin/auditoria`.
- `/paciente/transporte`: solicitação e acompanhamento.
- `/farmacia`, `/laboratorio`, `/radiologia`: filas operacionais protegidas por perfil.

> Observação de implantação: a criação de usuários internos depende da Service Role porque o Supabase Auth Admin não pode ser chamado com a chave pública. O restante do sistema continua usando a sessão do usuário e RLS.

## Atualização dos fluxos (28/09/2026)

O pacote inclui perfil clínico do paciente, visualização de prescrições, exames e
resultados, confirmação de encaminhamento agendado, perfil e calendário mensal do
médico, registro de exames por técnicos e regulação de encaminhamentos.

### Aplicar no Supabase do site

1. Confirme que as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   apontam para o **mesmo projeto** aberto no painel do Supabase. Não coloque a chave
   `SUPABASE_SERVICE_ROLE_KEY` em variável `NEXT_PUBLIC_`.
2. Se o banco ainda não recebeu a estrutura do projeto, aplique os arquivos de
   `supabase/migrations/` na ordem do nome. Os arquivos antigos criam `pacientes`,
   `pacientes_dados_sensiveis`, consultas e os módulos administrativos.
3. Se o banco **já tem** as migrations antigas até
   `20260928153000_fix_patient_own_data.sql`, execute somente
   `supabase/ATUALIZACAO_PROJETO_EXISTENTE.sql` no SQL Editor. O mesmo conteúdo
   está na última migration para instalações novas. Não execute o arquivo final
   antes das migrations das quais ele depende (`encaminhamentos`, `exames`, etc.).
   Se apareceu `relation "public.pacientes_dados_sensiveis" does not exist`,
   verifique também se a estrutura inicial e `20260924132643_complete_patient_booking.sql`
   foram aplicadas antes da integração administrativa. O arquivo de atualização
   recria essa tabela, mas não substitui todas as migrations anteriores.
4. Confira no SQL Editor:

```sql
select to_regclass('public.pacientes_dados_sensiveis') as dados,
       to_regclass('public.encaminhamentos') as encaminhamentos,
       to_regclass('public.exames_realizados') as exames_realizados;
```

As três colunas devem mostrar nomes de tabelas. Depois, entre com contas dos
respectivos perfis e verifique a gravação e leitura de cada fluxo. A compilação
local não confirma o estado do Supabase remoto.
