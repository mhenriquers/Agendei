# Tarefas — Agendei

Contexto, regras e especificação estão no `claude.md`.

## T1 — Botão "+" abre o painel "Nova tarefa"

**Objetivo:** a tela inicial perde o campo "O que precisa fazer?" e o botão "Adicionar". No lugar, um botão redondo **"+"** fica fixo no canto inferior direito. Tocar nele abre o painel "Nova tarefa" com texto, urgência e prazo. Especificação completa: seção `Botão "+" e painel "Nova tarefa"` do `claude.md`. Nesta tarefa o botão **ainda não arrasta** (isso é a T2).

**Como vai funcionar:** o painel "Editar tarefa" (`<dialog id="editor">`) passa a ter dois modos, `'new'` e `'edit'`, guardados na variável `editorMode`. Os campos são os mesmos; mudam o título, o texto do botão de confirmar e o que acontece ao confirmar (`addItem` ou `updateItem`).

**Armadilhas que estes passos evitam (não "simplificar" os passos por causa delas):**
- O botão "Cancelar" hoje chama `closeEditor` direto (`addEventListener('click', closeEditor)`). Como `closeEditor` passa a receber um parâmetro, o evento de clique entraria como esse parâmetro. Por isso o ouvinte vira `function () { closeEditor(); }`.
- `required` no texto só pode valer no modo novo. Na edição, texto vazio mantém o texto anterior (regra que já existe), e `required` bloquearia o salvar.
- `required` não pega texto só com espaços. Por isso, se `addItem` devolver `null`, o painel limpa o campo e chama `reportValidity()` para o navegador mostrar o aviso, sem fechar.
- O nome do parâmetro de `closeEditor` é `addedId`, **não** `newId`, porque `newId` já é uma função do `app.js` e ficaria escondida dentro de `closeEditor`.
- A variável `input` (campo antigo) é usada em 8 lugares do `app.js`. Todos são trocados nos passos abaixo. Se sobrar algum, o app quebra ao carregar (`input` não existe mais).

### T1.1 — `index.html`

- [ ] **T1.1.1** Apagar o formulário inteiro de adicionar (6 linhas, dentro de `<main>`, logo depois do aviso "vence hoje"):

  ```html
  <form id="add-form" class="add-form" autocomplete="off">
    <label for="new-item" class="sr-only">Novo item</label>
    <input id="new-item" name="text" type="text" maxlength="200" required placeholder="O que precisa fazer?"
      enterkeyhint="done">
    <button type="submit" class="btn btn-primary">Adicionar</button>
  </form>
  ```

- [ ] **T1.1.2** Trocar o texto do estado vazio. De:

  ```html
  <p id="empty-state" class="empty-state">Nenhum item ainda.</p>
  ```

  para:

  ```html
  <p id="empty-state" class="empty-state">Nenhum item ainda. Toque no + para adicionar.</p>
  ```

- [ ] **T1.1.3** Logo depois de `</main>` e **antes** do comentário `<!-- Bob Esponja dando boas-vindas ... -->`, colar:

  ```html
  <!-- Botão "+": abre o painel Nova tarefa. Dá para arrastar para outro lugar da tela. -->
  <button type="button" id="add-button" class="fab" aria-haspopup="dialog">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 5v14M5 12h14" />
    </svg>
    <span class="sr-only">Nova tarefa</span>
  </button>
  ```

- [ ] **T1.1.4** No `<dialog id="editor">`, no campo de texto, acrescentar o `placeholder`. De:

  ```html
  <input type="text" id="editor-text" maxlength="200" autocomplete="off" enterkeyhint="done">
  ```

  para:

  ```html
  <input type="text" id="editor-text" maxlength="200" autocomplete="off" enterkeyhint="done" placeholder="O que precisa fazer?">
  ```

- [ ] **T1.1.5** No mesmo `<dialog>`, dar um id ao botão de confirmar. De:

  ```html
  <button type="submit" class="btn btn-primary">Salvar</button>
  ```

  (é o que está dentro de `<dialog id="editor">`; o painel Personalizar tem um "Fechar", não confundir) para:

  ```html
  <button type="submit" id="editor-submit" class="btn btn-primary">Salvar</button>
  ```

