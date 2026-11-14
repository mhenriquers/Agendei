# Plano de confecção — PWA Checklist (Agendei)

Fonte: `claude.md`. O `contexto-pwa-checklist.docx` citado lá não existe; tudo que ele cobriria foi decidido abaixo em "Decisões do projeto" e vale como especificação.

## Decisões travadas (vindas do claude.md)

- HTML, CSS e JS puros. Sem build, sem npm, sem framework.
- Publicação no GitHub Pages (`usuario.github.io/<repo>/`).
- **Todos os caminhos relativos** (`./`), incluindo `start_url`, `scope`, `<link>`, `<script>`, registro do SW e lista de cache do SW. Nenhum caminho começando com `/`.
- Ícones como **PNG reais** na pasta `icons/` (nada de data URI).
- Persistência em `localStorage` com a chave **`checklist.items.v1`**.
- Fora do escopo: login, backend, notificações, múltiplas listas.
- Teste local sempre via HTTP (`npx --yes http-server -c-1 -p 8000`; o Node já está instalado, e o npx serve só para testar, nada entra no repo), nunca `file://`.

## Árvore de arquivos alvo

```
/
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
├── sw.js
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
├── .nojekyll
└── README.md
```

## Decisões do projeto

1. **Nome do repo / app**: `Agendei`. `start_url: "./"` e `scope: "./"`, então o manifest funciona com qualquer nome de repo.
2. **Funcionalidades**: adicionar item, marcar/desmarcar como feito, editar texto, excluir item, limpar concluídos, contador de pendentes, estado vazio. Uma única lista.
3. **Regras de negócio**:
   - Texto obrigatório após `trim()`; espaços internos repetidos viram um só.
   - Máximo de 200 caracteres (`maxlength` no input + corte no JS).
   - Itens duplicados são permitidos.
   - Ordem: pendentes primeiro (mais novos no topo), concluídos depois (mais recentemente concluídos no topo).
   - Excluir um item é direto, sem confirmação. "Limpar concluídos" pede `confirm()` porque apaga vários.
   - Editar para texto vazio cancela a edição (não exclui).
4. **Modelo do item**: `{ id: string, text: string, done: boolean, createdAt: number, doneAt: number | null }`. No storage, salvo como array JSON em `checklist.items.v1`.
5. **Idioma**: português (pt-BR).
6. **Visual**: fonte de sistema, cor de destaque verde-azulada `#0f766e`, fundo claro `#f8fafc` / escuro `#0f172a`. Esse mesmo verde é o `theme_color` do manifest e a cor do ícone (um "✓" branco sobre o verde).

---

# Parte 1 — Tarefas macro

| # | Macro | Entrega | Depende de |
|---|-------|---------|------------|
| M0 | Preparação do repositório | Estrutura de pastas, `.nojekyll`, `.gitignore`, CLAUDE.md atualizado | — |
| M1 | Estrutura HTML | `index.html` com todos os elementos e ligações | M0 |
| M2 | Estilo | `styles.css` completo, responsivo, acessível | M1 |
| M3 | Lógica do app | `app.js` com estado, render, eventos e persistência | M1 |
| M4 | Camada PWA | `manifest.webmanifest`, `sw.js`, ícones PNG, registro do SW | M1, M3 |
| M5 | Revisão de caminhos e integração | Auditoria de caminhos relativos e consistência entre index/app/sw | M1–M4 |
| M6 | Testes locais e critérios de aceite | Checklist de aceite verificado via HTTP local | M5 |
| M7 | Publicação no GitHub Pages | App no ar, instalável e funcionando offline | M6 |

Ordem de execução: M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 (M2 e M3 podem ser feitas em qualquer ordem entre si).

---

# Parte 2 — Tarefas detalhadas

Cada subtarefa é pensada para ser resolvida de uma vez, mas sempre olhando o trio `index.html` / `app.js` / `sw.js` como um conjunto.

## M0 — Preparação do repositório

- [x] **M0.1** Fechar as decisões do projeto (seção "Decisões do projeto" acima).
- [x] **M0.2** Criar as pastas `icons/` e arquivos vazios da árvore alvo.
- [x] **M0.3** Criar `.nojekyll` (vazio) para o Pages não processar o site com Jekyll.
- [x] **M0.4** Criar `.gitignore` mínimo (`.DS_Store`, `Thumbs.db`, `.vscode/`).
- [x] **M0.5** Reescrever `claude.md` como instruções de projeto de verdade (hoje é um trecho de conversa): decisões travadas + decisões do projeto + "siga o task.md e marque as subtarefas concluídas".
- **Verificar:** `ls` bate com a árvore alvo.

