const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');

for (const legacy of [false, true]) test(`patient data and automatic booking work with ${legacy ? 'deployed legacy' : 'complete'} schema`, async () => {
  const db = new PGlite();
  const migration = name => readFileSync(join(__dirname, '../supabase/migrations', name), 'utf8').replace('create extension if not exists "pgcrypto";', '');
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
    `);
    await db.exec(migration('0001_init.sql'));
    await db.exec(migration('20260915175204_automatic_scheduling.sql'));
    await db.exec(migration('20260915175857_isolate_booking_function.sql'));
    // Reproduce the deployed database variant: sensitive table/helper absent.
    if (legacy) await db.exec('drop table public.pacientes_dados_sensiveis; drop function public.is_clinical_staff(uuid);');
    else await db.exec(migration('20260924120000_patient_profile_doctor_portal.sql'));
    const sql = migration('20260924132643_complete_patient_booking.sql');
    await db.exec(sql);
    await db.exec(sql); // Safe to re-run the SQL Editor script.
    const users = [randomUUID(), randomUUID(), randomUUID()];
    for (const id of users) await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,$2,'{\"nome\":\"Paciente de teste\"}')", [id, `${id}@example.org`]);
    const patients = [];
    for (const id of users) patients.push((await db.query('select id from pacientes where user_id=$1', [id])).rows[0].id);
    const especialidade = (await db.query("select id from especialidades where nome='Cardiologia'")).rows[0].id;
    const unidade = (await db.query('select id from unidades limit 1')).rows[0].id;
    const doctors = [randomUUID(), randomUUID()];
    const slot = '2099-01-10T13:00:00Z';
    for (const id of doctors) {
      await db.query('insert into profissionais(id,nome,especialidade_id,unidade_id) values($1,$2,$3,$4)', [id, `Medico ${id}`, especialidade, unidade]);
      await db.query('insert into agenda_medica(profissional_id,especialidade_id,unidade_id,data_hora) values($1,$2,$3,$4)', [id, especialidade, unidade, slot]);
    }
    const asUser = async id => {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
      await db.exec('set role authenticated');
    };
    await asUser(users[0]);
    await db.query('select salvar_meus_dados($1::jsonb)', [JSON.stringify({ nome_completo: 'Nome atualizado', celular: '11999999999', data_nascimento: '1990-01-01', cpf: '123.456.789-01', cidade: 'São Paulo' })]);
    assert.equal((await db.query('select cidade from pacientes_dados_sensiveis')).rows[0].cidade, 'São Paulo');
    await asUser(users[1]);
    assert.equal((await db.query('select * from pacientes_dados_sensiveis')).rows.length, 0);
    await asUser(users[0]);
    assert.equal((await db.query('select cpf from pacientes_dados_sensiveis')).rows[0].cpf, '12345678901');
    let slots = (await db.query('select * from horarios_disponiveis_por_especialidade()')).rows;
    assert.equal(Number(slots[0].vagas), 2);
    assert.deepEqual(Object.keys(slots[0]).sort(), ['data_hora','especialidade_id','unidade_id','vagas']);
    const book = patient => db.query('select * from agendar_consulta_automaticamente($1,$2,$3,$4,$5)', [patient, especialidade, unidade, slot, 'Consulta de teste']);
    await assert.rejects(book(patients[1]), /Paciente inválido/);
    const first = (await book(patients[0])).rows[0];
    assert.ok(first.nome_profissional);
    await assert.rejects(book(patients[0]), /já possui/);
    await asUser(users[1]);
    const second = (await book(patients[1])).rows[0];
    assert.notEqual(first.nome_profissional, second.nome_profissional);
    await asUser(users[2]);
    assert.equal((await db.query('select * from horarios_disponiveis_por_especialidade()')).rows.length, 0);
    await assert.rejects(book(patients[2]), /indisponível/);
    await assert.rejects(db.query('insert into consultas(paciente_id,profissional_id,data_hora) values($1,$2,$3)', [patients[2], doctors[0], slot]), /row-level security/);
    await db.exec('reset role; set role anon');
    await assert.rejects(db.query('select * from horarios_disponiveis_por_especialidade()'), /permission denied/);
    await db.exec('reset role');
    assert.equal(Number((await db.query('select count(*) as n from consultas')).rows[0].n), 2);
  } finally { await db.close(); }
});
