/* ==================== SABLE INTERACTIF ==================== */
(() => {
  const canvas = document.querySelector('.sand-canvas');
  const clearButton = document.querySelector('[data-sand-clear]');
  if (!canvas || !clearButton) return;

  const context = canvas.getContext('2d', { alpha: true });
  const trailCanvas = document.createElement('canvas');
  const trailContext = trailCanvas.getContext('2d', { alpha: true });
  if (!context || !trailContext) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { active: false, x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let lastPoint = null;
  let animationFrame = 0;
  let grains = [];

  /* ==================== DIMENSIONS & GRAINS ==================== */
  function seedGrains() {
    const amount = Math.min(170, Math.round((width * height) / 2100));
    grains = Array.from({ length: amount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.25 + 0.35,
      alpha: Math.random() * 0.25 + 0.08,
      drift: Math.random() * 0.12 + 0.03,
    }));
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    trailCanvas.width = canvas.width;
    trailCanvas.height = canvas.height;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    trailContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    seedGrains();
    drawGrains(false);
  }

  /* ==================== DESSIN DES SILLONS ==================== */
  function drawGrains(animate) {
    context.clearRect(0, 0, width, height);
    context.drawImage(trailCanvas, 0, 0, trailCanvas.width, trailCanvas.height, 0, 0, width, height);
    grains.forEach((grain) => {
      if (animate && !reducedMotion) grain.x += grain.drift;
      if (grain.x > width) grain.x = 0;
      context.beginPath();
      context.arc(grain.x, grain.y, grain.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(128, 91, 47, ${grain.alpha})`;
      context.fill();
    });
  }

  function paintStroke(from, to) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / 4));
    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      const x = from.x + (to.x - from.x) * progress;
      const y = from.y + (to.y - from.y) * progress;
      const widthOfMark = 3.2 + Math.sin(x * 0.032) * 1.1;
      trailContext.beginPath();
      trailContext.ellipse(x, y, widthOfMark, 1.5, -0.12, 0, Math.PI * 2);
      trailContext.fillStyle = 'rgba(112, 77, 39, 0.19)';
      trailContext.fill();
      trailContext.beginPath();
      trailContext.ellipse(x, y - 2.2, widthOfMark * 0.72, 0.7, -0.12, 0, Math.PI * 2);
      trailContext.fillStyle = 'rgba(255, 255, 240, 0.29)';
      trailContext.fill();
    }
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  canvas.addEventListener('pointerdown', (event) => {
    pointer.active = true;
    canvas.setPointerCapture(event.pointerId);
    lastPoint = pointFromEvent(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!pointer.active || !lastPoint) return;
    const nextPoint = pointFromEvent(event);
    paintStroke(lastPoint, nextPoint);
    lastPoint = nextPoint;
  });
  const finishStroke = () => { pointer.active = false; lastPoint = null; };
  canvas.addEventListener('pointerup', finishStroke);
  canvas.addEventListener('pointercancel', finishStroke);
  canvas.addEventListener('lostpointercapture', finishStroke);

  /* ==================== LISSEUR & MOUVEMENT SUBTIL ==================== */
  clearButton.addEventListener('click', () => {
    trailContext.clearRect(0, 0, width, height);
    context.clearRect(0, 0, width, height);
    seedGrains();
    drawGrains(false);
  });

  if (!reducedMotion) {
    const animate = () => {
      drawGrains(true);
      animationFrame = window.requestAnimationFrame(animate);
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !animationFrame) animationFrame = window.requestAnimationFrame(animate);
      if (!entries[0].isIntersecting && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    });
    observer.observe(canvas);
  }

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(canvas);
  resizeCanvas();
})();
