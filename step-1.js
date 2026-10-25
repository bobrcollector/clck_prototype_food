// Шаг 1 формы «Добавление рецепта»: обложка, тип и категория блюда, проверка полей.
(function () {
  'use strict';

  /* ---------- Данные ---------- */

  // popular — чипсы на экране, more — только в списке «Показать все»
  var TYPES = {
    popular: ['Супы', 'Горячее', 'Салаты', 'Закуски', 'Десерты', 'Выпечка'],
    more: []
  };

  var CATEGORIES = {
    'Супы': {
      popular: ['Борщ', 'Щи', 'Солянка', 'Уха', 'Крем-супы'],
      more: ['Бульоны', 'Рассольник', 'Харчо', 'Гороховый суп', 'Окрошка', 'Куриный суп', 'Грибной суп', 'Лапша']
    },
    'Горячее': {
      popular: ['Паста', 'Плов', 'Котлеты', 'Жаркое', 'Стейки'],
      more: ['Ризотто', 'Голубцы', 'Гуляш', 'Запечённое мясо', 'Рыба', 'Пельмени', 'Вареники']
    },
    'Салаты': {
      popular: ['Оливье', 'Цезарь', 'Греческий', 'Винегрет', 'Капрезе'],
      more: ['Мясные', 'Овощные', 'С морепродуктами', 'С курицей', 'Слоёные', 'Фруктовые']
    },
    'Закуски': {
      popular: ['Брускетты', 'Канапе', 'Тарталетки', 'Начос', 'Рулеты'],
      more: ['Нарезки', 'Паштеты', 'Фаршированные овощи', 'Холодные закуски', 'Горячие закуски']
    },
    'Десерты': {
      popular: ['Торты', 'Печенье', 'Мороженое', 'Чизкейки', 'Панкейки'],
      more: ['Пудинги', 'Желе', 'Муссы', 'Тирамису', 'Конфеты', 'Кексы']
    },
    'Выпечка': {
      popular: ['Хлеб', 'Пироги', 'Кексы', 'Булочки', 'Круассаны'],
      more: ['Пицца', 'Пирожки', 'Печенье', 'Лепёшки', 'Кулебяка', 'Ватрушки']
    }
  };

  var ICON_PLUS = '<svg class="icon icon--s" aria-hidden="true" focusable="false"><use href="#i-plus"/></svg>';
  var ICON_X = '<svg class="icon icon--s" aria-hidden="true" focusable="false"><use href="#i-x"/></svg>';
  var ICON_CHECK = '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-check"/></svg>';
  var ICON_SEARCH = '<svg class="icon dropdown__search-icon" aria-hidden="true" focusable="false"><use href="#i-search"/></svg>';

  function $(id) { return document.getElementById(id); }

  function byRu(a, b) { return a.localeCompare(b, 'ru'); }

  /* ---------- Поле с чипсами и списком «Показать все» ---------- */

  // opts: { root, chips, label, multiple, showAll, getOptions(), onChange(selected) }
  function ChipField(opts) {
    var selected = [];
    var popover = null;
    var search = null;
    var list = null;
    var popoverId = opts.chips.id + '-popover';

    function isOpen() { return popover !== null && !popover.hidden; }

    function chipButton(name) {
      var btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.setAttribute('aria-pressed', selected.indexOf(name) !== -1 ? 'true' : 'false');
      btn.textContent = name;
      btn.addEventListener('click', function () { toggle(name); });
      return btn;
    }

    function tagChip(name) {
      var tag = document.createElement('span');
      tag.className = 'chip chip--tag';
      tag.appendChild(document.createTextNode(name));
      var remove = document.createElement('button');
      remove.className = 'chip__remove';
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Убрать: ' + name);
      remove.innerHTML = ICON_X;
      remove.addEventListener('click', function () {
        toggle(name);
        focusMore();
      });
      tag.appendChild(remove);
      return tag;
    }

    function moreButton() { return opts.chips.querySelector('.chip--more'); }

    function focusMore() {
      var more = moreButton();
      if (more) more.focus();
    }

    function renderChips() {
      var options = opts.getOptions();
      opts.chips.textContent = '';
      options.popular.forEach(function (name) { opts.chips.appendChild(chipButton(name)); });
      selected.forEach(function (name) {
        if (options.popular.indexOf(name) === -1) opts.chips.appendChild(tagChip(name));
      });
      if (!opts.showAll) return;
      var more = document.createElement('button');
      more.className = 'chip chip--more';
      more.type = 'button';
      more.innerHTML = ICON_PLUS + 'Показать все';
      more.setAttribute('aria-expanded', isOpen() ? 'true' : 'false');
      more.setAttribute('aria-controls', popoverId);
      more.addEventListener('click', function () { if (isOpen()) close(false); else open(); });
      opts.chips.appendChild(more);
    }

    function toggle(name) {
      var i = selected.indexOf(name);
      if (opts.multiple) {
        if (i === -1) selected.push(name); else selected.splice(i, 1);
      } else {
        selected = i === -1 ? [name] : [];
      }
      renderChips();
      syncOptions();
      if (isOpen() && !opts.multiple) close(true);
      opts.onChange(selected.slice());
    }

    /* --- раскрывающийся список --- */

    function buildPopover() {
      popover = document.createElement('div');
      popover.className = 'dropdown dropdown--popover';
      popover.id = popoverId;
      popover.setAttribute('role', 'listbox');
      popover.setAttribute('aria-label', opts.label);
      if (opts.multiple) popover.setAttribute('aria-multiselectable', 'true');
      popover.hidden = true;

      var searchWrap = document.createElement('div');
      searchWrap.className = 'dropdown__search';
      searchWrap.innerHTML = ICON_SEARCH;
      search = document.createElement('input');
      search.className = 'input__field';
      search.type = 'search';
      search.placeholder = 'Поиск...';
      search.setAttribute('aria-label', 'Поиск');
      search.addEventListener('input', function () { renderList(search.value); });
      // Enter в поиске списка не должен отправлять форму
      search.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
      searchWrap.appendChild(search);

      list = document.createElement('div');
      list.className = 'dropdown__list';

      popover.appendChild(searchWrap);
      popover.appendChild(list);
      opts.root.appendChild(popover);
    }

    function optionButton(name) {
      var btn = document.createElement('button');
      btn.className = 'dropdown__option';
      btn.type = 'button';
      btn.setAttribute('role', 'option');
      btn.setAttribute('data-name', name);
      btn.setAttribute('aria-selected', selected.indexOf(name) !== -1 ? 'true' : 'false');
      btn.appendChild(document.createTextNode(name));
      btn.insertAdjacentHTML('beforeend', ICON_CHECK);
      btn.addEventListener('click', function () { toggle(name); });
      return btn;
    }

    function group(title) {
      var p = document.createElement('p');
      p.className = 'dropdown__group';
      p.textContent = title;
      return p;
    }

    function renderList(query) {
      var options = opts.getOptions();
      var q = query.trim().toLowerCase();
      function matches(name) { return q === '' || name.toLowerCase().indexOf(q) !== -1; }
      var popular = options.popular.filter(matches);
      var rest = options.more.slice().sort(byRu).filter(matches);

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
      if (!list) return;
      Array.prototype.forEach.call(list.querySelectorAll('.dropdown__option'), function (btn) {
        btn.setAttribute('aria-selected', selected.indexOf(btn.getAttribute('data-name')) !== -1 ? 'true' : 'false');
      });
    }

    function open() {
      if (!popover) buildPopover();
      search.value = '';
      renderList('');
      popover.hidden = false;
      moreButton().setAttribute('aria-expanded', 'true');
      search.focus();
      popover.scrollIntoView({ block: 'nearest' });
    }

    function close(returnFocus) {
      if (!isOpen()) return;
      popover.hidden = true;
      moreButton().setAttribute('aria-expanded', 'false');
      if (returnFocus) focusMore();
    }

    /* --- внешний интерфейс --- */

    return {
      render: renderChips,
      get: function () { return selected.slice(); },
      set: function (list) { selected = list.slice(); renderChips(); syncOptions(); },
      reset: function () { selected = []; close(false); renderChips(); },
      close: close,
      isOpen: isOpen,
      contains: function (node) { return opts.root.contains(node); },
      firstFocusable: function () { return opts.chips.querySelector('button'); }
    };
  }

  /* ---------- Ошибки полей ---------- */

  function setError(field, control, message, on) {
    if (field) field.classList.toggle('is-error', on);
    if (control) {
      if (on) control.setAttribute('aria-invalid', 'true'); else control.removeAttribute('aria-invalid');
    }
    message.hidden = !on;
  }

  /* ---------- Обложка ---------- */

  function initCover(onChange) {
    var upload = $('cover-upload');
    var input = $('cover-input');
    var frame = $('cover-frame');
    var loading = $('cover-loading');
    var preview = $('cover-preview');
    var image = $('cover-image');
    var errorMsg = $('cover-error');
    var objectUrl = null;
    var coverData = null; // уменьшенная копия для черновика

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
      coverData = null;
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
          RecipeDraft.resizeImage(file, 800, function (data) { coverData = data; onChange(); });
        }
      };
      probe.onerror = function () {
        URL.revokeObjectURL(url);
        input.value = '';
        setState('error');
      };
      probe.src = url;
    });

    $('cover-replace').addEventListener('click', function () { input.click(); });
    $('cover-remove').addEventListener('click', function () {
      release();
      input.value = '';
      coverData = null;
      setState('default');
      input.focus();
      onChange();
    });

    return {
      get: function () { return coverData; },
      restore: function (dataUrl) {
        image.src = dataUrl;
        coverData = dataUrl;
        setState('success');
      }
    };
  }

  /* ---------- Форма ---------- */

  function init() {
    var cover = initCover(function () { save(); });

    var nameInput = $('dish-name');
    var descInput = $('dish-desc');
    var typeError = $('type-error');
    var categoryRoot = $('category-field');
    var currentType = null;

    var categoryField = ChipField({
      root: categoryRoot,
      chips: $('category-chips'),
      label: 'Категория блюда',
      multiple: true,
      showAll: true,
      getOptions: function () { return CATEGORIES[currentType] || { popular: [], more: [] }; },
      onChange: function () { save(); }
    });

    var typeField = ChipField({
      root: $('type-field'),
      chips: $('type-chips'),
      label: 'Тип блюда',
      multiple: false,
      showAll: false,
      getOptions: function () { return TYPES; },
      onChange: function (selected) {
        currentType = selected[0] || null;
        typeError.hidden = true;
        categoryField.reset();
        categoryRoot.hidden = currentType === null;
        save();
      }
    });

    typeField.render();

    // черновик: сохраняем введённое и возвращаем его при возврате на шаг
    function save() {
      if (!window.RecipeDraft) return;
      var categories = categoryField.get();
      RecipeDraft.set('step1', {
        name: nameInput.value,
        description: descInput.value,
        type: currentType,
        categories: categories,
        cover: cover.get(),
        filled: nameInput.value.trim() !== '' || descInput.value.trim() !== '' || currentType !== null ||
          categories.length > 0 || cover.get() !== null
      });
    }

    var saved = window.RecipeDraft ? RecipeDraft.get('step1') : null;
    if (saved) {
      nameInput.value = saved.name || '';
      descInput.value = saved.description || '';
      if (saved.type) {
        currentType = saved.type;
        typeField.set([saved.type]);
        categoryRoot.hidden = false;
        categoryField.set(saved.categories || []);
      }
      if (saved.cover) cover.restore(saved.cover);
    }

    nameInput.addEventListener('input', function () {
      setError($('name-field'), nameInput, $('name-error'), false);
      save();
    });
    descInput.addEventListener('input', function () {
      setError($('desc-field'), descInput, $('desc-error'), false);
      save();
    });

    // закрытие списка: клик вне поля и Escape
    document.addEventListener('click', function (e) {
      [typeField, categoryField].forEach(function (field) {
        if (field.isOpen() && !field.contains(e.target)) field.close(false);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      [typeField, categoryField].forEach(function (field) {
        if (field.isOpen()) field.close(true);
      });
    });

    // проверка обязательных полей: название, описание, тип блюда
    $('recipe-form').addEventListener('submit', function (e) {
      var firstInvalid = null;

      var nameEmpty = nameInput.value.trim() === '';
      setError($('name-field'), nameInput, $('name-error'), nameEmpty);
      if (nameEmpty && !firstInvalid) firstInvalid = nameInput;

      var descEmpty = descInput.value.trim() === '';
      setError($('desc-field'), descInput, $('desc-error'), descEmpty);
      if (descEmpty && !firstInvalid) firstInvalid = descInput;

      var typeEmpty = currentType === null;
      typeError.hidden = !typeEmpty;
      if (typeEmpty && !firstInvalid) firstInvalid = typeField.firstFocusable();

      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
      }
    });
  }

  init();
})();
