import { EASE_OUT, EASE_MORPH } from "./motion.js";

const canvas = document.querySelector("#caustic-water");
const hero = document.querySelector(".caustic-hero");
const stage = document.querySelector("#loading-screen");
const copy = document.querySelector("#loading-copy");
const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let morph,
  animatedView,
  transitioning = false;

function waterSurface() {
  let gl;
  try {
    gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
  } catch {}
  if (!gl) {
    canvas.classList.add("caustic-fallback");
    return { resize() {} };
  }
  const vertex = `#version 300 es
    in vec2 position;
    out vec2 uv;
    void main() { uv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`;
  const fragment = `#version 300 es
    precision highp float;
    in vec2 uv;
    out vec4 color;
    uniform vec2 resolution;
    uniform float time;
    uniform vec4 ripples[5];
    float field(vec2 p, float t) {
      p += 0.24 * vec2(sin(p.y * 1.7 + t), cos(p.x * 1.45 - t * 0.83));
      float a = sin(p.x * 1.15 + t * 0.45) + sin(p.y * 1.38 - t * 0.58);
      float b = sin((p.x + p.y) * 0.92 + t * 0.36) + sin((p.x - p.y) * 1.12 - t * 0.31);
      float c = sin(length(p * vec2(0.82, 1.1) - vec2(2.4, 1.8)) * 1.18 - t * 0.5);
      return a + b * 0.72 + c * 0.5;
    }
    void main() {
      float aspect = resolution.x / resolution.y;
      vec2 refraction = vec2(0.0);
      float shimmer = 0.0;
      for (int i = 0; i < 5; i++) {
        vec4 drop = ripples[i];
        vec2 delta = (uv - drop.xy) * vec2(aspect, 1.0);
        float distance = length(delta);
        float age = drop.z;
        float front = distance - age * 0.27;
        float envelope = exp(-pow(front / 0.065, 2.0)) * exp(-age * 1.65);
        float wave = sin(front * 77.0) * envelope * smoothstep(0.0, 0.09, age) * drop.w;
        refraction += delta / max(distance, 0.001) * wave * 0.09;
        shimmer += wave * 0.028;
      }
      vec2 p = ((uv - 0.5) * vec2(aspect, 1.0) + refraction) * 8.0;
      float f = field(p, time);
      float caustic = pow(max(0.0, cos(f * 1.42)), 9.0);
      float wide = pow(max(0.0, cos(f * 0.7 + 1.2)), 5.0) * 0.2;
      // Thin, fast-moving threads make the surface read as clear water rather
      // than a flat gel; the glint layer adds small white-blue specks.
      float thin = pow(max(0.0, cos(f * 3.1 - time * 0.9)), 18.0) * 0.34;
      float glint = pow(max(0.0, sin(f * 6.4 + time * 2.6) * sin(p.x * 1.8 - p.y * 1.3 - time * 1.7)), 24.0);
      float sparkle = glint * (0.25 + caustic * 0.75);
      float pulse = 0.88 + 0.12 * sin(time * 1.6 + f * 0.4);
      float edge = smoothstep(0.0, 0.17, uv.y) * smoothstep(0.0, 0.12, 1.0 - uv.y);
      vec3 deep = vec3(0.010, 0.035, 0.105);
      vec3 azure = vec3(0.020, 0.165, 0.365);
      vec3 light = vec3(0.70, 0.94, 1.0);
      vec3 water = mix(deep, azure, (0.5 + 0.5 * sin(f * 0.48 + 1.1)) * 0.72);
      water += light * (caustic * 0.72 + wide * 0.16 + thin * 0.4 + shimmer) * edge * pulse;
      water += vec3(0.86, 0.97, 1.0) * sparkle * 0.5 * edge;
      water += vec3(0.008, 0.022, 0.055) * uv.y;
      color = vec4(min(water, vec3(1.0)), 1.0);
    }`;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  };
  const vs = compile(gl.VERTEX_SHADER, vertex),
    fs = compile(gl.FRAGMENT_SHADER, fragment);
  const program = vs && fs ? gl.createProgram() : null;
  if (program) {
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
  }
  if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    canvas.classList.add("caustic-fallback");
    return { resize() {} };
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, "resolution"),
    clock = gl.getUniformLocation(program, "time"),
    drops = gl.getUniformLocation(program, "ripples[0]");
  const data = new Float32Array(20),
    born = Array(5).fill(-Infinity);
  let nextDrop = 0,
    frame = 0,
    visible = true,
    size = { width: innerWidth, height: innerHeight };
  const start = performance.now();
  function draw(now) {
    frame = 0;
    if (!visible || document.hidden) return;
    const view = animatedView?.() || size;
    gl.uniform2f(resolution, view.width, view.height);
    gl.uniform1f(clock, reduced.matches ? 0 : (now - start) * 0.00032);
    for (let i = 0; i < 5; i++)
      data[i * 4 + 2] = Math.min(10, (now - born[i]) / 1000);
    gl.uniform4fv(drops, data);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (!reduced.matches) frame = requestAnimationFrame(draw);
  }
  function resume() {
    if (!frame && visible && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  function resize() {
    if (transitioning) return;
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(
      devicePixelRatio || 1,
      1.5,
      Math.sqrt(2000000 / Math.max(1, bounds.width * bounds.height)),
    );
    size = {
      width: Math.max(1, bounds.width),
      height: Math.max(1, bounds.height),
    };
    canvas.width = Math.round(size.width * scale);
    canvas.height = Math.round(size.height * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    cancelAnimationFrame(frame);
    frame = 0;
    draw(performance.now());
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) resume();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else resume();
  });
  reduced.addEventListener("change", () => {
    data.fill(0);
    cancelAnimationFrame(frame);
    frame = 0;
    resume();
  });
  // Press-and-drag paints a trail of ripples; a plain click still drops one.
  // Pointer events cover mouse, pen and touch with a single code path.
  let dragging = false,
    lastDropAt = 0;
  const dropRipple = (clientX, clientY, now) => {
    const rect = canvas.getBoundingClientRect(),
      i = nextDrop++ % 5;
    data[i * 4] = (clientX - rect.left) / rect.width;
    data[i * 4 + 1] = 1 - (clientY - rect.top) / rect.height;
    data[i * 4 + 3] = 1;
    born[i] = now;
    lastDropAt = now;
    resume();
  };
  canvas.addEventListener("pointerdown", (event) => {
    if (reduced.matches) return;
    dragging = true;
    canvas.setPointerCapture?.(event.pointerId);
    dropRipple(event.clientX, event.clientY, performance.now());
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging || reduced.matches) return;
    const now = performance.now();
    // Throttle the trail so dragging feels continuous without flooding the
    // five ripple slots every frame.
    if (now - lastDropAt < 70) return;
    dropRipple(event.clientX, event.clientY, now);
  });
  const stopDragging = () => {
    dragging = false;
  };
  canvas.addEventListener("pointerup", stopDragging);
  canvas.addEventListener("pointercancel", stopDragging);
  canvas.addEventListener("lostpointercapture", stopDragging);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    frame = 0;
    canvas.classList.add("caustic-fallback");
  });
  resize();
  return { resize };
}