- [ ] **T1.1.6** **Não** mudar o `<h2 id="editor-title">Editar tarefa</h2>`: o `app.js` troca o texto conforme o modo.
- [ ] **T1.1.7** Conferir: não sobrou nenhum `add-form` nem `new-item` no `index.html` (buscar as duas palavras).

### T1.2 — `styles.css`

- [ ] **T1.2.1** Na seção `/* ===== Formulário ===== */`, apagar o bloco:

  ```css
  .add-form {
    display: flex;
    gap: var(--space-2);
  }
  ```

- [ ] **T1.2.2** Logo abaixo, trocar o seletor duplo `.add-form input,` + `.field input {` por só `.field input {` (o conteúdo do bloco não muda).
- [ ] **T1.2.3** Trocar o bloco:

  ```css
  .add-form input::placeholder {
    color: var(--muted);
  }
  ```

  por:

  ```css
  .field input::placeholder {
    color: var(--muted);
  }
  ```

- [ ] **T1.2.4** Na regra `.app {` (perto da linha 106), no `padding`, trocar a **terceira** linha (a de baixo), de `calc(var(--space-6) + env(safe-area-inset-bottom, 0px))` para:

  ```css
  calc(var(--space-6) + 72px + env(safe-area-inset-bottom, 0px))
  ```

  (72 px = 56 do botão + 16 de distância da borda: a lista rola até acima do "+").

- [ ] **T1.2.5** Colar este bloco **logo antes** do comentário `/* ===== Bob Esponja: boas-vindas ao abrir o app ===== */`:

  ```css
  /* ===== Botão "+" (nova tarefa) ===== */
  /* Fica no canto inferior direito. Depois de arrastado (T2), ganha .is-placed e
     passa a usar left/top definidos no app.js. */
  .fab {
    position: fixed;
    right: calc(var(--space-4) + env(safe-area-inset-right, 0px));
    bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
    z-index: 14;
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    padding: 0;
    background: var(--accent);
    color: var(--accent-contrast);
    border: 0;
    border-radius: 50%;
    box-shadow: 0 6px 16px rgba(61, 52, 49, 0.3);
    cursor: pointer;
    touch-action: none;          /* arrastar o botão não rola a página */
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none; /* segurar o botão não abre o menu do iPhone */
    transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
  }

  .fab:hover {
    background: var(--accent-hover);
  }

  .fab:active {
    transform: scale(0.95);
  }

  .fab svg {
    width: 28px;
    height: 28px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  /* Arrastado para outro lugar (T2): left/top vêm do app.js. */
  .fab.is-placed {
    right: auto;
    bottom: auto;
  }

  /* Durante o arrasto: um pouco maior, sem transição (segue o dedo na hora). */
  .fab.is-dragging {
    cursor: grabbing;
    transform: scale(1.08);
    box-shadow: 0 10px 24px rgba(61, 52, 49, 0.35);
    transition: none;
  }

  /* Com a faixa de atualização aberta, o "+" no canto padrão sobe para ficar acima dela. */
  body.has-update .fab:not(.is-placed) {
    bottom: calc(var(--space-4) + 80px + env(safe-area-inset-bottom, 0px));
  }
  ```

- [ ] **T1.2.6** Na regra `body.has-update .app {` (seção do aviso de atualização), trocar o `padding-bottom` por:

  ```css
  padding-bottom: calc(var(--space-6) + 80px + 72px + env(safe-area-inset-bottom, 0px));
  ```

- [ ] **T1.2.7** Na regra `.update-banner {`, acrescentar `z-index: 16;` (a faixa fica acima do "+" se ele for arrastado para cima dela; o Bob é 15 e o "+" é 14).
- [ ] **T1.2.8** Conferir: não sobrou nenhum `add-form` no `styles.css`.

### T1.3 — `app.js`

- [ ] **T1.3.1** Trocar a função `addItem` inteira (seção `// ===== Estado e operações =====`) por:

  ```js
  // fields: { text, priority, dueDate, dueTime }. Devolve o id do item novo,
  // ou null se o texto ficou vazio (só espaços).
  function addItem(fields) {
    var clean = normalize(fields.text);
    if (!clean) return null;
    var item = {
      id: newId(), text: clean, done: false, createdAt: Date.now(), doneAt: null,
      priority: PRIORITIES.indexOf(fields.priority) >= 0 ? fields.priority : 'normal',
      dueDate: fields.dueDate && DATE_RE.test(fields.dueDate) ? fields.dueDate : null,
      dueTime: null
    };
    item.dueTime = item.dueDate && fields.dueTime && TIME_RE.test(fields.dueTime) ? fields.dueTime : null;
    items.push(item);
    commit();
    return item.id;
  }
  ```

