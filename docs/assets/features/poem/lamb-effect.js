window.__registerSiteFeature(function(api) {
  var SLUG = 'poem/小羊';
  var GRASS_INTERVAL = 10000;
  var MAX_GRASS = 2;
  var MIN_GRASS_DISTANCE = 0.1;
  var MOVES_BEFORE_HUNGRY = 3;
  var WAIT_MIN = 1000;
  var WAIT_MAX = 3000;
  var JUMP_CHANCE = 0.3;
  var GRASS_AVOIDANCE = 60;

  var cleanupFns = [];
  var overlay = null;
  var lamb = null;
  var grasses = [];
  var grassTimer = null;
  var isMoving = false;
  var currentX = 0;
  var facingLeft = true;
  var isPink = false;
  var pinkJumps = 0;
  var movesSinceEat = 0;
  var heartTimer = null;
  var heartInterval = 100;

  function cleanup() {
    cleanupFns.forEach(function(fn) { fn(); });
    cleanupFns = [];
    if (grassTimer) { clearInterval(grassTimer); grassTimer = null; }
    if (heartTimer) { clearInterval(heartTimer); heartTimer = null; }
    if (overlay) { overlay.remove(); overlay = null; }
    lamb = null;
    grasses = [];
    isMoving = false;
    facingLeft = true;
    isPink = false;
    pinkJumps = 0;
    movesSinceEat = 0;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createOverlay() {
    var dialog = document.querySelector('.article-modal-dialog');
    if (!dialog) return;

    overlay = document.createElement('div');
    overlay.className = 'lamb-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    dialog.appendChild(overlay);

    lamb = document.createElement('div');
    lamb.className = 'lamb-sprite';
    lamb.textContent = '🐑';
    currentX = dialog.clientWidth / 2;
    lamb.style.left = currentX + 'px';
    overlay.appendChild(lamb);
  }

  function getDialogWidth() {
    var dialog = document.querySelector('.article-modal-dialog');
    return dialog ? dialog.clientWidth : 0;
  }

  function getBaseScale() {
    return facingLeft ? 1 : -1;
  }

  function isValidGrassPosition(x, width) {
    for (var i = 0; i < grasses.length; i++) {
      var distance = Math.abs(x - grasses[i].x) / width;
      if (distance < MIN_GRASS_DISTANCE) return false;
    }
    return true;
  }

  function spawnGrass() {
    if (!overlay || grasses.length >= MAX_GRASS) return;

    var dialog = document.querySelector('.article-modal-dialog');
    if (!dialog) return;
    var width = dialog.clientWidth;

    var x, attempts = 0;
    do {
      x = randomBetween(20, width - 40);
      attempts++;
    } while (!isValidGrassPosition(x, width) && attempts < 20);

    if (attempts >= 20) return;

    var rand = Math.random();
    var emoji = '☘️';
    if (rand < 1/10) emoji = '💌';
    else if(rand < 1/10+1/3) emoji = '🍀';

    var grass = document.createElement('div');
    grass.className = 'lamb-grass';
    grass.textContent = emoji;
    grass.style.left = x + 'px';
    grass.style.animationDelay = (Math.random() * 2000) + 'ms';
    overlay.appendChild(grass);
    grasses.push({ el: grass, x: x, type: emoji });
  }

  function isNearGrass(x) {
    for (var i = 0; i < grasses.length; i++) {
      if (Math.abs(x - grasses[i].x) < GRASS_AVOIDANCE) return true;
    }
    return false;
  }

  function getRandomTargetX() {
    var width = getDialogWidth();
    if (!width) return currentX;
    var x, attempts = 0;
    do {
      var range = width - 40;
      var u = Math.random();
      var bias = u * u;
      var offset = (Math.random() < 0.5 ? -1 : 1) * bias * range * 0.4;
      x = currentX + offset;
      x = Math.max(20, Math.min(width - 40, x));
      attempts++;
    } while (isNearGrass(x) && attempts < 30);
    return x;
  }

  function moveLambTo(targetX, callback) {
    if (!lamb || isMoving) return;
    isMoving = true;

    var width = getDialogWidth();
    if (!width) { isMoving = false; return; }

    var clampedX = Math.max(10, Math.min(width - 30, targetX));
    var distance = Math.abs(clampedX - currentX);
    var baseDuration = isPink ? 1200 : 2000;
    var duration = Math.max(baseDuration * 0.5, Math.min(baseDuration * 2, distance * 6));
    var goingRight = clampedX > currentX;

    facingLeft = !goingRight;
    lamb.style.transform = 'scaleX(' + getBaseScale() + ')';
    lamb.style.transition = 'left ' + duration + 'ms ease-in-out';
    lamb.style.left = clampedX + 'px';
    currentX = clampedX;

    setTimeout(function() {
      isMoving = false;
      if (callback) callback();
    }, duration);
  }

  function startHeartTimer() {
    if (heartTimer) clearInterval(heartTimer);
    heartTimer = setInterval(function() {
      if (isPink) {
        spawnHearts(1);
      } else {
        clearInterval(heartTimer);
        heartTimer = null;
      }
    }, heartInterval);
  }

  function doJump(callback) {
    if (!lamb) return;
    lamb.classList.add('is-jumping');
    setTimeout(function() {
      lamb.classList.remove('is-jumping');
      if (isPink) {
        pinkJumps++;
        if (pinkJumps >= 4) {
          isPink = false;
          pinkJumps = 0;
          movesSinceEat = 0;
          heartInterval = 100;
          if (heartTimer) { clearInterval(heartTimer); heartTimer = null; }
        } else {
          heartInterval += 100;
          startHeartTimer();
        }
      }
      if (callback) callback();
    }, 500);
  }

  function doLookAround(callback) {
    if (!lamb) return;
    var base = getBaseScale();
    lamb.style.transition = 'transform 0.4s ease-in-out';
    lamb.style.transform = 'scaleX(' + (-base) + ')';
    setTimeout(function() {
      lamb.style.transform = 'scaleX(' + base + ')';
      setTimeout(function() {
        lamb.style.transition = 'none';
        if (callback) callback();
      }, 400);
    }, 400);
  }

  function doEatRotate(callback) {
    if (!lamb) return;
    var base = getBaseScale();
    var rotateDir = -40;
    lamb.style.transition = 'transform 0.3s ease-in-out';
    lamb.style.transform = 'scaleX(' + base + ') rotate(' + rotateDir + 'deg)';
    setTimeout(function() {
      lamb.style.transition = 'transform 0.2s ease-in-out';
      lamb.style.transform = 'scaleX(' + base + ')';
      setTimeout(function() {
        lamb.style.transition = 'none';
        if (callback) callback();
      }, 200);
    }, 300);
  }

  function doFlip(callback) {
    if (!lamb) return;
    var base = getBaseScale();
    setTimeout(function() {
      lamb.style.transformOrigin = 'center 30%';
      lamb.style.transition = 'transform 0.35s linear';
      lamb.style.transform = 'scaleX(' + base + ') rotate(-360deg)';
      setTimeout(function() {
        lamb.style.transition = 'none';
        lamb.style.transform = 'scaleX(' + base + ')';
        lamb.style.transformOrigin = '';
        if (callback) callback();
      }, 350);
    }, 400);
  }

  function doTurnPink(callback) {
    isPink = true;
    pinkJumps = 0;
    heartInterval = 100;
    startHeartTimer();
    if (callback) callback();
  }

  function spawnHearts(count) {
    if (!lamb || !overlay) return;
    var lambRect = lamb.getBoundingClientRect();
    var overlayRect = overlay.getBoundingClientRect();
    var centerX = lambRect.left - overlayRect.left + lambRect.width / 2;
    var topY = lambRect.top - overlayRect.top;

    for (var i = 0; i < count; i++) {
      var heart = document.createElement('div');
      heart.className = 'lamb-heart';
      heart.textContent = '❤️';
      heart.style.left = (centerX + (Math.random() - 0.5) * 30) + 'px';
      heart.style.top = (topY - 10) + 'px';
      heart.style.animationDelay = (Math.random() * 200) + 'ms';
      overlay.appendChild(heart);
      setTimeout(function(el) { el.remove(); }.bind(null, heart), 1000);
    }
  }

  function findNearestGrass() {
    if (grasses.length === 0) return null;
    var nearest = null;
    var minDist = Infinity;
    for (var i = 0; i < grasses.length; i++) {
      var dist = Math.abs(currentX - grasses[i].x);
      if (dist < minDist) {
        minDist = dist;
        nearest = { index: i, grass: grasses[i], dist: dist };
      }
    }
    return nearest;
  }

  function scheduleNextAction() {
    var waitMin = isPink ? 300 : WAIT_MIN;
    var waitMax = isPink ? 800 : WAIT_MAX;
    var wait = randomBetween(waitMin, waitMax);
    var shouldJump = isPink ? true : Math.random() < JUMP_CHANCE;

    setTimeout(function() {
      if (!lamb) return;

      if (isPink) {
        doRandomMove(shouldJump);
        return;
      }

      var isHungry = movesSinceEat >= MOVES_BEFORE_HUNGRY && grasses.length > 0;

      if (isHungry) {
        movesSinceEat = 0;
        var nearest = findNearestGrass();
        if (!nearest) {
          doRandomMove(shouldJump);
          return;
        }
        doGoEat(nearest, shouldJump);
      } else {
        doRandomMove(shouldJump);
      }
    }, wait);
  }

  function doRandomMove(shouldJump) {
    var targetX = getRandomTargetX();
    moveLambTo(targetX, function() {
      movesSinceEat++;
      if (shouldJump) {
        doJump(function() {
          scheduleNextAction();
        });
      } else {
        scheduleNextAction();
      }
    });
  }

  function doGoEat(nearest, shouldJump) {
    var target = nearest.grass;
    var goingRight = target.x > currentX;
    var offset = goingRight ? -25 : 25;

    moveLambTo(target.x + offset, function() {
      if (target.type === '🍀') {
        doLookAround(function() {
          doEatRotate(function() {
            removeGrass(nearest);
            doFlip(function() {
              if (shouldJump) {
                doJump(function() { scheduleNextAction(); });
              } else {
                scheduleNextAction();
              }
            });
          });
        });
      } else if (target.type === '💌') {
        doEatRotate(function() {
          doTurnPink(function() {
            removeGrass(nearest);
            scheduleNextAction();
          });
        });
      } else {
        doEatRotate(function() {
          removeGrass(nearest);
          if (shouldJump) {
            doJump(function() { scheduleNextAction(); });
          } else {
            scheduleNextAction();
          }
        });
      }
    });
  }

  function removeGrass(nearest) {
    if (!nearest || !nearest.grass || !nearest.grass.el) return;
    var idx = grasses.indexOf(nearest.grass);
    if (idx >= 0) {
      nearest.grass.el.remove();
      grasses.splice(idx, 1);
    }
  }

  api.onArticleOpen(function(payload) {
    cleanup();
    if (payload.slug !== SLUG) return;

    createOverlay();
    if (!overlay) return;

    for (var i = 0; i < 2; i++) {
      setTimeout(spawnGrass, i * 2000);
    }

    grassTimer = setInterval(spawnGrass, GRASS_INTERVAL);
    cleanupFns.push(function() { clearInterval(grassTimer); grassTimer = null; });

    scheduleNextAction();
  });

  api.onArticleClose(function() { cleanup(); });
});
