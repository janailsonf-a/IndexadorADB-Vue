# Indexador ADB — Progresso de Desenvolvimento

> **Projeto:** DAM (Digital Asset Manager) para Amigos do Bem  
> **Stack:** Vue 3 + Vite 8 + Pinia + Vue Router 4 (JavaScript, não TypeScript)  
> **Backend:** FastAPI + SQLite + JWT (HS256, 8h)  
> **UI:** Tailwind CSS v3 (darkMode: 'class') + CSS custom properties  
> **Fontes:** Montserrat (headings) + Inter (body)  
> **Cores ADB:** Laranja `#FF6B00` · Amarelo `#FFD900` · Azul `#0047BA`

---

## Estado atual (última atualização: 2026-07-28, fim de sessão)

**Deploy em produção feito nesta sessão.** Ver seção "Deploy e Produção" logo abaixo para o estado atual de infraestrutura — é a parte mais importante pra quem continuar a partir daqui.

**Todas as 16 views funcionais** — nenhuma é mais mock puro (`AuditView` removida nesta sessão, ver abaixo). Alta, média e **baixa prioridade/polish: 100% concluídas.** Backlog anterior zerado nesta sessão:
- [x] `SearchView.vue` refatorado — `mapItem`/`EXT_TO_TYPE`/`formatSize`/`normalizeDate` agora exportados de `assets.js` e reaproveitados, dedupe completo. Corrigiu de quebra o bug de `starred: false` sempre falso na busca.
- [x] `AbortController` em `fetchAssets`/`loadMore` (`assets.js`) — request anterior cancelado a cada nova busca/filtro, com guard pra não deixar request obsoleto sobrescrever estado mais novo.
- [x] Sweep de cor de marca — `#FF6B00` → `var(--accent)` em 22 arquivos, 102 ocorrências (mantidos os literais de `COLORS`/valor-default do color-picker, que dependem de comparação de string).
- [x] Framework de teste (Vitest, `npm run test`, 11 testes em `assets.js`) + linter (ESLint flat config, `flat/essential`, `npm run lint`) configurados e com 0 warnings.
- [x] Focus trap aplicado nos 5 modais restantes (Campanhas, Coleções, Lixeira, Tags, CampanhaDetail). Bônus: `useFocusTrap.js` ganhou `onUnmounted` — o listener de `keydown` só era removido no fechamento via `isOpen`, vazando se o componente desmontasse (navegação SPA) com o modal ainda aberto.
- [x] Loading skeleton (`SkeletonGrid.vue`) aplicado em `DuplicatesView` e `SearchView` (antes usavam spinner simples). Demais views sem loading próprio (derivam de dados já carregados, sem estado de espera).
- [x] Filtro de lixeira estendido — novo computed `assets.visibleItems` (itens menos lixeira/ocultos, sem os filtros de tipo/campanha/período de `assets.filtered`) usado em `FavoritesView`, `RecentesView`, `CampaignDetailView`; `SearchView` ganhou o mesmo filtro inline (resultado vem da API, não de `assets.items`). Testado via Playwright: arquivo movido pra lixeira some das 4 views e aparece só na Lixeira.

Sessão anterior corrigiu **2 bugs reais no backend** (`/home/janailsonf-a/indexador`, fora do repo Noxis2, autorizados explicitamente — ver seção própria abaixo): permissão de `editor` bloqueada indevidamente em `PUT /api/files/{id}/metadata`, e um bug de concorrência real (`sqlite3.ProgrammingError` sob requests paralelos).

**O que ainda falta** (baixo risco, nenhum bloqueante):
- Nenhum item bloqueante identificado no momento — app em produção, ver seção "Deploy e Produção".

**Feature nova nesta sessão (backend dev, autorizado explicitamente):** detecção de duplicatas por hash de conteúdo real (SHA-256), ver seção "Funcionalidades adicionadas no Backend" abaixo.

**Removido nesta sessão:** `AuditView.vue` (não era útil, pedido explícito do usuário) — rota `/auditoria`, item de menu e o arquivo da view apagados. `GET /api/activities` (backend) continua intacto, ainda usado por `ProfileView`, `StatusView` e `AnalyticsView`.

**Polish visual nesta sessão (pedido explícito do usuário):**
- [x] `LoginView.vue` redesenhada — painel promocional (features/marketing) removido, agora é só um card único centralizado: logo (88px), nome, e-mail/senha, botão "Entrar". Card com contorno (`border` + `box-shadow` sutil), largura ajustada por feedback iterativo até 560px/padding 72px.
- [x] Logo do sidebar aumentada de 34px → 44px.
- [x] **Todos os emojis trocados por ícones SVG** (Feather-style, `stroke=currentColor`) em 15 arquivos — empty-states, badge de expiração da lixeira, botão "Manter primeiro" de Duplicatas, tema claro/escuro do sidebar, tipos de arquivo do `FilterBar`. Novo módulo `src/lib/icons.js` com os ícones genéricos reutilizáveis; ícones de tipo de arquivo no `FilterBar` reaproveitam `useFileType(tipo).icon` em vez de duplicar.
  - **Bug real achado e corrigido nesse meio-tempo:** ícones injetados via `v-html` não recebiam o atributo de escopo (`data-v-hash`) que o Vue anexa em CSS `scoped`, então regras do tipo `.empty-ico svg { width: ... }` nunca casavam — SVG renderizava com tamanho 0/errado. Afeta **qualquer** ícone setado via `v-html` sob `<style scoped>`, inclusive o `.nav-ico` do sidebar que já existia antes desta sessão (não só os novos). Corrigido trocando por `:deep(svg)` em 17 regras. Verificado via `getComputedStyle`/screenshot antes e depois.
- [x] `StubView.vue` removido — componente órfão de quando as views eram mock, não referenciado em lugar nenhum (confirmado via grep antes de apagar).
- [x] Novo `ACESSOS.md` (raiz do repo) — documento com o que cada nível de usuário (Editor/Admin) acessa: tabela de telas por rota, ações internas restritas por botão, e endpoints do backend por `require_editor`/`require_admin` (conferido linha a linha em `users.py`, não só chutado).

