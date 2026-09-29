import confetti from 'canvas-confetti';

const CELEBRATION_COLORS = ['#ff6b9d', '#ffd700', '#c78bfa', '#38bdf8', '#34d399', '#f43f5e'];

function motionIsReduced() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function isMobileScreen() {
  return typeof window !== 'undefined' && window.matchMedia?.('(max-width: 768px)').matches;
}

function particleCount(count) {
  if (motionIsReduced()) return Math.max(4, Math.round(count * 0.18));
  return isMobileScreen() ? Math.round(count * 0.56) : count;
}

function emitConfetti(options) {
  confetti({ zIndex: 9999, disableForReducedMotion: true, ...options, particleCount: particleCount(options.particleCount || 0) });
}

// Celebratory Blast
export function blastConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fireBurst(particleRatio, opts) {
    emitConfetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fireBurst(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#ff6b9d', '#ffd700', '#c78bfa']
  });

  fireBurst(0.2, {
    spread: 60,
    colors: ['#38bdf8', '#34d399', '#f43f5e']
  });

  fireBurst(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#fbbf24', '#a855f7', '#ec4899']
  });

  fireBurst(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#ffffff', '#ffd700']
  });

  fireBurst(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#ff69b4', '#8b5cf6']
  });
}

// Side Fireworks Show
export function launchSideCannons(duration = 2500) {
  const end = Date.now() + duration;
  const colors = ['#c85e6f', '#d98b76', '#b78940', '#5d9c97', '#f7dd9c'];

  (function frame() {
    emitConfetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.75 },
      colors: colors,
      zIndex: 9999
    });
    emitConfetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.75 },
      colors: colors,
      zIndex: 9999
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// Heart Blast Confetti
export function blastHearts() {
  const hearts = confetti.shapeFromPath({
    path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
  });

  emitConfetti({
    shapes: [hearts],
    scalar: 2,
    particleCount: 40,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#ff4d6d', '#ff758f', '#ff8fa3', '#c9184a'],
    zIndex: 9999
  });
}

// Star Burst Confetti
export function blastStars() {
  const star = confetti.shapeFromPath({
    path: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'
  });

  emitConfetti({
    shapes: [star],
    scalar: 1.6,
    particleCount: 45,
    spread: 90,
    origin: { y: 0.5 },
    colors: ['#ffd700', '#fef08a', '#f59e0b', '#fbbf24'],
    zIndex: 9999
  });
}

// A short multi-burst show used for the first visit and major celebrations.
export function launchFireworksShow(duration = 2200) {
  if (typeof window === 'undefined' || document.visibilityState !== 'visible') return;
  const end = Date.now() + duration;
  const colors = CELEBRATION_COLORS;

  const burst = () => {
    const x = 0.12 + Math.random() * 0.76;
    const y = 0.12 + Math.random() * 0.4;
    emitConfetti({
      particleCount: 34,
      startVelocity: 34 + Math.random() * 16,
      spread: 75 + Math.random() * 30,
      scalar: isMobileScreen() ? 0.82 : 1,
      ticks: 180,
      gravity: 0.88,
      origin: { x, y },
      colors,
    });
    if (Date.now() < end) window.setTimeout(burst, isMobileScreen() ? 420 : 300);
  };

  burst();
}

export function launchWishCelebration() {
  emitConfetti({
    particleCount: 70,
    startVelocity: 46,
    spread: 90,
    scalar: isMobileScreen() ? 0.82 : 1.05,
    origin: { x: 0.5, y: 0.78 },
    colors: ['#ffd700', '#fef08a', '#ff6b9d', '#c78bfa'],
  });
  window.setTimeout(() => launchFireworksShow(1100), 140);
}
