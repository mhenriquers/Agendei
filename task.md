# Tarefas — Agendei

Contexto, regras e especificação estão no `claude.md`.

## T1 — Aviso de "Nova versão disponível"

**Objetivo:** quando houver uma versão nova publicada, o app aberto mostra uma faixa no rodapé com "Nova versão disponível." e um botão **Atualizar**. Ao tocar, o app recarrega já na versão nova. Sem notificação push (fora do escopo): o aviso só aparece com o app aberto.

**Como vai funcionar:** o service worker novo instala em segundo plano e fica **esperando** (estado `waiting`), em vez de assumir sozinho. O `app.js` percebe que existe um SW esperando e mostra a faixa. O botão manda a mensagem `'SKIP_WAITING'` para o SW, que assume o controle; o `app.js` ouve a troca (`controllerchange`) e recarrega a página.

**Armadilhas que estes passos evitam (não "simplificar" os passos por causa delas):**
- Na **primeira visita** não existe SW antigo. O SW novo assume direto e o `clients.claim()` dispara `controllerchange`. Se o app recarregar sempre nesse evento, a primeira visita recarrega sozinha. Por isso o reload só acontece quando o usuário tocou em **Atualizar** (variável `userAccepted`).
- A faixa só pode aparecer se **já existe** um SW controlando a página (`navigator.serviceWorker.controller`). Sem isso, a primeira instalação mostraria o aviso à toa.
- O GitHub Pages manda `Cache-Control: max-age=600`. Sem `cache: 'reload'`, o SW novo pode guardar no cache uma cópia velha (até 10 min) de `app.js`/`styles.css` vinda do cache HTTP do navegador.
- `registration.update()` falha quando está offline. Sempre com `.catch`.

### T1.1 — `sw.js`

- [ ] **T1.1.1** No evento `install`, trocar o bloco inteiro por este (o `self.skipWaiting()` **sai**; a lista vira `Request` com `cache: 'reload'`):

  ```js
  self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll(ASSETS.map(function (url) {
          return new Request(url, { cache: 'reload' });
        }));
      })
    );
  });
  ```

- [ ] **T1.1.2** Logo depois do bloco `install`, adicionar o ouvinte de mensagem:

  ```js
  // O app manda 'SKIP_WAITING' quando o usuário toca em "Atualizar".
  self.addEventListener('message', function (event) {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
  });
  ```

- [ ] **T1.1.3** **Não mexer** nos eventos `activate` (continua apagando caches antigos e chamando `self.clients.claim()`) e `fetch`.
- [ ] **T1.1.4** Incrementar `CACHE_NAME` (ex.: `checklist-v3` → `checklist-v4`). A lista `ASSETS` não muda: nenhum arquivo novo é criado nesta tarefa.
- [ ] **T1.1.5** No comentário do topo do `sw.js`, acrescentar uma linha: "O SW novo fica em espera até o usuário tocar em Atualizar (ver app.js)."

### T1.2 — `index.html`

- [ ] **T1.2.1** Logo depois de `</main>` e **antes** de `<template id="item-template">`, colar:

  ```html
  <div id="update-banner" class="update-banner" role="status" hidden>
    <span>Nova versão disponível.</span>
    <button type="button" id="update-button" class="btn btn-primary">Atualizar</button>
  </div>
  ```

- [ ] **T1.2.2** Conferir: o atributo `hidden` está presente (a faixa começa escondida) e os ids são exatamente `update-banner` e `update-button`.

### T1.3 — `styles.css`

- [ ] **T1.3.1** Colar este bloco **logo antes** do comentário `/* ===== Acessibilidade ===== */`:

  ```css
  /* ===== Aviso de atualização ===== */
  .update-banner {
    position: fixed;
    left: 50%;
    bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
    transform: translateX(-50%);
    width: calc(100% - 2 * var(--space-4));
    max-width: 528px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  /* Com a faixa visível, abre espaço no fim da página para ela não cobrir "Limpar concluídos". */
  body.has-update .app {
    padding-bottom: calc(var(--space-6) + 80px + env(safe-area-inset-bottom, 0px));
  }
  ```