- [ ] **T1.3.2** Na seção `// ===== Render =====`, trocar as duas linhas:

  ```js
  var form = document.getElementById('add-form');
  var input = document.getElementById('new-item');
  ```

  por:

  ```js
  var addButton = document.getElementById('add-button');
  ```

- [ ] **T1.3.3** Trocar o bloco inteiro que começa em `// ===== Painel "Editar tarefa" =====` e vai até o fim do ouvinte de `editorClearDue` (o `});` logo antes de `// ===== Fogos de artifício ao concluir =====`) por:

  ```js
  // ===== Painel de tarefa: "Nova tarefa" (botão +) e "Editar tarefa" (lápis do card) =====
  var editor = document.getElementById('editor');
  var editorForm = document.getElementById('editor-form');
  var editorTitle = document.getElementById('editor-title');
  var editorSubmit = document.getElementById('editor-submit');
  var editorText = document.getElementById('editor-text');
  var editorDate = document.getElementById('editor-date');
  var editorTime = document.getElementById('editor-time');
  var editorClearDue = document.getElementById('editor-clear-due');
  var editorCancel = document.getElementById('editor-cancel');
  var editorMode = null; // null (fechado), 'new' ou 'edit'
  var editingId = null;  // item em edição (só no modo 'edit')

  function fillEditor(text, priority, dueDate, dueTime) {
    editorText.value = text;
    editorForm.querySelectorAll('input[name="editor-priority"]').forEach(function (radio) {
      radio.checked = radio.value === priority;
    });
    editorDate.value = dueDate || '';
    editorTime.value = dueTime || '';
  }

  function showEditor() {
    hideBob();
    if (typeof editor.showModal === 'function') {
      editor.showModal();
    } else {
      editor.setAttribute('open', '');
    }
    editorText.focus();
    editorText.setSelectionRange(editorText.value.length, editorText.value.length);
  }

  function openNewTask() {
    editorMode = 'new';
    editingId = null;
    editorTitle.textContent = 'Nova tarefa';
    editorSubmit.textContent = 'Adicionar';
    editorText.required = true; // texto vazio: o navegador avisa "Preencha este campo"
    fillEditor('', 'normal', null, null);
    showEditor();
  }

  function openEditor(id) {
    var item = findItem(id);
    if (!item) return;
    editorMode = 'edit';
    editingId = id;
    editorTitle.textContent = 'Editar tarefa';
    editorSubmit.textContent = 'Salvar';
    editorText.required = false; // na edição, texto vazio mantém o texto anterior
    fillEditor(item.text, item.priority, item.dueDate, item.dueTime);
    showEditor();
  }

  // addedId: item que acabou de ser adicionado (o card é destacado).
  // O foco volta para quem abriu o painel: o lápis do card ou o botão "+".
  function closeEditor(addedId) {
    var mode = editorMode;
    var id = editingId;
    editorMode = null;
    editingId = null;
    if (editor.open) editor.close();
    if (mode === 'edit') {
      var btn = id && list.querySelector('[data-id="' + cssEscape(id) + '"] .item-edit');
      if (btn) btn.focus();
    } else if (mode === 'new') {
      addButton.focus();
      var li = addedId && list.querySelector('[data-id="' + cssEscape(addedId) + '"]');
      if (li) {
        li.scrollIntoView({ block: 'nearest', behavior: reduceMotion && reduceMotion.matches ? 'auto' : 'smooth' });
        li.classList.remove('flash');
        void li.offsetWidth; // reinicia a animação
        li.classList.add('flash');
      }
    }
  }

  editorForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!editorMode) return;
    var checked = editorForm.querySelector('input[name="editor-priority"]:checked');
    var date = editorDate.value;
    // Hora sem data: vale para hoje.
    if (!date && editorTime.value) date = dateStr(new Date());
    var fields = {
      text: editorText.value,
      priority: checked ? checked.value : 'normal',
      dueDate: date,
      dueTime: editorTime.value
    };
    if (editorMode === 'new') {
      var addedId = addItem(fields);
      if (!addedId) {
        // Só espaços: limpa o campo e mostra o aviso do navegador, sem fechar o painel.
        editorText.value = '';
        editorText.focus();
        editorText.reportValidity();
        return;
      }
      closeEditor(addedId);
    } else {
      updateItem(editingId, fields);
      closeEditor();
    }
  });

  editorCancel.addEventListener('click', function () { closeEditor(); });

  // Esc fecha o <dialog> sozinho; aqui só devolvemos o foco.
  editor.addEventListener('close', function () {
    if (editorMode) closeEditor();
  });

  editorClearDue.addEventListener('click', function () {
    editorDate.value = '';
    editorTime.value = '';
    editorDate.focus();
  });
  ```

  Conferir: `reduceMotion`, `cssEscape` e `hideBob` são declarados **mais abaixo** no arquivo. Não faz mal: só são usados quando o usuário toca em algo, e a essa altura o arquivo inteiro já rodou.