**Bug real achado testando "Criar usuário" em `UsersView.vue` (2026-07-17) — corrigido no frontend, não no backend:**
- **Sintoma:** criar usuário com perfil "Editor" devolvia 422 (`Input should be 'user' or 'admin'`).
- **Causa raiz:** o backend só tem 2 papéis (`Literal["user", "admin"]` em `app/schemas/users.py`) — isso está **correto**, é o mesmo esquema usado no resto do app (`auth.js` já mapeia `user`↔`editor`). O bug era só no `UsersView.vue`: inventou um 3º papel fictício (`viewer`/"Visualizador") que nunca existiu no backend, e nunca aplicava a tradução `user↔editor` — então mandava `role:"editor"` cru pro backend (422) e, ao listar usuários, comparava/exibia o valor cru (`"user"`) contra rótulos que só conheciam `"editor"` (usuários não-admin apareciam com label errado e o filtro por "Editor" nunca batia com ninguém).
- **Fix:** `mapRole`/`unmapRole` exportados de `stores/auth.js` (o `unmapRole` é novo, inverso do `mapRole` que já existia). `UsersView.vue` passou a mapear a lista recém-carregada (`mapRole`) pra exibição/filtro, e destraduzir (`unmapRole`) antes de mandar pro backend em criar/editar. Removida a opção fictícia "Visualizador" dos dois selects (filtro e modal).
- **Verificado ao vivo:** criar usuário com Editor → 201 (`role:"user"` na resposta); criar com Admin → 201 (`role:"admin"`); filtro por Editor exclui admin e vice-versa; editar papel Editor→Admin → 200; usuários de teste limpos depois.

**Para rodar:** ver seção "Ambiente de Desenvolvimento" logo abaixo. Login dev: `jfalmeida@amigosdobem.org` / `noxis2025`.

---

## Deploy e Produção (2026-07-28)

### Repositórios (ambos com git de verdade agora, nada mais é "sem git")
| Repo | GitHub | Branch em produção |
|---|---|---|
| Frontend (este projeto, mesclado do antigo `Noxis2`) | `github.com/janailsonf-a/IndexadorADB-Vue` | `feature/noxis2-merge` → PR aberto e **mergeado em `main`** |
| Backend (`/home/janailsonf-a/indexador`, dev; código real roda em container separado) | `github.com/janailsonf-a/IndexadorADB-Python` | `feat/deploy-ajustes` |

O merge do antigo `Noxis2` pra dentro deste repo (`Noxis`) já está descrito nas seções acima como trabalho de sessão; ficou tudo preservado em `_legacy-noxis-pre-merge/` o que colidia por caminho.

### ⚠️ O backend tem que rodar em Docker, não bare-metal
Confirmado nesta sessão: a instância de produção real é o container Docker `indexador-api` (porta host `9102` → porta interna do container `9100`), junto com `indexador-worker` (indexer/watcher). **Não existe processo bare-metal de produção** — só o dev local (`localhost:9103`, ambiente descrito na seção abaixo) roda fora de container, e é só pra desenvolvimento/teste, nunca pra servir usuário real. Se for reconfigurar/reiniciar o backend em produção, é `docker` (`docker ps`, `docker restart indexador-api` etc.), não `uvicorn` direto.

### Servidor de produção (`192.168.0.162`)
| Item | Valor |
|---|---|
| Frontend (build estático, nginx) | `http://192.168.0.162:9101` |
| Backend (container Docker) | `127.0.0.1:9102` (só acessível via proxy do nginx, não exposto direto pro navegador) |
| Diretório do frontend no servidor | `/opt/projetos/Noxis-Vue` (clone do repo, branch `main`) |
| Nginx config | `/etc/nginx/sites-available/noxis_vue` |
| Diretório do backend no servidor | `/opt/projetos/IndexadorADB-Python` |

**⚠️ `COMPOSE_PROJECT_NAME` no servidor:** as pastas foram renomeadas de
`Noxis-Vue`/`indexador` para `IndexadorADB-*` em 28/08/2026. O `docker compose`
deriva o nome do projeto do nome da pasta, então depois do rename ele parou de
enxergar os containers `indexador-api`/`indexador-worker`. A correção foi
acrescentar `COMPOSE_PROJECT_NAME=indexador` ao `.env` de
`/opt/projetos/IndexadorADB-Python`. Esse `.env` é gitignored — se ele for
perdido ou o repo for re-clonado, a linha precisa ser recriada, senão um
`docker compose down`/`up` não encontra os containers certos e colide no nome
`indexador-api`.

**Processo de deploy do frontend**, replicável pra próxima atualização:
```bash
cd /opt/projetos/Noxis-Vue
git pull origin main
rm -rf node_modules package-lock.json   # evita node_modules desatualizado/incompatível
npm install
npm run build
sudo systemctl reload nginx             # só se o nginx config mudou; build sozinho não precisa
```

**Bug de infra achado e corrigido nesta sessão:** o nginx só tinha `location / { try_files ... }` servindo os arquivos estáticos — nenhuma regra de proxy pra `/api`, `/files`, `/download`, `/preview`. Qualquer método diferente de GET/HEAD (ex: `POST /api/auth/login`) caía nesse location estático e retornava **405 Not Allowed** direto do nginx, sem nunca chegar no backend. Corrigido adicionando 4 blocos `location` com `proxy_pass http://127.0.0.1:9102` (a porta publicada do container `indexador-api`) antes do `location /` existente. Login testado funcionando depois do fix.

### Comunicação pro time
- `ACESSOS.md` (raiz do repo) — o que cada papel (Editor/Admin) acessa.
- Apresentação de novidades: artifact HTML (self-contained, 8 slides) e uma versão no Canva (brand kit "Amigos do Bem" aplicado, formato direto "antes / agora / pra que serve" por funcionalidade) — nenhum dos dois faz parte do código do projeto, são só material de comunicação, não precisam de manutenção junto com o app.

---

## Ambiente de Desenvolvimento

| Item | Valor |
|---|---|
| Frontend | `http://192.168.1.109:5174` (Vite dev, host 0.0.0.0) |
| Backend dev | `localhost:9103` (uvicorn, `/home/janailsonf-a/indexador/`) |
| Arquivos indexados | `/home/janailsonf-a/teste_10m` → ~1.009.905 arquivos |
| DB dev | `/home/janailsonf-a/indexador/data-dev/file_index.db` |
| Backend produção | `192.168.0.162:9102` — **NÃO TOCAR** |
| Usuário dev | `jfalmeida@amigosdobem.org` / `noxis2025` (role: `admin`) |

### Iniciar backend dev
```bash
cd /home/janailsonf-a/indexador
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 9103
```
Use sempre o `.venv` deste diretório explicitamente (`.venv/bin/python -m uvicorn`, não só `uvicorn` do PATH) — existe uma cópia divergente do código em `/opt/indexador` que já rodou na porta 9103 por engano nesta sessão (ver aviso na seção "Funcionalidades adicionadas no Backend" abaixo). Sem `--reload` por padrão nesta sessão; adicione se for iterar em código Python.

### Iniciar frontend
```bash
cd /var/www/html/IndexadorADB-Vue-dev
npm run dev
```

---

## Arquitetura do Frontend