## M1 — `index.html`

- [x] **M1.1** Esqueleto: `<!doctype html>`, `lang="pt-BR"`, `charset`, `viewport`, `<title>`, `meta description`.
- [x] **M1.2** Metas PWA: `<link rel="manifest" href="./manifest.webmanifest">`, `theme-color`, `apple-touch-icon` → `./icons/icon-192.png`, `apple-mobile-web-app-capable`.
- [x] **M1.3** Ligações: `<link rel="stylesheet" href="./styles.css">` e `<script src="./app.js" defer>`.
- [x] **M1.4** Cabeçalho: título do app + contador de pendentes (`#counter`, `aria-live="polite"`).
- [x] **M1.5** Formulário de adição: `<form id="add-form">` com `<label>` (visualmente oculto), `<input id="new-item" maxlength="200" required>` e botão “Adicionar”.
- [x] **M1.6** Lista: `<ul id="list">` vazia + `<template id="item-template">` com checkbox, texto, botão editar e botão excluir.
- [x] **M1.7** Estado vazio: `<p id="empty-state">` (“Nenhum item ainda”).
- [x] **M1.8** Rodapé de ações: botão “Limpar concluídos” (`#clear-done`).
- [x] **M1.9** `<noscript>` com aviso.
- **Verificar:** validar no https://validator.w3.org (colar o código) e conferir que nenhum `href`/`src` começa com `/`.

## M2 — `styles.css`

- [x] **M2.1** Tokens em `:root` (cores, espaçamentos, raio, fonte de sistema) + variante `@media (prefers-color-scheme: dark)`.
- [x] **M2.2** Reset leve e base (`box-sizing`, `body` com fundo explícito, fonte, `min-height: 100dvh`).
- [x] **M2.3** Layout: coluna central `max-width: 560px`, gutter de 16px, safe-area (`env(safe-area-inset-*)`) para modo standalone.
- [x] **M2.4** Formulário: input e botão com alvo de toque ≥ 44px.
- [x] **M2.5** Itens da lista: linha com checkbox, texto que quebra linha, ações à direita; estado `.done` riscado e esmaecido.
- [x] **M2.6** Estado vazio, contador e botão “Limpar concluídos” (estado desabilitado).
- [x] **M2.7** Acessibilidade: `:focus-visible` evidente, classe `.sr-only`, contraste AA, `prefers-reduced-motion`.
- **Verificar:** abrir em 360px de largura (DevTools) sem scroll horizontal; checar tema claro e escuro.

## M3 — `app.js`

- [x] **M3.1** Constantes e storage: `STORAGE_KEY = 'checklist.items.v1'`, `load()` com `try/catch` + validação do formato (se inválido, retorna `[]`), `save(items)` com `try/catch`.
- [x] **M3.2** Estado e operações puras: `addItem(text)`, `toggleItem(id)`, `editItem(id, text)`, `removeItem(id)`, `clearDone()`. Cada uma valida, altera o estado, chama `save()` e `render()`.
- [x] **M3.3** Geração de id: `crypto.randomUUID()` com fallback (`Date.now()` + `Math.random()`).
- [x] **M3.4** `render()`: limpa `#list`, clona o template por item, usa **`textContent`** (nunca `innerHTML` com texto do usuário), atualiza contador, estado vazio e `disabled` de “Limpar concluídos”.
- [x] **M3.5** Eventos: submit do formulário (trim, ignora vazio, limpa e refoca o input); delegação de eventos na `<ul>` para checkbox, editar e excluir.
- [x] **M3.6** Edição inline: ao clicar em editar, troca o texto por input; Enter salva, Esc cancela, blur salva; texto vazio = cancela.
- [x] **M3.7** Ordenação no `render()`: pendentes por `createdAt` desc, depois concluídos por `doneAt` desc. Exclusão direta; `clearDone()` só roda após `confirm()`.
- [x] **M3.8** Sincronização entre abas: ouvir o evento `storage` da mesma chave e re-renderizar.
- [x] **M3.9** Registro do SW no final: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js')` dentro do `load` da janela.
- **Verificar:** via HTTP local, adicionar/marcar/editar/excluir, recarregar a página e ver que tudo persiste; corromper a chave no DevTools e ver que o app não quebra.

## M4 — Camada PWA

