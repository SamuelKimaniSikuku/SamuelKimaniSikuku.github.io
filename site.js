/* Shared behaviour: dark/light theme toggle + background music.
   The initial theme is applied by a small inline script in <head>
   to avoid a flash; this file wires up the controls. */
(function () {
  var html = document.documentElement;

  /* ── Theme toggle ── */
  var toggle = document.getElementById('theme-switch');
  if (toggle) {
    toggle.checked = html.getAttribute('data-theme') === 'dark';
    toggle.addEventListener('change', function () {
      var theme = toggle.checked ? 'dark' : 'light';
      html.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
  }

  /* ── Background music ── */
  var music = document.getElementById('bgMusic');
  var btn = document.getElementById('musicBtn');
  if (music && btn) {
    var playing = false;

    music.volume = parseFloat(localStorage.getItem('musicVolume') || '0.35');

    var startOnInteraction = function () {
      if (!playing && localStorage.getItem('musicMuted') !== 'true') {
        music.play().then(function () {
          playing = true;
          btn.textContent = '🔊';
          btn.classList.add('playing');
        }).catch(function () {});
      }
    };

    ['click', 'keydown', 'scroll', 'touchstart'].forEach(function (evt) {
      document.body.addEventListener(evt, startOnInteraction, { once: true });
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (playing) {
        music.pause();
        playing = false;
        btn.textContent = '🎵';
        btn.classList.remove('playing');
        localStorage.setItem('musicMuted', 'true');
      } else {
        music.play().then(function () {
          playing = true;
          btn.textContent = '🔊';
          btn.classList.add('playing');
          localStorage.setItem('musicMuted', 'false');
        }).catch(function () {});
      }
    });
  }
})();
