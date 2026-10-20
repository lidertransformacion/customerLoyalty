import type { CSSProperties, ReactNode } from "react";

/**
 * Living layers for the Chile menu, drawn in the PDF's own points so they sit
 * exactly on the cups, pans and glasses of the print. Each spread's photo
 * keeps its effects right above it and under the type.
 * Motion is CSS (see chile.css), so it runs on the compositor.
 */

type Pt = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };

export type Effect =
  | ({ kind: "steam"; w: number; rise?: number; count?: number; strength?: number } & Pt)
  | ({ kind: "bubbles"; count?: number; size?: number; tint?: string } & Box)
  | ({ kind: "drips"; count?: number } & Box)
  | ({ kind: "glint"; size?: number } & Pt)
  | ({ kind: "sweep"; tint?: string; every?: number } & Box)
  | ({ kind: "pour"; from: Pt; to: Pt; rx: number; ry: number })
  | ({ kind: "pulse"; r: number; color: string } & Pt)
  | ({ kind: "travel"; x0: number; x1: number; y: number; color: string; delay?: number });

/** Photo keys whose texture flows (liquid, silk). */
export const FLOW: Record<string, "silk" | "amber" | "matcha"> = {
  "p1-1": "silk",
  "p21-1": "silk",
  "p7-1": "amber",
  "p8-1": "matcha",
};

/** Photos that stay perfectly still because an effect is pinned to a detail of them. */
export const STILL = new Set(["p5-1"]);

const cups = (points: [number, number][], w = 40): Effect[] => points.map(([x, y]) => ({ kind: "steam", x, y, w }));
const glints = (points: [number, number][], size = 5): Effect[] => points.map(([x, y]) => ({ kind: "glint", x, y, size }));

