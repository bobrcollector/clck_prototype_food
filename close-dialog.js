// Диалог при закрытии формы крестиком, если что-то введено: сохранить в черновик, не сохранять или продолжить заполнение.
(function () {
  'use strict';

  var trigger = document.querySelector('.formbar__close');
  var overlay = document.getElementById('exit-dialog');
  var screen = document.getElementById('screen') || document.querySelector('.screen');
  if (!trigger || !overlay) return;

  function isOpen() { return overlay.classList.contains('is-open'); }

  // Слепок введённого: значения полей, выбранные чипсы, число строк, теги, загруженные фото.
  // Диалог нужен, только если слепок отличается от того, что был при открытии экрана.
  function snapshot() {
    var form = document.getElementById('recipe-form');
    if (!form) return '';
    var parts = [];
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.type === 'file') parts.push(el.files ? el.files.length : 0);
      else if (el.type === 'checkbox' || el.type === 'radio') parts.push(el.checked);
      else parts.push(el.value);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[aria-pressed]'), function (el) {
      parts.push(el.getAttribute('aria-pressed'));
    });
    ['#step-list', '#ingredient-list'].forEach(function (sel) {
      var list = document.querySelector(sel);
      parts.push(list ? list.children.length : 0);
    });
    parts.push(document.querySelectorAll('.chip--tag').length);
    parts.push(document.querySelectorAll('.upload.is-success').length);
    return JSON.stringify(parts);
  }

  var initial = snapshot();

  function open() {
    overlay.classList.add('is-open');
    document.body.classList.add('is-locked');
    screen.setAttribute('inert', '');
    // окно становится видимым в первый кадр анимации — фокус ставим после него
    setTimeout(function () { overlay.querySelector('.btn--primary').focus(); }, 50);
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    screen.removeAttribute('inert');
    trigger.focus();
  }

  trigger.addEventListener('click', function (e) {
    var hasDraft = window.RecipeDraft && RecipeDraft.hasData();
    if (snapshot() === initial && !hasDraft) return; // ничего не введено — крестик просто ведёт на главную
    e.preventDefault();
    open();
  });

  document.getElementById('exit-cancel').addEventListener('click', close);

  // «Не сохранять»: введённое на всех шагах сбрасываем
  var discard = document.getElementById('exit-discard');
  if (discard) discard.addEventListener('click', function () { if (window.RecipeDraft) RecipeDraft.clear(); });

  // клик по затемнению вне окна закрывает диалог
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) close();
  });
})();