- [ ] **T1.3.4** Na seção `// ===== Eventos =====`, trocar o ouvinte inteiro `form.addEventListener('submit', ...)` (7 linhas, termina em `});`) por:

  ```js
  addButton.addEventListener('click', openNewTask);
  ```

- [ ] **T1.3.5** No ouvinte de clique da lista (excluir), trocar `(target || input).focus();` por:

  ```js
  (target || addButton).focus();
  ```

- [ ] **T1.3.6** No ouvinte de `clearBtn`, trocar `input.focus();` por `addButton.focus();`.
- [ ] **T1.3.7** No ouvinte de `dueBannerClose`, trocar `input.focus();` por `addButton.focus();`.
- [ ] **T1.3.8** Na seção do Bob, trocar o comentário do topo (as 3 linhas que começam em `// Sobe do canto de baixo perguntando`) por:

  ```js
  // Sobe do canto de baixo perguntando "O que faremos hoje?". Tocar nele (ou no balão)
  // abre o painel "Nova tarefa". Sai sozinho depois de BOB_DURATION ou quando um painel abre.
  ```

- [ ] **T1.3.9** Na função `greetSoon`, trocar a linha:

  ```js
  if (document.querySelector('dialog[open]') || document.activeElement === input) return;
  ```

  por:

  ```js
  if (document.querySelector('dialog[open]')) return;
  ```

  e o comentário logo acima da função por `// Não cumprimenta com um painel aberto.`

- [ ] **T1.3.10** Trocar o ouvinte de clique do Bob e a linha seguinte:

  ```js
  bob.addEventListener('click', function () {
    hideBob();
    input.focus();
  });
  input.addEventListener('focus', hideBob);
  ```

  por (o `openNewTask` já esconde o Bob):

  ```js
  bob.addEventListener('click', openNewTask);
  ```

- [ ] **T1.3.11** No `setInterval` do relógio, trocar `if (editingId) return;` por:

  ```js
  if (editorMode) return;
  ```

- [ ] **T1.3.12** Conferir buscando no `app.js`:
  - `input.` e `input)`: não pode sobrar nenhum uso da variável `input` (os `input[name="editor-priority"]` dentro de seletores são outra coisa e ficam);
  - `form.`: só pode aparecer como `editorForm.`;
  - `addItem(`: só a definição e a chamada dentro do `submit` do painel.

### T1.4 — `sw.js`

- [ ] **T1.4.1** Incrementar `CACHE_NAME` (ex.: `checklist-v16` → `checklist-v17`). A lista `ASSETS` não muda (nenhum arquivo novo).

### T1.5 — Testar

Servir com `npx --yes http-server -c-1 -p 8000` e abrir `http://localhost:8000/` (ver "Testar" no `claude.md`).