/** Effects by photo key (drawn above that photo) and by spread (`s4`, drawn on top). */
export const EFFECTS: Record<string, Effect[]> = {
  "p1-1": [{ kind: "sweep", x: 21, y: 21, w: 666, h: 750, every: 7 }],
  "p21-1": [{ kind: "sweep", x: 21, y: 21, w: 666, h: 750, every: 8 }],
  "p3-1": [
    ...glints([[905, 330], [1052, 486], [1198, 300], [812, 560], [1105, 178], [960, 640], [1270, 520]], 6),
    { kind: "sweep", x: 687, y: 21, w: 665, h: 750, every: 9 },
  ],
  s4: [
    { kind: "pulse", x: 142, y: 287, r: 11, color: "#d9cfb0" },
    { kind: "pulse", x: 142, y: 380, r: 11, color: "#a9c4dc" },
    { kind: "pulse", x: 142, y: 462, r: 11, color: "#1d2e54" },
    { kind: "pulse", x: 142, y: 557, r: 11, color: "#c43c9c" },
    { kind: "travel", x0: 882, x1: 944, y: 289, color: "#cfc3a0", delay: 0 },
    { kind: "travel", x0: 882, x1: 946, y: 380, color: "#9dbbd6", delay: 0.6 },
    { kind: "travel", x0: 882, x1: 1006, y: 463, color: "#1d2e54", delay: 1.2 },
    { kind: "travel", x0: 882, x1: 1068, y: 547, color: "#c43c9c", delay: 1.8 },
    { kind: "travel", x0: 882, x1: 1127, y: 631, color: "#8a7a45", delay: 2.4 },
  ],
  "p5-1": [
    { kind: "pour", from: { x: 492, y: 278 }, to: { x: 456, y: 598 }, rx: 150, ry: 46 },
    { kind: "steam", x: 340, y: 540, w: 90, rise: 150, count: 4 },
    { kind: "steam", x: 560, y: 560, w: 70, rise: 130 },
  ],
  "p6-1": [
    ...cups([[290, 335], [375, 410], [205, 490], [460, 510], [290, 640], [590, 645]], 70),
    { kind: "steam", x: 112, y: 315, w: 60 },
  ],
  "p6-2": cups([[1235, 205], [1133, 255], [1235, 325], [1135, 375], [1235, 440], [1133, 500], [1235, 545]], 38),
  "p7-1": [
    { kind: "bubbles", x: 40, y: 60, w: 640, h: 700, count: 26, size: 1.6 },
    ...glints([[300, 236], [420, 240], [610, 70], [230, 50]], 5),
  ],
  "p8-1": [{ kind: "drips", x: 30, y: 40, w: 650, h: 720, count: 14 }],
  "p8-2": [
    ...cups([[815, 468], [897, 552], [1015, 592]], 40),
    { kind: "bubbles", x: 955, y: 480, w: 45, h: 60, count: 6 },
    { kind: "bubbles", x: 1075, y: 505, w: 55, h: 75, count: 8 },
    { kind: "bubbles", x: 1170, y: 570, w: 55, h: 85, count: 9 },
  ],
  "p9-1": [
    { kind: "bubbles", x: 50, y: 430, w: 220, h: 330, count: 14, size: 2.4 },
    { kind: "bubbles", x: 450, y: 450, w: 220, h: 310, count: 14, size: 2.4 },
    { kind: "drips", x: 40, y: 410, w: 240, h: 330, count: 6 },
    { kind: "drips", x: 440, y: 430, w: 240, h: 320, count: 6 },
    ...glints([[470, 352], [45, 372], [228, 392], [600, 420]], 7),
  ],
  "p9-2": [
    { kind: "bubbles", x: 820, y: 580, w: 50, h: 90, count: 6 },
    { kind: "bubbles", x: 925, y: 590, w: 50, h: 80, count: 6 },
    { kind: "bubbles", x: 1032, y: 580, w: 50, h: 90, count: 6 },
    { kind: "bubbles", x: 1145, y: 580, w: 50, h: 90, count: 6 },
  ],
  "p10-1": [
    { kind: "bubbles", x: 70, y: 440, w: 180, h: 260, count: 12, size: 2 },
    { kind: "bubbles", x: 265, y: 345, w: 140, h: 230, count: 10, size: 2 },
    { kind: "bubbles", x: 430, y: 275, w: 130, h: 200, count: 9, size: 2 },
    { kind: "bubbles", x: 590, y: 235, w: 90, h: 180, count: 8, size: 1.8 },
    ...glints([[160, 414], [330, 324], [495, 257], [630, 212], [640, 190]], 6),
    { kind: "sweep", x: 21, y: 21, w: 666, h: 750, every: 8 },
  ],
  "p11-1": cups([[585, 268], [485, 545]], 95),
  "p11-2": cups([[1200, 355], [1035, 588]], 95),
  "p12-1": glints([[215, 512], [250, 495], [490, 590], [512, 612], [420, 436]], 5),
  "p12-2": [
    ...glints([[872, 330], [1030, 410], [1215, 480], [880, 660], [1240, 600]], 7),
    { kind: "sweep", x: 687, y: 21, w: 665, h: 750, every: 7 },
  ],
  "p13-1": glints([[432, 102], [490, 280], [565, 478], [632, 702]], 5),
  "p13-2": glints([[1135, 172], [1282, 552], [1310, 330], [1120, 430]], 5),
  "p14-1": [...cups([[125, 540], [630, 540]], 50), ...glints([[380, 556], [395, 548]], 5)],
  "p14-2": glints([[965, 140], [1235, 150], [1235, 410]], 5),
  "p15-1": cups([[630, 250]], 60),
  "p15-2": [...cups([[530, 468]], 75), ...glints([[612, 515]], 5)],
  "p15-3": cups([[340, 670]], 60),
  "p16-1": cups([[340, 565]], 60),
  "p16-2": cups([[1070, 158]], 60),
  "p16-3": [...cups([[1140, 590]], 70), ...glints([[1105, 655], [1180, 560]], 6)],
  "p17-1": glints([[580, 40], [530, 480], [505, 660]], 5),
  "p17-2": glints([[1200, 285], [1200, 572], [1160, 160]], 5),
  "p18-1": [
    { kind: "steam", x: 1110, y: 600, w: 220, rise: 260, count: 5, strength: 0.5 },
    { kind: "steam", x: 900, y: 470, w: 160, rise: 200, count: 4, strength: 0.4 },
    ...glints([[1320, 150], [1170, 60], [880, 60]], 6),
  ],
  "p19-1": cups([[250, 105], [452, 318], [372, 532]], 95),
};

/** Deterministic spread of values, so every visit looks the same. */
const rand = (i: number, salt = 1) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const css = (vars: Record<string, string | number>): CSSProperties => vars as CSSProperties;

function Steam({ x, y, w, rise = 110, count = 3, strength = 0.55 }: Extract<Effect, { kind: "steam" }>) {
  const wisps = Array.from({ length: count }, (_, i) => {
    const dx = (rand(i, x) - 0.5) * w * 0.7;
    const h = rise * (0.75 + rand(i, y) * 0.5);
    const sway = w * 0.18;
    const d = `M${x + dx} ${y} c ${-sway} ${-h * 0.3} ${sway} ${-h * 0.45} 0 ${-h * 0.62} s ${sway * 0.8} ${-h * 0.3} ${-sway * 0.4} ${-h * 0.38}`;
    return (
      <path
        key={i}
        d={d}
        className="ch-steam"
        strokeWidth={Math.max(4, w * 0.16)}
        style={css({ "--d": `${4.6 + rand(i, 3) * 2.2}s`, "--delay": `${-(rand(i, 9) * 6).toFixed(2)}s`, "--o": strength, "--dx": `${(rand(i, 5) - 0.5) * w * 0.3}px` })}
      />
    );
  });
  return <g filter={w >= 120 ? "url(#ch-soft-large)" : "url(#ch-soft)"}>{wisps}</g>;
}

