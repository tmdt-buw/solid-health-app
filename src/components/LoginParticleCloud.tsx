import { useEffect, useRef } from "react";

const POINT_COUNT = 96;
const NODE_COLORS = ["#cbd5e1", "#e2e8f0", "#f8fafc", "#93c5fd", "#bfdbfe"];

type Particle = {
  x: number;
  y: number;
  z: number;
  phase: number;
  color: string;
};

type ProjectedPoint = { x: number; y: number; z: number };
type Direction = { x: number; y: number; z: number };

const normalizeDirection = ({ x, y, z }: Direction): Direction => {
  const length = Math.hypot(x, y, z) || 1;
  return { x: x / length, y: y / length, z: z / length };
};

const SELF_DIRECTION = normalizeDirection({ x: -1, y: 0.04, z: 0.1 });

const getParticleDirection = (index: number, total: number): Direction => {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / Math.max(total - 1, 1)) * 2;
  const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = index * goldenAngle + 0.72;
  let direction = normalizeDirection({
    x: Math.cos(theta) * ringRadius,
    y: y * 0.64,
    z: Math.sin(theta) * ringRadius,
  });
  const selfDot =
    direction.x * SELF_DIRECTION.x +
    direction.y * SELF_DIRECTION.y +
    direction.z * SELF_DIRECTION.z;

  if (selfDot > 0.68) {
    direction = normalizeDirection({
      x: Math.abs(direction.x),
      y: direction.y * -0.8,
      z: direction.z,
    });
  }

  return direction;
};

const createParticles = (): Particle[] =>
  Array.from({ length: POINT_COUNT }, (_, index) => {
    const direction = getParticleDirection(index, POINT_COUNT);
    const sourceRadius = 0.92 + ((index * 17) % 19) / 100;
    return {
      x: direction.x * sourceRadius * 1.18,
      y: direction.y * sourceRadius * 0.74,
      z: direction.z * sourceRadius * 0.98,
      phase: index * 0.87,
      color: NODE_COLORS[index % NODE_COLORS.length],
    };
  });

const rotateAndProject = (
  point: Pick<Particle, "x" | "y" | "z">,
  yaw: number,
  pitch: number,
  width: number,
  height: number
): ProjectedPoint => {
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const xAfterYaw = point.x * cosYaw + point.z * sinYaw;
  const zAfterYaw = -point.x * sinYaw + point.z * cosYaw;
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const yAfterPitch = point.y * cosPitch - zAfterYaw * sinPitch;
  const zAfterPitch = point.y * sinPitch + zAfterYaw * cosPitch;
  const perspective = 1 + zAfterPitch * 0.12;
  const scale = Math.min(width, height) * 0.37;
  return {
    x: width / 2 + xAfterYaw * scale * perspective,
    y: height / 2 + yAfterPitch * scale * perspective,
    z: zAfterPitch,
  };
};

