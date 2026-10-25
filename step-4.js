// Шаг 4 формы «Добавление рецепта»: чипсы, окно выбора (кухня, особенности, повод), «Дополнительные параметры», порции, калорийность.
(function () {
  'use strict';

  // popular — чипсы на экране, other — только в окне выбора
  var FIELDS = {
    cuisine: {
      title: 'Национальная кухня',
      popular: ['Русская', 'Итальянская', 'Азиатская', 'Кавказская', 'Европейская'],
      other: [
        'Абхазская', 'Австралийская', 'Австрийская', 'Адыгейская', 'Азербайджанская', 'Албанская', 'Алжирская',
        'Американская', 'Английская', 'Армянская', 'Африканская', 'Бельгийская', 'Болгарская', 'Бразильская',
        'Британская', 'Венгерская', 'Вьетнамская', 'Германская', 'Греческая', 'Грузинская', 'Египетская',
        'Израильская', 'Индийская', 'Индонезийская', 'Испанская', 'Казахская', 'Китайская', 'Корейская',
        'Кубинская', 'Латвийская', 'Литовская', 'Мексиканская', 'Марокканская', 'Норвежская', 'Перуанская',
        'Польская', 'Португальская', 'Тайская', 'Турецкая', 'Украинская', 'Французская', 'Чешская', 'Шведская',
        'Японская'
      ]
    },
    features: {
      title: 'Особенности блюда',
      popular: ['Вегетарианское', 'Постное', 'Без глютена'],
      other: [
        'Диетическое', 'Для детей', 'Острое', 'Без лактозы', 'Веганское', 'Низкокалорийное',
        'Высокобелковое', 'Без сахара', 'Кето', 'Сыроедное'
      ]
    },
    occasion: {
      title: 'Повод',
      popular: ['На каждый день', 'Праздничный стол', 'Новый год'],
      other: [
        'Пикник', 'Романтический ужин', 'День рождения', 'Масленица', 'Пасха', 'Рождество',
        '8 Марта', '23 Февраля', 'Детский праздник', 'Свадьба'
      ]
    }
  };

  var ICON_PLUS = '<svg class="icon icon--s" aria-hidden="true" focusable="false"><use href="#i-plus"/></svg>';
  var ICON_MINUS = '<svg class="icon icon--s" aria-hidden="true" focusable="false"><use href="#i-minus"/></svg>';

  var ICON_X = '<svg class="icon icon--s" aria-hidden="true" focusable="false"><use href="#i-x"/></svg>';
  var ICON_CHECK = '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-check"/></svg>';

  function $(id) { return document.getElementById(id); }
  function byRu(a, b) { return a.localeCompare(b, 'ru'); }

  /* ---------- Чипсы: один или несколько ---------- */

  function initChipGroup(group) {
    var single = group.getAttribute('data-chips') === 'single';
    group.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip[aria-pressed]');
      if (!chip || !group.contains(chip)) return;
      var on = chip.getAttribute('aria-pressed') !== 'true';
      if (single) {
        Array.prototype.forEach.call(group.querySelectorAll('.chip[aria-pressed]'), function (c) {
          c.setAttribute('aria-pressed', 'false');
        });
      }
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      syncCustom(group);
    });
  }

  // «Свой вариант»: показывает поля значения и единицы, пока чипс выбран,
  // а введённое время выводит в самом чипсе — так видно, что оно выбрано
  var CUSTOM_LABEL = 'Свой вариант';

  function customParts(group) {
    var chip = group.querySelector('[data-custom]');
    if (!chip) return null;
    var row = $(chip.getAttribute('data-custom'));
    return { chip: chip, row: row, input: row.querySelector('input'), unit: row.querySelector('select') };
  }

  function updateCustomChip(group) {
    var p = customParts(group);
    if (!p) return;
    var value = p.input.value.trim();
    p.chip.textContent = value ? CUSTOM_LABEL + ': ' + value + ' ' + p.unit.value : CUSTOM_LABEL;
  }

  function syncCustom(group) {
    var p = customParts(group);
    if (!p) return;
    var on = p.chip.getAttribute('aria-pressed') === 'true';
    var wasHidden = p.row.hidden;
    p.row.hidden = !on;
    if (on && wasHidden) p.input.focus();
    if (!on) {
      p.input.value = '';
      p.unit.selectedIndex = 0;
    }
    updateCustomChip(group);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-chips]'), function (group) {
    var p = customParts(group);
    if (!p) return;
    p.input.addEventListener('input', function () {
      p.input.value = p.input.value.replace(/\D/g, '');
      updateCustomChip(group);
    });
    p.unit.addEventListener('change', function () { updateCustomChip(group); });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-chips]'), initChipGroup);

  /* ---------- Поля с окном выбора: кухня, особенности, повод ---------- */

  var picker = $('picker');
  var pickerTitle = $('picker-title');
  var search = $('picker-search');
  var list = $('picker-list');
  var selectedBox = $('picker-selected');
  var screen = $('screen');
  var current = null; // поле, для которого открыто окно

  Object.keys(FIELDS).forEach(function (key) {
    var f = FIELDS[key];
    f.key = key;
    f.group = $(key + '-chips');
    f.more = $(key + '-more');
    f.selected = [];
    f.group.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip[aria-pressed]');
      if (chip) toggleValue(f, chip.textContent.trim());
    });
    f.more.addEventListener('click', function () { open(f); });
  });

  function isOpen() { return picker.classList.contains('is-open'); }
  function isSelected(f, name) { return f.selected.indexOf(name) !== -1; }

  function toggleValue(f, name) {
    var i = f.selected.indexOf(name);
    if (i === -1) f.selected.push(name); else f.selected.splice(i, 1);
    renderChips(f);
    if (isOpen() && current === f) {
      renderSelected();
      syncOptions();
    }
    save();
  }

  function tagChip(f, name) {
    var tag = document.createElement('span');
    tag.className = 'chip chip--tag';
    tag.appendChild(document.createTextNode(name));
    var remove = document.createElement('button');
    remove.className = 'chip__remove';
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Убрать: ' + name);
    remove.innerHTML = ICON_X;
    remove.addEventListener('click', function () {
      toggleValue(f, name);
      if (!isOpen()) f.more.focus();
    });
    tag.appendChild(remove);
    return tag;
  }

  // популярные — обычные чипсы, остальные выбранные — теги перед «Показать все»
  function renderChips(f) {
    Array.prototype.forEach.call(f.group.querySelectorAll('.chip[aria-pressed]'), function (chip) {
      chip.setAttribute('aria-pressed', isSelected(f, chip.textContent.trim()) ? 'true' : 'false');
    });
    Array.prototype.forEach.call(f.group.querySelectorAll('.chip--tag'), function (tag) { tag.remove(); });
    f.selected.forEach(function (name) {
      if (f.popular.indexOf(name) === -1) f.group.insertBefore(tagChip(f, name), f.more);
    });
  }

  /* --- окно выбора --- */

  function group(title) {
    var p = document.createElement('p');
    p.className = 'dropdown__group';
    p.textContent = title;
    return p;
  }

  function optionButton(name) {
    var btn = document.createElement('button');
    btn.className = 'dropdown__option';
    btn.type = 'button';
    btn.setAttribute('role', 'option');
    btn.setAttribute('data-name', name);
    btn.setAttribute('aria-selected', isSelected(current, name) ? 'true' : 'false');
    btn.appendChild(document.createTextNode(name));
    btn.insertAdjacentHTML('beforeend', ICON_CHECK);
    btn.addEventListener('click', function () { toggleValue(current, name); });
    return btn;
  }

  function renderList(query) {
    var q = query.trim().toLowerCase();
    function matches(name) { return q === '' || name.toLowerCase().indexOf(q) !== -1; }
    var popular = current.popular.filter(matches);
    var rest = current.other.slice().sort(byRu).filter(matches);

    list.textContent = '';
    if (popular.length === 0 && rest.length === 0) {
      var status = document.createElement('p');
      status.className = 'dropdown__status';
      status.textContent = 'Ничего не найдено';
      list.appendChild(status);
      return;
    }
    if (popular.length) {
      list.appendChild(group('Популярные'));
      popular.forEach(function (name) { list.appendChild(optionButton(name)); });
    }
    if (rest.length) {
      list.appendChild(group('Остальные'));
      rest.forEach(function (name) { list.appendChild(optionButton(name)); });
    }
  }

  function syncOptions() {
    Array.prototype.forEach.call(list.querySelectorAll('.dropdown__option'), function (btn) {
      btn.setAttribute('aria-selected', isSelected(current, btn.getAttribute('data-name')) ? 'true' : 'false');
    });
  }

  function renderSelected() {
    selectedBox.textContent = '';
    current.selected.forEach(function (name) { selectedBox.appendChild(tagChip(current, name)); });
    selectedBox.hidden = current.selected.length === 0;
  }

  function open(f) {
    current = f;
    pickerTitle.textContent = f.title;
    list.setAttribute('aria-label', f.title);
    search.value = '';
    renderList('');
    renderSelected();
    picker.classList.add('is-open');
    document.body.classList.add('is-locked');
    screen.setAttribute('inert', '');
    f.more.setAttribute('aria-expanded', 'true');
    // окно становится видимым в первый кадр анимации — фокус ставим после него
    setTimeout(function () { search.focus(); }, 50);
  }

  function close() {
    var f = current;
    picker.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    screen.removeAttribute('inert');
    f.more.setAttribute('aria-expanded', 'false');
    f.more.focus();
  }

  $('picker-done').addEventListener('click', close);
  $('picker-back').addEventListener('click', close);
  search.addEventListener('input', function () { renderList(search.value); });
  // Enter в поиске не должен отправлять форму
  search.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) close();
  });

  /* ---------- «Дополнительные параметры» ---------- */

  var moreToggle = $('more-toggle');
  var moreFields = $('more-fields');
  moreToggle.addEventListener('click', function () {
    var expand = moreToggle.getAttribute('aria-expanded') !== 'true';
    moreToggle.setAttribute('aria-expanded', expand ? 'true' : 'false');
    moreFields.hidden = !expand;
    moreToggle.innerHTML = (expand ? ICON_MINUS : ICON_PLUS) + (expand ? 'Свернуть' : 'Дополнительные параметры');
  });

  /* ---------- Порции ---------- */

  var servings = $('servings');
  var decBtn = $('servings-dec');
  var suffix = $('servings-suffix');

  function plural(n) {
    var m10 = n % 10;
    var m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'порция';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'порции';
    return 'порций';
  }

  function servingsValue() {
    var n = parseInt(servings.value, 10);
    return isNaN(n) || n < 1 ? 1 : n;
  }

  function syncServings() {
    var n = servingsValue();
    decBtn.disabled = n <= 1;
    suffix.textContent = plural(n);
  }

  $('servings-inc').addEventListener('click', function () {
    servings.value = servingsValue() + 1;
    syncServings();
  });
  decBtn.addEventListener('click', function () {
    servings.value = Math.max(1, servingsValue() - 1);
    syncServings();
  });
  servings.addEventListener('input', function () {
    servings.value = servings.value.replace(/\D/g, '');
    syncServings();
  });
  servings.addEventListener('blur', function () {
    servings.value = servingsValue();
    syncServings();
  });

  /* ---------- Калорийность: только цифры ---------- */

  var calories = $('calories');
  calories.addEventListener('input', function () {
    calories.value = calories.value.replace(/\D/g, '');
  });

  /* ---------- Черновик: сохраняем введённое и возвращаем при возврате на шаг ---------- */

  var form = $('recipe-form');
  var TIME_KEYS = ['total', 'active'];

  function pressedTexts(groupId) {
    return Array.prototype.map.call(
      $(groupId).querySelectorAll('.chip[aria-pressed="true"]:not([data-custom])'),
      function (chip) { return chip.textContent.trim(); }
    );
  }

  function timeState(key) {
    var group = $(key + '-chips');
    var custom = group.querySelector('[data-custom]');
    if (custom.getAttribute('aria-pressed') === 'true') {
      return { custom: true, value: $(key + '-value').value, unit: $(key + '-unit').value, label: '' };
    }
    var chip = group.querySelector('.chip[aria-pressed="true"]');
    return { custom: false, value: '', unit: '', label: chip ? chip.textContent.trim() : '' };
  }

  function save() {
    if (!window.RecipeDraft) return;
    var data = {
      servings: servingsValue(),
      total: timeState('total'),
      active: timeState('active'),
      cooking: pressedTexts('cooking-chips'),
      cuisine: FIELDS.cuisine.selected.slice(),
      features: FIELDS.features.selected.slice(),
      occasion: FIELDS.occasion.selected.slice(),
      calories: calories.value,
      moreOpen: moreToggle.getAttribute('aria-expanded') === 'true'
    };
    data.filled = data.servings > 1 || data.cooking.length > 0 || data.cuisine.length > 0 ||
      data.features.length > 0 || data.occasion.length > 0 || data.calories !== '' ||
      TIME_KEYS.some(function (k) { return data[k].label !== '' || (data[k].custom && data[k].value !== ''); });
    RecipeDraft.set('step4', data);
  }

  // чипсы и поля внутри формы: сохраняем после того, как сработают их собственные обработчики
  ['click', 'input', 'change'].forEach(function (type) {
    form.addEventListener(type, function () { setTimeout(save, 0); });
  });

  function restore(saved) {
    servings.value = saved.servings || 1;

    TIME_KEYS.forEach(function (key) {
      var st = saved[key];
      var group = $(key + '-chips');
      var p = customParts(group);
      if (!st) return;
      if (st.custom) {
        p.chip.setAttribute('aria-pressed', 'true');
        p.row.hidden = false;
        p.input.value = st.value || '';
        if (st.unit) p.unit.value = st.unit;
        updateCustomChip(group);
      } else if (st.label) {
        Array.prototype.forEach.call(group.querySelectorAll('.chip[aria-pressed]'), function (chip) {
          if (chip.textContent.trim() === st.label) chip.setAttribute('aria-pressed', 'true');
        });
      }
    });

    Array.prototype.forEach.call($('cooking-chips').querySelectorAll('.chip[aria-pressed]'), function (chip) {
      if ((saved.cooking || []).indexOf(chip.textContent.trim()) !== -1) chip.setAttribute('aria-pressed', 'true');
    });

    ['cuisine', 'features', 'occasion'].forEach(function (key) {
      FIELDS[key].selected = (saved[key] || []).slice();
      renderChips(FIELDS[key]);
    });

    calories.value = saved.calories || '';

    if (saved.moreOpen) {
      moreToggle.setAttribute('aria-expanded', 'true');
      moreFields.hidden = false;
      moreToggle.innerHTML = ICON_MINUS + 'Свернуть';
    }
  }

  var saved = window.RecipeDraft ? RecipeDraft.get('step4') : null;
  if (saved) restore(saved);

  syncServings();
})();
