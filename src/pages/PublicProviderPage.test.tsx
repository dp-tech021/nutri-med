import {render,screen} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {describe,it,expect,vi} from 'vitest';
import {api} from '../api';
import {PublicProviderPage} from './PublicProviderPage';
vi.mock('../api',async original=>({...await original<typeof import('../api')>(),api:vi.fn()}));
describe('perfil público por domínio',()=>{
  it.each([false,true])('registro declarado público=%s, sem selo oficial',async(publish)=>{
    vi.mocked(api).mockResolvedValue({provider:{domain:'health',display_name:'Profissional sintético',city:'Cidade QA',about:'Apresentação sintética',profession:'profissao-qa',specialty:'especialidade-qa',registration_reported:publish?{council:'CONSELHO-QA',number:'123-QA',jurisdiction:'TESTE'}:null},services:[],modalities:['online','presencial']});
    render(<MemoryRouter initialEntries={['/prestador/demo']}><Routes><Route path="/prestador/:id" element={<PublicProviderPage/>}/></Routes></MemoryRouter>);
    expect(await screen.findByRole('heading',{name:'Profissional sintético'})).toBeVisible();
    expect(screen.getByText('Profissão: Profissao qa')).toBeVisible();
    expect(screen.getByText('Especialidade: Especialidade qa')).toBeVisible();
    expect(screen.getByText('Modalidades: Online, Presencial')).toBeVisible();
    expect(screen.queryByText(/Registro informado pelo profissional/) !== null).toBe(publish);
    expect(screen.queryByText(/^verificado$/i)).not.toBeInTheDocument();
  });
});