- [ ] **T1.5.1** Tela inicial: não há campo de texto nem botão "Adicionar" no topo; o "+" coral aparece no canto inferior direito; com a lista vazia, aparece "Nenhum item ainda. Toque no + para adicionar."
- [ ] **T1.5.2** Tocar no "+": abre o painel com o título "Nova tarefa", texto vazio com "O que precisa fazer?" de dica, urgência Normal marcada, data e hora vazias, botão "Adicionar", e o cursor no texto.
- [ ] **T1.5.3** Digitar e apertar Enter: a tarefa entra na lista (urgência Normal, sem prazo), o card pisca em amarelo, o painel fecha e o foco fica no "+".
- [ ] **T1.5.4** Abrir de novo, escolher urgência Alta, uma data de amanhã e uma hora, e tocar em "Adicionar": o card mostra a faixa e a etiqueta "Alta" e a data. Repetir com só a hora (sem data): o prazo vira hoje.
- [ ] **T1.5.5** Texto vazio e "Adicionar": o painel não fecha e o navegador mostra o aviso de campo obrigatório. Só espaços: o mesmo, e o campo fica vazio. Nada entra na lista.
- [ ] **T1.5.6** Esc e "Cancelar": fecham sem adicionar, e o foco volta ao "+". Ao abrir de novo, o painel vem vazio (não guarda o que foi digitado antes).
- [ ] **T1.5.7** Lápis de um card: o painel abre com o título "Editar tarefa", os dados do item e o botão "Salvar"; apagar o texto e salvar mantém o texto anterior (não aparece o aviso de obrigatório); Esc devolve o foco ao lápis.
- [ ] **T1.5.8** Excluir o último item da lista, "Limpar concluídos" e o "×" do aviso "vence hoje": o foco vai para o "+" (sem erro no console).
- [ ] **T1.5.9** Bob: ao abrir o app ele aparece; tocar nele (ou no balão) abre "Nova tarefa" e ele sai. Com o painel aberto, sair e voltar para o app não faz o Bob aparecer.
- [ ] **T1.5.10** A 360 px de largura: o "+" não cobre o Bob nem o balão; rolando até o fim, "Limpar concluídos" fica acima do "+".
- [ ] **T1.5.11** Teclado: Tab chega no "+" (contorno de foco visível) e Enter abre o painel.
- [ ] **T1.5.12** Faixa de atualização aberta (simular com `document.body.classList.add('has-update'); document.getElementById('update-banner').hidden = false` no console): o "+" sobe para cima dela.
- [ ] **T1.5.13** Console sem erros em todos os passos acima.
- [ ] **T1.5.14** Bateria automatizada (Edge pelo DevTools Protocol, fora do repo; ver "Testes automatizados" no `claude.md`): cobrir T1.5.1 a T1.5.12 e rodar de novo as baterias **prazo** e **Bob**, ajustando o que usava o campo `#new-item` (agora: clicar em `#add-button`, preencher `#editor-text` e enviar).

### T1.6 — Documentar e publicar

- [ ] **T1.6.1** No `claude.md`, atualizar o que mudou:
  - "Estrutura": na linha do `index.html`, trocar "lista" por "lista, botão +";
  - "Especificação" item 2: trocar "adicionar item" por "adicionar item (botão + e painel Nova tarefa)";
  - item 3, trocar a regra "Adicionar é só o texto (urgência Normal, sem prazo); urgência e prazo são definidos no painel "Editar tarefa"." por "Adicionar é pelo botão "+", que abre o painel "Nova tarefa" com texto, urgência (Normal por padrão) e prazo (vazio por padrão).";
  - item 3, regra do máximo de 200 caracteres: trocar "(`maxlength` no input + corte no JS)" por "(`maxlength` no campo do painel + corte no JS)";
  - "Urgência e prazo", item "Painel Editar tarefa": acrescentar no fim "O mesmo painel serve para criar tarefa (ver "Botão +")."; e trocar "com o painel de edição aberto, espera" (item "Relógio") por "com o painel de tarefa aberto, espera";
  - "Bob Esponja": trocar "Tocar no Bob ou no balão foca o campo "O que precisa fazer?" e ele sai. Ele também sai sozinho depois de 8 s ou quando o campo ganha foco. Não aparece se houver um painel aberto (`dialog[open]`) ou se o campo estiver com foco" por "Tocar no Bob ou no balão abre o painel "Nova tarefa" e ele sai. Ele também sai sozinho depois de 8 s ou quando um painel de tarefa abre. Não aparece se houver um painel aberto (`dialog[open]`)";
  - seção `Botão "+" e painel "Nova tarefa"`: no título, trocar "(em implementação: tarefas T1 e T2 do `task.md`)" por "(em implementação: tarefa T2 do `task.md`)";
  - "Testes automatizados": acrescentar a bateria **botão + (N)** com o que ela cobre, e na bateria **Bob** trocar "toque leva ao campo, não aparece com painel aberto ou campo em uso" por "toque abre Nova tarefa, não aparece com painel aberto".