```
src/
├── api/
│   └── client.js          # axios, baseURL '/', interceptor JWT + 401 + detecção de rede caída
├── router/
│   └── index.js           # rotas + guards (admin/editor) → redirecionam pra /403; catch-all → 404
├── stores/
│   ├── auth.js            # login real, role mapping, init() (só desloga em 401/403 real)
│   ├── assets.js          # fetchAssets/loadMore/toggleStar, campanhas/coleções/lixeira/filtros (localStorage)
│   ├── ui.js               # theme, gridSize (+ setGridSize), sidebar
│   ├── toast.js            # push/success/error/warn/info, auto-dismiss
│   └── settings.js         # cfg + notifications do app, localStorage (sem endpoint no backend)
├── composables/
│   ├── useFileType.js      # ícones/cores por tipo (img/vid/pdf/xls/ppt/doc/aud/unk)
│   ├── useZipDownload.js   # monta ZIP no browser (jszip) a partir de download_link de cada arquivo
│   └── useFocusTrap.js     # trap de foco genérico p/ modais (Tab cicla, Esc fecha, restaura foco)
├── components/
│   ├── gallery/
│   │   ├── FilterBar.vue                # dropdown "Filtros avançados" (tipo, campanha, período — todos reais)
│   │   ├── FileCard.vue                 # card focável por teclado, thumbnail, star, checkbox, quick-acts
│   │   ├── FileLightbox.vue             # visualizador (img/vid/pdf/áudio) + edição de metadados + copiar link
│   │   ├── FloatingActionBar.vue        # barra seleção múltipla (slot "extra" p/ ações específicas de view)
│   │   ├── AddToCollectionModal.vue     # modal reusável "adicionar à coleção" (focus trap)
│   │   └── LinkToCampaignModal.vue      # modal reusável "vincular campanha" (focus trap)
│   └── ui/
│       ├── ToastContainer.vue     # toasts fixed bottom-right (cores tema-reativas)
│       ├── SkeletonGrid.vue       # loading skeleton com shimmer (Gallery/Duplicates/Search)
│       └── StubView.vue           # placeholder genérico
└── views/                 # inclui CollectionDetailView.vue, ForbiddenView.vue, NotFoundView.vue (novas)
```

### Vite proxy (evita CORS)
```js
// vite.config.js → todas as rotas /api, /files, /download, /preview
// apontam para http://localhost:9103
```

### Mapeamento de roles
```
backend "user"  → frontend "editor"
backend "admin" → frontend "admin"
```

### Normalização de datas
API retorna `"2026-03-31 10:45"` (espaço, sem segundos).  
`normalizeDate()` em `assets.js` converte para `"2026-03-31T10:45:00"`.

---

## O QUE JÁ ESTÁ PRONTO ✅

### Infraestrutura
- [x] Vite proxy configurado (sem CORS)
- [x] `api/client.js` — baseURL `/`, interceptor injeta JWT no header
- [x] `api/client.js` — interceptor de resposta: 401 → logout automático + redirect `/login`
- [x] `stores/toast.js` + `ToastContainer.vue` — toasts animados em toda a app
- [x] `App.vue` — chama `auth.init()` no mount (valida token salvo)

### Autenticação
- [x] `stores/auth.js` — login real via `POST /api/auth/login`
- [x] Persistência JWT no localStorage
- [x] `GET /api/auth/me` na inicialização para revalidar token
- [x] Logout limpa store + localStorage
- [x] Guards de rota por role (`admin` / `editor` / `viewer`)
- [x] `LoginView.vue` — tela de login com validação de erro

### Galeria (`GalleryView.vue`) — **funcional com dados reais**
- [x] `GET /api/search` com paginação (50 por página)
- [x] Infinite scroll (dispara `loadMore` a 200px do fim)
- [x] Agrupamento por mês (com fallback "Sem data" para datas inválidas)
- [x] Filtro por tipo (pills no `FilterBar`)
- [x] Busca com debounce 300ms
- [x] Modo grade + modo lista
- [x] Seleção múltipla + `FloatingActionBar`
- [x] Download real via `<a>` dinâmico
- [x] Star/favoritar (localStorage)
- [x] `FilterBar.vue` — dropdown "Filtros avançados" (tipo, campanha, tags, data range)

### FileLightbox (`FileLightbox.vue`) — **metadados reais**
- [x] Visualizador: imagem, vídeo, ícone + botões para outros tipos
- [x] Navegação por botões (◀/▶) e por teclado (←/→ + Esc) — **correção de doc**: o `keydown` não fica no `FileLightbox.vue` (ele só emite `prev`/`next`/`close`), fica em cada view que o usa (`window.addEventListener('keydown', onKey)` em Gallery/Favorites/Recentes/Busca/CampanhaDetail). Já funcionava em todas essas; só faltava em `CollectionDetailView.vue` (novo), que ficou sem o listener na hora de criar — corrigido
- [x] `GET /api/files/{id}/metadata` ao abrir cada arquivo
- [x] Painel edição (toggle "Editar"):
  - Campo título, campanha, descrição
  - Tags com autocomplete (`GET /api/files/tags/suggestions`)
  - Checkbox "arquivo oficial"
  - `PUT /api/files/{id}/metadata` ao salvar
  - Toast de sucesso/erro
- [x] Botão editar visível apenas para `editor` / `admin`

### Views com dados reais
- [x] **`GalleryView`** — 1M+ arquivos reais, infinite scroll
- [x] **`SearchView`** — `GET /api/search` com debounce real (não mais filtro local)
- [x] **`FavoritesView`** — starred do localStorage cruzado com `assets.items`
- [x] **`RecentesView`** — `assets.items` ordenados por data desc, agrupados por período (bug corrigido em 2026-07-07: `openLightbox()` referenciava `allFiles.value`, variável inexistente — causava `ReferenceError` ao clicar em qualquer card; corrigido para usar `grouped.value.flatMap(g => g.files)`)
- [x] **`ProfileView`** — nome via `PUT /api/auth/me`, senha, atividades reais
- [x] **`UsersView`** — CRUD completo: listar/criar/editar/excluir via `/api/users`, modal
- [x] **`StatusView`** — `GET /api/full-status`: CPU/RAM/disco, indexador, log de atividades