export default function LoginParticleCloud({ label }: { label: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const activateFallback = () => {
      host.classList.add("login-particle-cloud--fallback");
      return () => host.classList.remove("login-particle-cloud--fallback");
    };
    if (/jsdom/i.test(window.navigator.userAgent)) return activateFallback();

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext("2d");
    } catch {
      return activateFallback();
    }
    if (!context) return activateFallback();
    const drawingContext = context;
    host.appendChild(canvas);

    const particles = createParticles();
    const state = {
      width: 1,
      height: 1,
      yaw: 0.22,
      pitch: -0.06,
      targetYaw: 0.22,
      targetPitch: -0.06,
      dragging: false,
      lastX: 0,
      lastY: 0,
    };
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      state.width = Math.max(1, bounds.width);
      state.height = Math.max(1, bounds.height);
      canvas.width = Math.max(1, Math.round(state.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(state.height * pixelRatio));
      drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const drawSignal = (elapsed: number) => {
      const signal = [
        particles[13],
        { x: -0.52, y: 0.08, z: 0.09 },
        { x: -0.18, y: 0.08, z: 0.09 },
        { x: -0.08, y: -0.22, z: 0.09 },
        { x: 0.04, y: 0.31, z: 0.09 },
        { x: 0.16, y: -0.08, z: 0.09 },
        { x: 0.5, y: -0.06, z: 0.09 },
        particles[67],
      ].map((point) =>
        rotateAndProject(point, state.yaw, state.pitch, state.width, state.height)
      );
      const signalOpacity = reducedMotion?.matches
        ? 0.92
        : 0.78 + Math.sin(elapsed * 1.3) * 0.16;
      drawingContext.save();
      drawingContext.beginPath();
      signal.forEach((point, index) => {
        if (index === 0) drawingContext.moveTo(point.x, point.y);
        else drawingContext.lineTo(point.x, point.y);
      });
      drawingContext.lineWidth = 3;
      drawingContext.lineCap = "round";
      drawingContext.lineJoin = "round";
      drawingContext.strokeStyle = `rgba(255, 159, 67, ${signalOpacity})`;
      drawingContext.shadowColor = "rgba(255, 159, 67, .72)";
      drawingContext.shadowBlur = 10;
      drawingContext.stroke();
      drawingContext.restore();
    };

    const draw = (now: number) => {
      const elapsed = now / 1000;
      drawingContext.clearRect(0, 0, state.width, state.height);
      drawSignal(elapsed);
      particles
        .map((particle) => ({
          particle,
          point: rotateAndProject(
            particle,
            state.yaw,
            state.pitch,
            state.width,
            state.height
          ),
        }))
        .sort((left, right) => left.point.z - right.point.z)
        .forEach(({ particle, point }) => {
          // Rear nodes are hidden by the central sphere, matching the shared
          // catalog/tours login visualisation.
          if (point.z < -0.04) return;
          const pulse = reducedMotion?.matches
            ? 1
            : 1 + Math.sin(elapsed * 1.4 + particle.phase) * 0.08;
          const depth = Math.max(0.45, Math.min(1, 0.72 + point.z * 0.2));
          const radius = (2.2 + depth * 1.7) * pulse;
          drawingContext.beginPath();
          drawingContext.arc(point.x, point.y, radius * 2.3, 0, Math.PI * 2);
          drawingContext.fillStyle = `${particle.color}22`;
          drawingContext.fill();
          drawingContext.beginPath();
          drawingContext.arc(point.x, point.y, radius, 0, Math.PI * 2);
          drawingContext.fillStyle = particle.color;
          drawingContext.globalAlpha = depth;
          drawingContext.fill();
          drawingContext.globalAlpha = 1;
        });
    };

    const pointerDown = (event: PointerEvent) => {
      state.dragging = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      host.classList.add("is-dragging");
      host.setPointerCapture?.(event.pointerId);
    };
    const pointerMove = (event: PointerEvent) => {
      if (!state.dragging) return;
      state.targetYaw += (event.clientX - state.lastX) * 0.0075;
      state.targetPitch = Math.max(
        -0.82,
        Math.min(0.82, state.targetPitch + (event.clientY - state.lastY) * 0.005)
      );
      state.lastX = event.clientX;
      state.lastY = event.clientY;
    };
    const pointerUp = (event: PointerEvent) => {
      state.dragging = false;
      host.classList.remove("is-dragging");
      host.releasePointerCapture?.(event.pointerId);
    };

    host.addEventListener("pointerdown", pointerDown);
    host.addEventListener("pointermove", pointerMove);
    host.addEventListener("pointerup", pointerUp);
    host.addEventListener("pointercancel", pointerUp);
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(host);
    window.addEventListener("resize", resize);
    resize();

    let animationFrame = 0;
    const render = (now: number) => {
      if (!reducedMotion?.matches) state.targetYaw += 0.00054;
      state.yaw += (state.targetYaw - state.yaw) * 0.075;
      state.pitch += (state.targetPitch - state.pitch) * 0.075;
      draw(now);
      if (!reducedMotion?.matches) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      observer?.disconnect();
      host.removeEventListener("pointerdown", pointerDown);
      host.removeEventListener("pointermove", pointerMove);
      host.removeEventListener("pointerup", pointerUp);
      host.removeEventListener("pointercancel", pointerUp);
      canvas.remove();
    };
  }, []);

  return (
    <div className="login-visual-band" aria-hidden="true">
      <div className="login-particle-cloud" ref={hostRef} />
      <div className="login-particle-cloud__label">{label}</div>
    </div>
  );
}