- [ ] **T1.6.2** No `README.md`, nada muda (a linha "Adicionar, marcar como feito, editar e excluir itens" continua certa).
- [ ] **T1.6.3** Commit e push: "Botão + abre o painel Nova tarefa". Conferir a publicação como em "Publicação (GitHub Pages)" no `claude.md`.

## T2 — Arrastar o botão "+" para outro lugar

**Objetivo:** a pessoa pode arrastar o "+" (com o dedo ou o mouse) para qualquer lugar da tela, e ele fica lá, inclusive depois de fechar e abrir o app. Tocar sem arrastar continua abrindo "Nova tarefa". Especificação: seção `Botão "+" e painel "Nova tarefa"` do `claude.md` (item "Arrastar").

**Como vai funcionar:** com Pointer Events (o mesmo código serve para dedo, mouse e caneta). No `pointerdown` o botão "captura" o ponteiro (`setPointerCapture`), então continua recebendo os movimentos mesmo se o dedo sair de cima dele. Só depois de mover 8 px vira arrasto: aí o botão ganha `.is-placed` e passa a usar `left`/`top`. No fim do arrasto, a posição do **centro do botão** é salva como fração da tela (0 a 1) no `checklist.settings.v1`, campo `fabPos`, por funções que o `settings.js` expõe em `window.AgendeiSettings`.

**Armadilhas que estes passos evitam (não "simplificar" os passos por causa delas):**
- **Duas chaves de storage só:** a posição vai no `checklist.settings.v1`. Mas quem grava essa chave é o `settings.js`, que regrava o objeto inteiro a cada mudança de fundo/avatar. Se o `app.js` gravasse a chave por conta própria, a próxima mudança de fundo apagaria a posição (o `settings.js` não saberia do campo). Por isso o campo entra no modelo do `settings.js` e o `app.js` só usa `getFabPos`/`setFabPos`.
- **Click depois do arrasto:** ao soltar o dedo, o navegador ainda dispara `click` no botão, e o painel abriria no fim de todo arrasto. A variável `fabDragged` faz o `click` seguinte ser ignorado. Ela volta a `false` no próximo `pointerdown` **e** 400 ms depois de soltar. Sem essa segunda volta, um Enter pelo teclado logo depois de arrastar seria engolido.
- **Fração da tela, não pixels:** guardar `left`/`top` em pixels deixaria o botão fora da tela ao girar o celular ou diminuir a janela. Com fração + limite (`placeFab` nunca deixa sair da tela, margem de 8 px), ele sempre aparece.
- **`touch-action: none`** (já colocado no CSS da T1): sem isso, arrastar o botão no celular rolaria a página em vez de mover o botão.
- **Ordem dos scripts:** `settings.js` vem antes do `app.js` no `index.html` (os dois com `defer`, que respeita a ordem). Por isso o `app.js` já encontra `window.AgendeiSettings` ao carregar. Não mudar a ordem das tags `<script>`.

### T2.1 — `settings.js`

- [ ] **T2.1.1** No objeto `defaults`, acrescentar `fabPos: null` no fim:

  ```js
  var defaults = { bgType: 'default', bgColor: DEFAULT_BG, bgPhoto: null, bgBlur: 0, avatar: null, fabPos: null };
  ```

- [ ] **T2.1.2** Logo depois da função `isImageData`, colar:

  ```js
  // Posição do botão "+": fração da tela (0 a 1).
  function isFraction(value) {
    return typeof value === 'number' && value >= 0 && value <= 1;
  }
  ```

- [ ] **T2.1.3** Em `load()`, logo depois da linha do `avatar` (`if (isImageData(data.avatar) || ...`), colar:

  ```js
      if (data.fabPos && isFraction(data.fabPos.x) && isFraction(data.fabPos.y)) {
        s.fabPos = { x: data.fabPos.x, y: data.fabPos.y };
      }
  ```