### Assets store (`stores/assets.js`)
- [x] `fetchAssets({ query, page, reset })` — `GET /api/search`, cancela request anterior via `AbortController` antes de disparar um novo
- [x] `loadMore()` — incrementa página, mesma cancelação
- [x] `toggleStar(id)` — localStorage + update reativo
- [x] `toggleSelect(id)` / `clearSelection()`
- [x] `visibleItems` computed (exclui itens na lixeira/ocultos, sem os demais filtros) — usado por Favoritos/Recentes/CampanhaDetail
- [x] `filtered` computed (`visibleItems` + `currentFilter` + campanha/período)
- [x] `hasMore` computed
- [x] `mapItem`, `EXT_TO_TYPE`, `formatSize`, `normalizeDate` exportados — reaproveitados em `SearchView.vue` e testados em `assets.test.js`
- [x] `campaignMeta` (localStorage `noxis_campaign_meta`) + `upsertCampaignMeta(name, patch)` — descrição/cor de campanhas
- [x] `collections` (localStorage `noxis_collections`) + `createCollection`/`deleteCollection`/`addFilesToCollection`/`removeFileFromCollection`
- [x] `trash` (localStorage `noxis_trash`, `{id: deletedAtISO}`) + `moveToTrash`/`restoreFromTrash`/`emptyTrash`
- [x] `hiddenIds` (localStorage `noxis_hidden`) + `permanentlyRemove(id)` — oculta para sempre da galeria (sem endpoint de delete no backend)

### Campanhas (`CampaignsView.vue` / `CampaignDetailView.vue`) — **funcional**
- [x] Campanhas derivadas ao vivo de `assets.items` (agrupamento pelo campo `campaign`)
- [x] `createCampaign()` — cria campanha vazia via `campaignMeta` (localStorage); aparece na lista com 0 arquivos até algum arquivo ser tageado com o mesmo nome (aí funde automaticamente com a derivada)
- [x] Cor customizável (color swatches) refletida no gradiente do card e do banner de detalhe
- [x] `CampaignDetailView.vue` — modal "Editar" (descrição + cor, persistido em `campaignMeta`); nome não é editável (renomear exigiria batch-update em todos os arquivos, fora de escopo)
- [x] Download individual e em lote ligados de verdade (antes eram no-op)
- [x] Deep-link direto (`/campanhas/:id`) já busca `assets.items` se ainda não carregado

### Coleções (`CollectionsView.vue` / `CollectionDetailView.vue`, nova) — **funcional**
- [x] CRUD real via `assets.collections` (localStorage): criar (nome + cor), excluir (com confirmação)
- [x] `CollectionDetailView.vue` (nova view, rota `/colecoes/:id`) — mostra arquivos da coleção (cross-referência por ID em `assets.items`), permite remover arquivos selecionados da coleção
- [x] `AddToCollectionModal.vue` (novo componente reusável) — escolher coleção existente ou criar nova inline; usado a partir do `FloatingActionBar` em **todas** as views de arquivo (Acervo, Favoritos, Recentes, Busca, Campanha, Coleção)

### Lixeira (`LixeiraView.vue`) — **funcional**
- [x] Soft-delete local via `assets.trash` (localStorage) — sem endpoint de delete no backend, documentado como limitação conhecida
- [x] "Mover para lixeira": quick-action no `FileCard` (ícone lixeira, visível para `editor`+) e botão em lote no `FloatingActionBar`
- [x] Restaurar arquivo (some da lixeira, reaparece na galeria)
- [x] Apagar para sempre (admin) — oculta definitivamente via `hiddenIds`, mesmo após restart
- [x] Esvaziar lixeira (admin, com modal de confirmação)
- [x] Arquivos na lixeira somem da Galeria (`assets.filtered`); outras views (Favoritos/Recentes/Busca/Campanha) ainda não aplicam esse filtro — ver pendências
- [x] "Expira em Xd" calculado a partir de `assets.trash[id]` (data real de exclusão) + `settings.cfg.trashDays`

### Configurações (`SettingsView.vue`) — **funcional (persistência local)**
- [x] Novo `stores/settings.js` — `cfg` (identidade, upload, retenção lixeira, qualidade thumbnail, aprovação, notificações) persistido em `localStorage` (`noxis_settings_cfg` / `noxis_settings_notificações`)
- [x] Todas as 4 abas com botão "Salvar" persistem de verdade (antes era `alert()` + `// TODO`)
- [x] Upload de logo real: `<input type="file">` → `FileReader` → data URL salva em `cfg.logoUrl` (sem backend de upload, mas funciona de ponta a ponta)
- [x] Aba "Integrações": removido o campo de "chave de API" fake (`nxs_live_•••`) — o backend não tem sistema de API key, só JWT por login; mantido apenas a URL base real
- [x] `LixeiraView` já lê `settings.cfg.trashDays` (não mais hardcoded "30 dias") — confirmado end-to-end: mudar retenção em Configurações muda o "Expira em Xd" na Lixeira
- [ ] Aba "Indexação" mencionada aqui antes **não existe no código atual** (era uma divergência doc-vs-código); confirmado por leitura direta do backend que não há `POST /api/reindex` — reindexação só roda via CLI (`python -m app.indexer`) no servidor, não há caminho HTTP. Não há UI para isso hoje; se for necessário no futuro, precisa de endpoint novo no backend primeiro.
- [ ] Modo manutenção / exigir aprovação / papel mínimo — os toggles salvam o valor, mas nenhuma lógica no resto do app ainda lê/reage a esses campos (ex: `cfg.maintenance` não bloqueia login de não-admins de fato)

---

## O QUE FALTA SER FEITO ⏳

### Média prioridade

#### `FloatingActionBar` — ações em lote
- [x] "Adicionar à coleção" — real em todas as views (via `AddToCollectionModal`)
- [x] "Mover para lixeira" (em lote) — real em todas as views (Acervo, Favoritos, Recentes, Busca, Campanha, Coleção)
- [x] "Vincular campanha" (em lote) — real em todas as views, via novo `LinkToCampaignModal.vue` (mesmo padrão do `AddToCollectionModal`): escolhe campanha existente (lista de `assets.campaignsList`, novo computed no store) ou cria uma nova, `PUT /api/files/{id}/metadata` sequencial por arquivo (`{campaign: name}`, preserva demais campos). Testado: toast, label aparece na hora, persiste após reload, aparece em `CampaignsView` com contagem certa
- [x] "Download ZIP" — real em todas as views, via novo composable `src/composables/useZipDownload.js` (**única lib nova do projeto: `jszip`** — sem alternativa nativa do browser pra zipar múltiplos arquivos). Busca cada `download_link` via `fetch` (confirmado: `/download` no backend não exige auth, mesmo esquema já usado pelo download individual), monta ZIP no navegador, dispara download via blob URL. Deduplica nomes de arquivo colidentes (`foto.jpg` → `foto (2).jpg`). Toast de progresso/sucesso/erro. Backend não tem endpoint de batch-download, então isso cobre só o que o cliente já carregou/selecionou — não tem limite arbitrário de arquivos, mas para seleções muito grandes o navegador guarda tudo em memória antes de gerar o ZIP (sem streaming). Testado: 3 arquivos reais, ZIP baixado e verificado com `unzip -l` (conteúdo íntegro, tamanhos batendo)

