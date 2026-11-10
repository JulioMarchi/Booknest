# BookNest

Plataforma para autores publicarem eBooks e leitores comprarem, acessarem e
baixarem seus livros com segurança — pagamento via Stripe, entrega via
Signed URLs (o PDF nunca fica público).

> **Status:** em desenvolvimento ativo, construído em fases. Ver
> [Roadmap](#roadmap) abaixo para o que já está pronto e o que falta.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| UI | TailwindCSS v4, shadcn/ui (componentes próprios sobre Radix UI), Framer Motion, Lucide Icons |
| Formulários | React Hook Form + Zod |
| Backend | Supabase (Postgres, Auth, Storage, RLS) |
| Pagamentos | Stripe (Checkout + Webhooks) |
| Deploy | Vercel |

## Roadmap

- [x] **Fase 1 — Fundação**: estrutura do projeto, design system (paleta
      preto/branco/roxo `#7C3AED`, tipografia Fraunces + Inter, dark mode),
      clientes Supabase, middleware de sessão/rate limiting, componentes de UI base.
- [x] **Fase 2 — Banco de dados**: schema completo no Supabase (tabelas, RLS,
      Storage, triggers, functions, views) — aplicado e validado via advisors
      de segurança e performance.
- [x] **Fase 3 — Autenticação**: cadastro, login, logout, recuperação/troca de
      senha, login Google (código completo — falta só a configuração manual
      do provedor, ver [Login com Google](#login-com-google) abaixo).
- [x] **Fase 4 — Loja**: home, catálogo, categorias, busca instantânea,
      filtros, ordenação, página de produto, mais vendidos, lançamentos,
      relacionados, favoritos, compartilhamento. Catálogo ainda sem eBooks
      reais (ver nota abaixo) — estados vazios tratados de propósito.
- [x] **Fase 5 — Compras e Stripe**: checkout (Stripe Checkout Session),
      webhook com verificação de assinatura, liberação automática, cupons,
      idempotência garantida. Falta só registrar o endpoint do webhook no
      Stripe (precisa de URL pública — feito na Fase 10, deploy).
- [x] **Fase 6 — Área do cliente**: biblioteca (com download via Signed URL),
      favoritos, histórico de compras, perfil (nome + senha). "Biblioteca" e
      "Meus eBooks" viraram uma página só — são o mesmo conjunto de dados
      (eBooks comprados), então duas telas quase idênticas só confundiriam
      qual usar. "Downloads" é o botão de baixar dentro da biblioteca, não
      uma tela separada.
- [x] **Fase 7 — Painel administrativo**: dashboard com gráficos, CRUD
      completo de eBooks (upload de capa e PDF), usuários, vendas. É aqui
      que a loja deixa de estar vazia — publique um eBook em
      `/admin/ebooks/novo` e ele aparece em toda a loja na hora.
- [x] **Fase 8 — SEO e performance**: metadata completa (Open Graph, Twitter
      Card, robots), imagem OG gerada por código, `robots.txt`, `sitemap.xml`
      dinâmico, Schema.org (Book + WebSite/Organization), cache de categorias.
- [x] **Fase 9 — Revisão de segurança e QA completo**: ver achados abaixo.
- [ ] **Fase 10 — Deploy em produção**: preparado, falta você fazer `git
      push` pro GitHub e importar na Vercel (ver seção "Deploy em produção"
      abaixo) — daí eu registro o webhook do Stripe pra você.

## Arquitetura de pastas

```
app/            Rotas (App Router) — páginas e API routes
components/     Componentes de UI reutilizáveis (components/ui = primitivos)
features/       Módulos de domínio (auth, catalog, checkout...), cada um com
                seus próprios componentes/hooks/types quando fizer sentido
                isolar do resto
hooks/          React hooks compartilhados entre features
lib/            Infraestrutura: clientes Supabase, fontes, utils, constantes
services/       Integrações externas (Stripe, e-mail...) e camadas de dados
utils/          Funções puras sem dependência de framework
types/          Tipos compartilhados (database.types.ts é gerado, não editar)
supabase/       Migrations SQL (fonte da verdade do schema)
middleware/     Lógica usada pelo middleware.ts raiz (sessão, rate limit)
```

## Banco de dados

O schema vive em `supabase/migrations/`, aplicado em ordem numérica. Pontos
de design que valem registrar:

- **`categories` é uma tabela normalizada** (não um campo de texto livre em
  `ebooks`) — permite gerenciar categorias no admin e páginas de categoria
  sem risco de inconsistência de digitação.
- **`ebooks.author_id`** referencia `users(id)` em vez de guardar o nome do
  autor como texto solto, preparando o terreno para uma futura área do autor
  (o enum `user_role` já inclui `'author'`).
- **`published`** foi adicionado para separar "rascunho" de "publicado" —
  não estava na lista original, mas é necessário para o admin poder preparar
  um eBook antes de liberá-lo na loja.
- **`sales_count`, `rating_avg`, `rating_count`** em `ebooks` são
  desnormalizados via trigger, para ordenar "mais vendidos" e exibir nota
  média sem agregação em tempo real a cada carregamento do catálogo.
- **PDFs nunca são públicos.** O bucket `ebooks` é privado; todo download
  passa por uma Signed URL de curta duração gerada no servidor (service
  role), só depois de confirmar a compra em `purchases`.
- **`purchases` não tem policy de INSERT** para `authenticated`/`anon` — só
  o webhook do Stripe, usando a service role, grava uma compra. Isso
  impede forjar uma compra diretamente pelo client.
- **Rate limiting** é resolvido com uma tabela (`rate_limits`) e uma function
  (`check_rate_limit`) no próprio Postgres, em vez de depender de um serviço
  externo (Redis/Upstash) que ainda não está conectado.
- **`is_admin()` e `has_purchased()`** vivem num schema `private`, não
  exposto pelo PostgREST — evita que fiquem acessíveis como RPC pública
  (achado real do advisor de segurança, corrigido nas migrations 0008/0009).
- **`ebooks.author_name`** (migration 0011) é o nome exibido na loja,
  independente de `author_id`. Adicionado na Fase 7 ao perceber que
  `author_id` sozinho forçaria todo livro a aparecer "por [seu usuário
  admin]" — a maioria dos autores reais não tem conta na plataforma.

## Stripe — checkout e webhook

O checkout usa Sessions do Stripe com preço calculado no servidor
(`price_data` inline — não depende de Products/Prices pré-cadastrados no
Stripe, então funciona assim que o primeiro eBook for publicado, sem
nenhuma configuração extra). Only cartão está habilitado por enquanto
(`payment_method_types: ["card"]`) — pix/boleto ficam de fora de propósito
nesta fase, pra não introduzir os fluxos de confirmação assíncrona sem
testar cada estado a fundo; adicionar depois é uma mudança pequena e isolada
em `features/checkout/actions.ts` e no handler do webhook.

**Testando localmente**, com o [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Isso imprime um `whsec_...` — coloque em `STRIPE_WEBHOOK_SECRET` no
`.env.local`. Use um [cartão de teste](https://stripe.com/docs/testing) do
Stripe (ex.: `4242 4242 4242 4242`) pra simular uma compra completa.

**Em produção**, o endpoint do webhook (`/api/webhooks/stripe`) precisa ser
registrado no painel do Stripe (Desenvolvedores → Webhooks) apontando pra
URL real depois do deploy. Se você me der a URL depois de publicar, eu
registro esse endpoint pra você usando a integração do Stripe (isso eu
consigo automatizar) e te devolvo o `STRIPE_WEBHOOK_SECRET` gerado.

## Deploy em produção (Vercel)

Tentei automatizar o deploy inteiro pela integração conectada, mas a
ferramenta de deploy que tenho aceita arquivos individuais, um por um, sem
suporte a repositório git — pra um projeto de 115 arquivos, isso significa
transcrever cada arquivo à mão numa chamada só, o que não é confiável (risco
real de erro de transcrição corromper algo). Então o caminho mais seguro é
você mesmo conectar o repositório, que é também o jeito padrão e recomendado
(ganha deploy automático a cada push, de graça):

1. **Crie um repositório no GitHub** e suba o que já está pronto (o `git
   init` e os commits de cada fase já estão feitos):
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/booknest.git
   git branch -M main
   git push -u origin main
   ```

2. **No painel da Vercel** ([vercel.com/new](https://vercel.com/new)):
   importe o repositório — a Vercel detecta Next.js automaticamente, não
   precisa mudar nenhuma configuração de build.

3. **Antes de clicar em Deploy**, adicione as variáveis de ambiente
   (Environment Variables). Estas eu já configurei e testei:
   - `NEXT_PUBLIC_SUPABASE_URL` → `https://ymqsptlmezwagnqyhrxp.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `sb_publishable_A2WjqonEGjqUBMKKlz6GIQ_WgfnQV-0`
   - `SUPABASE_SERVICE_ROLE_KEY` → a que você já me passou
   - `STRIPE_SECRET_KEY` → a que você já me passou

   E mais uma que só existe depois do primeiro deploy:
   - `NEXT_PUBLIC_SITE_URL` → a URL que a Vercel te der (ex.:
     `https://booknest.vercel.app`) — adicione essa variável e clique em
     Redeploy uma vez depois de saber a URL final.

4. **Me manda a URL de produção.** Eu registro o webhook do Stripe
   apontando pra ela (via integração), te devolvo o `STRIPE_WEBHOOK_SECRET`
   gerado, e você adiciona como última variável + um redeploy final.

5. **Login com Google** (se for usar): configure conforme a seção acima,
   usando a URL de produção nas URIs de redirecionamento.

## Login com Google

O código do fluxo (botão, redirect, callback) já está pronto e funcional em
`features/auth/`. Falta uma configuração manual que não é feita por SQL nem
pelas integrações conectadas — só existe no painel:

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um
   OAuth Client ID (tipo "Web application") com a URI de redirecionamento:
   `https://ymqsptlmezwagnqyhrxp.supabase.co/auth/v1/callback`
2. No painel do Supabase → Authentication → Providers → Google, cole o
   Client ID e Client Secret gerados e ative o provedor.

Depois disso o botão "Continuar com Google" funciona sem nenhuma mudança de
código.

> **Nota técnica:** durante o desenvolvimento deste projeto, o `npm run build`
> mostrou um aviso inofensivo (`getCategories: Host not in allowlist`) — o
> ambiente usado pela IA tem acesso de rede restrito a poucos domínios
> (registries de pacotes, GitHub) e não alcança o Supabase durante a geração
> estática de `/admin/ebooks/novo`. A função já trata esse erro (cai para
> lista vazia); no seu computador ou na Vercel, com rede normal, esse aviso
> nem aparece.

## Revisão de segurança (Fase 9) — o que foi encontrado e corrigido

- **JSON-LD sem escape**: `dangerouslySetInnerHTML` podia, em teoria, ser
  fechado prematuramente se um campo (ex.: título de eBook) contivesse
  literalmente `</script>`. Corrigido escapando `<` antes de injetar.
- **`getStripe()` fora do try/catch** no checkout e no webhook: uma
  `STRIPE_SECRET_KEY` ausente derrubava a requisição com erro não tratado
  em vez de uma mensagem/resposta controlada. Corrigido.
- **Cupom e download sem rate limit**: `validate_coupon` é RPC pública de
  propósito (o checkout precisa dela) e o endpoint de download só exigia
  estar logado — nenhum dos dois tinha limite de tentativas. Adicionado
  `lib/rate-limit.ts`, reaproveitando a mesma function `check_rate_limit`
  do banco, chamada direto da Server Action/Route Handler (não dá pra usar
  o middleware nesses dois casos — não têm um pathname fixo).
- **Casts de `typedRoutes` com comentário desatualizado**: várias páginas
  que não existiam quando o cast foi escrito ("chega na Fase X") já
  existem há fases. Removidos os casts que não são mais necessários
  (`/`, `/conta`, `/admin`, `/admin/ebooks`) e os comentários órfãos.
- **Dependência morta**: `@stripe/stripe-js` estava instalada mas nunca
  importada — o checkout redireciona para a página hospedada do Stripe,
  não usa Stripe Elements no client. Removida.
- **Banco**: advisors de segurança e performance rodados de novo — limpos,
  só resta o `validate_coupon` exposto (intencional, documentado) e os
  "unused index" esperados (zero linhas no banco ainda).
- **Consistência visual**: nenhuma cor "chumbada" (`bg-gray-*`,
  `text-black` etc.) fora do design system encontrada — só um uso
  intencional de `bg-black/10 dark:bg-white/10` no detalhe da lombada.
  Dropdown de categorias ganhou limite de altura com rolagem (não tinha,
  ficaria enorme se a lista de categorias crescer muito).

## Catálogo vazio até você publicar o primeiro eBook

A loja nasce com zero eBooks — publique o primeiro em `/admin/ebooks/novo`
(entre com uma conta cujo `role` seja `admin`; por padrão todo cadastro
novo vira `customer` — promova manualmente via SQL ou Table Editor no
Supabase: `update public.users set role = 'admin' where email = '...'`).
Depois de publicado, o eBook aparece imediatamente na home, catálogo,
categoria e busca — todas as páginas já tratam o estado vazio, não é
preciso nenhuma configuração extra.

## Como rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves reais do seu projeto
npm run dev
```

Variáveis necessárias — ver comentários em [`.env.example`](./.env.example).
A `SUPABASE_SERVICE_ROLE_KEY` fica em Settings → API no painel do Supabase
(nunca exponha essa chave no client).

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build de produção |
| `npm run lint` | ESLint |
| `npm run type-check` | Checagem de tipos sem emitir arquivos |
| `npm run format` | Formata com Prettier |

## Licença

[MIT](./LICENSE)
