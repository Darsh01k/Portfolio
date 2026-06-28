(function() {
  var canvas = document.getElementById('bgMesh');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  var COLS = 5, ROWS = 4;
  var points = [];
  var palettes = {
    dark: [
      [148, 163, 184],
      [100, 116, 139],
      [203, 213, 225],
      [71, 85, 105],
      [226, 232, 240],
    ],
    light: [
      [100, 116, 139],
      [148, 163, 184],
      [71, 85, 105],
      [203, 213, 225],
      [120, 130, 150],
    ],
  };

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function initPoints() {
    points.length = 0;
    var pal = palettes[getTheme()];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var col = pal[(r + c) % pal.length];
        points.push({
          bx: (c / (COLS - 1)) * (W + 200) - 100,
          by: (r / (ROWS - 1)) * (H + 200) - 100,
          r: col[0], g: col[1], b: col[2],
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          speed: 0.25 + Math.random() * 0.15,
          ampX: 80 + Math.random() * 80,
          ampY: 60 + Math.random() * 80,
        });
      }
    }
  }
  initPoints();

  var time = 0, running = true;

  document.addEventListener('visibilitychange', function() {
    running = !document.hidden;
    if (running) draw();
  });

  document.documentElement.addEventListener('themechange', function() {
    initPoints();
  });

  function draw() {
    if (!running) return;
    time += 0.004;
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      var px = p.bx + Math.sin(time * p.speed + p.phaseX) * p.ampX;
      var py = p.by + Math.cos(time * p.speed * 0.7 + p.phaseY) * p.ampY;
      var radius = Math.max(W, H) * 0.6;
      var grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
      var alpha = 0.05 + Math.sin(time * p.speed * 0.5 + p.phaseX) * 0.02;
      grad.addColorStop(0, 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + alpha + ')');
      grad.addColorStop(0.4, 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (alpha * 0.5) + ')');
      grad.addColorStop(1, 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
    requestAnimationFrame(draw);
  }
  draw();
})();
