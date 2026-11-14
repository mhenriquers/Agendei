'use strict';

/*
 * Personalização: foto do perfil (avatar no topo + ícone da aba) e plano de fundo
 * (padrão = foto fixa do app, cor sólida ou foto enviada; as fotos aceitam desfoque). Salvo em localStorage, chave
 * checklist.settings.v1. O ícone do app instalado NÃO muda: ele vem do manifest.
 */
(function () {
  var SETTINGS_KEY = 'checklist.settings.v1';
  var DEFAULT_BG = '#fbf6ee'; // cor por baixo da foto (enquanto carrega) e cor sólida inicial
  // Fundo padrão: foto fixa no repo (cacheada pelo SW), com o rosto mais para cima.
  var DEFAULT_PHOTO = './img/fundo-padrao.jpg';
  var DEFAULT_PHOTO_POSITION = '45% 30%';
  var PHOTO_THEME = '#3d3431'; // cor da barra do sistema com foto de fundo (escurecida)
  var MAX_BLUR = 20;

  // Fotos de perfil prontas (PNG no repo, também no cache do SW).
  var AVATAR_PRESETS = ['./avatars/avatar-1.png', './avatars/avatar-2.png'];

  var defaults = { bgType: 'default', bgColor: DEFAULT_BG, bgPhoto: null, bgBlur: 0, avatar: null };

  function isColor(value) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  }

  function isImageData(value) {
    return typeof value === 'string' && value.indexOf('data:image/') === 0;
  }

  function load() {
    var s = Object.assign({}, defaults);
    try {
      var data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (!data || typeof data !== 'object') return s;
      if (data.bgType === 'color' || data.bgType === 'photo') s.bgType = data.bgType;
      if (isColor(data.bgColor)) s.bgColor = data.bgColor;
      if (isImageData(data.bgPhoto)) s.bgPhoto = data.bgPhoto;
      if (typeof data.bgBlur === 'number' && data.bgBlur >= 0 && data.bgBlur <= MAX_BLUR) {
        s.bgBlur = Math.round(data.bgBlur);
      }
      if (isImageData(data.avatar) || AVATAR_PRESETS.indexOf(data.avatar) >= 0) s.avatar = data.avatar;
    } catch (err) { /* dado corrompido: usa o padrão */ }
    return s;
  }

  // Devolve false se não coube no armazenamento (imagem grande demais).
  function save() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (err) {
      return false;
    }
  }

  var settings = load();

  // ===== Elementos =====
  var root = document.documentElement;
  var bgLayer = document.getElementById('app-bg');
  var avatarImg = document.getElementById('avatar');
  var favicon = document.querySelector('link[rel="icon"]');
  var defaultFavicon = favicon ? favicon.getAttribute('href') : null;
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  var dialog = document.getElementById('settings');
  var openBtn = document.getElementById('open-settings');
  var avatarFile = document.getElementById('avatar-file');
  var avatarRemove = document.getElementById('avatar-remove');
  var avatarOptions = document.querySelectorAll('.avatar-option');
  var typeRadios = document.querySelectorAll('input[name="bg-type"]');
  var colorOptions = document.getElementById('bg-color-options');
  var photoOptions = document.getElementById('bg-photo-options');
  var colorInput = document.getElementById('bg-color');
  var swatches = document.querySelectorAll('.swatch');
  var bgFile = document.getElementById('bg-file');
  var blurOptions = document.getElementById('bg-blur-options');
  var blurInput = document.getElementById('bg-blur');
  var blurValue = document.getElementById('bg-blur-value');
  var photoHint = document.getElementById('bg-photo-hint');

  // Luminância relativa (WCAG) para decidir se o texto sobre o fundo fica escuro.
  function luminance(hex) {
    var rgb = [1, 3, 5].map(function (i) {
      var c = parseInt(hex.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  // ===== Aplicar na página =====
  function apply() {
    var useDefault = settings.bgType === 'default';
    var usePhoto = useDefault || (settings.bgType === 'photo' && settings.bgPhoto);
    var useColor = settings.bgType === 'color';
    var color = useColor ? settings.bgColor : DEFAULT_BG;

    root.style.setProperty('--bg', color);
    // Fundo escuro ou foto: texto claro sobre o fundo (classe .bg-dark).
    root.classList.toggle('bg-dark', Boolean(usePhoto) || luminance(color) <= 0.3);
    root.classList.toggle('bg-photo', Boolean(usePhoto));
    if (themeMeta) themeMeta.setAttribute('content', usePhoto ? PHOTO_THEME : color);

    if (usePhoto) {
      // A data URL vem do canvas (base64), sem aspas: segura dentro de url("...").
      bgLayer.style.backgroundImage = 'url("' + (useDefault ? DEFAULT_PHOTO : settings.bgPhoto) + '")';
      bgLayer.style.backgroundPosition = useDefault ? DEFAULT_PHOTO_POSITION : '';
      bgLayer.style.filter = settings.bgBlur > 0 ? 'blur(' + settings.bgBlur + 'px)' : '';
      // Aumenta um pouco para a borda borrada não aparecer.
      bgLayer.style.transform = settings.bgBlur > 0 ? 'scale(1.08)' : '';
      bgLayer.hidden = false;
    } else {
      bgLayer.style.backgroundImage = '';
      bgLayer.hidden = true;
    }

    if (settings.avatar) {
      avatarImg.src = settings.avatar;
      avatarImg.hidden = false;
      if (favicon) {
        favicon.setAttribute('type', isImageData(settings.avatar) ? 'image/jpeg' : 'image/png');
        favicon.setAttribute('href', settings.avatar);
      }
    } else {
      avatarImg.removeAttribute('src');
      avatarImg.hidden = true;
      if (favicon && defaultFavicon) {
        favicon.setAttribute('type', 'image/png');
        favicon.setAttribute('href', defaultFavicon);
      }
    }
  }

  // Sincroniza os controles do painel com o estado.
  function syncControls() {
    typeRadios.forEach(function (radio) { radio.checked = radio.value === settings.bgType; });
    colorOptions.hidden = settings.bgType !== 'color';
    photoOptions.hidden = settings.bgType !== 'photo';
    colorInput.value = settings.bgColor;
    swatches.forEach(function (sw) {
      sw.setAttribute('aria-pressed', String(settings.bgType === 'color' && sw.dataset.color === settings.bgColor));
    });
    blurInput.value = String(settings.bgBlur);
    blurValue.textContent = String(settings.bgBlur);
    blurOptions.hidden = settings.bgType === 'color';
    blurInput.disabled = settings.bgType === 'photo' && !settings.bgPhoto;
    photoHint.hidden = Boolean(settings.bgPhoto);
    avatarRemove.disabled = !settings.avatar;
    avatarOptions.forEach(function (opt) {
      opt.setAttribute('aria-pressed', String(opt.dataset.avatar === settings.avatar));
    });
  }

  function update(changes) {
    var previous = Object.assign({}, settings);
    Object.assign(settings, changes);
    if (!save()) {
      settings = previous;
      window.alert('Não deu para salvar: a imagem é grande demais para o armazenamento do navegador. Tente outra foto.');
    }
    apply();
    syncControls();
  }

  // ===== Imagens =====
  // Lê o arquivo e devolve uma data URL JPEG reduzida. square=true recorta um
  // quadrado (puxado para cima, onde costuma estar o rosto em fotos em pé).
  function processImage(file, maxSide, square) {
    return new Promise(function (resolve, reject) {
      if (!file || file.type.indexOf('image/') !== 0) {
        reject(new Error('not-image'));
        return;
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        var sx = 0, sy = 0, sw = w, sh = h, outW, outH;
        if (square) {
          var side = Math.min(w, h);
          sx = (w - side) / 2;
          sy = (h - side) * 0.3;
          sw = sh = side;
          outW = outH = Math.min(maxSide, side);
        } else {
          var scale = Math.min(1, maxSide / Math.max(w, h));
          outW = Math.round(w * scale);
          outH = Math.round(h * scale);
        }
        var canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('load-failed'));
      };
      img.src = url;
    });
  }

  function imageError() {
    window.alert('Não deu para abrir essa imagem. Tente uma foto JPG ou PNG.');
  }

  // ===== Eventos =====
  openBtn.addEventListener('click', function () {
    syncControls();
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  });

  avatarFile.addEventListener('change', function () {
    var file = avatarFile.files[0];
    avatarFile.value = '';
    if (!file) return;
    processImage(file, 192, true).then(function (data) { update({ avatar: data }); }, imageError);
  });

  avatarOptions.forEach(function (opt) {
    opt.addEventListener('click', function () { update({ avatar: opt.dataset.avatar }); });
  });

  avatarRemove.addEventListener('click', function () {
    update({ avatar: null });
    avatarFile.focus();
  });

  typeRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) update({ bgType: radio.value });
    });
  });

  swatches.forEach(function (sw) {
    sw.addEventListener('click', function () { update({ bgType: 'color', bgColor: sw.dataset.color }); });
  });

  colorInput.addEventListener('input', function () {
    if (isColor(colorInput.value)) update({ bgType: 'color', bgColor: colorInput.value.toLowerCase() });
  });

  bgFile.addEventListener('change', function () {
    var file = bgFile.files[0];
    bgFile.value = '';
    if (!file) return;
    processImage(file, 1600, false).then(function (data) {
      update({ bgType: 'photo', bgPhoto: data });
    }, imageError);
  });

  blurInput.addEventListener('input', function () {
    var value = Math.max(0, Math.min(MAX_BLUR, parseInt(blurInput.value, 10) || 0));
    blurValue.textContent = String(value);
    update({ bgBlur: value });
  });

  // Sincronização entre abas.
  window.addEventListener('storage', function (event) {
    if (event.key !== SETTINGS_KEY && event.key !== null) return;
    settings = load();
    apply();
    syncControls();
  });

  apply();
})();
