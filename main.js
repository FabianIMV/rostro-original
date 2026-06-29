/* ============================================================
   Mira por ti mismo · The Headless Way
   Vanilla JS + GSAP/ScrollTrigger + Lenis + WebGL fog.
   ============================================================ */

(function () {
  "use strict";

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ------------------------------------------------------------
     1. Scroll suave (Lenis)
  ------------------------------------------------------------ */
  let lenis = null;
  if (!prefersReduced && window.Lenis) {
    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
    }
  }

  /* ------------------------------------------------------------
     2. Reveals por escena (GSAP + ScrollTrigger)
  ------------------------------------------------------------ */
  function setupReveals() {
    if (!window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);

    const scenes = gsap.utils.toArray(".scene");

    scenes.forEach((scene) => {
      const items = scene.querySelectorAll("[data-reveal]");
      const late = scene.querySelectorAll("[data-reveal-late]");

      gsap.to(items, {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 1.6,
        ease: "power2.out",
        stagger: 0.5,
        scrollTrigger: {
          trigger: scene,
          start: "top 62%",
          toggleActions: "play none none reverse",
        },
      });

      // Texto "tardío" (p. ej. la segunda pregunta de la escena núcleo):
      // aparece tras una pausa larga, invitando a sostener la mirada.
      if (late.length) {
        gsap.to(late, {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 2,
          ease: "power2.out",
          delay: 3.2,
          scrollTrigger: {
            trigger: scene,
            start: "top 55%",
            toggleActions: "play none none reverse",
          },
        });
      }
    });
  }

  /* Si no hay GSAP, revela todo de inmediato (degradación elegante). */
  function revealAllFallback() {
    document
      .querySelectorAll("[data-reveal], [data-reveal-late]")
      .forEach((el) => {
        el.style.opacity = "1";
        el.style.filter = "none";
        el.style.transform = "none";
      });
  }

  if (window.gsap && !prefersReduced) {
    setupReveals();
  } else {
    revealAllFallback();
  }

  /* ------------------------------------------------------------
     3. Botones: empezar y reiniciar
  ------------------------------------------------------------ */
  function scrollToScene(index) {
    const target = document.getElementById("scene-" + index);
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.8 });
    } else {
      target.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  const startBtn = document.getElementById("start-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => scrollToScene(1));
  }

  const restartBtn = document.getElementById("restart-btn");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      if (lenis) {
        lenis.scrollTo(0, { duration: 2 });
      } else {
        window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
      }
    });
  }

  /* ------------------------------------------------------------
     4. "Toca para confirmar" en escenas con data-tap
  ------------------------------------------------------------ */
  function setupTapCues() {
    const tapScenes = document.querySelectorAll(".scene[data-tap]");
    tapScenes.forEach((scene) => {
      const sceneIndex = parseInt(scene.dataset.scene, 10);
      const cue = document.createElement("button");
      cue.className = "tap-cue";
      cue.type = "button";
      cue.textContent = scene.dataset.tap;
      cue.setAttribute("data-reveal", "");
      scene.querySelector(".scene__inner").appendChild(cue);

      cue.addEventListener("click", () => {
        cue.classList.add("is-confirmed");
        cue.textContent = "✓";
        // Avanza con suavidad a la siguiente escena.
        setTimeout(() => scrollToScene(sceneIndex + 1), 450);
      });
    });
  }
  setupTapCues();

  /* ------------------------------------------------------------
     5. Punto de luz que sigue al puntero (refuerza "apuntar")
  ------------------------------------------------------------ */
  if (!prefersReduced) {
    const light = document.getElementById("pointer-light");
    if (light) {
      let tx = window.innerWidth / 2;
      let ty = window.innerHeight / 2;
      let cx = tx;
      let cy = ty;
      let visible = false;

      function move(x, y) {
        tx = x;
        ty = y;
        if (!visible) {
          visible = true;
          light.classList.add("is-visible");
        }
      }

      window.addEventListener(
        "pointermove",
        (e) => move(e.clientX, e.clientY),
        { passive: true }
      );
      window.addEventListener(
        "touchmove",
        (e) => {
          if (e.touches[0]) move(e.touches[0].clientX, e.touches[0].clientY);
        },
        { passive: true }
      );

      function follow() {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        light.style.transform = `translate(${cx}px, ${cy}px)`;
        requestAnimationFrame(follow);
      }
      follow();
    }
  }

  /* ------------------------------------------------------------
     6. Pista de scroll + barra de progreso
  ------------------------------------------------------------ */
  const scrollHint = document.getElementById("scroll-hint");
  const progressBar = document.getElementById("progress-bar");

  function onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const y = window.scrollY || doc.scrollTop;
    const ratio = max > 0 ? y / max : 0;

    if (progressBar) progressBar.style.width = (ratio * 100).toFixed(2) + "%";

    if (scrollHint) {
      // Visible salvo al principio del todo y casi al final.
      const show = y > 40 && ratio < 0.94;
      scrollHint.classList.toggle("is-visible", show);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  if (lenis) lenis.on("scroll", onScroll);
  onScroll();

  /* ------------------------------------------------------------
     7. Navegación por teclado (accesibilidad)
        Flechas / espacio / Re-Av para moverse entre escenas.
  ------------------------------------------------------------ */
  const sceneEls = Array.from(document.querySelectorAll(".scene"));
  function currentSceneIndex() {
    const mid = window.scrollY + window.innerHeight / 2;
    let best = 0;
    sceneEls.forEach((s, i) => {
      if (s.offsetTop <= mid) best = i;
    });
    return best;
  }
  window.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "button" || tag === "a" || tag === "input") return;

    if (["ArrowDown", "PageDown", " "].includes(e.key)) {
      e.preventDefault();
      scrollToScene(Math.min(currentSceneIndex() + 1, sceneEls.length - 1));
    } else if (["ArrowUp", "PageUp"].includes(e.key)) {
      e.preventDefault();
      scrollToScene(Math.max(currentSceneIndex() - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      scrollToScene(0);
    } else if (e.key === "End") {
      e.preventDefault();
      scrollToScene(sceneEls.length - 1);
    }
  });

  /* ------------------------------------------------------------
     8. Fondo WebGL: niebla luminosa lenta.
        Degrada al gradiente CSS si WebGL no está disponible
        o si el usuario pide movimiento reducido.
  ------------------------------------------------------------ */
  function initFog() {
    const canvas = document.getElementById("fog");
    if (!canvas) return;

    if (prefersReduced) {
      canvas.style.display = "none";
      return;
    }

    const gl =
      canvas.getContext("webgl", { antialias: false, alpha: true }) ||
      canvas.getContext("experimental-webgl");

    if (!gl) {
      // Sin WebGL: el gradiente CSS (body::before) ya cubre el fondo.
      canvas.style.display = "none";
      return;
    }

    const vert = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    // FBM de ruido de valor -> niebla suave que respira en índigo.
    const frag = `
      precision mediump float;
      uniform vec2  u_res;
      uniform float u_time;

      float hash(vec2 p){
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(vec2 p){
        float v = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++){
          v += amp * noise(p);
          p *= 2.0;
          amp *= 0.5;
        }
        return v;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / u_res.xy;
        vec2 p = uv;
        p.x *= u_res.x / u_res.y;

        float t = u_time * 0.025;            // muy lento
        vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t + 4.0));
        float f = fbm(p * 2.2 + q * 1.5 + t * 0.5);

        // Paleta profunda: negro azulado -> índigo tenue -> lila.
        vec3 deep   = vec3(0.039, 0.047, 0.094);
        vec3 indigo = vec3(0.090, 0.105, 0.215);
        vec3 lilac  = vec3(0.250, 0.215, 0.420);

        vec3 col = mix(deep, indigo, smoothstep(0.2, 0.8, f));
        col = mix(col, lilac, smoothstep(0.55, 1.0, f) * 0.5);

        // Halo central suave que sugiere profundidad / apertura.
        float d = distance(uv, vec2(0.5, 0.40));
        col += lilac * 0.12 * smoothstep(0.7, 0.0, d) * (0.6 + 0.4 * f);

        // Viñeta para los bordes.
        col *= smoothstep(1.25, 0.35, d);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("shader:", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) {
      canvas.style.display = "none";
      return;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");

    // Limita la densidad de píxeles en móvil para mantener fluidez.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    function resize() {
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();

    const start = performance.now();
    let raf = null;
    let running = true;

    function render(now) {
      if (!running) return;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    // Pausa el render cuando la pestaña no está visible (ahorro de batería).
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(render);
      }
    });
  }

  initFog();

  /* Refresca ScrollTrigger cuando todo (fuentes incl.) está listo. */
  window.addEventListener("load", () => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
