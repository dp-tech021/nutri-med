import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {Session} from '@supabase/supabase-js';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach,it,expect,vi} from 'vitest';
import {api} from '../api';
import {AppContext} from '../app/AppContext';
import {DashboardPage} from './DashboardPage';

vi.mock('../api',async original=>({...await original<typeof import('../api')>(),api:vi.fn()}));
const mocked=vi.mocked(api);
const session={access_token:'synthetic-token',user:{id:'health-demo'}} as Session;
const profile={kind:'prestador' as const,domain:'health' as const,display_name:'Saúde sintética',city:'Cidade QA',category:'',about:'',profession:'prof-qa',specialty:'esp-qa'};
const offer={id:'offer-qa',domain:'health',title:'Oferta sintética',modality:'online',active:true};
function show(){render(<AppContext.Provider value={{session,profile,refresh:async()=>undefined}}><MemoryRouter><DashboardPage/></MemoryRouter></AppContext.Provider>);}
beforeEach(()=>{
 mocked.mockReset();mocked.mockImplementation(async(path,method)=>{
  if(method==='PATCH')return {...offer,modality:'presencial'};
  if(path==='/me')return profile;
  if(path==='/health-taxonomy')return {professions:[{slug:'prof-qa',label:'Profissão QA'}],specialties:[{profession:'prof-qa',slug:'esp-qa',label:'Especialidade QA'},{profession:'prof-qa',slug:'esp-dois',label:'Outra especialidade QA'}]};
  return [offer];
 });
});
it('painel Saúde não replica propostas, preços ou campo clínico e salva apenas atributos suportados',async()=>{
 const user=userEvent.setup();show();
 expect(await screen.findByLabelText(/^Profissão/)).toHaveValue('prof-qa');
 expect(screen.getByRole('button',{name:'Solicitar atendimento'})).toBeDisabled();
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 expect(screen.queryByRole('link',{name:'Propostas'})).not.toBeInTheDocument();
 expect(screen.queryByText('Sob orçamento')).not.toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Ver perfil público'})).toHaveAttribute('href','/prestador/health-demo');
 await user.selectOptions(screen.getByLabelText(/^Especialidade/),'esp-dois');
 await user.click(screen.getByRole('button',{name:'Salvar perfil profissional'}));
 expect(await screen.findByText(/Perfil profissional atualizado/)).toBeVisible();
 expect(mocked).toHaveBeenCalledWith('/me','PATCH',{profession:'prof-qa',specialty:'esp-dois'},session,expect.any(AbortSignal));
 await user.selectOptions(screen.getByLabelText('Modalidade de Oferta sintética'),'presencial');
 await waitFor(()=>expect(screen.getByLabelText('Modalidade de Oferta sintética')).toHaveValue('presencial'));
 expect(mocked).toHaveBeenCalledWith('/services/offer-qa','PATCH',{modality:'presencial'},session,expect.any(AbortSignal));
 expect(mocked.mock.calls.some(([path])=>path==='/requests')).toBe(false);
});
it('falha de edição não confirma modalidade e permite tentar novamente',async()=>{
 const user=userEvent.setup();show();await screen.findByLabelText(/^Profissão/);
 mocked.mockRejectedValueOnce(new Error('offline'));
 await user.selectOptions(screen.getByLabelText('Modalidade de Oferta sintética'),'presencial');
 expect(await screen.findByText(/Nenhuma alteração foi confirmada/)).toBeVisible();
 expect(screen.getByLabelText('Modalidade de Oferta sintética')).toHaveValue('online');
 await user.selectOptions(screen.getByLabelText('Modalidade de Oferta sintética'),'presencial');
 expect(await screen.findByText('Modalidade de Oferta sintética atualizada.')).toBeVisible();
});
it('falha de carregamento oferece recuperação sem controles de edição inoperantes',async()=>{
 mocked.mockRejectedValueOnce(new Error('offline'));const user=userEvent.setup();show();
 expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
 expect(screen.queryByLabelText(/^Profissão/)).not.toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'Tentar novamente'}));
 expect(await screen.findByLabelText(/^Profissão/)).toBeVisible();
});