if (canvas && hero && stage) {
  // index.html already resolved the intro decision (including the ?intro
  // override and reduced-motion), so honour it here without a second check.
  const skip = root.dataset.intro === "skip";
  if (skip) {
    hero.append(canvas);
    hero.classList.add("is-visible");
    stage.remove();
    copy?.remove();
    root.dataset.intro = "skip";
  }
  const surface = waterSurface();
  if (!skip) {
    const holdDuration = 2100;
    const morphDuration = 1500;
    stage.style.setProperty("--intro-morph-duration", `${morphDuration}ms`);
    let done = false;
    const timers = [];
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      morph?.cancel();
      animatedView = null;
      transitioning = false;
      hero.append(canvas);
      hero.classList.add("is-visible");
      stage.remove();
      copy?.remove();
      root.dataset.intro = "done";
      surface.resize();
      window.removeEventListener("resize", finish);
      document.removeEventListener("keydown", skipOnKey);
      reduced.removeEventListener("change", finish);
    };
    const skipOnKey = (event) => {
      if (event.key === "Escape" || event.key === "Tab") finish();
    };
    const present = () => {
      if (done) return;
      copy?.querySelectorAll(":scope > *").forEach((part, i) =>
        part.animate(
          [
            { opacity: 0, transform: "translateY(12px) scale(.96)" },
            { opacity: 1, transform: "translateY(0) scale(1)" },
          ],
          { duration: 650, delay: i * 90, easing: EASE_OUT, fill: "both" },
        ),
      );
      timers.push(
        setTimeout(() => {
          if (done) return;
          const rect = hero.getBoundingClientRect();
          const full = { width: innerWidth, height: innerHeight };
          transitioning = true;
          Object.assign(stage.style, {
            inset: "auto",
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            transformOrigin: "0 0",
          });
          copy?.animate(
            [
              { opacity: 1, transform: "translateY(0)" },
              { opacity: 0, transform: "translateY(-8px)" },
            ],
            { duration: 350, easing: EASE_OUT, fill: "forwards" },
          );
          root.dataset.intro = "morphing";
          morph = stage.animate(
            [
              {
                transform: `translate(${-rect.left}px, ${-rect.top}px) scale(${full.width / rect.width}, ${full.height / rect.height})`,
                borderRadius: "0px",
              },
              {
                transform: "translate(0, 0) scale(1, 1)",
                borderRadius: getComputedStyle(hero).borderRadius,
              },
            ],
            { duration: morphDuration, easing: EASE_MORPH, fill: "forwards" },
          );
          animatedView = () => {
            const p = morph.effect.getComputedTiming().progress || 0;
            return {
              width: full.width + (rect.width - full.width) * p,
              height: full.height + (rect.height - full.height) * p,
            };
          };
          timers.push(
            setTimeout(() => {
              if (!done) root.dataset.intro = "revealed";
            }, 950),
          );
          morph.finished.then(finish).catch(() => {});
        }, holdDuration),
      );
    };
    // Start the visible hold after decoding; a slow or broken image never traps the UI.
    const mark = copy?.querySelector(".loading-mark");
    const decoded = mark?.decode?.().catch(() => {});
    Promise.race([
      decoded,
      new Promise((resolve) => timers.push(setTimeout(resolve, 900))),
    ]).then(present);
    timers.push(setTimeout(finish, holdDuration + morphDuration + 1400));
    window.addEventListener("resize", finish);
    reduced.addEventListener("change", finish, { once: true });
    document.addEventListener("keydown", skipOnKey);
  }
}