#### Lixeira — follow-ups
- [ ] Estender o filtro de itens-na-lixeira (`assets.filtered`) para Favoritos/Recentes/Busca/CampanhaDetail/ColeçãoDetail — hoje um arquivo na lixeira ainda aparece nessas views porque elas leem `assets.items` direto, não `assets.filtered`
- [ ] Quick-action "mover para lixeira" no `FileCard` só tem handler ligado em `GalleryView`; nas outras views o botão aparece (se `showTrash` for passado) mas não foi propagado ainda

#### `TagsView.vue` — **funcional**
- [x] Lista de tags derivada ao vivo de `assets.items[].tags`, com contagem de uso e busca
- [x] Clicar na tag → filtra galeria
- [x] `deleteTag()` / `saveTag()` (rename) — persistem de verdade via `PUT /api/files/{id}/metadata` em lote nos arquivos afetados (sequencial, não paralelo — ver bug de concorrência abaixo); toast de sucesso/erro; botões desabilitados durante a operação
- [ ] Criar tag nova sem arquivo associado continua sem efeito — tags não são entidade própria no backend (só existem via tabela `file_tags`, uma linha por arquivo), não há "tag vazia" pra criar

#### `AnalyticsView.vue` — **funcional (redesenhado, não era possível manter o mock)**
Pesquisa no código-fonte real do backend (não só na doc) mostrou que 3 seções do mock original são **impossíveis de implementar honestamente** com os dados que existem:
- "Uploads por dia" — não existe ação `upload` registrada em lugar nenhum (`app/services/activity_service.py` só loga `vacuum/preview/download/serve_file/clear_activities/search` — é indexador de arquivo existente, não portal de upload)
- "Usuários mais ativos" — tabela `activities` não tem coluna de usuário/ator nenhuma (schema: `action, filename, rel_path, created_at`, só isso). Atividade é 100% anônima.
- "Armazenamento por tipo" — backend não computa `SUM(size_bytes) GROUP BY ext`, só `shutil.disk_usage()` (percentual geral do disco, sem breakdown)

Substituído por dados reais equivalentes:
- [x] 4 KPIs reais: arquivos indexados (`total_indexed` de `/api/search`), armazenamento (`/api/full-status`), usuários cadastrados (`/api/users`), tags em uso (`/api/files/tags/suggestions`)
- [x] "Atividade por dia" — real, `GET /api/activities` (limit 1000) agrupado por dia, período 7/30/90 **agora funcional de verdade** (antes só decorativo)
- [x] "Atividade por ação" (novo, substitui "Usuários mais ativos") — donut real dos 6 tipos de ação que existem de fato
- [x] "Distribuição por tipo" e "Top Campanhas" — reais, mas só da amostra de `assets.items` já carregada (rotulado explicitamente na tela, mesma lógica de honestidade do Duplicatas — não cobre o acervo inteiro)
- [x] "Histórico de armazenamento" (novo, substitui "Armazenamento por tipo") — real, `GET /api/history` (snapshot diário de uso de disco, endpoint que já existia e ninguém tinha usado ainda)
- [x] **Bug de CSS real corrigido**: `.bar-col` sem `height` explícito fazia `height: X%` do `.bar` nunca resolver (spec: % height contra container sem altura definida = ignorado) — todo gráfico de barras (inclusive o mock original, nunca detectado) renderizava sempre achatado. Fix: `height: 100%` no `.bar-col`. Confirmado via inspeção de DOM antes/depois.
- [x] **Navegação corrigida**: `/analytics` e `/tags` não tinham link nenhum na sidebar — só existiam se alguém digitasse a URL direto. Adicionados em `AppSidebar.vue` (reaproveitando `ICON_REPORT`/`ICON_TAG`, que já existiam mas nunca eram usados)

#### `DuplicatesView.vue` — **funcional (hash de conteúdo no backend)**
- [x] Agrupamento por `content_hash` (SHA-256 real do conteúdo, calculado no backend) via novo `GET /api/duplicates` — cobre o acervo inteiro (~1M arquivos), não só o que já está carregado no cliente. Substituiu a heurística anterior client-side por nome+tamanho.
- [x] Arquivos de 0 bytes excluídos da comparação — descoberta ao testar: ~1.009.827 dos ~1.009.905 arquivos do corpus de teste são vazios e todos batem no mesmo hash SHA-256 (hash do arquivo vazio), o que criava um grupo "duplicata" gigante e inútil cobrindo quase o acervo inteiro. Mesma lição da tentativa antiga de tamanho+tipo: sinal fraco demais vira ruído em massa.
- [x] "Manter primeiro" / "Manter mais recente" / "Manter este" / "Remover" — todos batem com a Lixeira real (`assets.moveToTrash`); trash/ocultos (localStorage) filtrados dos grupos depois de buscar na API, já que o backend não sabe desses conceitos fake
- [x] "Escanear novamente" rebusca `/api/duplicates`
- [x] Testado: 2 grupos reais encontrados no corpus de teste (`perfil.json`/`perfil (1).json`, `XLSX Worksheet.xlsx`/`XLSX Worksheet.xlsx (2)`), "Manter primeiro" move o resto pra lixeira e o grupo some da lista

### Baixa prioridade / Polish

#### Erros e estados de rede
- [x] Tela de erro 403 — nova `ForbiddenView.vue`, aninhada no `AppShell` (mantém sidebar). Router: `requiresAdmin`/`requiresEditor` agora redirecionam pra `/403` em vez de `/acervo` silenciosamente
- [x] Tela de erro 404 — nova `NotFoundView.vue`, standalone (catch-all `/:pathMatch(.*)*`, antes era `redirect: '/'` silencioso). Mostra o path que falhou + botão voltar
- [x] Testado: login como editor, acesso a `/usuarios` (admin-only) → `/403` com mensagem clara; URL inventada → 404 com o path exibido; botão "Voltar ao Acervo" funciona nos dois
- [x] Estado "sem conexão" / "backend offline" — ver seção "Estado de rede" abaixo
- [x] Loading skeleton — ver seção "Estado de rede" abaixo

#### `GalleryView`/demais views — melhorias
- [x] Bulk download ZIP real — feito (ver seção FloatingActionBar acima)
- [x] Bulk vincular campanha real — feito
- [x] Bulk adicionar coleção real — feito

