// Шторка «+» на главной: выезжает по кнопке «+» в таб-баре.
(function () {
  'use strict';

  var trigger = document.getElementById('add-trigger');
  var overlay = document.getElementById('add-sheet');
  if (!trigger || !overlay) return;

  function isOpen() { return overlay.classList.contains('is-open'); }

  function open() {
    overlay.classList.add('is-open');
    document.body.classList.add('is-locked');
    trigger.setAttribute('aria-expanded', 'true');
    overlay.querySelector('.sheet__item').focus();
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }

  trigger.addEventListener('click', function (e) {
    e.preventDefault(); // без JS «+» просто ведёт на шаг 1
    open();
  });

  // клик по затемнению закрывает шторку
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;

    if (e.key === 'Escape') {
      close();
      return;
    }

    // фокус остаётся внутри шторки
    if (e.key === 'Tab') {
      var items = overlay.querySelectorAll('a[href], button');
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
})();