- [ ] **T2.1.4** Logo depois da linha `var settings = load();`, colar:

  ```js
  // Usado pelo app.js para lembrar onde a pessoa deixou o botão "+".
  // Grava sem redesenhar o fundo (a posição não muda nada visual aqui).
  window.AgendeiSettings = {
    getFabPos: function () { return settings.fabPos; },
    setFabPos: function (pos) {
      settings.fabPos = pos;
      save();
    }
  };
  ```

  (Usa `settings.fabPos` na hora da chamada, então continua certo depois que o ouvinte de `storage` troca o objeto `settings`.)

- [ ] **T2.1.5** No comentário do topo do arquivo, acrescentar uma linha: " * Também guarda a posição do botão "+" (fabPos), usada pelo app.js."

### T2.2 — `app.js`

- [ ] **T2.2.1** Apagar a linha colocada na T1.3.4:

  ```js
  addButton.addEventListener('click', openNewTask);
  ```

  (o ouvinte de clique passa a ficar junto do código de arrastar, no passo seguinte).

- [ ] **T2.2.2** Colar este bloco **logo antes** do comentário `// ===== Bob Esponja: boas-vindas ao abrir e ao voltar para o app =====`:

  ```js
  // ===== Botão "+" arrastável =====
  // Arrastar (mais de FAB_DRAG_THRESHOLD px) muda o botão de lugar; tocar sem arrastar
  // abre "Nova tarefa". A posição fica no checklist.settings.v1 (campo fabPos, via
  // settings.js) como fração da tela do centro do botão, então se adapta a girar o
  // celular ou mudar o tamanho da janela.
  var FAB_MARGIN = 8;          // distância mínima da borda da tela
  var FAB_DRAG_THRESHOLD = 8;  // px até contar como arrasto (abaixo disso é toque)
  var fabDrag = null;          // arrasto em andamento
  var fabDragged = false;      // o último gesto foi arrasto: ignora o click que vem depois
  var fabDraggedTimer = null;

  // Coloca o botão com o centro em (cx, cy), sem deixar sair da tela.
  function placeFab(cx, cy) {
    var w = addButton.offsetWidth;
    var h = addButton.offsetHeight;
    var left = Math.min(Math.max(cx - w / 2, FAB_MARGIN), window.innerWidth - w - FAB_MARGIN);
    var top = Math.min(Math.max(cy - h / 2, FAB_MARGIN), window.innerHeight - h - FAB_MARGIN);
    addButton.style.left = left + 'px';
    addButton.style.top = top + 'px';
    addButton.classList.add('is-placed');
  }

  // Aplica a posição salva. Sem posição salva, fica no canto padrão do CSS.
  function restoreFab() {
    var pos = window.AgendeiSettings && window.AgendeiSettings.getFabPos();
    if (!pos) return;
    placeFab(pos.x * window.innerWidth, pos.y * window.innerHeight);
  }

  addButton.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return; // só o botão principal do mouse (dedo e caneta também são 0)
    fabDragged = false;
    clearTimeout(fabDraggedTimer);
    var rect = addButton.getBoundingClientRect();
    fabDrag = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      // onde o dedo pegou no botão, para ele não "pular" e centralizar no dedo
      offsetX: event.clientX - (rect.left + rect.width / 2),
      offsetY: event.clientY - (rect.top + rect.height / 2),
      moving: false
    };
    addButton.setPointerCapture(event.pointerId);
  });

  addButton.addEventListener('pointermove', function (event) {
    if (!fabDrag || event.pointerId !== fabDrag.id) return;
    if (!fabDrag.moving) {
      var dist = Math.hypot(event.clientX - fabDrag.startX, event.clientY - fabDrag.startY);
      if (dist < FAB_DRAG_THRESHOLD) return;
      fabDrag.moving = true;
      addButton.classList.add('is-dragging');
    }
    placeFab(event.clientX - fabDrag.offsetX, event.clientY - fabDrag.offsetY);
  });

  function endFabDrag(event) {
    if (!fabDrag || event.pointerId !== fabDrag.id) return;
    var moved = fabDrag.moving;
    fabDrag = null;
    addButton.classList.remove('is-dragging');
    if (!moved) return; // foi toque: o click abre o painel
    fabDragged = true;
    fabDraggedTimer = setTimeout(function () { fabDragged = false; }, 400);
    var rect = addButton.getBoundingClientRect();
    if (window.AgendeiSettings) {
      window.AgendeiSettings.setFabPos({
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight
      });
    }
  }

  addButton.addEventListener('pointerup', endFabDrag);
  addButton.addEventListener('pointercancel', endFabDrag);

  addButton.addEventListener('click', function () {
    if (fabDragged) { // foi arrasto, não toque
      fabDragged = false;
      return;
    }
    openNewTask();
  });

  window.addEventListener('resize', restoreFab);
  restoreFab();
  ```