#### `FileLightbox` — melhorias
- [x] PDF inline viewer (`<iframe>`, usa `preview_link` — `pdf` já está em `SAFE_INLINE_EXTENSIONS` no backend). Testado com arquivo real (`fluxo-git.pdf`), renderiza no viewer nativo do Chrome dentro do iframe.
- [x] Preview de áudio (`<audio controls>`) — **achado importante:** extensões de áudio NÃO estão em `SAFE_INLINE_EXTENSIONS` no backend, então usa `download_link` (`/download`, `Content-Disposition: attachment`) em vez de `preview_link`. Testado com arquivo real (`.ogg`, 110s) — funciona porque `<audio src>` carrega como subrecurso de mídia, não navegação, então o browser ignora o `Content-Disposition: attachment` nesse contexto. Confirmado via `readyState:4` (carregado) no elemento real.
- [x] Botão "Copiar link" — `navigator.clipboard.writeText(origin + preview_link/download_link)`, toast de confirmação, testado lendo o clipboard de verdade depois do clique.

#### Acessibilidade e UX
- [x] Trap de foco nos modais — composable `src/composables/useFocusTrap.js` (Tab cicla dentro do modal, Escape fecha, foco volta pro elemento que abriu). Aplicado em todos os 7 modais da aplicação: `AddToCollectionModal.vue`, `LinkToCampaignModal.vue` (sessão anterior) e `CampaignsView.vue`, `CollectionsView.vue`, `LixeiraView.vue`, `TagsView.vue`, `CampaignDetailView.vue` (nesta sessão). Testado via Playwright em todos: foco entra no modal ao abrir, Tab não escapa, Escape fecha. Bônus corrigido: composable vazava o listener `keydown` se o componente desmontasse (navegação SPA) com o modal ainda aberto — `isOpen` só virava `false` no fechamento explícito, nunca no unmount. Adicionado `onUnmounted` pra sempre limpar.
- [x] `aria-label`/`aria-pressed` nas ações do `FileCard` (selecionar, visualizar, baixar, lixeira, favoritar) + card inteiro agora é focável por teclado (`tabindex`, `role="button"`, Enter/Espaço abrem). Testado: foco via Tab + Enter abre o lightbox.
- [x] Confirmar shortcut `Delete` para mover pra lixeira — **não existia shortcut nenhum antes** (item do backlog presumia que existia e só faltava confirmar; na real era funcionalidade nova). Implementado nas 6 views com seleção (Acervo, Favoritos, Recentes, Busca, CampanhaDetail, ColeçãoDetail): `Delete` com itens selecionados abre `confirm()`, ignora se o foco estiver num campo de texto (busca etc.). Testado: confirm dispara com contagem certa, guard funciona digitando na busca.
- [x] **Bônus corrigido testando:** `FavoritesView.vue` e `CampaignDetailView.vue` (esse com listener anônimo, nem dava pra remover) vazavam o listener de teclado — nunca chamavam `removeEventListener` no unmount. Corrigido nos dois.

#### Estado de rede
- [x] Estado "sem conexão" — dois mecanismos complementares: (1) `window.addEventListener('online'/'offline')` no `App.vue`, toast imediato quando o navegador perde/recupera rede; (2) interceptor em `api/client.js` detecta `!err.response` (falha de transporte, não 4xx/5xx) e avisa "Sem conexão com o servidor" — cobre o caso de internet ok mas backend fora do ar, com debounce de 8s pra não empilhar toast a cada request falhando. Testado os dois cenários separadamente (offline real via `context.setOffline()`, backend-down via bloqueio de rota só em `/api/**`).
- [x] Loading skeleton — `src/components/ui/SkeletonGrid.vue` (shimmer animado, respeita tema claro/escuro e `gridSize`), aplicado no `GalleryView` (sessão anterior) e agora também em `DuplicatesView` e `SearchView`, no lugar do spinner genérico. Testado via Playwright interceptando `/api/search` com delay artificial: skeleton aparece durante o carregamento e some ao terminar, nas 3 views. `AnalyticsView` e views de listagem simples (Recentes, Favoritos, CampanhaDetail etc.) não têm loading próprio — derivam de dados já carregados no store, sem janela de espera a cobrir.

---

## Bugs e Inconsistências Identificados (revisão 2026-07-07)

Achados numa auditoria completa doc-vs-código. `RecentesView` já corrigido; os demais seguem pendentes.

- [x] **`RecentesView.vue`** — `openLightbox()` usava `allFiles.value` (variável inexistente) → `ReferenceError` ao clicar em card. Corrigido.
- [x] **`FileLightbox.vue`** — **não era bug real**: navegação por teclado já funcionava (implementada em cada view que usa o componente, não nele mesmo). O único caso genuinamente quebrado era `CollectionDetailView.vue` (view nova, faltou o listener) — corrigido, agora as 6 views têm.
- [x] **`FilterBar.vue`** — campos "Campanha" e "Período" agora funcionam de verdade: `assets.campaignFilter`/`dateFromFilter`/`dateToFilter` (novo estado no store), aplicados em `assets.filtered` (Galeria) e replicados nos computeds locais de Favoritos/Busca/Coleção (CampanhaDetail só aplica período, não campanha — já está dentro de uma campanha específica, filtrar por outra sempre daria vazio). Testado: 50→2 arquivos com filtro de campanha, badge correto, seleção persiste ao reabrir painel, filtro de período também testado.
- [x] **`FilterBar.vue`** — bônus achado testando: painel aberto cobria o próprio botão de trigger com o overlay de click-outside (`z-index` do overlay > botão), impossível fechar clicando de novo nele. Corrigido (`z-index: 81` no botão).
- [x] **`AppTopbar.vue`** — campo de busca dessincronizava de `assets.searchQuery` quando limpo externamente — corrigido com `watch(() => assets.searchQuery, ...)` bidirecional. Testado: digitar → limpar via FilterBar → campo de busca esvazia junto.
- [x] **`AppTopbar.vue`** — fórmula do slider corrigida (`(gridSize-150)/2`, inversa exata de `onSlider`). Testado: gridSize 200→slider 25, slider 80→gridSize 310, ambos batendo com a fórmula.
- [x] Duas fontes divergentes de campanhas/tags — `AppTopbar` agora deriva de `assets.campaignsList` (novo computed no store, mesma fonte que `CampaignsView`) e tags de `assets.items[].tags`, ao vivo, em vez de arrays hardcoded.
- [x] **`auth.js`** — `init()` só desloga em 401/403 real agora, não em qualquer erro (falha de rede transitória não derruba mais a sessão).
- [x] **`auth.js`** — `ROLE_MAP`: role não mapeado agora gera `console.warn` em vez de falhar silenciosamente (só 2 roles existem no backend hoje — `admin`/`user` — mas fica registrado se isso mudar).
- [x] **`ui.js`** — adicionada `setGridSize(size)` action, `AppTopbar` usa em vez de mutar `ui.gridSize` direto.
- [x] **`FileLightbox.vue`** — cores hardcoded revisadas e **mantidas de propósito**: é overlay full-screen sempre escuro por convenção de visualizador de mídia (como qualquer lightbox de fotos), não é bug — mudar pra tema-reativo deixaria inconsistente (viewer escuro + painel claro).
- [x] **`ToastContainer.vue`** — esse sim era inconsistência real (notificação pequena ao lado do resto do app, não overlay imersivo). Criadas variáveis `--toast-*-bg/fg/bd` no `style.css` (valores claros no `:root`, os escuros originais preservados em `html.dark`, zero regressão visual no dark mode). Testado nos dois temas.
- [x] **`SearchView.vue`** — não duplica mais `mapItem`/`EXT_TO_TYPE` de `assets.js`, agora importa direto (dedupe completo, corrigido nesta sessão)
- [x] **`assets.js`** — `fetchAssets`/`loadMore` agora cancelam request anterior via `AbortController` antes de disparar um novo
- [x] Cor de marca `#FF6B00` → `var(--accent)` em 22 arquivos (102 ocorrências), exceto literais de comparação de string (`COLORS` arrays dos color-pickers)
- [x] Vitest (11 testes em `assets.js`) e ESLint (`flat/essential`) configurados no `package.json`, 0 warnings

