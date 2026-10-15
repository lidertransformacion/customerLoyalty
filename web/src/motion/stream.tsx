import { motion, useAnimationFrame } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

export type StreamColor = "water" | "matcha" | "honey";

export type StreamSpec = {
  /** Spout and impact point, in pixels of the frame. */
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Thickness in pixels. */
  width: number;
  color: StreamColor;
  /** The hand moves the stream in circles over the bed: radius in pixels. 0 keeps it still. */
  spiral: number;
  /** Flow speed, 1 = water. Honey is slow. */
  speed?: number;
  /** Draw the falling column. Off when the photograph already shows it. */
  body?: boolean;
};

const PALETTE: Record<StreamColor, { body: string; core: string; edge: string; drop: string; wet: string; ripple: string }> = {
  water: { body: "rgba(235,245,255,0.16)", core: "rgba(255,255,255,0.55)", edge: "rgba(255,255,255,0.7)", drop: "rgba(255,255,255,0.6)", wet: "rgba(40,22,12,0.35)", ripple: "rgba(255,255,255,0.7)" },
  matcha: { body: "rgba(90,140,60,0.55)", core: "rgba(150,200,110,0.8)", edge: "rgba(210,240,180,0.7)", drop: "rgba(110,160,70,0.85)", wet: "rgba(80,130,50,0.3)", ripple: "rgba(200,235,170,0.8)" },
  honey: { body: "rgba(214,140,40,0.55)", core: "rgba(255,210,120,0.75)", edge: "rgba(255,240,200,0.8)", drop: "rgba(230,160,50,0.85)", wet: "rgba(120,60,10,0.25)", ripple: "rgba(255,220,140,0.7)" },
};

type Pt = { x: number; y: number };

