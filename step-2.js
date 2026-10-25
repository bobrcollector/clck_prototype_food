// Шаг 2 формы «Добавление рецепта»: форма ввода ингредиента, список с перетаскиванием, проверка перед «Дальше».
(function () {
  'use strict';

  var QTY_PATTERN = /^\d+([.,]\d+)?$/;
  var QTY_STEP = 0.5;
  var SCROLL_EDGE = 128;
  var SCROLL_STEP = 8;

  function $(id) { return document.getElementById(id); }

  var form = $('recipe-form');
  var nameInput = $('ing-name');
  var qtyInput = $('ing-qty');
  var unitSelect = $('ing-unit');
  var decBtn = $('qty-dec');
  var list = $('ingredient-list');
  var emptyBox = $('ingredient-empty');
  var listTitle = $('list-title');
  var status = $('ingredient-status');
  var template = $('ingredient-template');

  /* ---------- Ошибки полей ---------- */

  function setError(key, input, on) {
    $(key + '-field').classList.toggle('is-error', on);
    $(key + '-error').hidden = !on;
    if (on) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  function parseQty(value) {
    var v = value.trim();
    if (!QTY_PATTERN.test(v)) return NaN;
    return parseFloat(v.replace(',', '.'));
  }

  function formatQty(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }

  /* ---------- Счётчик количества ---------- */

  function syncDec() {
    var v = parseQty(qtyInput.value);
    decBtn.disabled = !(v > QTY_STEP);
  }

  decBtn.addEventListener('click', function () {
    var v = parseQty(qtyInput.value);
    if (v > QTY_STEP) qtyInput.value = formatQty(v - QTY_STEP);
    setError('qty', qtyInput, false);
    syncDec();
    save();
  });
  $('qty-inc').addEventListener('click', function () {
    var v = parseQty(qtyInput.value);
    qtyInput.value = formatQty((isNaN(v) ? 0 : v) + QTY_STEP);
    setError('qty', qtyInput, false);
    syncDec();
    save();
  });

  nameInput.addEventListener('input', function () {
    if (nameInput.value.trim() !== '') setError('name', nameInput, false);
    save();
  });
  qtyInput.addEventListener('input', function () {
    if (parseQty(qtyInput.value) > 0) setError('qty', qtyInput, false);
    syncDec();
    save();
  });
  unitSelect.addEventListener('change', function () {
    $('unit-field').classList.remove('is-empty');
    setError('unit', unitSelect, false);
    save();
  });

  /* ---------- Список ---------- */

  function syncList() {
    var has = list.children.length > 0;
    listTitle.hidden = !has;
    list.hidden = !has;
    emptyBox.hidden = has;
    if (has) {
      emptyBox.classList.remove('is-error');
      nameInput.setAttribute('aria-describedby', 'name-error');
    }
  }

  function createItem(name, qtyText, unit) {
    var item = template.content.firstElementChild.cloneNode(true);
    item.querySelector('.ingredient__name').textContent = name;
    item.querySelector('.ingredient__qty').textContent = qtyText + ' ' + unit;
    item.querySelector('[data-remove]').setAttribute('aria-label', 'Удалить ингредиент: ' + name);
    var hidden = item.querySelectorAll('input[type="hidden"]');
    hidden[0].value = name;
    hidden[1].value = qtyText;
    hidden[2].value = unit;
    return item;
  }

  function addIngredient() {
    var name = nameInput.value.trim();
    var qty = parseQty(qtyInput.value);
    var unit = unitSelect.value;

    var nameBad = name === '';
    var qtyBad = !(qty > 0);
    var unitBad = unit === '';
    setError('name', nameInput, nameBad);
    setError('qty', qtyInput, qtyBad);
    setError('unit', unitSelect, unitBad);
    if (nameBad) { nameInput.focus(); return; }
    if (qtyBad) { qtyInput.focus(); return; }
    if (unitBad) { unitSelect.focus(); return; }

    var qtyText = formatQty(qty);
    list.appendChild(createItem(name, qtyText, unit));
    syncList();

    status.textContent = 'Ингредиент добавлен: ' + name;
    nameInput.value = '';
    qtyInput.value = '1';
    syncDec();
    save();
    nameInput.focus();
  }

  $('add-ingredient').addEventListener('click', addIngredient);

  // Enter в полях ввода добавляет ингредиент, а не отправляет форму
  [nameInput, qtyInput].forEach(function (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      addIngredient();
    });
  });

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove]');
    if (!btn) return;
    var item = btn.closest('li');
    var next = item.nextElementSibling || item.previousElementSibling;
    var name = item.querySelector('.ingredient__name').textContent;
    item.remove();
    syncList();
    status.textContent = 'Ингредиент удалён: ' + name;
    save();
    if (next) next.querySelector('[data-remove]').focus(); else nameInput.focus();
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
    var handle = e.target.closest('.ingredient__handle');
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

  /* ---------- «Дальше»: в списке должен быть хотя бы один ингредиент ---------- */

  form.addEventListener('submit', function (e) {
    if (list.children.length > 0) return;
    e.preventDefault();
    emptyBox.classList.add('is-error');
    nameInput.setAttribute('aria-describedby', 'name-error ingredient-empty-hint');
    nameInput.focus();
  });

  /* ---------- Черновик: сохраняем введённое и возвращаем при возврате на шаг ---------- */

  function save() {
    if (!window.RecipeDraft) return;
    var items = Array.prototype.map.call(list.children, function (li) {
      var h = li.querySelectorAll('input[type="hidden"]');
      return { name: h[0].value, qty: h[1].value, unit: h[2].value };
    });
    RecipeDraft.set('step2', {
      items: items,
      entry: { name: nameInput.value, qty: qtyInput.value, unit: unitSelect.value },
      filled: items.length > 0 || nameInput.value.trim() !== ''
    });
  }

  var saved = window.RecipeDraft ? RecipeDraft.get('step2') : null;
  if (saved) {
    (saved.items || []).forEach(function (it) { list.appendChild(createItem(it.name, it.qty, it.unit)); });
    if (saved.entry) {
      nameInput.value = saved.entry.name || '';
      qtyInput.value = saved.entry.qty || '1';
      if (saved.entry.unit) {
        unitSelect.value = saved.entry.unit;
        $('unit-field').classList.remove('is-empty');
      }
    }
  }

  syncDec();
  syncList();
})();
