# Sistema visual Nutri-Med

Este documento define a base visual do MVP. O objetivo é oferecer uma interface clara para visitante, cliente e prestador sem sugerir certificações, resultados de saúde ou funcionalidades ainda não implementadas.

## Princípios

- Mobile first, conteúdo essencial disponível a partir de 320 px.
- Um CTA primário por seção; ações secundárias e destrutivas têm aparência e texto próprios.
- Feedback combina texto, borda e cor. Cor nunca é o único indicador.
- Fonte local do sistema com Inter como primeira opção, sem download remoto.
- Tailwind cuida de layout e responsividade; tokens e componentes semânticos ficam em `src/index.css` e `src/components/ui/`.
- Alvo de projeto: WCAG 2.2 AA. A conformidade completa depende de auditoria das páginas e dos fluxos integrados.

## Tokens

| Papel | Token CSS | Valor | Uso |
| --- | --- | --- | --- |
| Primária | `--color-primary` | `#126B72` | CTA, links e foco de controles |
| Secundária | `--color-secondary` | `#D9F3E8` | Fundos informativos e hover secundário |
| Fundo | `--color-background` | `#F6F9F8` | Fundo geral |
| Texto | `--color-text` | `#263B40` | Texto principal |
| Atenção | `--color-warning` | `#C47A20` | Bordas e foco; não usar como texto pequeno em branco |
| Erro | `--color-error` | `#B73B45` | Texto, borda e ação destrutiva |

O tom `#C47A20` tem contraste de apenas **3,41:1 sobre branco**. Por isso, avisos usam `--color-warning-text: #6B3D00` sobre `--color-warning-bg: #FFF4E5`; o tom aprovado permanece na borda e no foco.

### Contrastes verificados

Os valores abaixo foram calculados com a fórmula de luminância relativa da WCAG e são cobertos por `tests/design-system-contrast.test.mjs`.

| Primeiro plano / fundo | Relação |
| --- | ---: |
| `#263B40` / `#F6F9F8` | 11,12:1 |
| branco / `#126B72` | 6,23:1 |
| `#126B72` / branco | 6,23:1 |
| `#263B40` / `#D9F3E8` | 10,06:1 |
| `#B73B45` / `#FFF0F1` | 5,10:1 |
| branco / `#B73B45` | 5,64:1 |
| `#6B3D00` / `#FFF4E5` | 8,43:1 |
| `#52676B` / branco | 5,98:1 |

## Tipografia e medidas

- Corpo: `1rem` (16 px no padrão do navegador), entrelinha `1.6`.
- `h1`: `clamp(1.75rem, 5vw, 2.5rem)`.
- `h2`: `clamp(1.25rem, 3vw, 1.75rem)`.
- Escala de espaço: 4, 8, 12, 16, 24, 32, 48 e 64 px.
- Raios: 8 px para controles, 12 px para feedback e 16 px para cartões/modais.
- Sombras: `--shadow-sm` em cartões e `--shadow-md` em modais. Não usar sombra como única separação.
- Área de toque mínima dos controles: 44 px.
- Conteúdo: máximo de 1120 px, com 16 px de margem no mobile e 32 px a partir de 768 px.
- Breakpoints Tailwind usados: `sm` 640 px, `md` 768 px, `lg` 1024 px e `xl` 1280 px.

## Componentes

| Componente | Responsabilidade |
| --- | --- |
| `Button` / `LinkButton` | Ações primária, secundária ou destrutiva; loading e disabled |
| `Field`, `Input`, `Textarea`, `Select`, `Checkbox` | Rótulo, ajuda, erro e controles de formulário |
| `Card` | Agrupamento semântico de conteúdo |
| `Badge` / `StatusBadge` | Estado sempre expresso também em texto |
| `Alert` | Feedback com `role=status` ou `role=alert` conforme urgência |
| `LoadingState`, `EmptyState`, `ErrorState` | Estados completos de tela ou seção |
| `ConfirmationModal` | Confirmação com foco preso, Escape e retorno do foco |
| `Breadcrumbs` | Localização e retorno em jornadas internas |
| `Container` | Largura e margens responsivas consistentes |

Prefira verbos explícitos: “Salvar alterações”, “Desativar anúncio”, “Aceitar proposta”. Evite rótulos genéricos como “OK” ou “Continuar” quando a ação puder ser nomeada.

## Acessibilidade

- Todo campo precisa de `label` associado por `htmlFor`/`id`; ajuda e erro usam `aria-describedby`.
- Erros urgentes usam `role=alert`; sucesso, carregamento e informação usam `role=status`.
- O foco visível usa contorno de 3 px e não é removido.
- O modal começa no botão de cancelamento, prende Tab/Shift+Tab, fecha com Escape e devolve o foco ao acionador.
- Hover, disabled e ação destrutiva possuem diferenças além da cor.
- `prefers-reduced-motion: reduce` reduz transições e a animação de carregamento.
- Ícones não são necessários nesta base. Se forem adicionados, precisam de rótulo acessível quando a função não estiver clara pelo texto.

## Desenvolvimento e manutenção

Em desenvolvimento, abra `/dev/design-system`. A rota é criada apenas quando `import.meta.env.DEV` é verdadeiro e não existe no build de produção. Todos os exemplos usam dados sintéticos.

Inicie `npm run dev` (porta padrão 5173) e execute `npm run screenshots:design-system` em outro terminal para atualizar as capturas de 375 px e 1440 px em `docs/screenshots/design-system/`. Se o Chromium estiver instalado fora do caminho padrão do Playwright, informe `CHROMIUM_EXECUTABLE_PATH`.

Para alterar o sistema:

1. Atualize primeiro os tokens, evitando hex avulso em páginas.
2. Verifique contraste das novas combinações e registre o resultado no teste.
3. Atualize o componente reutilizável antes de duplicar classes nas telas.
4. Execute `npm run typecheck`, `npm test`, `npm run lint` e `npm run build`.
5. Faça QA por teclado, em 375 px e 1440 px, incluindo loading, vazio, erro e modal.
