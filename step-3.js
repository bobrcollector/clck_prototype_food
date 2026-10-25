// Шаг 3 формы «Добавление рецепта»: карточки шагов с фото, перетаскивание, проверка перед «Дальше».
(function () {
  'use strict';

  var SCROLL_EDGE = 128;
  var SCROLL_STEP = 8;

  function $(id) { return document.getElementById(id); }
  function part(item, name) { return item.querySelector('[data-part="' + name + '"]'); }

  var form = $('recipe-form');
  var list = $('step-list');
  var emptyBox = $('step-empty');
  var addBtn = $('add-step');
  var status = $('step-status');
  var template = $('step-template');
  var uid = 0;

  /* ---------- Ошибки ---------- */

  function setTextError(item, on) {
    var input = part(item, 'text');
    part(item, 'field').classList.toggle('is-error', on);
    part(item, 'text-error').hidden = !on;
    if (on) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    item.classList.toggle('is-error', on);
  }

  /* ---------- Список шагов ---------- */

  function renumber() {
    Array.prototype.forEach.call(list.children, function (item, i) {
      var n = i + 1;
      item.querySelector('.recipe-step__title').textContent = 'Шаг ' + n;
      item.querySelector('[data-remove]').setAttribute('aria-label', 'Удалить шаг ' + n);
      part(item, 'image').alt = 'Фото шага ' + n;
      part(item, 'replace').setAttribute('aria-label', 'Заменить фото шага ' + n);
      part(item, 'remove').setAttribute('aria-label', 'Удалить фото шага ' + n);
    });
  }

  function syncList() {
    var has = list.children.length > 0;
    list.hidden = !has;
    emptyBox.hidden = has;
    if (has) emptyBox.classList.remove('is-error');
    renumber();
  }

  /* ---------- Фото шага ---------- */

  function initPhoto(item) {
    var upload = part(item, 'upload');
    var input = part(item, 'photo');
    var frame = part(item, 'frame');
    var loading = part(item, 'loading');
    var preview = part(item, 'preview');
    var image = part(item, 'image');
    var errorMsg = part(item, 'photo-error');
    var objectUrl = null;
    var photoData = null; // уменьшенная копия для черновика

    function setState(state) {
      upload.classList.remove('is-loading', 'is-success', 'is-error');
      if (state !== 'default') upload.classList.add('is-' + state);
      frame.hidden = state === 'loading' || state === 'success';
      loading.hidden = state !== 'loading';
      preview.hidden = state !== 'success';
      input.hidden = state === 'success';
      errorMsg.hidden = state !== 'error';
      if (state === 'error') input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }

    function release() {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      image.removeAttribute('src');
    }

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return; // окно выбора закрыли без файла

      release();
      photoData = null;
      if (file.type.indexOf('image/') !== 0) {
        input.value = '';
        setState('error');
        return;
      }

      setState('loading');
      var url = URL.createObjectURL(file);
      var probe = new Image();
      probe.onload = function () {
        objectUrl = url;
        image.src = url;
        setState('success');
        if (window.RecipeDraft) {
          RecipeDraft.resizeImage(file, 640, function (data) { photoData = data; save(); });
        }
      };
      probe.onerror = function () {
        URL.revokeObjectURL(url);
        input.value = '';
        setState('error');
      };
      probe.src = url;
    });

    part(item, 'replace').addEventListener('click', function () { input.click(); });
    part(item, 'remove').addEventListener('click', function () {
      release();
      input.value = '';
      photoData = null;
      setState('default');
      input.focus();
      save();
    });

    item.releasePhoto = release;
    item.getPhoto = function () { return photoData; };
    item.setPhoto = function (dataUrl) {
      image.src = dataUrl;
      photoData = dataUrl;
      setState('success');
    };
  }

  function addStep() {
    var item = template.content.firstElementChild.cloneNode(true);
    uid += 1;
    var text = part(item, 'text');
    var textErr = part(item, 'text-error');
    text.id = 'step-text-' + uid;
    textErr.id = 'step-text-error-' + uid;
    text.setAttribute('aria-describedby', textErr.id);
    part(item, 'label').setAttribute('for', text.id);

    var photo = part(item, 'photo');
    photo.id = 'step-photo-' + uid;
    photo.setAttribute('aria-describedby', 'step-photo-error-' + uid);
    part(item, 'photo-error').id = 'step-photo-error-' + uid;
    part(item, 'frame').setAttribute('for', photo.id);

    text.addEventListener('input', function () {
      if (text.value.trim() !== '') setTextError(item, false);
      save();
    });
    initPhoto(item);

    list.appendChild(item);
    syncList();
    return item;
  }

  addBtn.addEventListener('click', function () {
    var item = addStep();
    var text = part(item, 'text');
    text.focus();
    text.scrollIntoView({ block: 'center', behavior: 'smooth' });
    status.textContent = 'Добавлен шаг ' + list.children.length;
    save();
  });

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove]');
    if (!btn) return;
    var item = btn.closest('li');
    var next = item.nextElementSibling || item.previousElementSibling;
    item.releasePhoto();
    item.remove();
    syncList();
    status.textContent = 'Шаг удалён';
    save();
    if (next) next.querySelector('[data-remove]').focus(); else addBtn.focus();
  });

  /* ---------- Перетаскивание за ручку ---------- */

  var drag = null;

  function middle(el) {
    var r = el.getBoundingClientRect();
    return r.top + r.height / 2;
  }

  function reorder() {
    var prev;
    var next;
    while ((prev = drag.item.previousElementSibling) && drag.y < middle(prev)) {
      list.insertBefore(drag.item, prev);
    }
    while ((next = drag.item.nextElementSibling) && drag.y > middle(next)) {
      list.insertBefore(next, drag.item);
    }
    renumber();
  }

  function autoscroll() {
    if (!drag) return;
    if (drag.y < SCROLL_EDGE) { window.scrollBy(0, -SCROLL_STEP); reorder(); }
    else if (drag.y > window.innerHeight - SCROLL_EDGE) { window.scrollBy(0, SCROLL_STEP); reorder(); }
    drag.frame = requestAnimationFrame(autoscroll);
  }

  function onMove(e) {
    if (!drag) return;
    drag.y = e.clientY;
    reorder();
  }

  function onEnd() {
    if (!drag) return;
    cancelAnimationFrame(drag.frame);
    drag.item.classList.remove('is-dragging');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onEnd);
    document.removeEventListener('pointercancel', onEnd);
    drag = null;
    save();
  }

  list.addEventListener('pointerdown', function (e) {
    var handle = e.target.closest('.recipe-step__handle');
    if (!handle || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    var item = handle.closest('li');
    item.classList.add('is-dragging');
    drag = { item: item, y: e.clientY, frame: 0 };
    drag.frame = requestAnimationFrame(autoscroll);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onEnd);
  });

  /* ---------- «Дальше» ---------- */

  // достаточно одного описанного шага: добавленные, но пустые шаги не мешают пройти дальше
  function stepsFilled() {
    var items = Array.prototype.slice.call(list.children);
    return items.some(function (item) { return part(item, 'text').value.trim() !== ''; });
  }

  form.addEventListener('submit', function (e) {
    if (stepsFilled()) return;

    if (list.children.length === 0) {
      e.preventDefault();
      emptyBox.classList.add('is-error');
      addBtn.setAttribute('aria-describedby', 'step-empty-hint');
      addBtn.focus();
      return;
    }
    addBtn.removeAttribute('aria-describedby');

    var firstInvalid = null;
    Array.prototype.forEach.call(list.children, function (item) {
      var text = part(item, 'text');
      var empty = text.value.trim() === '';
      setTextError(item, empty);
      if (empty && !firstInvalid) firstInvalid = text;
    });
    if (firstInvalid) {
      e.preventDefault();
      firstInvalid.focus();
    }
  });

  /* ---------- Черновик: сохраняем введённое и возвращаем при возврате на шаг ---------- */

  function save() {
    if (!window.RecipeDraft) return;
    var steps = Array.prototype.map.call(list.children, function (item) {
      return { text: part(item, 'text').value, photo: item.getPhoto() };
    });
    RecipeDraft.set('step3', {
      steps: steps,
      filled: steps.some(function (st) { return st.text.trim() !== '' || st.photo; })
    });
  }

  var saved = window.RecipeDraft ? RecipeDraft.get('step3') : null;
  if (saved) {
    (saved.steps || []).forEach(function (st) {
      var item = addStep();
      part(item, 'text').value = st.text || '';
      if (st.photo) item.setPhoto(st.photo);
    });
    if (!list.children.length) addStep(); // черновик без шагов — начинаем с пустого шага
    syncList();
  } else {
    addStep();
  }
})();
