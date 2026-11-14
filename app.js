'use strict';

(function () {
  // ===== Constantes e storage =====
  var STORAGE_KEY = 'checklist.items.v1';
  var MAX_LENGTH = 200;

  function isValidItem(item) {
    return item !== null &&
      typeof item === 'object' &&
      typeof item.id === 'string' && item.id.length > 0 &&
      typeof item.text === 'string' && item.text.length > 0 &&
      typeof item.done === 'boolean' &&
      typeof item.createdAt === 'number' &&
      (item.doneAt === null || typeof item.doneAt === 'number');
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      // Descarta itens malformados em vez de quebrar o app inteiro.
      return data.filter(isValidItem).map(function (item) {
        return {
          id: item.id,
          text: normalize(item.text),
          done: item.done,
          createdAt: item.createdAt,
          doneAt: item.done ? (item.doneAt === null ? item.createdAt : item.doneAt) : null
        };
      }).filter(function (item) { return item.text.length > 0; });
    } catch (err) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      // Storage cheio ou bloqueado (ex.: navegação privada): o app segue funcionando em memória.
    }
  }

  // ===== Utilidades =====
  function normalize(text) {
    return String(text).replace(/\s+/g, ' ').trim().slice(0, MAX_LENGTH);
  }

  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function findItem(id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function commit() {
    save();
    render();
  }

  // ===== Estado e operações =====
  var items = load();

  function addItem(text) {
    var clean = normalize(text);
    if (!clean) return false;
    items.push({ id: newId(), text: clean, done: false, createdAt: Date.now(), doneAt: null });
    commit();
    return true;
  }

  function toggleItem(id) {
    var item = findItem(id);
    if (!item) return;
    item.done = !item.done;
    item.doneAt = item.done ? Date.now() : null;
    commit();
  }

  function editItem(id, text) {
    var item = findItem(id);
    var clean = normalize(text);
    // Texto vazio cancela a edição (não exclui).
    if (item && clean && clean !== item.text) {
      item.text = clean;
      save();
    }
    render();
  }

  function removeItem(id) {
    items = items.filter(function (item) { return item.id !== id; });
    commit();
  }

  function clearDone() {
    items = items.filter(function (item) { return !item.done; });
    commit();
  }

  function sortedItems() {
    var pending = items.filter(function (i) { return !i.done; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; });
    var done = items.filter(function (i) { return i.done; })
      .sort(function (a, b) { return b.doneAt - a.doneAt; });
    return pending.concat(done);
  }

  // ===== Render =====
  var form = document.getElementById('add-form');
  var input = document.getElementById('new-item');
  var list = document.getElementById('list');
  var template = document.getElementById('item-template');
  var counter = document.getElementById('counter');
  var emptyState = document.getElementById('empty-state');
  var clearBtn = document.getElementById('clear-done');

  var editingId = null;

  function render() {
    editingId = null;
    list.textContent = '';

    var sorted = sortedItems();
    var fragment = document.createDocumentFragment();

    sorted.forEach(function (item) {
      var li = template.content.firstElementChild.cloneNode(true);
      li.dataset.id = item.id;
      li.classList.toggle('done', item.done);

      var checkbox = li.querySelector('.item-toggle');
      checkbox.checked = item.done;

      var textEl = li.querySelector('.item-text');
      textEl.textContent = item.text;

      var label = 'Marcar "' + item.text + '" como ' + (item.done ? 'pendente' : 'concluído');
      checkbox.setAttribute('aria-label', label);
      li.querySelector('.item-edit .sr-only').textContent = 'Editar "' + item.text + '"';
      li.querySelector('.item-delete .sr-only').textContent = 'Excluir "' + item.text + '"';

      fragment.appendChild(li);
    });

    list.appendChild(fragment);

    var pendingCount = items.filter(function (i) { return !i.done; }).length;
    var doneCount = items.length - pendingCount;

    counter.textContent = pendingCount === 1 ? '1 pendente' : pendingCount + ' pendentes';
    emptyState.hidden = items.length > 0;
    list.hidden = items.length === 0;
    clearBtn.disabled = doneCount === 0;
  }

  // ===== Edição inline =====
  function startEdit(li) {
    var id = li.dataset.id;
    var item = findItem(id);
    if (!item || editingId) return;
    editingId = id;

    var field = document.createElement('input');
    field.type = 'text';
    field.className = 'edit-input';
    field.maxLength = MAX_LENGTH;
    field.value = item.text;
    field.setAttribute('aria-label', 'Editar item');
    field.setAttribute('enterkeyhint', 'done');

    var finished = false;
    function finish(saveIt) {
      if (finished) return;
      finished = true;
      if (saveIt) {
        editItem(id, field.value);
      } else {
        render();
      }
      var row = list.querySelector('[data-id="' + cssEscape(id) + '"] .item-edit');
      if (row) row.focus();
    }

    field.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        finish(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        finish(false);
      }
    });
    field.addEventListener('blur', function () { finish(true); });

    li.classList.add('editing');
    li.insertBefore(field, li.firstChild);
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  // ===== Eventos =====
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    addItem(input.value);
    // Limpa também quando só havia espaços (item ignorado).
    input.value = '';
    input.focus();
  });

  list.addEventListener('change', function (event) {
    if (!event.target.classList.contains('item-toggle')) return;
    var li = event.target.closest('.item');
    if (li) toggleItem(li.dataset.id);
  });

  list.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-action]');
    if (!button) return;
    var li = button.closest('.item');
    if (!li) return;

    if (button.dataset.action === 'edit') {
      startEdit(li);
    } else if (button.dataset.action === 'delete') {
      var next = li.nextElementSibling || li.previousElementSibling;
      var nextId = next ? next.dataset.id : null;
      removeItem(li.dataset.id);
      // Mantém o foco num lugar previsível para quem navega por teclado.
      var target = nextId && list.querySelector('[data-id="' + cssEscape(nextId) + '"] .item-delete');
      (target || input).focus();
    }
  });

  clearBtn.addEventListener('click', function () {
    var doneCount = items.filter(function (i) { return i.done; }).length;
    if (doneCount === 0) return;
    var msg = doneCount === 1
      ? 'Remover 1 item concluído?'
      : 'Remover ' + doneCount + ' itens concluídos?';
    if (window.confirm(msg)) {
      clearDone();
      input.focus();
    }
  });

  // Sincronização entre abas.
  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    items = load();
    render();
  });

  render();

  // ===== Service worker e aviso de atualização =====
  if ('serviceWorker' in navigator) {
    var updateBanner = document.getElementById('update-banner');
    var updateButton = document.getElementById('update-button');
    var waitingWorker = null;
    var userAccepted = false;

    var showUpdate = function (worker) {
      waitingWorker = worker;
      updateBanner.hidden = false;
      document.body.classList.add('has-update');
    };

    // Acompanha um SW que está instalando; quando termina e já existe um SW
    // controlando a página, é uma atualização (não a primeira instalação).
    var track = function (worker) {
      worker.addEventListener('statechange', function () {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdate(worker);
        }
      });
    };

    var checkForUpdate = function (registration) {
      registration.update().catch(function () { /* offline: tenta na próxima */ });
    };

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
      // updateViaCache 'none': o navegador nunca usa a cópia guardada do sw.js
      // ao procurar versão nova (o Pages manda max-age=600).
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(function (registration) {
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
        // Procura versão nova ao abrir e sempre que o app volta para a tela
        // (um app instalado pode ficar aberto por dias).
        checkForUpdate(registration);
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') checkForUpdate(registration);
        });
      }).catch(function (err) {
        // Sem SW (ex.: file://) o app continua funcionando, só não fica offline.
        console.warn('Service worker não registrado:', err);
      });
    });
  }
})();
