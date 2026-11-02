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
      float edge = smoothstep(0.0, 0.17, uv.y) * smoothstep(0.0, 0.12, 1.0 - uv.y);
      vec3 deep = vec3(0.018, 0.115, 0.17);
      vec3 lagoon = vec3(0.025, 0.29, 0.34);
      vec3 light = vec3(0.38, 0.91, 0.82);
      vec3 water = mix(deep, lagoon, (0.5 + 0.5 * sin(f * 0.48 + 1.1)) * 0.75);
      water += light * (caustic * 0.58 + wide * 0.25 + shimmer) * edge;
      water += vec3(0.035, 0.1, 0.13) * uv.y;
      color = vec4(water, 1.0);
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
  canvas.addEventListener("pointerdown", (event) => {
    if (reduced.matches) return;
    const rect = canvas.getBoundingClientRect(),
      i = nextDrop++ % 5;
    data[i * 4] = (event.clientX - rect.left) / rect.width;
    data[i * 4 + 1] = 1 - (event.clientY - rect.top) / rect.height;
    data[i * 4 + 3] = 1;
    born[i] = performance.now();
    resume();
  });
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
  const skip = root.dataset.intro === "skip" || reduced.matches;
  try {
    localStorage.setItem("yggdrasil:config-builder:intro-seen", "yes");
  } catch {}
  if (skip) {
    hero.append(canvas);
    hero.classList.add("is-visible");
    stage.remove();
    copy?.remove();
    root.dataset.intro = "skip";
  }
  const surface = waterSurface();
  if (!skip) {
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
    };
    copy?.querySelectorAll(":scope > *").forEach((part, i) =>
      part.animate(
        [
          { opacity: 0, transform: "translateY(12px) scale(.96)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        { duration: 520, delay: i * 65, easing: EASE_OUT, fill: "both" },
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
          { duration: 220, easing: EASE_OUT, fill: "forwards" },
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
          { duration: 1280, easing: EASE_MORPH, fill: "forwards" },
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
          }, 800),
        );
        morph.finished.then(finish).catch(() => {});
      }, 560),
    );
    // Bounded fallback and immediate escape for reduced motion or a resized viewport.
    timers.push(setTimeout(finish, 2100));
    window.addEventListener("resize", finish);
    reduced.addEventListener("change", finish, { once: true });
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" || event.key === "Tab") finish();
      },
      { once: true },
    );
  }
}
