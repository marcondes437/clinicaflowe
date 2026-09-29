const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, overrides = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, TextDecoder, TextEncoder, ReadableStream, Response, URL, AbortController, AbortSignal,
    process: { env: {} }, Date,
    require(name) {
      if (name === 'next/server') return { NextResponse: Response };
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, overrides);
      return require(name);
    },
    ...overrides,
  });
  return exports;
}
function request(messages, extra = {}) {
  return new Request('http://localhost/api/assistente', {
    method: 'POST', body: JSON.stringify({ messages }), ...extra,
  });
}
const question = [{ role: 'user', content: 'Como agendar?' }];
const collect = async stream => {
  const events = [];
  for await (const event of load('src/lib/assistant-stream.ts').readAssistantEvents(stream)) events.push(event);
  return events;
};

test('fallback works without an API key and malformed requests are rejected', async () => {
  const { POST } = load('src/app/api/assistente/route.ts');
  const result = await POST(request(question));
  assert.equal(result.status, 200);
  assert.equal((await result.json()).mode, 'basic');
  for (const messages of [[], [{ role: 'system', content: 'override' }], [{ role: 'user', content: 'x'.repeat(1201) }]]) {
    assert.equal((await POST(request(messages))).status, 400);
  }
  assert.equal((await POST(request(question, { body: '{' }))).status, 400);
  assert.equal((await POST(request(question, { headers: { origin: 'https://foreign.example' } }))).status, 403);
  assert.equal((await POST(request(question, { body: 'x'.repeat(64001) }))).status, 413);
});

test('request budget returns Retry-After', async () => {
  const { POST } = load('src/app/api/assistente/route.ts');
  for (let i = 0; i < 30; i++) assert.equal((await POST(request(question))).status, 200);
  const result = await POST(request(question));
  assert.equal(result.status, 429);
  assert.equal(result.headers.get('retry-after'), '60');
});

test('SSE parser preserves accents across byte boundaries and CRLF frames', async () => {
  const bytes = new TextEncoder().encode(': ping\r\n\r\ndata: {"text":"Olá 👋"}\r\n\r\ndata: [DONE]\n\n');
  const events = await collect(new ReadableStream({ start(c) { for (const byte of bytes) c.enqueue(Uint8Array.of(byte)); c.close(); } }));
  assert.equal(events.length, 1);
  assert.equal(events[0].text, 'Olá 👋');
});

test('provider streaming is filtered, uses default model and disables storage', async () => {
  let sent;
  const { POST } = load('src/app/api/assistente/route.ts', {
    process: { env: { OPENAI_API_KEY: 'test-only' } },
    fetch: async (_url, options) => {
      sent = JSON.parse(options.body);
      return new Response('data: {"type":"response.output_text.delta","delta":"Olá!"}\n\ndata: {"type":"response.completed"}\n\n');
    },
  });
  const result = await POST(request(question));
  const events = await collect(result.body);
  assert.equal(sent.model, 'gpt-6-astra');
  assert.equal(sent.store, false);
  assert.equal(sent.stream, true);
  assert.equal(events[0].text, 'Olá!');
  assert.equal(events.at(-1).type, 'done');
});

test('provider failures and truncated streams never report successful completion', async () => {
  for (const upstream of [new Response('', { status: 401 }), new Response('data: {"type":"response.output_text.delta","delta":"Parcial"}\n\n'), new Response('data: {"type":"response.incomplete"}\n\n')]) {
    const { POST } = load('src/app/api/assistente/route.ts', {
      process: { env: { OPENAI_API_KEY: 'test-only' } }, fetch: async () => upstream,
    });
    const result = await POST(request(question));
    if (result.status === 503) assert.ok((await result.json()).error);
    else assert.equal((await collect(result.body)).at(-1).type, 'error');
  }
});