---

## Bugs corrigidos no Backend (`/home/janailsonf-a/indexador`, dev)

Achados durante o trabalho de 2026-07-07 e corrigidos com autorização explícita (fora do escopo do repo Noxis2, mas necessários pra funcionalidade do frontend funcionar corretamente).

### 1. `PUT /api/files/{id}/metadata` exigia `admin`, deveria aceitar `editor` também
- **Sintoma:** qualquer usuário `editor` (role `user` no backend) que tentasse salvar metadados/tags de um arquivo recebia 403 "Apenas administradores podem executar esta ação" — mesmo o frontend mostrando o botão "Editar" pra esse papel.
- **Causa:** `app/routers/metadata.py` usava `Depends(require_admin)` nesse endpoint.
- **Fix:** criado `require_editor` em `app/auth.py` (aceita `role in ("admin", "user")`), trocado no endpoint. Outros endpoints admin-only (`users.py`) não foram tocados.
- **Verificado:** criei usuário de teste role `user`, confirmei 403→200, confirmei que `PUT` parcial (só `{"tags": [...]}`) preserva `title`/`campaign`/`description` existentes (usuário de teste e dados de teste removidos depois).

### 2. Concorrência: `get_db()` quebrava com requests paralelos no mesmo processo — **corrigido**
- **Sintoma:** `sqlite3.ProgrammingError: SQLite objects created in a thread can only be used in that same thread` → 500. Reproduzido ao disparar vários `PUT /api/files/{id}/metadata` em paralelo (via `Promise.all` no frontend, ao renomear/excluir uma tag usada em vários arquivos).
- **Causa:** `get_db()` (`app/db.py:146-153`) é um generator síncrono; sob FastAPI+anyio, abrir/fechar a conexão pode ser agendado em threads diferentes do pool quando há requests concorrentes — `sqlite3.Connection` exige mesma thread por padrão.
- **Fix aplicado:** `sqlite3.connect(str(DB_PATH), check_same_thread=False)` em `get_db()`. Seguro aqui porque cada request tem sua própria conexão isolada (nunca duas requests compartilham a mesma conexão simultaneamente).
- **Verificado:** 20 requests `PUT` genuinamente concorrentes (thread pool real, não sequencial) contra o backend rodando → 20/20 respostas 200, zero erro no log. Antes do fix, o mesmo teste gerava 500 de forma intermitente.
- **Nota:** `TagsView.vue` manda os `PUT` em lote sequencialmente mesmo assim (não voltei pra `Promise.all`) — mais defensivo, sem custo perceptível pro usuário, e não depende de nenhum outro ponto do backend que ainda não tenha sido testado sob concorrência.

---

## Funcionalidades adicionadas no Backend (`/home/janailsonf-a/indexador`, dev — 2026-07-14, autorizado explicitamente)

### Hash de conteúdo (SHA-256) pra detecção real de duplicatas
- **Motivação:** heurística client-side por nome+tamanho tinha falso-negativo (nomes diferentes, mesmo conteúdo, não detectava) e não cobria o acervo inteiro (só o que já estava carregado no cliente).
- **`app/utils.py`** — `content_hash_of_file()`, SHA-256 streaming (chunk de 1MB), retorna `None` se não conseguir ler.
- **`app/db.py`** — `ensure_content_hash_column()`, migração idempotente (`ALTER TABLE ... ADD COLUMN` guardado por `PRAGMA table_info`, mais índice). Chamada no `lifespan` do `main.py`, no `indexer.py` e no `watcher.py` — se aplica sozinha na primeira vez que qualquer um desses roda.
- **`app/indexer.py`/`app/watcher.py`** — calculam hash só em arquivo novo/alterado (unchanged só recebe "touch", sem reler conteúdo) — custo incremental continua baixo.
- **`scripts/backfill_content_hash.py`** (novo) — script único pra hashear o backlog de arquivos já indexados antes da coluna existir. Rodar com `python -m scripts.backfill_content_hash` (a partir da raiz do repo). Rodado nesta sessão: 1.009.905 arquivos, ~45s, 0 ilegíveis.
- **`GET /api/duplicates`** (novo, `app/routers/api_search.py`) — agrupa por `content_hash` no banco inteiro (`FilesRepository.find_duplicate_hashes`/`files_by_content_hashes`), ignora `size_bytes = 0` (ver achado abaixo) e hash vazio/nulo. Resposta: `{groups: [{content_hash, count, files: [...]}], total_groups, total_files}`.
- **`content_hash` exposto em `/api/search`** também (`SearchResultItem.content_hash`), pra manter os dois endpoints consistentes.
- **Achado testando:** ~1.009.827 dos ~1.009.905 arquivos do corpus de teste (`teste_10m`) são vazios (0 bytes) — todos com o mesmo SHA-256 (hash do vazio), formando um grupo "duplicata" gigante e sem sentido. Filtrado com `size_bytes > 0` na query. Sem esse filtro, o corpus de teste (dados sintéticos) teria mascarado completamente os 2 grupos de duplicata real que existem nele.
- **Verificado:** `/api/duplicates` retorna 2 grupos reais (4 arquivos) no corpus de teste; testado via Playwright na `DuplicatesView.vue` — "Manter primeiro" move o resto pra lixeira, grupo some da lista.

