# Níveis de Acesso — Noxis 2.0

> Gerado em 2026-07-14 a partir do código-fonte real (router, sidebar, backend) — não é um documento aspiracional, reflete o que está implementado hoje.

## Papéis existentes

O backend só tem 2 roles: `admin` e `user`. O frontend mapeia `user` → **Editor** (ver `ROLE_MAP` em `src/stores/auth.js`).

| Role backend | Nome no frontend | Observação |
|---|---|---|
| `admin` | **Administrador** | Acesso total — todo `requiresEditor` também libera pra ele |
| `user` | **Editor** | Acesso intermediário |
| *(não logado)* | — | Redireciona pra `/login` |

Não existe um terceiro nível "somente leitura" — todo usuário logado (Editor ou Admin) já pode navegar, favoritar, baixar, etc. A diferença entre Editor e Admin é só em **criar/editar/excluir** coisas.

---

## Telas (rotas)

| Tela | Rota | Editor | Admin |
|---|---|:---:|:---:|
| Acervo (Galeria) | `/acervo` | ✅ | ✅ |
| Busca | `/busca` | ✅ | ✅ |
| Campanhas | `/campanhas` | ✅ | ✅ |
| Detalhe da Campanha | `/campanhas/:id` | ✅ | ✅ |
| Coleções | `/colecoes` | ✅ | ✅ |
| Detalhe da Coleção | `/colecoes/:id` | ✅ | ✅ |
| Favoritos | `/favoritos` | ✅ | ✅ |
| Recentes | `/recentes` | ✅ | ✅ |
| Lixeira | `/lixeira` | ✅ | ✅ |
| Tags | `/tags` | ✅ | ✅ |
| Perfil | `/perfil` | ✅ | ✅ |
| **Duplicatas** | `/duplicatas` | ❌ | ✅ |
| **Analytics** | `/analytics` | ❌ | ✅ |
| **Sistema (Status)** | `/status` | ❌ | ✅ |
| **Usuários** | `/usuarios` | ❌ | ✅ |
| **Configurações** | `/configuracoes` | ❌ | ✅ |

Quem tenta acessar uma tela admin-only sem ser admin cai em `/403` (tela "Acesso restrito"), não em erro silencioso.

---

## Ações dentro das telas (visíveis pra todos, mas com botões que só Editor+ vê)

Essas telas são acessíveis por qualquer usuário logado, mas alguns botões de **criar/editar/excluir** só aparecem pra Editor ou Admin:

| Tela | Ação restrita | Quem vê |
|---|---|---|
| Acervo | Botão "Mover para lixeira" no card do arquivo | Editor+ |
| Acervo (seleção em lote) | "Vincular campanha" / "Mover pra lixeira" na barra de ações | Editor+ |
| Campanhas | "Nova Campanha" | Editor+ |
| Detalhe da Campanha | Botão "Editar" da campanha | Editor+ |
| Coleções | "Nova Coleção" / excluir coleção | Editor+ |
| Detalhe da Coleção | Ações extras (editar/remover arquivos) | Editor+ |
| Visualizador de arquivo (Lightbox) | Botão "Editar metadados" | Editor+ |
| Lixeira | "Esvaziar lixeira" | **Admin only** |
| Lixeira | "Apagar para sempre" (por arquivo) | **Admin only** |

Tags: qualquer usuário logado pode criar/renomear/excluir tags (a tela inteira já é `requiresEditor`, então um Editor comum tem acesso completo lá dentro).

---

## Backend (`/home/janailsonf-a/indexador`) — quem pode chamar o quê

A maioria dos endpoints só exige estar logado (`get_current_user`). Só dois grupos são restritos:

| Endpoint | Restrição | Quem pode |
|---|---|---|
| `PUT /api/files/{id}/metadata` | `require_editor` | Editor+ |
| `GET /api/users` (listar) | `require_admin` | **Admin only** |
| `POST /api/users` (criar usuário) | `require_admin` | **Admin only** |
| `PUT /api/users/{id}` (editar usuário) | `require_admin` | **Admin only** |
| `DELETE /api/users/{id}` | `require_admin` | **Admin only** |
| `PUT /api/auth/me` (editar o próprio perfil/senha) | `get_current_user` | Qualquer logado (só o próprio) |
| Todo o resto (`/api/search`, `/api/files/{id}/metadata` GET, `/api/duplicates`, `/api/activities`, `/api/full-status` etc.) | `get_current_user` | Qualquer logado |

---

## Funcionalidades só-frontend (localStorage, não passam pelo backend)

Favoritar, lixeira (soft-delete), coleções e metadados de campanha (`campaignMeta`) são simulados via `localStorage` — não têm restrição de role no backend porque o backend nem sabe que existem. A única barreira nesses casos é o `v-if` no frontend (tabela acima).

---

## Resumo rápido

- **Editor**: usa o sistema no dia a dia — sobe, organiza, edita metadados, cria campanhas/coleções/tags, manda pra lixeira.
- **Admin**: tudo que Editor faz, **mais**: gerenciar usuários, ver Analytics/Status do sistema, achar duplicatas, configurações globais, esvaziar lixeira / apagar de vez.