- [ ] **T2.2.3** Conferir: existe **um** só `addButton.addEventListener('click'` no arquivo (o do bloco acima).

### T2.3 — `sw.js`

- [ ] **T2.3.1** Incrementar `CACHE_NAME` de novo (ex.: `checklist-v17` → `checklist-v18`). `ASSETS` não muda.

### T2.4 — Testar

- [ ] **T2.4.1** No PC, arrastar o "+" com o mouse até o meio da tela: ele segue o ponteiro, fica um pouco maior durante o arrasto e, ao soltar, fica lá; o painel **não** abre.
- [ ] **T2.4.2** Depois de arrastar, clicar no "+" (sem arrastar): abre "Nova tarefa".
- [ ] **T2.4.3** Movimento pequeno (menos de 8 px, um "tremidinho" ao tocar): conta como toque e abre o painel.
- [ ] **T2.4.4** Arrastar para fora da tela (além de cada borda): o botão para a 8 px da borda, inteiro visível.
- [ ] **T2.4.5** Recarregar a página: o "+" volta para onde foi deixado. Conferir no `localStorage` que `checklist.settings.v1` tem `fabPos` com `x` e `y` entre 0 e 1.
- [ ] **T2.4.6** Depois de arrastar, mudar o fundo no painel Personalizar e recarregar: a posição continua lá (o `settings.js` não apagou o `fabPos`).
- [ ] **T2.4.7** Diminuir a janela (ou girar o celular): o botão continua na mesma região proporcional e nunca fica fora da tela.
- [ ] **T2.4.8** No celular (ou emulação de toque do DevTools): arrastar o "+" move o botão e **não** rola a página; segurar o botão não abre menu do sistema.
- [ ] **T2.4.9** Teclado: arrastar com o mouse e, logo em seguida (mais de meio segundo depois), focar o "+" com Tab e apertar Enter: abre o painel.
- [ ] **T2.4.10** `fabPos` inválido no storage (ex.: `{ "x": 5, "y": "a" }`, ou só `fabPos: 1`): o app abre normal, com o "+" no canto padrão.
- [ ] **T2.4.11** Com o "+" arrastado para outro lugar e a faixa de atualização aberta: o "+" não sobe sozinho (só o canto padrão sobe), e se estiver em cima da faixa, a faixa fica por cima e o "Atualizar" continua clicável.
- [ ] **T2.4.12** Console sem erros. Bateria automatizada: arrastar com `Input.dispatchMouseEvent` (pressionar, mover em passos, soltar) e com `Input.dispatchTouchEvent`; cobrir T2.4.1 a T2.4.7, T2.4.10 e T2.4.11.

### T2.5 — Documentar e publicar

- [ ] **T2.5.1** No `claude.md`:
  - "Especificação" item 5 (modelo das preferências): acrescentar `fabPos: { x: 0–1, y: 0–1 } | null` ao objeto;
  - "Estrutura": na linha do `settings.js`, trocar "foto do perfil e plano de fundo" por "foto do perfil, plano de fundo e posição do botão +";
  - seção `Botão "+" e painel "Nova tarefa"`: tirar do título o "(em implementação: ...)";
  - "Testes automatizados": acrescentar à bateria **botão +** o que foi coberto do arrasto;
  - "Cuidados aprendidos": registrar o que for descoberto ao simular o arrasto pelo protocolo (por exemplo, se precisou de `Emulation.setTouchEmulationEnabled` para o toque).
- [ ] **T2.5.2** Regerar `screenshots/wide.png` e `screenshots/narrow.png` (o visual mudou: sem campo no topo, com o "+"), com o mesmo conteúdo das atuais (ver "Capturas de tela" em "Notas técnicas" do `claude.md`).
- [ ] **T2.5.3** Commit e push: "Botão + pode ser arrastado e lembra a posição". Conferir a publicação.