### ⚠️ Achado operacional importante: dois códigos-fonte divergentes servindo a mesma porta 9103
Ao reiniciar o backend dev pra testar essa feature, descobri que o processo que estava rodando na porta 9103 **não era** `/home/janailsonf-a/indexador` (o repo documentado aqui como "backend dev") — era `/opt/indexador/.venv/bin/uvicorn`, uma cópia **divergente** do código (diffs reais em `main.py`, `db.py`, `indexer.py`, `files_repository.py`, `auth.py` etc). O `.env` desse `/opt/indexador` aponta pra `ROOT_DIR=/data/indexados` e `DB_PATH=/app/data/file_index.db` — **caminhos que não existem neste host** — e porta configurada 9102 (produção), não 9103; quem quer que tenha subido aquele processo passou `--port 9103` direto no CLI. Não investiguei a fundo o que aquele processo realmente servia antes de derrubá-lo. Os containers Docker `indexador-api` (9102→9100) e `indexador-worker` são a stack de produção de verdade e **não foram tocados**. Reiniciei a 9103 a partir do `/home/janailsonf-a/indexador` correto (`.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 9103`), que é o que este documento sempre descreveu como backend dev. **Se a porta 9103 comportar estranho de novo, checar `ps aux | grep uvicorn` pra confirmar de qual diretório o processo está rodando antes de assumir.**

---

## Endpoints do Backend Documentados

### Auth (`/api/auth/`)
| Método | Rota | Uso |
|---|---|---|
| POST | `/api/auth/login` | Login → `{access_token, user}` |
| GET | `/api/auth/me` | Usuário logado |
| PUT | `/api/auth/me` | Atualizar nome / trocar senha |

### Arquivos (`/api/`)
| Método | Rota | Uso |
|---|---|---|
| GET | `/api/search` | Busca paginada `?query=&page=&page_size=&order=` |
| GET | `/api/duplicates` | Grupos de arquivos com `content_hash` (SHA-256) idêntico, `?limit_groups=` (novo, 2026-07-14) |
| GET | `/api/files/{id}/metadata` | Metadados de um arquivo |
| PUT | `/api/files/{id}/metadata` | Salvar metadados (requer `editor`+) |
| GET | `/api/files/tags/suggestions` | Lista de tags `?limit=` |
| GET | `/files/{rel_path}` | Servir arquivo |
| GET | `/download?path={rel_path}` | Download com Content-Disposition |
| GET | `/preview/{rel_path}` | Preview (thumbnails) |

### Usuários (`/api/users/`)
| Método | Rota | Uso |
|---|---|---|
| GET | `/api/users` | Listar todos (admin) |
| POST | `/api/users` | Criar usuário (admin) |
| PUT | `/api/users/{id}` | Editar usuário (admin) |
| DELETE | `/api/users/{id}` | Excluir usuário (admin) |

### Sistema
| Método | Rota | Uso |
|---|---|---|
| GET | `/api/activities` | Log de atividades `?limit=` |
| GET | `/api/full-status` | Status completo (disk, CPU, RAM, indexador) |
| GET | `/api/index-status` | Status do indexador |
| GET | `/api/status` | HTML status page |
| GET | `/health` | Healthcheck JSON |

### Endpoints ausentes (precisam ser criados ou adaptados)
- `POST /api/reindex` — disparar reindexação manual
- `GET /api/campaigns` — listar campanhas (hoje derivado do search)
- `GET /api/search/stats` — contagens por tipo para analytics
- `POST /api/download-zip` — download em lote

---

## Estrutura de Dados

### Item normalizado (assets.js → `mapItem`)
```js
{
  id: String,            // String(r.id)
  name: String,          // r.filename
  type: String,          // img|vid|pdf|xls|ppt|doc|aud|unk
  ext: String,           // 'JPG', 'MP4', etc.
  rel_path: String,      // caminho relativo no servidor
  size: String,          // '1.2 MB', '340 KB'
  date: String,          // ISO 8601 normalizado
  campaign: String,
  tags: String[],
  title: String,
  description: String,
  is_official: Boolean,
  preview_link: String,  // /files/...
  download_link: String, // /download?path=...
  thumbnail: String|null,// URL da thumbnail (apenas img)
  starred: Boolean,      // localStorage
  contentHash: String|null, // r.content_hash — SHA-256 do conteúdo, calculado no backend
}
```

### Resposta da API `/api/search`
```json
{
  "results": [...],
  "meta": {
    "total_matches": 1009905,
    "total_pages": 20199,
    "page": 1,
    "page_size": 50
  }
}
```

### Resposta `/api/activities`
```json
[
  {
    "action": "download|preview|metadata_update|login|vacuum",
    "filename": "arquivo.jpg",
    "rel_path": "pasta/arquivo.jpg",
    "created_at": "2026-07-02T10:45:00-03:00"
  }
]
```

---

## Decisões Técnicas

| Decisão | Motivo |
|---|---|
| Vite proxy em vez de CORS | Backend só aceita `localhost:5173`; proxy transparente sem alterar backend |
| localStorage para star/coleções/lixeira | Backend não tem essas entidades — evita criar tabelas desnecessárias |
| `role: user` → `editor` no frontend | Nomenclatura do produto diferente do backend |
| Normalização de datas no store | API retorna `"2026-03-31 10:45"` — normaliza uma vez, usa em toda a app |
| `page_size: 50` fixo | Performance: não sobrecarregar a API com requests grandes |
| FileLightbox carrega metadados on-demand | Não pré-carrega metadados de 50 items ao paginar |
| Player de áudio usa `download_link`, não `preview_link` | Extensões de áudio não estão em `SAFE_INLINE_EXTENSIONS` no backend; `<audio src>` carrega como subrecurso de mídia e ignora `Content-Disposition: attachment`, funciona mesmo assim (testado) |
| PUT de tags/campanha em lote é sequencial, não `Promise.all` | Defensivo mesmo após corrigir o bug de concorrência do backend — sem custo perceptível de UX, não depende de nenhum outro ponto do backend ainda não testado sob paralelismo |
| ZIP em lote é 100% client-side (`jszip`) | Backend não tem endpoint de batch-download; único jeito sem mudar o backend. Sem streaming — seleção muito grande fica tudo em memória antes de gerar o ZIP |
| Duplicatas: só nome+tamanho juntos, não tamanho isolado | Tamanho isolado gerou 47 falsos-positivos por coincidência no corpus de teste — sinal fraco demais sem hash de conteúdo |
| Focus trap só nos 2 modais compartilhados mais novos | Cobertura total exigiria tocar ~6 modais mais antigos e específicos de cada view — mesmo padrão, só não deu tempo nessa sessão |

---

## Convenções de Código

- Nenhum TypeScript — JavaScript puro
- Pinia stores com Composition API (`defineStore(() => { ... })`)
- CSS scoped em todos os components
- Classes `pill-admin`, `pill-ok`, `pill-warn`, `pill-draft`, `pill-user` para badges (globais)
- Classes `btn-primary`, `btn-secondary`, `btn-danger` para botões (globais em `main.css`)
- Variáveis CSS: `--bg`, `--card`, `--elevated`, `--border`, `--text`, `--heading`, `--muted`, `--faint`
