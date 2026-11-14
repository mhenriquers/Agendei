'use strict';

(function () {
  // ===== Constantes e storage =====
  var STORAGE_KEY = 'checklist.items.v1';
  var MAX_LENGTH = 200;
  var PRIORITIES = ['low', 'normal', 'high'];
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var TIME_RE = /^\d{2}:\d{2}$/;

  function isValidItem(item) {
    return item !== null &&
      typeof item === 'object' &&
      typeof item.id === 'string' && item.id.length > 0 &&
      typeof item.text === 'string' && item.text.length > 0 &&
      typeof item.done === 'boolean' &&
      typeof item.createdAt === 'number' &&
      (item.doneAt === null || typeof item.doneAt === 'number');
  }

  // Normaliza um item já validado. Itens antigos (sem urgência/prazo) ganham
  // urgência "normal" e prazo vazio; valores inválidos também viram o padrão.
  function cleanItem(item) {
    var dueDate = typeof item.dueDate === 'string' && DATE_RE.test(item.dueDate) ? item.dueDate : null;
    var dueTime = dueDate && typeof item.dueTime === 'string' && TIME_RE.test(item.dueTime) ? item.dueTime : null;
    return {
      id: item.id,
      text: normalize(item.text),
      done: item.done,
      createdAt: item.createdAt,
      doneAt: item.done ? (item.doneAt === null ? item.createdAt : item.doneAt) : null,
      priority: PRIORITIES.indexOf(item.priority) >= 0 ? item.priority : 'normal',
      dueDate: dueDate,
      dueTime: dueTime
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      // Descarta itens malformados em vez de quebrar o app inteiro.
      return data.filter(isValidItem).map(cleanItem)
        .filter(function (item) { return item.text.length > 0; });
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

  // ===== Datas (sempre no fuso do aparelho) =====
  var WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function dateStr(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseDate(str) {
    var p = str.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  // Momento do prazo. Sem hora, vale até o fim do dia.
  function dueMoment(item) {
    var d = parseDate(item.dueDate);
    var t = (item.dueTime || '23:59').split(':');
    d.setHours(Number(t[0]), Number(t[1]), 59, 999);
    return d.getTime();
  }

  // 'none' | 'late' | 'today' | 'future'
  function dueState(item, now) {
    if (!item.dueDate) return 'none';
    var today = dateStr(now);
    if (item.dueDate < today) return 'late';
    if (item.dueDate > today) return 'future';
    return item.dueTime && now.getTime() > dueMoment(item) ? 'late' : 'today';
  }

  // "Sex, 21/11" (com o ano quando não é o ano atual).
  function formatDate(str, now) {
    var d = parseDate(str);
    var text = WEEKDAYS[d.getDay()] + ', ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
    if (d.getFullYear() !== now.getFullYear()) text += '/' + d.getFullYear();
    return text;
  }

  // Texto da etiqueta de prazo: no dia, só a hora; em outro dia, só a data.
  function dueLabel(item, state, now) {
    if (state === 'today') return item.dueTime || 'Hoje';
    if (state === 'late') {
      var when = item.dueDate === dateStr(now) ? item.dueTime : formatDate(item.dueDate, now);
      return 'Atrasada · ' + when;
    }
    return formatDate(item.dueDate, now);
  }

  // No dia do prazo (ou depois de vencido) a tarefa pendente vira Alta.
  // A urgência escolhida (item.priority) não é alterada.
  function effectivePriority(item, now) {
    if (!item.done) {
      var state = dueState(item, now);
      if (state === 'late' || state === 'today') return 'high';
    }
    return item.priority;
  }

  function isDueToday(item, now) {
    return !item.done && item.dueDate === dateStr(now);
  }

  // ===== Estado e operações =====
  var items = load();

  function addItem(text) {
    var clean = normalize(text);
    if (!clean) return false;
    items.push({
      id: newId(), text: clean, done: false, createdAt: Date.now(), doneAt: null,
      priority: 'normal', dueDate: null, dueTime: null
    });
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

  // changes: { text, priority, dueDate, dueTime }. Texto vazio mantém o texto atual.
  function updateItem(id, changes) {
    var item = findItem(id);
    if (!item) return;
    var clean = normalize(changes.text);
    if (clean) item.text = clean;
    if (PRIORITIES.indexOf(changes.priority) >= 0) item.priority = changes.priority;
    item.dueDate = changes.dueDate && DATE_RE.test(changes.dueDate) ? changes.dueDate : null;
    item.dueTime = item.dueDate && changes.dueTime && TIME_RE.test(changes.dueTime) ? changes.dueTime : null;
    commit();
  }

  function removeItem(id) {
    items = items.filter(function (item) { return item.id !== id; });
    commit();
  }

  function clearDone() {
    items = items.filter(function (item) { return !item.done; });
    commit();
  }

  var RANK = { high: 0, normal: 1, low: 2 };

  // Pendentes: urgência efetiva (Alta → Normal → Baixa), depois prazo mais
  // próximo (atrasadas primeiro, sem prazo por último), depois o mais novo.
  // Concluídos embaixo, mais recentemente concluídos primeiro.
  function sortedItems(now) {
    var pending = items.filter(function (i) { return !i.done; })
      .sort(function (a, b) {
        var r = RANK[effectivePriority(a, now)] - RANK[effectivePriority(b, now)];
        if (r !== 0) return r;
        var da = a.dueDate ? dueMoment(a) : Infinity;
        var db = b.dueDate ? dueMoment(b) : Infinity;
        if (da !== db) return da < db ? -1 : 1;
        return b.createdAt - a.createdAt;
      });
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
  var dueBanner = document.getElementById('due-banner');
  var dueBannerOpen = document.getElementById('due-banner-open');
  var dueBannerText = document.getElementById('due-banner-text');
  var dueBannerClose = document.getElementById('due-banner-close');

  // Item que acabou de ser concluído: ganha a classe .just-done (pulo do check) no próximo render.
  var justDoneId = null;
  // O usuário fechou o aviso "vence hoje": some até o app abrir ou voltar para a tela.
  var dueDismissed = false;
  // Resumo do que depende do relógio; quando muda, a lista é redesenhada.
  var lastClockSignature = '';

  function makeTag(className, text, srPrefix) {
    var tag = document.createElement('span');
    tag.className = 'tag ' + className;
    if (srPrefix) {
      var sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = srPrefix;
      tag.appendChild(sr);
    }
    tag.appendChild(document.createTextNode(text));
    return tag;
  }

  function clockSignature(now) {
    return dateStr(now) + '|' + items.map(function (i) {
      return i.id + ':' + (i.done ? 'd' : dueState(i, now));
    }).join(',');
  }

  // Guarda qual controle de qual item tinha o foco, para devolvê-lo depois do render.
  function focusedControl() {
    var el = document.activeElement;
    if (!el || !list.contains(el)) return null;
    var li = el.closest('.item');
    var kind = ['item-toggle', 'item-edit', 'item-delete'].filter(function (c) { return el.classList.contains(c); })[0];
    return li && kind ? { id: li.dataset.id, kind: kind } : null;
  }

  function render() {
    var now = new Date();
    var popId = justDoneId;
    justDoneId = null;
    var keepFocus = focusedControl();
    list.textContent = '';

    var fragment = document.createDocumentFragment();

    sortedItems(now).forEach(function (item) {
      var li = template.content.firstElementChild.cloneNode(true);
      li.dataset.id = item.id;
      li.classList.toggle('done', item.done);
      if (item.id === popId) li.classList.add('just-done');

      var effective = effectivePriority(item, now);
      if (effective !== 'normal') li.classList.add('prio-' + effective);

      var checkbox = li.querySelector('.item-toggle');
      checkbox.checked = item.done;

      li.querySelector('.item-text').textContent = item.text;

      // Etiquetas: urgência escolhida (Alta/Baixa) e prazo.
      var meta = li.querySelector('.item-meta');
      if (item.priority === 'high') meta.appendChild(makeTag('tag-high', 'Alta', 'Urgência: '));
      if (item.priority === 'low') meta.appendChild(makeTag('tag-low', 'Baixa', 'Urgência: '));
      if (item.dueDate) {
        var state = dueState(item, now);
        var cls = item.done ? 'tag-due' : (state === 'late' ? 'tag-late' : state === 'today' ? 'tag-today' : 'tag-due');
        meta.appendChild(makeTag(cls, dueLabel(item, state, now), 'Prazo: '));
      }
      meta.hidden = meta.childNodes.length === 0;

      var label = 'Marcar "' + item.text + '" como ' + (item.done ? 'pendente' : 'concluído');
      checkbox.setAttribute('aria-label', label);
      li.querySelector('.item-edit .sr-only').textContent = 'Editar "' + item.text + '"';
      li.querySelector('.item-delete .sr-only').textContent = 'Excluir "' + item.text + '"';

      fragment.appendChild(li);
    });

    list.appendChild(fragment);

    if (keepFocus) {
      var again = list.querySelector('[data-id="' + cssEscape(keepFocus.id) + '"] .' + keepFocus.kind);
      if (again) again.focus();
    }

    var pendingCount = items.filter(function (i) { return !i.done; }).length;
    var doneCount = items.length - pendingCount;

    counter.textContent = pendingCount === 1 ? '1 pendente' : pendingCount + ' pendentes';
    emptyState.hidden = items.length > 0;
    list.hidden = items.length === 0;
    clearBtn.disabled = doneCount === 0;

    // Aviso "vence hoje": só tarefas pendentes com prazo para hoje.
    var todayCount = items.filter(function (i) { return isDueToday(i, now); }).length;
    dueBannerText.textContent = todayCount === 1 ? '1 tarefa vence hoje' : todayCount + ' tarefas vencem hoje';
    dueBanner.hidden = todayCount === 0 || dueDismissed;

    lastClockSignature = clockSignature(now);
  }

  // ===== Painel "Editar tarefa" =====
  var editor = document.getElementById('editor');
  var editorForm = document.getElementById('editor-form');
  var editorText = document.getElementById('editor-text');
  var editorDate = document.getElementById('editor-date');
  var editorTime = document.getElementById('editor-time');
  var editorClearDue = document.getElementById('editor-clear-due');
  var editorCancel = document.getElementById('editor-cancel');
  var editingId = null;

  function openEditor(id) {
    var item = findItem(id);
    if (!item) return;
    editingId = id;
    editorText.value = item.text;
    editorForm.querySelectorAll('input[name="editor-priority"]').forEach(function (radio) {
      radio.checked = radio.value === item.priority;
    });
    editorDate.value = item.dueDate || '';
    editorTime.value = item.dueTime || '';
    if (typeof editor.showModal === 'function') {
      editor.showModal();
    } else {
      editor.setAttribute('open', '');
    }
    editorText.focus();
    editorText.setSelectionRange(editorText.value.length, editorText.value.length);
  }

  function closeEditor() {
    var id = editingId;
    editingId = null;
    if (editor.open) editor.close();
    var btn = id && list.querySelector('[data-id="' + cssEscape(id) + '"] .item-edit');
    if (btn) btn.focus();
  }

  editorForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!editingId) return;
    var checked = editorForm.querySelector('input[name="editor-priority"]:checked');
    var date = editorDate.value;
    // Hora sem data: vale para hoje.
    if (!date && editorTime.value) date = dateStr(new Date());
    updateItem(editingId, {
      text: editorText.value,
      priority: checked ? checked.value : 'normal',
      dueDate: date,
      dueTime: editorTime.value
    });
    closeEditor();
  });

  editorCancel.addEventListener('click', closeEditor);

  // Esc fecha o <dialog> sozinho; aqui só devolvemos o foco.
  editor.addEventListener('close', function () {
    if (editingId) closeEditor();
  });

  editorClearDue.addEventListener('click', function () {
    editorDate.value = '';
    editorTime.value = '';
    editorDate.focus();
  });

  // ===== Fogos de artifício ao concluir =====
  // Três explosões pequenas (raio próximo ao tamanho da caixa de check), em
  // sequência, saindo do ponto onde o check estava. Posição fixa na tela,
  // porque o item concluído muda de lugar na lista logo em seguida.
  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var SPARK_COLORS = ['#2f9e6a', '#f2b631', '#ec6fa0', '#3aa6d9', '#e2725b', '#9b7bd8'];
  var BURSTS = [
    { dx: 0, dy: 0, delay: 0 },
    { dx: -16, dy: -14, delay: 140 },
    { dx: 16, dy: -16, delay: 280 }
  ];
  var SPARKS_PER_BURST = 10;

  function fireworks(x, y) {
    if (reduceMotion && reduceMotion.matches) return;
    BURSTS.forEach(function (b) {
      var burst = document.createElement('div');
      burst.className = 'firework';
      burst.setAttribute('aria-hidden', 'true');
      burst.style.left = (x + b.dx) + 'px';
      burst.style.top = (y + b.dy) + 'px';
      var flash = document.createElement('span');
      flash.className = 'firework-flash';
      flash.style.animationDelay = b.delay + 'ms';
      burst.appendChild(flash);
      for (var i = 0; i < SPARKS_PER_BURST; i++) {
        var angle = (i / SPARKS_PER_BURST) * 360 + Math.random() * 20;
        var dist = 12 + Math.random() * 5; // raio da explosão ~ tamanho da caixa de 22px
        var color = SPARK_COLORS[(i + b.delay) % SPARK_COLORS.length];
        var spark = document.createElement('span');
        spark.className = 'firework-spark';
        spark.style.setProperty('--a', angle.toFixed(0) + 'deg');
        spark.style.setProperty('--d', dist.toFixed(1) + 'px');
        spark.style.background = color;
        spark.style.color = color; // usado pelo brilho (box-shadow currentColor)
        spark.style.animationDelay = b.delay + 'ms';
        burst.appendChild(spark);
      }
      document.body.appendChild(burst);
      setTimeout(function () { burst.remove(); }, b.delay + 800);
    });
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
    if (!li) return;
    if (event.target.checked) {
      // Marcou como concluído: fogos saindo do centro da caixa de check.
      var box = event.target.getBoundingClientRect();
      fireworks(box.left + box.width / 2, box.top + box.height / 2);
      justDoneId = li.dataset.id;
    }
    toggleItem(li.dataset.id);
  });

  list.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-action]');
    if (!button) return;
    var li = button.closest('.item');
    if (!li) return;

    if (button.dataset.action === 'edit') {
      openEditor(li.dataset.id);
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

  // Aviso "vence hoje": leva até a primeira tarefa do dia.
  dueBannerOpen.addEventListener('click', function () {
    var now = new Date();
    var first = sortedItems(now).filter(function (i) { return isDueToday(i, now); })[0];
    var li = first && list.querySelector('[data-id="' + cssEscape(first.id) + '"]');
    if (!li) return;
    li.scrollIntoView({ block: 'center', behavior: reduceMotion && reduceMotion.matches ? 'auto' : 'smooth' });
    li.classList.remove('flash');
    void li.offsetWidth; // reinicia a animação
    li.classList.add('flash');
    li.querySelector('.item-toggle').focus({ preventScroll: true });
  });

  dueBannerClose.addEventListener('click', function () {
    dueDismissed = true;
    dueBanner.hidden = true;
    input.focus();
  });

  // Voltou para o app: o aviso aparece de novo e os prazos são recalculados.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      dueDismissed = false;
      render();
    }
  });

  // Com o app aberto, a virada do dia ou a hora do prazo passando mudam
  // etiquetas, urgência e ordem. Só redesenha quando algo mudou.
  setInterval(function () {
    if (editingId) return;
    if (clockSignature(new Date()) !== lastClockSignature) render();
  }, 30000);

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