- [ ] **T1.3.2** **Não** criar regra de `display: none` para a faixa: a regra `[hidden] { display: none !important; }` que já existe no arquivo é que esconde.

### T1.4 — `app.js`

- [ ] **T1.4.1** No fim do arquivo, substituir o bloco inteiro que começa em `// ===== Service worker =====` e vai até o `}` antes de `})();` por este:

  ```js
  // ===== Service worker e aviso de atualização =====
  if ('serviceWorker' in navigator) {
    var updateBanner = document.getElementById('update-banner');
    var updateButton = document.getElementById('update-button');
    var waitingWorker = null;
    var userAccepted = false;

    function showUpdate(worker) {
      waitingWorker = worker;
      updateBanner.hidden = false;
      document.body.classList.add('has-update');
    }

    // Acompanha um SW que está instalando; quando termina e já existe um SW
    // controlando a página, é uma atualização (não a primeira instalação).
    function track(worker) {
      worker.addEventListener('statechange', function () {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdate(worker);
        }
      });
    }

    updateButton.addEventListener('click', function () {
      if (!waitingWorker) return;
      userAccepted = true;
      updateButton.disabled = true;
      waitingWorker.postMessage('SKIP_WAITING');
    });

    // Só recarrega se o usuário pediu. Na primeira visita o clients.claim()
    // também dispara este evento, e aí não pode recarregar.
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!userAccepted) return;
      userAccepted = false;
      window.location.reload();
    });

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').then(function (registration) {
        // Versão nova que já tinha baixado antes e ficou esperando.
        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdate(registration.waiting);
        }
        // Versão nova que está baixando agora.
        if (registration.installing) track(registration.installing);
        // Versão nova encontrada depois.
        registration.addEventListener('updatefound', function () {
          if (registration.installing) track(registration.installing);
        });
        // App instalado pode ficar aberto por dias: verifica ao voltar para a tela.
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') {
            registration.update().catch(function () { /* offline: tenta na próxima */ });
          }
        });
      }).catch(function (err) {
        // Sem SW (ex.: file://) o app continua funcionando, só não fica offline.
        console.warn('Service worker não registrado:', err);
      });
    });
  }
  ```

- [ ] **T1.4.2** Conferir: o arquivo continua terminando com `})();` e não sobrou nenhum `navigator.serviceWorker.register` do bloco antigo (buscar por `register(` deve achar só uma ocorrência).
- [ ] **T1.4.3** Conferir: nenhum texto da faixa é montado com `innerHTML` (o texto fica fixo no HTML).

### T1.5 — Testar localmente (antes de commitar)

Servir pela pasta pai para simular o Pages: em `c:/dev`, rodar `npx --yes http-server -c-1 -p 8000` e abrir `http://localhost:8000/Agendei/`. Manter o DevTools aberto em **Aplicativo → Service workers**.

