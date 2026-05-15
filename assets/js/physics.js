(function () {
  const stage = document.querySelector(".folders-stage");
  if (!stage) return;
  const folders = Array.from(stage.querySelectorAll(".folder"));
  if (!folders.length) return;

  function fallbackStatic() {
    stage.classList.add("folders-stage--static");
    folders.forEach((f) => {
      f.style.transform = "";
      f.style.position = "";
    });
  }

  if (window.GKS && GKS.shouldSkipPhysics()) {
    fallbackStatic();
    return;
  }

  function start() {
    if (typeof Matter === "undefined") {
      fallbackStatic();
      return;
    }

    const { Engine, World, Bodies, Body } = Matter;

    const engine = Engine.create();
    engine.gravity.y = 0;
    engine.gravity.x = 0;
    // Tighter solver to reduce tunneling at high velocities
    engine.positionIterations = 10;
    engine.velocityIterations = 8;
    engine.constraintIterations = 4;
    const world = engine.world;

    let bounds = stage.getBoundingClientRect();
    function buildWalls() {
      const w = bounds.width;
      const h = bounds.height;
      const t = 400; // thick walls so nothing tunnels through
      return [
        Bodies.rectangle(w / 2, -t / 2, w + t * 2, t, { isStatic: true, restitution: 0.6 }),
        Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, { isStatic: true, restitution: 0.5 }),
        Bodies.rectangle(-t / 2, h / 2, t, h + t * 2, { isStatic: true, restitution: 0.6 }),
        Bodies.rectangle(w + t / 2, h / 2, t, h + t * 2, { isStatic: true, restitution: 0.6 }),
      ];
    }
    let walls = buildWalls();
    World.add(world, walls);

    const MAX_V = 18;
    function clampVelocity(b) {
      const vx = Math.max(-MAX_V, Math.min(MAX_V, b.velocity.x));
      const vy = Math.max(-MAX_V, Math.min(MAX_V, b.velocity.y));
      if (vx !== b.velocity.x || vy !== b.velocity.y) {
        Body.setVelocity(b, { x: vx, y: vy });
      }
    }

    // Keep a body inside the stage. Used during drag (hard) and as a safety net.
    function clampPosition(b) {
      const halfW = b._w / 2;
      const halfH = b._h / 2;
      const minX = halfW;
      const maxX = bounds.width - halfW;
      const minY = halfH;
      const maxY = bounds.height - halfH;
      const x = Math.max(minX, Math.min(maxX, b.position.x));
      const y = Math.max(minY, Math.min(maxY, b.position.y));
      if (x !== b.position.x || y !== b.position.y) {
        Body.setPosition(b, { x, y });
      }
    }

    // Bodies for each folder, scattered inside the stage and drifting
    const bodies = folders.map((el, i) => {
      const w = el.offsetWidth || 160;
      const h = el.offsetHeight || 138;
      const halfW = w / 2;
      const halfH = h / 2;
      const cols = Math.ceil(Math.sqrt(folders.length));
      const rows = Math.ceil(folders.length / cols);
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellW = (bounds.width - halfW * 2) / cols;
      const cellH = (bounds.height - halfH * 2) / Math.max(1, rows);
      const x = halfW + cellW * (col + 0.5) + (Math.random() * 30 - 15);
      const y = halfH + cellH * (row + 0.5) + (Math.random() * 30 - 15);
      const body = Bodies.rectangle(x, y, w * 0.82, h * 0.74, {
        chamfer: { radius: 14 },
        restitution: 0.85,
        friction: 0,
        frictionAir: 0.005,
        density: 0.0018,
        angle: (Math.random() - 0.5) * 0.4,
      });
      // Random initial drift velocity
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 2.2,
        y: (Math.random() - 0.5) * 2.2,
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);
      body._el = el;
      body._w = w;
      body._h = h;
      return body;
    });
    World.add(world, bodies);

    // Tiny periodic nudge so folders never fully settle
    const NUDGE_MS = 2400;
    let nudgeTimer = setInterval(() => {
      bodies.forEach((b) => {
        const speed = Math.hypot(b.velocity.x, b.velocity.y);
        if (speed < 0.6) {
          Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.0009,
            y: (Math.random() - 0.5) * 0.0009,
          });
        }
      });
    }, NUDGE_MS);

    const stagePos = () => stage.getBoundingClientRect();

    folders.forEach((el, i) => {
      el.addEventListener("pointerdown", (e) => {
        const dragInfo = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        el.classList.add("dragging");

        const body = bodies[i];
        const rect = stagePos();
        const startMouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const offset = { x: startMouse.x - body.position.x, y: startMouse.y - body.position.y };

        let lastT = performance.now();
        let lastP = { ...startMouse };
        Body.setAngularVelocity(body, 0);

        function onMove(ev) {
          const r = stagePos();
          const mx = ev.clientX - r.left;
          const my = ev.clientY - r.top;
          let targetX = mx - offset.x;
          let targetY = my - offset.y;

          // Clamp target to stage bounds so a fast drag can't push body off screen
          const halfW = body._w / 2;
          const halfH = body._h / 2;
          targetX = Math.max(halfW, Math.min(r.width - halfW, targetX));
          targetY = Math.max(halfH, Math.min(r.height - halfH, targetY));

          const now = performance.now();
          const dt = Math.max(1, now - lastT);
          let vx = ((mx - lastP.x) / dt) * 12;
          let vy = ((my - lastP.y) / dt) * 12;
          vx = Math.max(-MAX_V, Math.min(MAX_V, vx));
          vy = Math.max(-MAX_V, Math.min(MAX_V, vy));

          Body.setPosition(body, { x: targetX, y: targetY });
          Body.setVelocity(body, { x: vx, y: vy });
          lastP = { x: mx, y: my };
          lastT = now;
          if (Math.hypot(ev.clientX - dragInfo.x, ev.clientY - dragInfo.y) > 6) {
            dragInfo.moved = true;
          }
        }

        function onUp() {
          try { el.releasePointerCapture(e.pointerId); } catch (_) {}
          el.classList.remove("dragging");
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerup", onUp);
          el.removeEventListener("pointercancel", onUp);

          const dt = performance.now() - dragInfo.t;
          if (!dragInfo.moved && dt < 250) {
            const href = el.getAttribute("href");
            if (href) window.location.href = href;
          }
        }

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
        el.addEventListener("pointercancel", onUp);
        e.preventDefault();
      });

      el.addEventListener("dragstart", (e) => e.preventDefault());
    });

    function tick() {
      Engine.update(engine, 1000 / 60);
      bodies.forEach((b) => {
        clampVelocity(b);
        clampPosition(b);
        const el = b._el;
        const x = b.position.x - b._w / 2;
        const y = b.position.y - b._h / 2;
        const a = b.angle;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${a}rad)`;
      });
      rafId = requestAnimationFrame(tick);
    }
    let rafId = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
      const newBounds = stage.getBoundingClientRect();
      if (newBounds.width === bounds.width && newBounds.height === bounds.height) return;
      const sx = newBounds.width / Math.max(1, bounds.width);
      const sy = newBounds.height / Math.max(1, bounds.height);
      bodies.forEach((b) => {
        Body.setPosition(b, { x: b.position.x * sx, y: b.position.y * sy });
      });
      World.remove(world, walls);
      bounds = newBounds;
      walls = buildWalls();
      World.add(world, walls);
    });
    ro.observe(stage);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        clearInterval(nudgeTimer);
      } else {
        rafId = requestAnimationFrame(tick);
        nudgeTimer = setInterval(() => {
          bodies.forEach((b) => {
            const speed = Math.hypot(b.velocity.x, b.velocity.y);
            if (speed < 0.6) {
              Body.applyForce(b, b.position, {
                x: (Math.random() - 0.5) * 0.0009,
                y: (Math.random() - 0.5) * 0.0009,
              });
            }
          });
        }, NUDGE_MS);
      }
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(start));
  } else {
    requestAnimationFrame(start);
  }
})();
