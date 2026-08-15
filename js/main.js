var year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

var mark = document.querySelector('[data-mark]');
if (mark && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  var originalMark = mark.getAttribute('data-mark');
  var glyphs = '01<>/_';
  var scrambleTimer;

  mark.parentElement.addEventListener('mouseenter', function () {
    var frame = 0;
    clearInterval(scrambleTimer);
    scrambleTimer = setInterval(function () {
      mark.textContent = glyphs[Math.floor(Math.random() * glyphs.length)] + glyphs[Math.floor(Math.random() * glyphs.length)];
      frame += 1;
      if (frame > 5) {
        clearInterval(scrambleTimer);
        mark.textContent = originalMark;
      }
    }, 55);
  });

  mark.parentElement.addEventListener('mouseleave', function () {
    clearInterval(scrambleTimer);
    mark.textContent = originalMark;
  });
}
