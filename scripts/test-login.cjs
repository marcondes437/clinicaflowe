const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function load(file, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, setTimeout, clearTimeout, console, Error,
    ...globals,
    require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}

test('booking sends specialty and availability to the server, never the patient-selected doctor', async () => {
  let called;
  const { criarConsulta } = load('src/lib/actions.ts', {
    'next/cache': { revalidatePath() {} },
    '@/lib/supabase/server': { createClient: async () => ({ rpc: async (name, args) => {
      called = { name, args };
      return { data: [{ nome_profissional: 'Dra. Ana' }], error: null };
    } }) },
  });
  const fd = new FormData();
  for (const [key, value] of Object.entries({ paciente_id: 'patient', especialidade_id: 'cardiology', unidade_id: 'unit', data_hora: '2030-01-01T12:00:00Z', profissional_id: 'forged' })) fd.set(key, value);
  const result = await criarConsulta({}, fd);
  assert.equal(called.name, 'agendar_consulta_automaticamente');
  assert.equal(called.args._especialidade_id, 'cardiology');
  assert.equal('_profissional_id' in called.args, false);
  assert.match(result.ok, /Dra. Ana/);
});

test('signup clears loading after network failure and redirects only when a session exists', async () => {
  for (const scenario of ['failure', 'session', 'confirmation']) {
    const states = [];
    let index = 0;
    let destination;
    let submittedEmail;
    const jsx = (type, props) => ({ type, props });
    const { default: Page } = load('src/app/cadastro/page.tsx', {
      'react/jsx-runtime': { jsx, jsxs: jsx },
      react: { Suspense: 'suspense', useState(initial) {
        const slot = index++;
        const value = slot === 0 ? { nome: 'Ana', email: ' ana@example.com ', senha: '12345678' } : initial;
        states[slot] = value;
        return [value, next => { states[slot] = next; }];
      } },
      'next/navigation': { useSearchParams: () => new URLSearchParams('redirect=/paciente/agendar') },
      '@/lib/login-request': load('src/lib/login-request.ts'),
      '@/lib/auth-errors': load('src/lib/auth-errors.ts'),
      '@/lib/supabase/client': { createClient: () => ({ auth: { signUp: async ({ email }) => {
        submittedEmail = email;
        if (scenario === 'failure') throw new Error('network unavailable');
        return { data: { session: scenario === 'session' ? {} : null }, error: null };
      } } }) },
      '@/components/PatientPortal': { default: 'portal' },
      '@/components/GoogleIcon': { default: 'google' },
      '@/components/PortalLogin.module.css': { default: {} },
    }, { window: { location: { origin: 'http://localhost:3000', assign: path => { destination = path; } } } });
    const formElement = Page().props.children.type().props.children;
    await formElement.props.onSubmit({ preventDefault() {} });
    assert.equal(states[3], false);
    assert.equal(submittedEmail, 'ana@example.com');
    if (scenario === 'session') assert.equal(destination, '/paciente/agendar');
    else assert.equal(destination, undefined);
    if (scenario === 'failure') assert.equal(states[1], 'network unavailable');
    if (scenario === 'confirmation') assert.match(states[2], /confirme/);
  }
});

test('additional information cannot be saved without authentication', async () => {
  let saved = false;
  const { salvarMeusDados } = load('src/lib/actions.ts', {
    'next/cache': { revalidatePath() {} },
    '@/lib/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: null } }) },
      rpc: async () => { saved = true; },
    }) },
  });
  const result = await salvarMeusDados({}, new FormData());
  assert.match(result.erro, /Entre novamente/);
  assert.equal(saved, false);
});

test('additional information is saved together and reports database failures', async () => {
  let called;
  const { salvarMeusDados } = load('src/lib/actions.ts', {
    'next/cache': { revalidatePath() {} },
    '@/lib/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'own-account' } } }) },
      rpc: async (name, args) => { called = { name, args }; return { error: { message: 'failed' } }; },
    }) },
  });
  const fd = new FormData();
  fd.set('nome_completo', ' Ana '); fd.set('celular', '11999999999'); fd.set('cidade', 'São Paulo');
  fd.set('data_nascimento', '1990-01-01');
  const result = await salvarMeusDados({}, fd);
  assert.equal(called.name, 'salvar_meus_dados');
  assert.equal(called.args._dados.nome_completo, 'Ana');
  assert.equal(called.args._dados.cidade, 'São Paulo');
  assert.ok(result.erro);
  assert.equal(result.ok, undefined);
});

