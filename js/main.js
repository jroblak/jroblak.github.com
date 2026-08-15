var year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

var rotatingStatus = document.getElementById('rotating-status');
if (rotatingStatus && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  var statuses = [
    'teaching agents to clean up after themselves',
    'making the complicated thing legible',
    'turning prototypes into dependable systems',
    'asking whether this really needs another service'
  ];
  var statusIndex = 0;

  window.setInterval(function () {
    statusIndex = (statusIndex + 1) % statuses.length;
    rotatingStatus.textContent = statuses[statusIndex];
  }, 3200);
}