function Bubbles({ x, y, w, h, count = 8, size = 2, tint = "255,255,255" }: Extract<Effect, { kind: "bubbles" }>) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const r = size * (0.5 + rand(i, w) * 0.9);
        return (
          <circle
            key={i}
            cx={x + rand(i, 2) * w}
            cy={y + h}
            r={r}
            className="ch-bubble"
            fill={`rgba(${tint},0.35)`}
            stroke={`rgba(${tint},0.85)`}
            strokeWidth={Math.max(0.4, r * 0.28)}
            style={css({ "--rise": `${-h * (0.55 + rand(i, 4) * 0.45)}px`, "--d": `${3.2 + rand(i, 6) * 3}s`, "--delay": `${-(rand(i, 8) * 6).toFixed(2)}s`, "--wob": `${(rand(i, 7) - 0.5) * 8}px` })}
          />
        );
      })}
    </g>
  );
}

function Drips({ x, y, w, h, count = 8 }: Extract<Effect, { kind: "drips" }>) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <g key={i} className="ch-drip" style={css({ "--fall": `${40 + rand(i, 3) * 90}px`, "--d": `${6 + rand(i, 4) * 6}s`, "--delay": `${-(rand(i, 5) * 10).toFixed(2)}s` })}>
          <ellipse cx={x + rand(i, 1) * w} cy={y + rand(i, 2) * h * 0.7} rx={2.2} ry={3.2} fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.75)" strokeWidth="0.6" />
          <ellipse cx={x + rand(i, 1) * w - 0.7} cy={y + rand(i, 2) * h * 0.7 - 1.2} rx={0.6} ry={0.9} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Glint({ x, y, size = 5 }: Extract<Effect, { kind: "glint" }>) {
  const s = size;
  const i = x + y;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ch-glint" style={css({ "--d": `${4.5 + rand(i, 2) * 3}s`, "--delay": `${-(rand(i, 3) * 6).toFixed(2)}s` })}>
        <circle r={s * 1.4} fill="rgba(255,250,235,0.55)" filter="url(#ch-soft-small)" />
        <path d={`M0 ${-s * 3} L${s * 0.45} ${-s * 0.45} L${s * 3} 0 L${s * 0.45} ${s * 0.45} L0 ${s * 3} L${-s * 0.45} ${s * 0.45} L${-s * 3} 0 L${-s * 0.45} ${-s * 0.45} Z`} fill="#fff" />
      </g>
    </g>
  );
}

function Sweep({ x, y, w, h, every = 8, id }: Extract<Effect, { kind: "sweep" }> & { id: string }) {
  return (
    <g clipPath={`url(#${id})`} style={{ mixBlendMode: "soft-light" }}>
      <clipPath id={id}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      <rect
        x={x - w * 0.5}
        y={y - h * 0.1}
        width={w * 0.45}
        height={h * 1.2}
        fill="url(#ch-sweep)"
        className="ch-sweep"
        style={css({ "--travel": `${w * 1.6}px`, "--d": `${every}s` })}
      />
    </g>
  );
}

function Pour({ from, to, rx, ry }: Extract<Effect, { kind: "pour" }>) {
  const stream = `M${from.x} ${from.y} Q ${from.x - 6} ${(from.y + to.y) / 2} ${to.x} ${to.y}`;
  return (
    <g>
      {/* light running down the water */}
      <path d={stream} className="ch-stream" stroke="rgba(255,255,255,0.85)" strokeWidth="2.4" strokeDasharray="14 46" fill="none" strokeLinecap="round" />
      <path d={stream} className="ch-stream fast" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeDasharray="6 30" fill="none" strokeLinecap="round" />
      {/* the kettle circles: the wet ring travels round the bed */}
      <ellipse cx={to.x - 10} cy={to.y - 6} rx={rx * 0.55} ry={ry * 0.55} className="ch-spiral" fill="none" stroke="rgba(255,240,220,0.5)" strokeWidth="5" strokeDasharray={`${rx * 0.6} ${rx * 2.6}`} filter="url(#ch-soft-small)" />
      <ellipse cx={to.x - 10} cy={to.y - 6} rx={rx * 0.32} ry={ry * 0.32} className="ch-spiral slow" fill="none" stroke="rgba(255,240,220,0.45)" strokeWidth="4" strokeDasharray={`${rx * 0.4} ${rx * 1.4}`} filter="url(#ch-soft-small)" />
      {/* where it lands */}
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={to.x} cy={to.y} rx={rx * 0.42} ry={ry * 0.42} className="ch-ripple" fill="none" stroke="rgba(255,245,230,0.75)" strokeWidth="1.6" style={css({ "--delay": `${-i * 0.7}s` })} />
      ))}
      {/* the bloom: gas escaping the fresh grounds */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = rand(i, 4) * Math.PI * 2;
        const d = Math.sqrt(rand(i, 6));
        return (
          <circle key={i} cx={to.x - 10 + Math.cos(a) * rx * d} cy={to.y - 4 + Math.sin(a) * ry * d} r={1.6 + rand(i, 7) * 2.2} className="ch-bloom" fill="rgba(255,236,210,0.35)" stroke="rgba(255,248,236,0.9)" strokeWidth="0.7" style={css({ "--d": `${2.4 + rand(i, 8) * 2}s`, "--delay": `${-(rand(i, 9) * 4).toFixed(2)}s` })} />
        );
      })}
    </g>
  );
}

