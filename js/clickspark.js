(function () {
  'use strict';

  var defaults = {
    sparkColor: '#ffd700',
    sparkSize: 10,
    sparkRadius: 15,
    sparkCount: 8,
    duration: 400,
    easing: 'ease-out',
    extraScale: 1
  };

  var easingFunctions = {
    linear: function (t) { return t; },
    'ease-in': function (t) { return t * t; },
    'ease-in-out': function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
    'ease-out': function (t) { return t * (2 - t); }
  };

  function getEasing(name) {
    return easingFunctions[name] || easingFunctions['ease-out'];
  }

  var container = document.createElement('div');
  container.id = 'clickspark-container';
  container.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(container);

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block';
  container.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var sparks = [];
  var animId = null;
  var config = Object.assign({}, defaults);

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function draw(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sparks = sparks.filter(function (spark) {
      var elapsed = timestamp - spark.startTime;
      if (elapsed >= config.duration) return false;

      var progress = elapsed / config.duration;
      var eased = config._ease(progress);

      var distance = eased * config.sparkRadius * config.extraScale;
      var lineLength = config.sparkSize * (1 - eased);

      var x1 = spark.x + distance * Math.cos(spark.angle);
      var y1 = spark.y + distance * Math.sin(spark.angle);
      var x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      var y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      ctx.strokeStyle = config.sparkColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      return true;
    });

    if (sparks.length > 0) {
      animId = requestAnimationFrame(draw);
    } else {
      animId = null;
    }
  }

  function onDocumentClick(e) {
    var now = performance.now();
    var i;
    for (i = 0; i < config.sparkCount; i++) {
      sparks.push({
        x: e.clientX,
        y: e.clientY,
        angle: (2 * Math.PI * i) / config.sparkCount,
        startTime: now
      });
    }
    if (!animId) {
      animId = requestAnimationFrame(draw);
    }
  }

  document.addEventListener('click', onDocumentClick);

  window.initClickSpark = function (options) {
    if (options) {
      Object.keys(options).forEach(function (key) {
        config[key] = options[key];
      });
    }
    config._ease = getEasing(config.easing);
  };

  config._ease = getEasing(config.easing);
})();
