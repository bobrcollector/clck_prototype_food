// Черновик рецепта между шагами формы: хранится в sessionStorage браузера, пока открыта вкладка.
// Каждый шаг сохраняет свои данные под своим ключом (step1…step4), экран результата их читает.
(function () {
  'use strict';

  var KEY = 'russfood-recipe-draft';

  function read() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }

  function write(data) {
    try { sessionStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  }

  function clear() {
    try { sessionStorage.removeItem(KEY); } catch (e) { /* хранилище недоступно */ }
  }

  // Фото уменьшаем до maxSide по длинной стороне и сохраняем как JPEG в виде строки,
  // чтобы оно пережило переход между страницами и влезло в лимит хранилища.
  function resizeImage(file, maxSide, done) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      var data = null;
      try { data = canvas.toDataURL('image/jpeg', 0.8); } catch (e) { data = null; }
      done(data);
    };
    img.onerror = function () { URL.revokeObjectURL(url); done(null); };
    img.src = url;
  }

  // Новая форма из «+» открывается с ?new — старый черновик сбрасываем
  if (/[?&]new(=|&|$)/.test(location.search)) {
    clear();
    if (window.history && history.replaceState) history.replaceState(null, '', location.pathname);
  }

  // Данные между шагами уже лежат в черновике, поэтому форму не отправляем со всеми полями в адресной строке:
  // после проверки шага просто переходим на следующую страницу. Слушатель вешаем на DOMContentLoaded,
  // чтобы он сработал после проверок из скриптов шагов (они отменяют отправку, если поле не заполнено).
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('recipe-form');
    if (!form || !form.getAttribute('action')) return;
    form.addEventListener('submit', function (e) {
      if (e.defaultPrevented) return;
      e.preventDefault();
      location.href = form.getAttribute('action');
    });
  });

  window.RecipeDraft = {
    get: function (step) { var d = read()[step]; return d === undefined ? null : d; },
    set: function (step, value) {
      var d = read();
      d[step] = value;
      return write(d);
    },
    // есть ли хоть что-то введённое (шаги сами отмечают это полем filled)
    hasData: function () {
      var d = read();
      return Object.keys(d).some(function (k) { return d[k] && d[k].filled; });
    },
    clear: clear,
    resizeImage: resizeImage
  };
})();
