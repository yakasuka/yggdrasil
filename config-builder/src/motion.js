export const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
export const EASE_MORPH = "cubic-bezier(0.77, 0, 0.175, 1)";
export const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// Exact critically damped integration: retargets keep both position and velocity.
export function springStep(value, velocity, target, dt, response = 0.42) {
  const omega = (2 * Math.PI) / response;
  const offset = value - target;
  const impulse = (velocity + omega * offset) * dt;
  const decay = Math.exp(-omega * dt);
  return [
    target + (offset + impulse) * decay,
    (velocity - omega * impulse) * decay,
  ];
}

export function springPosition(update) {
  let x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    tx = 0,
    ty = 0,
    frame = 0,
    last = 0,
    initialized = false;
  function tick(now) {
    const dt = Math.min((now - last) / 1000 || 1 / 60, 0.064);
    last = now;
    [x, vx] = springStep(x, vx, tx, dt);
    [y, vy] = springStep(y, vy, ty, dt);
    const resting =
      Math.abs(tx - x) + Math.abs(ty - y) < 0.05 &&
      Math.abs(vx) + Math.abs(vy) < 0.2;
    if (resting) {
      x = tx;
      y = ty;
    }
    update(x, y);
    frame = resting ? 0 : requestAnimationFrame(tick);
  }
  return (nextX, nextY) => {
    tx = nextX;
    ty = nextY;
    if (!initialized || reducedMotion()) {
      initialized = true;
      cancelAnimationFrame(frame);
      frame = 0;
      vx = vy = 0;
      x = tx;
      y = ty;
      update(x, y);
    } else if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };
}

export function enterPanel(panel) {
  if (reducedMotion()) return;
  panel.animate(
    [
      { opacity: 0, transform: "translateY(7px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: 280, easing: EASE_OUT },
  );
}

export function progressCursor(nav) {
  const cursor = document.createElement("span");
  cursor.className = "step-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML =
    '<svg viewBox="0 0 20 20" fill="none"><path d="M3 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  nav.append(cursor);
  let target;
  const move = springPosition((x, y) => {
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
  function position() {
    if (!target) return;
    const parent = nav.getBoundingClientRect(),
      child = target.getBoundingClientRect();
    const horizontal = matchMedia("(max-width: 680px)").matches;
    move(
      horizontal ? child.left - parent.left + child.width / 2 - 9 : 0,
      horizontal ? 0 : child.top - parent.top + child.height / 2 - 9,
    );
  }
  new ResizeObserver(position).observe(nav);
  return (element) => {
    target = element;
    position();
  };
}

const cardMotion = new WeakMap();
export async function revealCard(slot, removing = false) {
  if (reducedMotion()) {
    if (removing) slot.remove();
    return;
  }
  const height = slot.getBoundingClientRect().height;
  const child = slot.firstElementChild,
    prior = getComputedStyle(child);
  const from = { opacity: prior.opacity, transform: prior.transform };
  const lease = {};
  cardMotion.set(slot, lease);
  slot.getAnimations().forEach((animation) => animation.cancel());
  child.getAnimations().forEach((animation) => animation.cancel());
  slot.style.overflow = "clip";
  const layout = slot.animate(
    [
      { height: `${removing ? height : 0}px` },
      { height: `${removing ? 0 : height}px` },
    ],
    { duration: removing ? 260 : 410, easing: EASE_OUT },
  );
  const content = child.animate(
    removing
      ? [from, { opacity: 0, transform: "translateY(-5px)" }]
      : [
          { opacity: 0, transform: "translateY(9px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
    { duration: removing ? 150 : 350, easing: EASE_OUT, fill: "both" },
  );
  try {
    await layout.finished;
  } catch {}
  if (cardMotion.get(slot) !== lease) return;
  if (removing) slot.remove();
  else {
    content.cancel();
    slot.style.overflow = "";
  }
}

let lastCelebration = -Infinity;
export function celebrate(button) {
  if (reducedMotion() || performance.now() - lastCelebration < 1400) return;
  const rect = button.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;
  lastCelebration = performance.now();
  canvas.className = "completion-confetti";
  canvas.setAttribute("aria-hidden", "true");
  const scale = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * scale;
  canvas.height = innerHeight * scale;
  context.scale(scale, scale);
  document.body.append(canvas);
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  const colors = [accent, "#80b8af", "#b6cbd0"];
  const pieces = Array.from({ length: 30 }, () => ({
    x: rect.left + rect.width / 2,
    y: rect.top + 8,
    vx: (Math.random() - 0.5) * 350,
    vy: -160 - Math.random() * 185,
    angle: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 10,
    width: 3 + Math.random() * 3,
    length: 5 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  let previous = start;
  function draw(now) {
    const age = (now - start) / 1000;
    if (age > 1.3 || document.hidden || reducedMotion()) {
      canvas.remove();
      return;
    }
    const dt = Math.min((now - previous) / 1000, 0.04);
    previous = now;
    context.clearRect(0, 0, innerWidth, innerHeight);
    context.globalAlpha = Math.max(
      0,
      1 - (Math.max(0, age - 0.65) / 0.65) ** 2,
    );
    for (const p of pieces) {
      p.vx *= Math.exp(-2.2 * dt);
      p.vy += 440 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      context.save();
      context.translate(p.x, p.y);
      context.rotate(p.angle);
      context.fillStyle = p.color;
      context.fillRect(-p.width / 2, -p.length / 2, p.width, p.length);
      context.restore();
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
