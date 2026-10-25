// Экран результата: карточка сохранённого рецепта собирается из того, что пользователь ввёл в форме.
// Если черновика нет (экран открыт напрямую), остаётся пример из разметки.
(function () {
  'use strict';

  if (!window.RecipeDraft) return;

  var step1 = RecipeDraft.get('step1');
  var step4 = RecipeDraft.get('step4');
  if (!step1 && !step4) return;

  var card = document.getElementById('result-card');
  var cover = document.getElementById('result-cover');
  var title = document.getElementById('result-title');
  var text = document.getElementById('result-text');
  var meta = document.getElementById('result-meta');
  var time = document.getElementById('result-time');

  title.textContent = (step1 && step1.name && step1.name.trim()) || 'Без названия';

  if (step1 && step1.cover) {
    cover.src = step1.cover;
  } else {
    // обложки нет — карточка без картинки (вариант is-empty)
    cover.remove();
    card.classList.add('is-empty');
  }

  // описание — из шага 1 (в карточке две строки, остальное обрезается)
  var description = step1 && step1.description && step1.description.trim();
  if (description) text.textContent = description; else text.remove();

  // мета — только время приготовления из шага 4 (иконка «часы» уже в разметке)
  var total = step4 && step4.total;
  var label = '';
  if (total && total.custom && total.value) label = total.value + ' ' + total.unit;
  else if (total && total.label) label = total.label;
  if (label) time.textContent = label; else meta.remove();
})();
