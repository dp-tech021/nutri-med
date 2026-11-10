import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync(new URL('../src/PaymentDemo.tsx', import.meta.url),'utf8');
const app = readFileSync(new URL('../src/main.tsx', import.meta.url),'utf8');

test('tela inclui identificação explícita de simulação e três estados de teste', () => {
  assert.match(screen, /AMBIENTE DE TESTES — NENHUM PAGAMENTO REAL/);
  for (const status of ['aprovado', 'recusado', 'pendente']) assert.match(screen, new RegExp(status));
  for (const method of ['pix','cartao','boleto']) assert.match(screen, new RegExp(method));
});

test('tela não solicita dados de cartão e não executa alterações no pedido', () => {
  assert.doesNotMatch(screen, /<input[^>]+(?:cardNumber|cvv|cpf|numeroCartao|expiration)/i);
  assert.doesNotMatch(screen, /api\([^)]*\b(?:POST|PATCH|DELETE)\b/);
  assert.doesNotMatch(screen, /fetch\(|\.rpc\(|\.functions\.invoke\(/);
  assert.match(screen, /request\.client_id !== userId/);
  assert.match(screen, /data\.contract/);
});

test('apenas navegação demonstra pagamento, sem alterar fluxo de contratação', () => {
  assert.match(app, /path="\/pagamento-demo"/);
  assert.match(app, /path="\/pagamento-demo\/:id"/);
  assert.match(app, /data\.contract &&/);
  assert.match(app, /Simulação de pagamento|simulação de pagamento/);
});
