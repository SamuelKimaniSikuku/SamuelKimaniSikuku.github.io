/* Shared behaviour: dark/light theme toggle + generative handpan music.
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

  /* ── Handpan melody (Web Audio, generative) ──
     Clicking the music button plays a soft, looping handpan
     improvisation synthesised in the browser — no audio file. */
  var btn = document.getElementById('musicBtn');
  if (!btn) return;

  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) { btn.style.display = 'none'; return; }

  var ctx = null, master = null, delay = null, wet = null;
  var timer = null, nextTime = 0, idx = 4, playing = false;

  /* D Kurd — the classic meditative handpan scale (Hz) */
  var scale = [146.83, 220.00, 233.08, 261.63, 293.66, 329.63, 349.23, 440.00];

  /* One handpan note: a few inharmonic sine partials with a fast
     attack and long, bell-like decay. */
  function strike(freq, time, vel) {
    var partials = [
      { r: 1.00, g: 1.00 },
      { r: 2.01, g: 0.45 },
      { r: 3.02, g: 0.22 },
      { r: 4.98, g: 0.08 }
    ];
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(vel, time + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 2.4);
    env.connect(master);
    env.connect(delay);
    partials.forEach(function (p) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * p.r;
      var g = ctx.createGain();
      g.gain.value = p.g;
      osc.connect(g).connect(env);
      osc.start(time);
      osc.stop(time + 2.5);
    });
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* Look-ahead scheduler: a gentle random walk across the scale. */
  function schedule() {
    while (nextTime < ctx.currentTime + 0.5) {
      var vel = 0.16 + Math.random() * 0.12;
      strike(scale[idx], nextTime, vel);
      if (Math.random() < 0.22) {
        strike(scale[Math.min(scale.length - 1, idx + 2)] / 2, nextTime + 0.05, vel * 0.5);
      }
      idx = Math.min(scale.length - 1, Math.max(0, idx + pick([-2, -1, -1, 0, 1, 1, 2])));
      nextTime += pick([0.5, 0.5, 0.75, 1.0, 1.0, 1.5]);
    }
  }

  function start() {
    if (!ctx) {
      ctx = new AudioCtx();
      var comp = ctx.createDynamicsCompressor();
      comp.connect(ctx.destination);
      master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(comp);
      delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.36;
      var fb = ctx.createGain(); fb.gain.value = 0.32;
      wet = ctx.createGain(); wet.gain.value = 0.25;
      delay.connect(fb).connect(delay);
      delay.connect(wet).connect(comp);
    }
    if (ctx.state === 'suspended') ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 1.5);
    nextTime = ctx.currentTime + 0.15;
    schedule();
    timer = setInterval(schedule, 200);
    playing = true;
    btn.textContent = '🔊';
    btn.classList.add('playing');
    localStorage.setItem('musicMuted', 'false');
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    }
    playing = false;
    btn.textContent = '🎵';
    btn.classList.remove('playing');
    localStorage.setItem('musicMuted', 'true');
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (playing) stop(); else start();
  });
})();
