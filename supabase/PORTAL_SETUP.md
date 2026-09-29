# Ativação do cadastro e portal médico

## Atualização para concluir os requisitos do paciente

No projeto existente `bpeeabwursdnibbfvabh`, execute no SQL Editor **somente o arquivo completo `supabase/migrations/20260924132643_complete_patient_booking.sql`** para ativar os dados adicionais e a consulta por especialidade. A agenda médica já existe; a verificação remota encontrou a tabela de dados adicionais e as funções de perfil ainda ausentes. Este arquivo trata essa variante do banco e pode ser executado novamente sem duplicar dados.

Após aplicar:

1. Entre como paciente. Se faltar nome, celular ou nascimento, o primeiro acesso abre “Meus dados”. Salve e clique em “Continuar”.
2. Saia e entre novamente: os dados ficam salvos, sem novo preenchimento.
3. Um médico ou administrador deve disponibilizar horários reais com especialidade e unidade.
4. O paciente escolhe especialidade, unidade e horário livre. Não há seletor de médico, e a lista de horários não retorna identidade profissional.
5. Confirme: o médico atribuído aparece no resultado e no painel. A vaga é consumida no banco; uma nova tentativa na mesma vaga esgotada é recusada.

`npm test` inclui testes com Postgres em memória para persistência, isolamento de dados, impedimento de reserva para outro paciente, atribuição automática, esgotamento das vagas e compatibilidade com o banco sem `is_clinical_staff`. Esses testes não substituem aplicar o SQL no projeto remoto.

## Falha de login confirmada em 24/09/2026

Teste no navegador local: signup HTTP 200; login HTTP 200; cookies de sessão presentes; consulta `user_roles` HTTP 403 com código `42501`, `permission denied for function is_admin_gestor`. Aplique `supabase/fix_login_permissions.sql` no SQL Editor para restaurar a execução das funções chamadas pelas políticas RLS. Não é necessário recriar a conta do paciente.

Também foi corrigida a colisão de arquivos entre `next build` e o servidor local: o desenvolvimento agora usa `.next-dev`, enquanto a compilação usa `.next`. Os arquivos JS e CSS do portal foram novamente verificados com HTTP 200.

O banco remoto retornou `42883: function public.is_clinical_staff(uuid) does not exist` ao executar a primeira versão da correção. O arquivo `fix_login_permissions.sql` foi atualizado para localizar as assinaturas existentes, ignorar funções ausentes e retornar uma verificação de permissão por função. A migração do portal também passou a tratar `is_clinical_staff` como opcional. Execute a versão atualizada; a tentativa anterior com erro não confirma que as permissões tenham sido aplicadas.

Conta sintética criada para o diagnóstico: `clinicaflow-test-79042e7c@example.org` (nome: Teste de acesso ClinicaFlow). Pode ser removida pelo administrador em Authentication > Users após a validação. A senha aleatória não foi gravada. Nenhuma conta real foi alterada.

## Configuração

1. Aplique as migrações de `supabase/migrations` em ordem, incluindo `20260924120000_patient_profile_doctor_portal.sql`, no banco Supabase do projeto. Se as anteriores já foram aplicadas, execute somente a nova no SQL Editor.
2. Crie a conta do profissional no Supabase Auth. No cadastro de profissionais da administração, informe o ID dessa conta, especialidade e unidade. A nova migração atribui o acesso de médico ao vincular a conta. Para um profissional já cadastrado, atualize seu `user_id` no banco.
3. Entre em `/portal-medico` com essa conta e publique horários na agenda.
4. Entre como paciente, preencha `/paciente/dados` e salve. Saia e entre novamente para conferir a persistência.
5. Em `/paciente/agendar`, escolha especialidade, unidade e um horário publicado. O nome do profissional aparece na confirmação e no painel após a reserva.

## Validação no banco

- Dois pacientes disputando a única vaga: somente uma reserva deve ser criada; o outro recebe indisponibilidade.
- Dois médicos na mesma especialidade/unidade/horário: cada reserva deve ocupar uma vaga diferente.
- Um médico sem vínculo profissional não deve carregar agenda ou prontuários no portal.
- Tentar salvar dados sem sessão deve falhar. Falhas na gravação devem reverter os dados pessoais e adicionais juntos.

A validação local de tipos, os testes automatizados e a compilação não substituem esses testes com o banco migrado e contas reais. A migração não foi aplicada automaticamente por falta de credenciais administrativas neste ambiente.