function bezier(a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

/** Matcha dropping into milk: green tendrils bloom, sink and dissolve under the impact. */
function Swirl({ at, size }: { at: Pt; size: number }) {
  const blobs = Array.from({ length: 6 }, (_, i) => ({ dx: ((i * 29) % 15) - 7, delay: (i * 0.9) % 4, r: size * (1.6 + (i % 3) * 0.6), sink: size * (4 + (i % 4) * 2) }));
  return (
    <g style={{ filter: "blur(3px)", mixBlendMode: "multiply" }}>
      {blobs.map((blob, i) => (
        <motion.ellipse
          key={i}
          cx={at.x + blob.dx}
          rx={blob.r}
          ry={blob.r * 1.3}
          fill="rgba(90,150,60,0.55)"
          initial={{ cy: at.y, opacity: 0, scale: 0.3 }}
          animate={{ cy: [at.y, at.y + blob.sink * 0.5, at.y + blob.sink], opacity: [0, 0.75, 0], scale: [0.3, 1.2, 2.2] }}
          transition={{ duration: 4.5, delay: blob.delay, repeat: Infinity, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
    </g>
  );
}

let supportsBackdropUrl: boolean | null = null;
function backdropUrlSupported(): boolean {
  if (supportsBackdropUrl !== null) return supportsBackdropUrl;
  try {
    supportsBackdropUrl = (CSS.supports("backdrop-filter", "url(#x)") || CSS.supports("-webkit-backdrop-filter", "url(#x)")) && /Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent);
  } catch {
    supportsBackdropUrl = false;
  }
  return supportsBackdropUrl;
}

/**
 * A liquid that really falls. The stream bends toward an impact point that
 * circles over the bed, like a hand pouring. The background refracts through
 * it (Chromium), gooey drops travel down it, it splashes where it lands, the
 * bed darkens where it has been wet, and rings spread from the impact.
 */
export function Stream({ spec, uid }: { spec: StreamSpec; uid: string }) {
  const palette = PALETTE[spec.color];
  const speed = spec.speed ?? 1;
  const body = spec.body ?? true;
  const [refract] = useState(() => backdropUrlSupported());
  const pathRef = useRef<SVGPathElement>(null);
  const coreRef = useRef<SVGPathElement>(null);
  const edgeRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const dropRefs = useRef<(SVGCircleElement | null)[]>([]);
  const rippleRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const splashRef = useRef<SVGGElement>(null);
  const splashDrops = useRef<(SVGCircleElement | null)[]>([]);
  const wetRef = useRef<SVGEllipseElement>(null);
  const drops = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ t: (i / 9) % 1, size: 0.7 + ((i * 7) % 5) * 0.1 })), []);
  const ripples = useRef<{ x: number; y: number; born: number }[]>([]);
  const lag = useRef<Pt>({ ...spec.to });
  const clock = useRef(0);
  const lastRipple = useRef(0);
  const dash = useRef(0);

  useEffect(() => {
    lag.current = { ...spec.to };
  }, [spec.to]);

  useAnimationFrame((_, delta) => {
    const dt = Math.min(delta, 50) / 1000;
    clock.current += dt;
    const t = clock.current;
    // the impact point circles, radius breathing in and out
    const radius = spec.spiral * (0.55 + 0.45 * Math.sin(t * 0.55));
    const angle = t * 1.35 * speed;
    const impact: Pt = { x: spec.to.x + Math.cos(angle) * radius, y: spec.to.y + Math.sin(angle) * radius * 0.42 };
    const drop = spec.to.y - spec.from.y;
    const c1: Pt = { x: spec.from.x, y: spec.from.y + drop * 0.45 };
    const c2: Pt = { x: impact.x, y: impact.y - drop * 0.28 };

    // stream body
    const steps = 18;
    const center: Pt[] = [];
    for (let i = 0; i <= steps; i += 1) center.push(bezier(spec.from, c1, c2, impact, i / steps));
    const d = center.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    pathRef.current?.setAttribute("d", d);
    coreRef.current?.setAttribute("d", d);
    edgeRef.current?.setAttribute("d", d);
    dash.current -= dt * 140 * speed;
    coreRef.current?.setAttribute("stroke-dashoffset", dash.current.toFixed(1));
    if (clipRef.current) {
      const half = spec.width * 0.62;
      const left = center.map((p, i) => `${i === 0 ? "M" : "L"}${(p.x - half).toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
      const right = [...center].reverse().map((p) => `L${(p.x + half).toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
      clipRef.current.style.clipPath = `path("${left} ${right} Z")`;
    }

    // gooey drops travelling down
    drops.forEach((item, i) => {
      item.t += dt * 0.55 * speed * (0.8 + item.size * 0.3);
      if (item.t > 1) item.t -= 1;
      const p = bezier(spec.from, c1, c2, impact, item.t);
      const node = dropRefs.current[i];
      if (!node) return;
      node.setAttribute("cx", p.x.toFixed(1));
      node.setAttribute("cy", p.y.toFixed(1));
      node.setAttribute("r", (spec.width * 0.42 * item.size * (0.75 + 0.25 * Math.sin(t * 6 + i))).toFixed(2));
    });

    // splash follows the impact
    splashRef.current?.setAttribute("transform", `translate(${impact.x.toFixed(1)} ${impact.y.toFixed(1)})`);
    splashDrops.current.forEach((node, i) => {
      if (!node) return;
      const phase = (t * (1.6 + (i % 3) * 0.3) * speed + i * 0.37) % 1;
      const height = spec.width * (1.4 + (i % 4) * 0.5);
      const dx = ((i % 2 ? 1 : -1) * spec.width * (0.6 + (i % 5) * 0.35)) * phase;
      const dy = -Math.sin(phase * Math.PI) * height + phase * spec.width * 0.6;
      node.setAttribute("cx", dx.toFixed(1));
      node.setAttribute("cy", dy.toFixed(1));
      node.setAttribute("opacity", (phase < 0.85 ? 0.9 : 0.9 * (1 - (phase - 0.85) / 0.15)).toFixed(2));
    });

    // wet bed trails behind the impact
    lag.current = { x: lag.current.x + (impact.x - lag.current.x) * 0.06, y: lag.current.y + (impact.y - lag.current.y) * 0.06 };
    if (wetRef.current) {
      wetRef.current.setAttribute("cx", lag.current.x.toFixed(1));
      wetRef.current.setAttribute("cy", (lag.current.y + spec.width * 0.4).toFixed(1));
    }

    // rings
    if (t - lastRipple.current > 0.32 / speed) {
      lastRipple.current = t;
      ripples.current.push({ x: impact.x, y: impact.y + spec.width * 0.3, born: t });
      if (ripples.current.length > 6) ripples.current.shift();
    }
    rippleRefs.current.forEach((node, i) => {
      const ring = ripples.current[i];
      if (!node) return;
      if (!ring) {
        node.setAttribute("opacity", "0");
        return;
      }
      const age = (t - ring.born) / 0.9;
      if (age > 1) {
        node.setAttribute("opacity", "0");
        return;
      }
      const rx = spec.width * (0.8 + age * 4.2);
      node.setAttribute("cx", ring.x.toFixed(1));
      node.setAttribute("cy", ring.y.toFixed(1));
      node.setAttribute("rx", rx.toFixed(1));
      node.setAttribute("ry", (rx * 0.42).toFixed(1));
      node.setAttribute("opacity", (0.8 * (1 - age)).toFixed(2));
    });
  });

  const goo = `${uid}-goo`;
  const refractId = `${uid}-refract`;

  const swirl = spec.color === "matcha";
  return (
    <>
      {body && refract ? (
        <div
          ref={clipRef}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", backdropFilter: `url(#${refractId}) brightness(1.12) contrast(1.05)`, WebkitBackdropFilter: `url(#${refractId}) brightness(1.12)` }}
        />
      ) : body ? (
        <div ref={clipRef} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", backdropFilter: "blur(1.2px) brightness(1.15)", WebkitBackdropFilter: "blur(1.2px) brightness(1.15)" }} />
      ) : null}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
        <defs>
          <filter id={refractId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.09" numOctaves="2" seed="3" result="noise">
              <animate attributeName="baseFrequency" values="0.02 0.09;0.028 0.12;0.02 0.09" dur="1.6s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={Math.max(10, spec.width * 1.6)} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={goo} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(1.2, spec.width * 0.22)} result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -6" />
          </filter>
          <radialGradient id={`${uid}-dropfill`} cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="1" stopColor={palette.drop} />
          </radialGradient>
        </defs>
        <ellipse ref={wetRef} rx={spec.width * 3.2} ry={spec.width * 1.3} fill={palette.wet} style={{ filter: "blur(4px)" }} />
        {swirl ? <Swirl at={spec.to} size={spec.width} /> : null}
        {body ? (
          <>
            <path ref={pathRef} fill="none" stroke={palette.body} strokeWidth={spec.width} strokeLinecap="round" />
            <path ref={coreRef} fill="none" stroke={palette.core} strokeWidth={spec.width * 0.34} strokeLinecap="round" strokeDasharray={`${spec.width * 1.6} ${spec.width * 2.2}`} style={{ filter: "blur(0.4px)" }} />
            <path ref={edgeRef} fill="none" stroke={palette.edge} strokeWidth={Math.max(0.8, spec.width * 0.12)} strokeLinecap="round" transform={`translate(${-spec.width * 0.28} 0)`} opacity="0.8" />
            <g filter={`url(#${goo})`}>
              {drops.map((_, i) => (
                <circle key={i} ref={(node) => { dropRefs.current[i] = node; }} fill={`url(#${uid}-dropfill)`} />
              ))}
            </g>
          </>
        ) : null}
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse key={`r${i}`} ref={(node) => { rippleRefs.current[i] = node; }} fill="none" stroke={palette.ripple} strokeWidth="1" opacity="0" />
        ))}
        <g ref={splashRef}>
          {Array.from({ length: 10 }, (_, i) => (
            <circle key={`s${i}`} ref={(node) => { splashDrops.current[i] = node; }} r={Math.max(1, spec.width * (0.14 + (i % 3) * 0.08))} fill={palette.drop} />
          ))}
        </g>
      </svg>
    </>
  );
}
