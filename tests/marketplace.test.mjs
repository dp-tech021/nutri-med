import test from 'node:test';
import assert from 'node:assert/strict';
import { marketplaceDomain, validateDomainFilters, publicMarketplaceProfile } from '../src/marketplace.ts';

test('default legado e domínios estritos, sem influência sobre papéis', () => {
  assert.equal(marketplaceDomain(), 'services');
  for (const domain of ['health', 'services']) assert.equal(marketplaceDomain(domain), domain);
  for (const value of [null, '', 'cliente', 'prestador', 'admin']) assert.throws(() => marketplaceDomain(value), /INVALID_DOMAIN/);
});
test('filtros pertencem ao domínio e parâmetros desconhecidos/duplicados são rejeitados', () => {
  for (const query of ['category=limpeza', 'domain=services&city=Recife&modality=online', 'domain=health&profession=demo&specialty=demo']) {
    assert.ok(validateDomainFilters(new URLSearchParams(query)));
  }
  for (const query of ['domain=health&category=limpeza', 'domain=services&profession=demo', 'domain=invalid', 'domain=health&kind=admin', 'domain=health&domain=services', 'domain=health&profession=x%25']) {
    assert.throws(() => validateDomainFilters(new URLSearchParams(query)));
  }
});

test('projeção pública omite dados privados e só publica registro com consentimento', () => {
  const source={user_id:'id-publico',display_name:'Nome sintético',city:'Cidade QA',about:'Apresentação pública',category:'limpeza',domain:'health',profession:'profissao-qa',specialty:'especialidade-qa',registration_public:false,registration_council:'CONSELHO-QA',registration_number:'PRIVADO-QA',registration_jurisdiction:'TESTE',kind:'prestador',email:'privado@example.invalid',search_name:'nome interno'};
  const hidden=publicMarketplaceProfile(source);
  assert.equal(hidden.registration_reported,null);
  for(const key of ['kind','email','search_name','registration_public','registration_number','category'])assert.equal(hidden[key],undefined);
  assert(!JSON.stringify(hidden).includes('PRIVADO-QA'));
  assert.deepEqual(publicMarketplaceProfile({...source,registration_public:true}).registration_reported,{council:'CONSELHO-QA',number:'PRIVADO-QA',jurisdiction:'TESTE'});
  const legacy=publicMarketplaceProfile({...source,domain:'services'});
  assert.equal(legacy.category,'limpeza');assert.equal(legacy.registration_reported,undefined);assert.equal(legacy.profession,undefined);
});