test('login stops waiting when authentication never settles', async () => {
  const { loginRequest } = load('src/lib/login-request.ts');
  await assert.rejects(loginRequest(new Promise(() => {}), 10), /demorou/);
});

test('login preserves success and propagates failures', async () => {
  const { loginRequest } = load('src/lib/login-request.ts');
  assert.equal(await loginRequest(Promise.resolve('ok'), 100), 'ok');
  await assert.rejects(loginRequest(Promise.reject(new Error('network')), 100), /network/);
});

test('public login and callback do not wait for Supabase; protected pages still check auth', async () => {
  let authCalls = 0;
  const response = {};
  const { updateSession } = load('src/lib/supabase/middleware.ts', {
    'next/server': { NextResponse: { next: () => response, redirect: url => ({ location: url.pathname }) } },
    '@supabase/ssr': { createServerClient: () => ({ auth: { getClaims: async () => { authCalls++; return { data: null }; } } }) },
    './config': { getSupabaseConfig: () => ({ supabaseUrl: 'https://example.test', supabasePublishableKey: 'test' }) },
    './fetch': { supabaseFetch() {} },
    '@/lib/roles': load('src/lib/roles.ts'),
  });
  for (const pathname of ['/portal-paciente', '/portal-medico', '/auth/callback', '/cadastro']) {
    assert.equal(await updateSession({ nextUrl: { pathname } }), response);
  }
  assert.equal(authCalls, 0);
  const result = await updateSession({ nextUrl: { pathname: '/paciente', clone: () => new URL('http://localhost:3000/paciente') } });
  assert.equal(authCalls, 1);
  assert.equal(result.location, '/portal-paciente');
});

test('unconfirmed email and connection failures are not reported as invalid credentials', () => {
  const { authErrorMessage } = load('src/lib/auth-errors.ts');
  assert.match(authErrorMessage({ code: 'email_not_confirmed' }), /Confirme seu e-mail/);
  assert.match(authErrorMessage({ code: 'invalid_credentials' }), /senha incorretos/);
  assert.match(authErrorMessage({ status: 503 }), /serviço de acesso/);
  assert.match(authErrorMessage({ status: 429 }), /Aguarde/);
});

test('first access requests missing patient information and completed records are reused', () => {
  const { cadastroPacientePendente } = load('src/lib/cadastro-paciente.ts');
  assert.equal(cadastroPacientePendente(null), true);
  assert.equal(cadastroPacientePendente({ nome_completo: 'Ana' }), true);
  assert.equal(cadastroPacientePendente({ nome_completo: 'Ana', celular: '11999999999', data_nascimento: '1990-01-01' }), false);
});

test('permission query failure returns to login rather than assuming patient access', async () => {
  const { updateSession } = load('src/lib/supabase/middleware.ts', {
    'next/server': { NextResponse: { next: () => ({}), redirect: url => ({ location: url.pathname, error: url.searchParams.get('erro') }) } },
    '@supabase/ssr': { createServerClient: () => ({
      auth: { getClaims: async () => ({ data: { claims: { sub: 'user' } } }) },
      from: () => ({ select: () => ({ eq: async () => ({ data: null, error: { code: '42501' } }) }) }),
    }) },
    './config': { getSupabaseConfig: () => ({ supabaseUrl: 'https://example.test', supabasePublishableKey: 'test' }) },
    './fetch': { supabaseFetch() {} },
    '@/lib/roles': load('src/lib/roles.ts'),
  });
  const result = await updateSession({ nextUrl: { pathname: '/paciente', clone: () => new URL('http://localhost:3000/paciente') } });
  assert.equal(result.location, '/portal-paciente');
  assert.equal(result.error, 'acesso');
});
