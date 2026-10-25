// Шапка .topbar прячется при прокрутке вниз и возвращается при прокрутке вверх.
(function () {
  var header = document.querySelector('.topbar');
  if (!header) return;

  var THRESHOLD = 8; // px: игнорируем дрожание пальца
  var lastY = window.scrollY;
  var ticking = false;

  function update() {
    var y = Math.max(window.scrollY, 0);
    var delta = y - lastY;

    if (y <= header.offsetHeight) {
      header.classList.remove('is-hidden');
    } else if (delta > THRESHOLD) {
      header.classList.add('is-hidden');
    } else if (delta < -THRESHOLD) {
      header.classList.remove('is-hidden');
    }

    if (Math.abs(delta) > THRESHOLD) lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });

  // фокус клавиатуры внутри шапки всегда её показывает
  header.addEventListener('focusin', function () {
    header.classList.remove('is-hidden');
  });
})();