function Pulse({ x, y, r, color }: Extract<Effect, { kind: "pulse" }>) {
  return (
    <g>
      {[0, 1].map((i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth="1.4" className="ch-pulse" style={css({ "--delay": `${-i * 1.4}s` })} />
      ))}
    </g>
  );
}

function Travel({ x0, x1, y, color, delay = 0 }: Extract<Effect, { kind: "travel" }>) {
  return <circle cx={x0} cy={y} r={3.2} fill={color} className="ch-travel" style={css({ "--travel": `${x1 - x0}px`, "--delay": `${delay}s` })} />;
}

const anchor = (effect: Effect): Pt => {
  if (effect.kind === "pour") return effect.to;
  if (effect.kind === "travel") return { x: effect.x0, y: effect.y };
  if ("w" in effect && "h" in effect) return { x: effect.x + effect.w / 2, y: effect.y + effect.h / 2 };
  return { x: effect.x, y: effect.y };
};

export function EffectLayer({ effects: all, scope, view }: { effects: Effect[] | undefined; scope: string; view: [number, number, number, number] }): ReactNode {
  const [vx, vy, vw, vh] = view;
  const margin = 60;
  const effects = all?.filter((effect) => {
    const { x, y } = anchor(effect);
    return x > vx - margin && x < vx + vw + margin && y > vy - margin && y < vy + vh + margin;
  });
  if (!effects?.length) return null;
  return (
    <g className="ch-fx" pointerEvents="none">
      {effects.map((effect, i) => {
        switch (effect.kind) {
          case "steam":
            return <Steam key={i} {...effect} />;
          case "bubbles":
            return <Bubbles key={i} {...effect} />;
          case "drips":
            return <Drips key={i} {...effect} />;
          case "glint":
            return <Glint key={i} {...effect} />;
          case "sweep":
            return <Sweep key={i} {...effect} id={`${scope}-sw${i}`} />;
          case "pour":
            return <Pour key={i} {...effect} />;
          case "pulse":
            return <Pulse key={i} {...effect} />;
          case "travel":
            return <Travel key={i} {...effect} />;
        }
      })}
    </g>
  );
}

/** Shared filters and gradients, mounted once per screen. */
export function ChileDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <filter id="ch-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="ch-soft-large" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="ch-soft-small" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <linearGradient id="ch-sweep" x1="0" y1="0" x2="1" y2="0.15">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff6e6" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* Textures that flow: the noise drifts, the photo follows it. Units are the photo's own pixels. */}
        <filter id="ch-flow-silk" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0009 0.0026" numOctaves="1" seed="4" result="noise" />
          <feOffset in="noise" result="moved">
            <animate attributeName="dx" values="0;140;0" dur="22s" repeatCount="indefinite" />
            <animate attributeName="dy" values="0;40;0" dur="17s" repeatCount="indefinite" />
          </feOffset>
          <feDisplacementMap in="SourceGraphic" in2="moved" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="ch-flow-amber" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0028 0.0036" numOctaves="1" seed="11" result="noise" />
          <feOffset in="noise" result="moved">
            <animate attributeName="dx" values="0;-80;0" dur="19s" repeatCount="indefinite" />
            <animate attributeName="dy" values="0;-120;0" dur="14s" repeatCount="indefinite" />
          </feOffset>
          <feDisplacementMap in="SourceGraphic" in2="moved" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="ch-flow-matcha" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0026 0.0032" numOctaves="1" seed="23" result="noise" />
          <feOffset in="noise" result="moved">
            <animate attributeName="dx" values="0;70;0" dur="18s" repeatCount="indefinite" />
            <animate attributeName="dy" values="0;-90;0" dur="15s" repeatCount="indefinite" />
          </feOffset>
          <feDisplacementMap in="SourceGraphic" in2="moved" scale="16" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
