import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const routes = readFileSync(new URL('../src/routes/AppRoutes.tsx', import.meta.url), 'utf8');
const entry = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');

test('refatoração preserva as rotas públicas e privadas do MVP', () => {
  for (const path of [
    '/',
    '/login',
    '/cadastro',
    '/recuperar',
    '/atualizar-senha',
    '/servico/:id',
    '/prestador/:id',
    '/dashboard',
    '/novo-servico',
    '/editar-servico/:id',
    '/pedido/:id',
  ]) {
    assert.match(routes, new RegExp(`path=["']${path.replaceAll('/', '\\/')}["']`));
  }
});

test('ponto de entrada delega a aplicação sem concentrar páginas', () => {
  assert.match(entry, /import \{ App \} from ['"]\.\/App['"]/);
  assert.doesNotMatch(entry, /function (Catalog|Dashboard|Auth|RequestDetails)/);
});