- [x] **M4.1** Gerar ícones PNG (192, 512 e 512 maskable com área segura de 80%). Usar um script PowerShell temporário com System.Drawing (já vem no Windows), guardado fora do repo. Só os PNG entram no repo. — Maskable refeito: foto em círculo de 80% (área segura) sobre fundo #c0c0c0.
- [x] **M4.2** `manifest.webmanifest`: `name`, `short_name`, `description`, `lang: "pt-BR"`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `background_color`, `theme_color` (iguais ao CSS), `icons` com caminhos `./icons/...` e `purpose` (`any` / `maskable`).
- [x] **M4.3** `sw.js` — instalação: `CACHE_NAME = 'checklist-v1'`, lista `ASSETS` com caminhos relativos (`./`, `./index.html`, `./styles.css`, `./app.js`, `./manifest.webmanifest`, `./icons/*.png`), `cache.addAll` e `self.skipWaiting()`.
- [x] **M4.4** `sw.js` — ativação: apagar caches com nome diferente de `CACHE_NAME` e `clients.claim()`.
- [x] **M4.5** `sw.js` — fetch: só `GET` da mesma origem; estratégia cache-first com fallback para rede; navegação offline cai em `./index.html`.
- [x] **M4.6** Documentar no topo do `sw.js`: “ao mudar qualquer arquivo, incrementar `CACHE_NAME`”.
- **Verificar:** DevTools → Application → Manifest sem erros, ícones carregam; Service Workers mostra “activated”; Cache Storage contém todos os arquivos.

## M5 — Revisão de caminhos e integração

- [x] **M5.1** Buscar `href="/`, `src="/`, `'/` e `"/` em todos os arquivos — não pode haver caminho absoluto.
- [x] **M5.2** Conferir que cada arquivo da lista `ASSETS` do SW existe com o nome exato (maiúsculas/minúsculas importam no Pages).
- [x] **M5.3** Conferir que `theme_color`/`background_color` do manifest batem com o `meta theme-color` e com o CSS.
- [x] **M5.4** Conferir que o SW está na raiz (escopo cobre o app inteiro).
- [x] **M5.5** Simular subpasta: servir a pasta *pai* (`npx --yes http-server -c-1 -p 8000` rodando em `c:/dev`) e abrir `http://localhost:8000/Agendei/` — tudo precisa funcionar igual ao Pages.
- **Verificar:** zero 404 na aba Network nos dois cenários (raiz e subpasta).

## M6 — Testes locais e critérios de aceite

- [x] **M6.1** Escrever `README.md`: o que é, como rodar local (`npx --yes http-server -c-1 -p 8000`, `python -m http.server 8000` ou Live Server), aviso sobre `file://`, como publicar, como atualizar a versão do cache.
- [ ] **M6.2** Rodar os critérios de aceite:
  - [x] Adicionar item com texto válido aparece na lista; texto vazio/espaços é ignorado.
  - [x] Marcar/desmarcar alterna o estado visual e o contador.
  - [x] Editar e excluir funcionam; “Limpar concluídos” remove só os feitos.
  - [x] Recarregar mantém os dados (`checklist.items.v1` no localStorage).
  - [x] Dado corrompido no storage não quebra o app.
  - [x] DevTools → Network “Offline” + recarregar: app abre e funciona.
  - [~] Lighthouse (PWA/instalabilidade) sem erros; app instalável no Chrome. — Verificado via DevTools Protocol no Edge: manifest sem erros e zero erros de instalabilidade. Falta rodar o Lighthouse e instalar de fato (manual).
  - [~] Navegação só por teclado funciona; foco visível. — Elementos nativos + `:focus-visible` + foco gerenciado ao editar/excluir; falta conferir à mão com Tab.
  - [x] 360px de largura sem scroll horizontal; tema escuro legível.
- [x] **M6.3** Corrigir o que falhar e repetir M6.2. — 27/27 testes automatizados passando (Edge headless, servido em subpasta `/Agendei/`).

## M7 — Publicação no GitHub Pages

- [x] **M7.1** Commit dos arquivos (mensagem clara) na `main`.
- [x] **M7.2** O remote `origin` já aponta para `github.com/mhenriquers/Agendei` (repo vazio). Fazer `git push` — **pede confirmação do usuário antes**.
- [x] **M7.3** Settings → Pages → Source: “Deploy from a branch”, branch `main`, pasta `/ (root)`. — Estava como "GitHub Actions" sem workflow (404); trocado via `gh api` em 2026-11-14.
- [ ] **M7.4** Abrir `https://<usuario>.github.io/<repo>/` e repetir os itens de PWA do M6.2 (instalar, offline, Lighthouse).
- [ ] **M7.5** Testar instalação no celular (Android/Chrome e iOS/Safari “Adicionar à Tela de Início”).
- [ ] **M7.6** Atualizar o README com a URL pública.
