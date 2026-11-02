const canvas = document.querySelector("#caustic-water");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const introStarted = performance.now();
const gl = canvas?.getContext("webgl2", {
  alpha: false,
  antialias: false,
  powerPreference: "low-power",
});

if (canvas) {
  const loadingScreen = document.querySelector("#loading-screen");
  const hero = document.querySelector(".caustic-hero");
  const loadingMark = loadingScreen?.querySelector(".loading-mark");
  let firstOpen = true;
  try {
    firstOpen = localStorage.getItem("yggdrasil:config-builder:intro-seen") !== "yes";
  } catch {}
  const dismissLoadingScreen = async () => {
    if (!loadingScreen || loadingScreen.dataset.dismissed) return;
    loadingScreen.dataset.dismissed = "true";
    if (firstOpen) {
      const remaining = 2000 - (performance.now() - introStarted);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    try {
      localStorage.setItem("yggdrasil:config-builder:intro-seen", "yes");
    } catch {}
    if (hero) {
      hero.append(canvas);
      hero.classList.add("is-visible");
      if (firstOpen && !reducedMotion.matches) hero.classList.add("is-arriving");
      loadingScreen.classList.add("is-collapsing");
      const rect = hero.getBoundingClientRect();
      const clip = `inset(${Math.max(0, rect.top)}px ${Math.max(0, innerWidth - rect.right)}px ${Math.max(0, innerHeight - rect.bottom)}px ${Math.max(0, rect.left)}px round 10px)`;
      if (firstOpen && loadingScreen.animate && !reducedMotion.matches) {
        try {
          await loadingScreen.animate(
            [{ clipPath: "inset(0 round 0px)" }, { clipPath: clip }],
            { duration: 820, easing: "cubic-bezier(.2,.75,.25,1)", fill: "forwards" },
          ).finished;
        } catch {}
      }
    }
    loadingScreen.classList.add("is-loaded");
    window.setTimeout(() => loadingScreen.remove(), 700);
  };
  if (document.readyState === "complete") dismissLoadingScreen();
  else window.addEventListener("load", dismissLoadingScreen, { once: true });
  if (loadingScreen && loadingMark && matchMedia("(hover: hover) and (pointer: fine)").matches && !reducedMotion.matches) {
    loadingScreen.addEventListener("pointermove", (event) => {
      const bounds = loadingMark.getBoundingClientRect();
      const x = (event.clientX - (bounds.left + bounds.width / 2)) / innerWidth;
      const y = (event.clientY - (bounds.top + bounds.height / 2)) / innerHeight;
      loadingMark.style.setProperty("--tilt-x", `${Math.max(-1, Math.min(1, y * 9))}deg`);
      loadingMark.style.setProperty("--tilt-y", `${Math.max(-1, Math.min(1, -x * 9))}deg`);
    });
    loadingScreen.addEventListener("pointerleave", () => {
      loadingMark.style.setProperty("--tilt-x", "0deg");
      loadingMark.style.setProperty("--tilt-y", "0deg");
    });
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
  uniform vec2 ripple;
  uniform float rippleAge;
  float field(vec2 p, float t) {
    p += 0.24 * vec2(sin(p.y * 1.7 + t), cos(p.x * 1.45 - t * 0.83));
    float a = sin(p.x * 1.15 + t * 0.45) + sin(p.y * 1.38 - t * 0.58);
    float b = sin((p.x + p.y) * 0.92 + t * 0.36) + sin((p.x - p.y) * 1.12 - t * 0.31);
    float c = sin(length(p * vec2(0.82, 1.1) - vec2(2.4, 1.8)) * 1.18 - t * 0.5);
    return a + b * 0.72 + c * 0.5;
  }
  void main() {
    vec2 p = (uv - 0.5) * vec2(resolution.x / resolution.y, 1.0) * 8.0;
    float f = field(p, time);
    float caustic = pow(max(0.0, cos(f * 1.42)), 9.0);
    float wide = pow(max(0.0, cos(f * 0.7 + 1.2)), 5.0) * 0.2;
    float edge = smoothstep(0.0, 0.17, uv.y) * smoothstep(0.0, 0.12, 1.0 - uv.y);
    float d = distance(uv, ripple) * resolution.y;
    float pulse = sin(d * 0.105 - rippleAge * 13.0) * exp(-rippleAge * 1.55) * exp(-d * 0.004);
    pulse *= step(0.0, 1.0 - rippleAge) * 0.12;
    vec3 deep = vec3(0.018, 0.115, 0.17);
    vec3 lagoon = vec3(0.025, 0.29, 0.34);
    vec3 light = vec3(0.38, 0.91, 0.82);
    float depth = 0.5 + 0.5 * sin(f * 0.48 + 1.1);
    vec3 water = mix(deep, lagoon, depth * 0.75);
    water += light * (caustic * 0.58 + wide * 0.25 + pulse) * edge;
    water += vec3(0.035, 0.1, 0.13) * uv.y;
    color = vec4(water, 1.0);
  }`;

  if (gl) {
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, vertex);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    const program = vs && fs ? gl.createProgram() : null;
    if (program) {
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
    }
    if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
      canvas.classList.add("caustic-fallback");
    } else {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.useProgram(program);
      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const resolution = gl.getUniformLocation(program, "resolution");
      const clock = gl.getUniformLocation(program, "time");
      const ripple = gl.getUniformLocation(program, "ripple");
      const rippleAge = gl.getUniformLocation(program, "rippleAge");
      const start = performance.now();
      let ripplePoint = [-10, -10], rippleStart = -10;
      let visible = true, frame;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const scale = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = Math.max(1, Math.round(rect.width * scale));
        canvas.height = Math.max(1, Math.round(rect.height * scale));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(resolution, canvas.width, canvas.height);
        draw(performance.now());
      };
      const draw = (now) => {
        if (!visible && !reducedMotion.matches) return;
        const seconds = reducedMotion.matches ? 0 : (now - start) * 0.00032;
        gl.uniform1f(clock, seconds);
        gl.uniform2f(ripple, ripplePoint[0], ripplePoint[1]);
        gl.uniform1f(rippleAge, Math.max(0, (now - rippleStart) / 1000));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (!reducedMotion.matches && visible) frame = requestAnimationFrame(draw);
      };
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(frame);
        if (visible) draw(performance.now());
      });
      observer.observe(canvas);
      new ResizeObserver(resize).observe(canvas);
      canvas.addEventListener("pointerdown", (event) => {
        const rect = canvas.getBoundingClientRect();
        ripplePoint = [
          (event.clientX - rect.left) / rect.width,
          1 - (event.clientY - rect.top) / rect.height,
        ];
        rippleStart = performance.now();
      });
      reducedMotion.addEventListener("change", resize);
      resize();
    }
  } else canvas.classList.add("caustic-fallback");
}