- [ ] **T1.5.1** **Primeira visita:** em Aplicativo → Armazenamento, clicar em "Limpar dados do site" e recarregar. Esperado: a página carrega **uma vez só** (sem recarregar sozinha), a faixa **não** aparece, e o SW `checklist-v4` fica "ativado e em execução".
- [ ] **T1.5.2** **Simular versão nova:** sem fechar a aba, mudar temporariamente o `<h1>` do `index.html` (ex.: acrescentar " (teste)") e o `CACHE_NAME` para `checklist-v5`. Voltar para a aba e recarregar (F5). Esperado: a página ainda mostra o título antigo, a faixa "Nova versão disponível." aparece, e em Service workers há um SW novo "aguardando ativação".
- [ ] **T1.5.3** **Atualizar:** clicar em **Atualizar**. Esperado: a página recarrega **uma vez**, mostra o título com " (teste)", a faixa some, e só existe um SW ativo (nenhum aguardando). Em **Armazenamento em cache**, existe só `checklist-v5`.
- [ ] **T1.5.4** **Verificação ao voltar para a tela:** mudar o `CACHE_NAME` para `checklist-v6`, ir para outra aba e voltar (sem F5). Esperado: a faixa aparece sozinha em poucos segundos.
- [ ] **T1.5.5** **Offline:** no DevTools, aba Rede → "Offline". Ir para outra aba e voltar. Esperado: o app continua funcionando e o console não mostra erro "Uncaught" vindo do `app.js`.
- [ ] **T1.5.6** **Faixa no celular (360px):** no modo dispositivo do DevTools, com a faixa visível, rolar até o fim: o botão "Limpar concluídos" fica acima da faixa, sem ficar coberto, e não há scroll horizontal. Conferir também no tema escuro.
- [ ] **T1.5.7** **Teclado:** com a faixa visível, chegar ao botão **Atualizar** com Tab (contorno visível) e acionar com Enter.
- [ ] **T1.5.8** **Desfazer o teste:** tirar o " (teste)" do `<h1>` e voltar o `CACHE_NAME` para `checklist-v4`. Conferir com `git diff index.html` que o único trecho mudado no `index.html` é a faixa do T1.2.

### T1.6 — Documentar e publicar

- [ ] **T1.6.1** No `claude.md`, em "Notas técnicas", trocar a nota **Atualização** por: "O SW novo instala em segundo plano e espera. O app mostra a faixa 'Nova versão disponível' e só troca de versão quando o usuário toca em Atualizar. A mudança só é detectada se o `CACHE_NAME` (ou qualquer byte do `sw.js`) mudar."
- [ ] **T1.6.2** No `README.md`, na seção "Atualizar o app depois de publicado", trocar o último parágrafo por: "Na próxima vez que alguém abrir o app (ou voltar para ele), aparece a faixa 'Nova versão disponível'. Tocando em Atualizar, o app recarrega na versão nova."
- [ ] **T1.6.3** Commit com `sw.js`, `index.html`, `styles.css`, `app.js`, `claude.md`, `README.md` e `task.md`, e push na `main`.
- [ ] **T1.6.4** **Transição (só desta vez):** quem já tem o app instalado está com o SW `checklist-v3`, que não conhece a faixa. O `checklist-v4` vai ficar esperando até o app ser **fechado por completo** (no celular, também tirar dos apps recentes) e aberto de novo. Depois disso, as próximas atualizações já mostram a faixa.
- [ ] **T1.6.5** **Teste real:** após o push, abrir https://mhenriquers.github.io/Agendei/ e confirmar no DevTools que o SW ativo é o `checklist-v4`. A primeira atualização publicada depois disso (ex.: o T2) serve de teste de verdade da faixa no PC e no celular.

## Demais tarefas

- [ ] **T2** Ícones com a foto nova: gerar `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` a partir de `icons/icon-2.png`, com o mesmo processo da foto anterior (maskable com a foto em círculo de 80% sobre fundo sólido). Incrementar `CACHE_NAME`.
- [ ] **T3** Corrigir o ID do app: remover a linha `"id": "./"` do `manifest.webmanifest` e incrementar `CACHE_NAME`. Depois, desinstalar e instalar o app de novo no PC e no celular.
- [ ] **T4** (Opcional) Janela de instalação com capturas de tela: gerar 2 PNG em `screenshots/`, um de PC (ex.: 1280×800, `"form_factor": "wide"`) e um de celular (ex.: 390×844, sem `form_factor`). Declarar em `"screenshots"` no manifest com caminhos `./screenshots/...`, incluir na lista `ASSETS` e incrementar `CACHE_NAME`.
- [ ] **T5** Opção para o usuário trocar o ícone do app enviando uma imagem, tratada como no T2 (os três tamanhos). Antes, decidir o que fazer com o limite do PWA descrito no `claude.md`: o ícone instalado não muda depois da instalação.
- [ ] **T6** Opção para trocar o plano de fundo: cor sólida ou foto, com a opção de desfocar a foto.
