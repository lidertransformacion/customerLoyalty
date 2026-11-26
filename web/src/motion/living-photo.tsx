import { motion, useTransform } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { Stream, type StreamColor } from "./stream";
import { useTilt } from "./tilt";
import { useReduced } from "./prefs";

export type Mood = "cold" | "pour" | "hot" | "fizz" | "still";

/** A point in percent of the photograph itself, not of the frame. */
export type Point = { x: number; y: number };
export type Region = { x: number; y: number; w: number; h: number };

export type PourSpec = { from: Point; to: Point; width: number; color: StreamColor; spiral?: number; speed?: number; /** false keeps only what happens where it lands: splash, rings, wet bed, swirl. The photograph already shows the stream. */ body?: boolean };

export type PhotoSpec = {
  src: string;
  mood: Mood;
  /** A real clip that plays muted in a loop over the still. The still is its poster and its fallback. */
  video?: string;
  /** Where the camera rests, as CSS object-position. */
  focus?: string;
  /** Liquids that fall. */
  pours?: PourSpec[];
  /** Where steam rises. */
  steam?: Point[];
  /** Glass that sweats. */
  sweat?: Region[];
  /** The outline of the glass, as a polygon: condensation and bubbles stay inside it. */
  shape?: Point[];
  /** Where bubbles rise. */
  fizz?: Region[];
  /** Filter coffee that drips: a drop forms under the dripper, falls and rings the coffee below. */
  drips?: { from: Point; to: Point }[];
  /** Honey or syrup that runs: along each path a thick, glossy thread creeps down and gathers into a drop. Width in percent of the photograph. */
  oozes?: { path: Point[]; width: number }[];
  /** Food: a little more colour and contrast, so the plate looks freshly served. */
  rich?: boolean;
  /** Glossy spots that catch the light now and then. */
  glints?: Point[];
  /** A soft light that crosses the photograph every few seconds. */
  sweep?: boolean;
  /** The photograph itself flows: silk that waves, liquid that drifts. */
  flow?: "silk" | "liquid";
  /** An ellipse of liquid that drifts on its own: the surface of a cup, the body of a glass. Percent of the photograph. */
  liquid?: Region;
  /** Plates without a ground: drawn whole on the page, no frame. */
  cutout?: boolean;
  /** A product shot on plain white: drawn whole on white paper, like a cut-out, never cropped or darkened. */
  studio?: boolean;
  /** Where the subject is inside a photograph with much white around it (percent of it): the product page frames it by this, so it fills the space. */
  crop?: Region;
  /** A wide, low subject in a square photograph (a row of boxes): the product page lets it span the screen's width. */
  wide?: boolean;
  /** Real pixels across the photograph; it is never shown much larger than this. */
  native?: number;
  /** Edges where the photograph was cut straight: they fade into the page. */
  fade?: { top?: number; right?: number; bottom?: number; left?: number };
};

/** The sharper copy of a photograph, for dense screens: name.jpg → name@2x.jpg. */
export function retina(src: string): string {
  return src.replace(/\.(jpg|webp)$/, "@2x.$1");
}

type Props = {
  photo: PhotoSpec;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  interactive?: boolean;
  drift?: boolean;
  radius?: number;
  testId?: string;
  /** Mood layers and video. Off for thumbnails, where only the photograph is needed. */
  effects?: boolean;
};

type Frame = { w: number; h: number; nw: number; nh: number };

/** Maps photo percentages to frame pixels for a cut-out drawn whole (object-fit: contain, centred). */
function containMapper(frame: Frame) {
  const a = frame.nw / frame.nh;
  const dw = a > frame.w / frame.h ? frame.w : frame.h * a;
  const dh = dw / a;
  const ox = (frame.w - dw) / 2;
  const oy = (frame.h - dh) / 2;
  return { px: (p: Point) => ({ x: ox + (p.x / 100) * dw, y: oy + (p.y / 100) * dh }), len: (pct: number) => (pct / 100) * dw };
}

/** Maps photo percentages to frame pixels, honoring object-fit: cover, the focus and the 12% zoom. */
function mapper(frame: Frame, focus: string) {
  const [fxRaw, fyRaw] = focus.split(/\s+/);
  const fx = parseFloat(fxRaw ?? "50") / 100;
  const fy = parseFloat(fyRaw ?? "50") / 100;
  const zoom = 1.12;
  const bw = frame.w * zoom;
  const bh = frame.h * zoom;
  const bx = -frame.w * 0.06;
  const by = -frame.h * 0.06;
  const a = frame.nw / frame.nh;
  let dw: number;
  let dh: number;
  if (a > bw / bh) {
    dh = bh;
    dw = dh * a;
  } else {
    dw = bw;
    dh = dw / a;
  }
  const ox = bx + (bw - dw) * fx;
  const oy = by + (bh - dh) * fy;
  return {
    px: (p: Point) => ({ x: ox + (p.x / 100) * dw, y: oy + (p.y / 100) * dh }),
    len: (pct: number) => (pct / 100) * dw,
  };
}

/**
 * A real photograph that lives. The camera drifts and tilts with the phone,
 * and on top of it liquids really fall, steam rises, glass sweats and drinks
 * fizz, each placed on the photograph itself so it lands in the right spot in
 * any frame.
 */
export function LivingPhoto({ photo, style, className, children, interactive = true, drift = true, radius = 24, testId, effects = true }: Props) {
  const reduced = useReduced();
  const tilt = useTilt(interactive && !reduced ? 6 : 0);
  const shiftX = useTransform(tilt.px, [0, 1], [10, -10]);
  const shiftY = useTransform(tilt.py, [0, 1], [8, -8]);
  const sheenX = useTransform(tilt.px, (v) => `${v * 100}%`);
  const sheenY = useTransform(tilt.py, (v) => `${v * 100}%`);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [visible, setVisible] = useState(true);
  const [videoOk, setVideoOk] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // the clip plays only while on screen, and only when motion is welcome
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // iOS only autoplays a clip that is muted at the element level, not just through React's property.
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    const tryPlay = () => {
      const promise = video.play();
      if (promise) promise.catch(() => setVideoOk(false));
    };
    if (visible && !reduced) {
      tryPlay();
      // Low Power Mode blocks autoplay; the first touch anywhere starts it.
      const onTouch = () => {
        if (video.paused) tryPlay();
      };
      window.addEventListener("touchstart", onTouch, { passive: true, once: true });
      window.addEventListener("pointerdown", onTouch, { passive: true, once: true });
      return () => {
        window.removeEventListener("touchstart", onTouch);
        window.removeEventListener("pointerdown", onTouch);
      };
    }
    video.pause();
    return undefined;
  }, [visible, reduced, photo.video]);
  const uid = useRef(`lp${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    const node = tilt.ref.current;
    const img = imgRef.current;
    if (!node || !img) return;
    const measure = () => {
      if (!img.naturalWidth) return;
      setFrame({ w: node.clientWidth, h: node.clientHeight, nw: img.naturalWidth, nh: img.naturalHeight });
    };
    measure();
    img.addEventListener("load", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    const io = new IntersectionObserver((entries) => setVisible(entries.some((entry) => entry.isIntersecting)), { rootMargin: "80px" });
    io.observe(node);
    return () => {
      img.removeEventListener("load", measure);
      ro.disconnect();
      io.disconnect();
    };
  }, [tilt.ref]);

  const map = frame ? (photo.cutout ? containMapper(frame) : mapper(frame, photo.focus ?? "50% 50%")) : null;
  const live = effects && !reduced && visible && map !== null;
  // On white paper (a cut-out, a studio shot) steam is grey and there is no cold haze: white on white shows nothing.
  const paper = !!(photo.cutout || photo.studio);
  const srcSet = /\.(jpg|webp)$/.test(photo.src) ? `${photo.src} 1x, ${retina(photo.src)} 2x` : undefined;
  const drifting = drift && !reduced && !videoOk;

  return (
    <motion.div
      ref={tilt.ref}
      className={className}
      data-testid={testId}
      style={{ position: "relative", overflow: photo.cutout ? "visible" : "hidden", borderRadius: photo.cutout ? 0 : radius, transformPerspective: 1000, rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: "preserve-3d", background: photo.cutout ? "transparent" : "#1b1612", ...style }}
    >
      {(photo.flow || photo.liquid || photo.steam?.length) && effects && !reduced ? <FlowFilters /> : null}
      <motion.div style={{ position: "absolute", inset: 0, x: shiftX, y: shiftY }}>
        <motion.div
          style={{ position: "absolute", inset: 0 }}
          animate={drifting ? (photo.cutout ? { y: [0, -3, 0] } : { scale: [1, 1.05, 1] }) : { scale: 1, y: 0 }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            ref={imgRef}
            src={photo.src}
            srcSet={srcSet}
            alt=""
            draggable={false}
            decoding="async"
            style={{ position: "absolute", ...(photo.fade ? fadeMask(photo.fade) : {}), ...(photo.cutout ? { inset: 0, width: "100%", height: "100%", objectFit: "contain" } : { inset: "-6%", width: "112%", height: "112%", objectFit: "cover", objectPosition: photo.focus ?? "50% 50%" }), maxWidth: "none", ...(photo.flow && effects && !reduced ? { filter: `url(#lp-flow-${photo.flow})` } : photo.rich ? { filter: "saturate(1.16) contrast(1.06)" } : {}) }}
          />
          {live && map && photo.liquid ? <Liquid region={photo.liquid} map={map} src={photo.src} srcSet={srcSet} /> : null}
        </motion.div>
        {photo.video && effects && !reduced ? (
          <motion.video
            ref={videoRef}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            poster={photo.src}
            onPlaying={() => setVideoOk(true)}
            onError={() => setVideoOk(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: videoOk ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: "absolute", inset: "-6%", width: "112%", maxWidth: "none", height: "112%", objectFit: "cover", objectPosition: photo.focus ?? "50% 50%", pointerEvents: "none" }}
            data-testid="living-video"
          >
            <source src={photo.video} type="video/mp4" />
            <source src={photo.video.replace(/\.mp4$/, ".webm")} type="video/webm" />
          </motion.video>
        ) : null}
        {live && map ? (
          <>
            {/* what happens on the glass and inside it keeps to the shape of the glass */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", ...(photo.shape?.length ? { clipPath: `polygon(${photo.shape.map((point) => { const at = map.px(point); return `${at.x.toFixed(1)}px ${at.y.toFixed(1)}px`; }).join(", ")})` } : {}) }}>
              {photo.sweat?.map((region, i) => <Sweat key={`sw${i}`} region={region} map={map} uid={`${uid}s${i}`} fog={!!photo.shape?.length} />)}
              {photo.fizz?.map((region, i) => <Fizz key={`fz${i}`} region={region} map={map} />)}
            </div>
            {!videoOk && photo.pours?.map((pour, i) => (
              <Stream key={`p${i}`} uid={`${uid}p${i}`} spec={{ from: map.px(pour.from), to: map.px(pour.to), width: Math.max(2.5, map.len(pour.width)), color: pour.color, spiral: map.len(pour.spiral ?? 0), body: pour.body ?? true, ...(pour.speed !== undefined ? { speed: pour.speed } : {}) }} />
            ))}
            {photo.oozes?.length ? <Ooze runs={photo.oozes.map((run) => ({ points: run.path.map((point) => map.px(point)), width: Math.max(3, map.len(run.width)) }))} uid={uid} /> : null}
            {photo.drips?.map((drip, i) => <Drip key={`dr${i}`} from={map.px(drip.from)} to={map.px(drip.to)} size={Math.max(2.2, map.len(0.9))} index={i} />)}
            {photo.steam?.map((point, i) => <Steam key={`st${i}`} at={map.px(point)} size={map.len(9)} index={i} paper={paper} />)}
            {photo.glints?.length ? <Glints points={photo.glints.map((point) => map.px(point))} size={map.len(1.6)} /> : null}
            {photo.sweep ? <Sweep /> : null}
          </>
        ) : null}
        {photo.mood === "cold" && live && !paper ? <ColdAir /> : null}
      </motion.div>
      <motion.div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(240px 160px at var(--mx) var(--my), rgba(255,255,255,0.2), rgba(255,255,255,0) 70%)", ["--mx" as string]: sheenX, ["--my" as string]: sheenY, mixBlendMode: "soft-light" }} />
      {children ? <div style={{ position: "absolute", inset: 0 }}>{children}</div> : null}
    </motion.div>
  );
}

type Map = ReturnType<typeof mapper>;

/**
 * Real steam: soft wisps that rise, swell, sway, turn and dissolve, torn by a drifting noise.
 * White that glows over a dark photograph. Over white paper it is the steam of a cup just served:
 * thin white threads with a breath of shade at their edge, slow and light, never a cloud of smoke.
 */
function Steam({ at, size, index, paper }: { at: Point; size: number; index: number; paper: boolean }) {
  const blobs = Array.from({ length: paper ? 5 : 7 }, (_, i) => ({
    dx: ((i * 37) % 21) - 10,
    s: size * (0.7 + ((i * 13) % 7) * 0.12),
    delay: ((i * (paper ? 0.9 : 0.47) + index * 0.31) % (paper ? 4.4 : 2.6)),
    duration: paper ? 4.6 + ((i * 7) % 5) * 0.4 : 3 + ((i * 7) % 5) * 0.35,
    sway: ((i % 2 ? 1 : -1) * (6 + ((i * 5) % 9))),
    turn: ((i % 3) - 1) * 14,
  }));
  // the box the wisps live in: the filter needs a real area to work on
  const bw = size * 6;
  const bh = size * (paper ? 9 : 7);
  const tone = paper
    ? "radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 42%, rgba(255,255,255,0) 72%)"
    : "radial-gradient(ellipse at 50% 55%, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.36) 40%, rgba(255,255,255,0) 70%)";
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", left: at.x - bw / 2, top: at.y - bh + size * 0.6, width: bw, height: bh, pointerEvents: "none", filter: paper ? "url(#lp-wisp) drop-shadow(0 0 2.5px rgba(96,84,74,0.34))" : "url(#lp-wisp)" }}
    >
      {blobs.map((blob, i) =>
        paper ? (
          // a thread, not a puff: narrow and tall, it thins as it climbs
          <motion.div
            key={i}
            style={{ position: "absolute", left: bw / 2 + blob.dx * 0.7 - blob.s * 0.19, top: bh - size * 0.6 - blob.s * 1.5, width: blob.s * 0.38, height: blob.s * 2.1, borderRadius: "50%", background: tone, filter: `blur(${Math.max(1.5, blob.s * 0.07)}px)` }}
            initial={{ opacity: 0, y: 0, x: 0, scaleX: 0.5, scaleY: 0.5, rotate: 0 }}
            animate={{ opacity: [0, 0.75, 0.5, 0], y: [0, -size * 1.6, -size * 3.8, -size * 6], x: [0, blob.sway * 0.5, -blob.sway * 0.4, blob.sway * 0.7], scaleX: [0.5, 0.8, 1.1, 1.5], scaleY: [0.5, 1, 1.25, 1.4], rotate: [0, blob.turn * 0.4, -blob.turn * 0.5, blob.turn] }}
            transition={{ duration: blob.duration, delay: blob.delay, repeat: Infinity, ease: "easeOut" }}
          />
        ) : (
          <motion.div
            key={i}
            style={{ position: "absolute", left: bw / 2 + blob.dx - blob.s * 0.4, top: bh - size * 0.6 - blob.s * 0.75, width: blob.s * 0.8, height: blob.s * 1.5, borderRadius: "50%", background: tone, filter: `blur(${Math.max(3, blob.s * 0.18)}px)`, mixBlendMode: "screen" }}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.4, rotate: 0 }}
            animate={{ opacity: [0, 0.6, 0.4, 0], y: [0, -size * 1.4, -size * 3.2, -size * 4.8], x: [0, blob.sway * 0.4, blob.sway, blob.sway * 0.6], scale: [0.4, 0.9, 1.4, 1.9], rotate: [0, blob.turn * 0.5, blob.turn, blob.turn * 1.4] }}
            transition={{ duration: blob.duration, delay: blob.delay, repeat: Infinity, ease: "easeOut" }}
          />
        ),
      )}
    </div>
  );
}

/**
 * Honey running. Along each path a thread of syrup creeps down, slowly, the way something thick moves:
 * amber and see-through, with the line of light that makes it look wet, and a heavy bead at its head that
 * gathers, hangs and lets go into the pool below. Each run keeps its own time, so they never fall together.
 */
function Ooze({ runs, uid }: { runs: { points: Point[]; width: number }[]; uid: string }) {
  // a smooth line through the points
  const line = (points: Point[]) =>
    points.reduce((d, point, i) => {
      if (i === 0) return `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      const before = points[i - 1]!;
      const my = (before.y + point.y) / 2;
      return `${d} C ${before.x.toFixed(1)} ${my.toFixed(1)}, ${point.x.toFixed(1)} ${my.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    }, "");
  return (
    <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <linearGradient id={`${uid}-honey`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9c5a0e" stopOpacity="0.8" />
          <stop offset="0.45" stopColor="#e7a02a" stopOpacity="0.86" />
          <stop offset="1" stopColor="#a8640f" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {runs.map((run, i) => {
        const d = line(run.points);
        const end = run.points[run.points.length - 1]!;
        const duration = 7.5 + i * 1.4;
        const loop = { duration, delay: i * 2.3, repeat: Infinity, repeatDelay: 1.8, ease: [0.5, 0.05, 0.75, 0.6] as [number, number, number, number] };
        return (
          <g key={i}>
            {/* the body of the thread: it grows down the path and then thins away from the top */}
            <motion.path d={d} fill="none" stroke={`url(#${uid}-honey)`} strokeWidth={run.width} strokeLinecap="round" initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }} animate={{ pathLength: [0, 0.55, 0.3, 0], pathOffset: [0, 0.2, 0.7, 1], opacity: [0, 0.95, 0.95, 0.6] }} transition={{ ...loop, times: [0, 0.4, 0.82, 1] }} />
            {/* the light on it */}
            <motion.path d={d} fill="none" stroke="#fff7e0" strokeWidth={Math.max(1, run.width * 0.22)} strokeLinecap="round" transform={`translate(${(-run.width * 0.2).toFixed(1)} 0)`} initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }} animate={{ pathLength: [0, 0.4, 0.22, 0], pathOffset: [0, 0.28, 0.74, 1], opacity: [0, 0.85, 0.8, 0] }} transition={{ ...loop, times: [0, 0.4, 0.82, 1] }} />
            {/* the bead at its head */}
            <motion.path d={d} fill="none" stroke="#c47a14" strokeOpacity={0.88} strokeWidth={run.width * 1.45} strokeLinecap="round" initial={{ pathLength: 0.001, pathOffset: 0, opacity: 0 }} animate={{ pathLength: 0.001, pathOffset: [0, 0.74, 0.985, 0.985], opacity: [0, 0.95, 0.95, 0] }} transition={{ ...loop, times: [0, 0.4, 0.82, 1] }} />
            <motion.path d={d} fill="none" stroke="#fff3d6" strokeOpacity={0.9} strokeWidth={run.width * 0.34} strokeLinecap="round" transform={`translate(${(-run.width * 0.3).toFixed(1)} ${(-run.width * 0.22).toFixed(1)})`} initial={{ pathLength: 0.001, pathOffset: 0, opacity: 0 }} animate={{ pathLength: 0.001, pathOffset: [0, 0.74, 0.985, 0.985], opacity: [0, 0.9, 0.9, 0] }} transition={{ ...loop, times: [0, 0.4, 0.82, 1] }} />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Filter coffee dripping, inside the carafe: under the dripper a fine thread of coffee, almost a line, with
 * small drops running down it one after another, and where they reach the coffee a faint ring that opens
 * and is gone. Quiet and thin: it is the last of a brew, not a tap.
 */
function Drip({ from, to, size, index }: { from: Point; to: Point; size: number; index: number }) {
  const fall = to.y - from.y;
  const drop = Math.max(1.6, size * 0.62);
  return (
    <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
      {/* the thread: barely there, it comes and goes */}
      <motion.line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#3a1c0b" strokeWidth={Math.max(0.8, drop * 0.34)} strokeLinecap="round" animate={{ opacity: [0.14, 0.38, 0.14] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }} />
      {[0, 1, 2].map((k) => (
        <motion.ellipse
          key={k}
          cx={from.x}
          rx={drop * 0.5}
          ry={drop * 0.8}
          fill="#2e1508"
          initial={{ cy: from.y, opacity: 0 }}
          animate={{ cy: [from.y, from.y + fall * 0.3, to.y], opacity: [0, 0.85, 0.7], ry: [drop * 0.6, drop * 0.85, drop * 1.15] }}
          transition={{ duration: 0.75, times: [0, 0.35, 1], ease: "easeIn", delay: k * 0.62 + index * 0.4, repeat: Infinity, repeatDelay: 1.1 }}
        />
      ))}
      {[0, 1, 2].map((k) => (
        <motion.ellipse
          key={`r${k}`}
          cx={to.x}
          cy={to.y}
          rx={drop * 3.4}
          ry={drop * 0.95}
          fill="none"
          stroke="rgba(214,168,120,0.55)"
          strokeWidth={0.9}
          initial={{ opacity: 0, scale: 0.15 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.15, 0.5, 1] }}
          transition={{ duration: 0.9, times: [0, 0.25, 1], ease: "easeOut", delay: k * 0.62 + index * 0.4 + 0.72, repeat: Infinity, repeatDelay: 0.95 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
    </svg>
  );
}

/** The liquid itself drifts: the same photograph, inside a soft ellipse, displaced by a slow noise. */
function Liquid({ region, map, src, srcSet }: { region: Region; map: Map; src: string; srcSet: string | undefined }) {
  const origin = map.px({ x: region.x, y: region.y });
  const w = map.len(region.w);
  const scaleY = map.px({ x: 0, y: 100 }).y - map.px({ x: 0, y: 0 }).y;
  const h = (region.h / 100) * scaleY;
  const top = map.px({ x: 0, y: 0 });
  const bottom = map.px({ x: 100, y: 100 });
  const mask = "radial-gradient(50% 50% at 50% 50%, #000 62%, rgba(0,0,0,0) 100%)";
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: origin.x, top: origin.y, width: w, height: h, overflow: "hidden", pointerEvents: "none", maskImage: mask, WebkitMaskImage: mask }}>
      <img src={src} srcSet={srcSet} alt="" draggable={false} style={{ position: "absolute", left: top.x - origin.x, top: top.y - origin.y, width: bottom.x - top.x, height: bottom.y - top.y, maxWidth: "none", filter: "url(#lp-liquid)" }} />
    </div>
  );
}

/**
 * A glass that is really cold. A fine frost fogs it and breathes; over it sit water drops as water looks on
 * glass: clear in the middle, a bright point of light up on one side, a darker rim below where the drop bends
 * what is behind it. Most are tiny and still. A few swell until they are too heavy, run down leaving a wet
 * track that dries, and form again.
 */
function Sweat({ region, map, uid, fog }: { region: Region; map: Map; uid: string; /** The glass is fogged too. Only where its outline is known: a fog without the shape of the glass is an oval floating on the photograph. */ fog: boolean }) {
  const origin = map.px({ x: region.x, y: region.y });
  const w = map.len(region.w);
  const scaleY = map.px({ x: 0, y: 100 }).y - map.px({ x: 0, y: 0 }).y;
  const hh = (region.h / 100) * scaleY;
  const unit = Math.max(1, map.len(1));
  // the fine dew: many, tiny, uneven; below the rim of the glass, where the drink is
  const dew = Array.from({ length: 30 }, (_, i) => ({
    x: (((i * 61 + 17) % 97) / 97) * 0.92 + 0.04,
    y: 0.2 + ((((i * 43) % 89) / 89) * 0.76),
    r: unit * (0.3 + ((i * 7) % 6) * 0.1),
    delay: (i * 0.37) % 6,
  }));
  // the heavy drops: fewer, larger, and they run
  const runs = Array.from({ length: 4 }, (_, i) => ({
    x: 0.1 + (((i * 29 + 11) % 83) / 83) * 0.8,
    y: 0.22 + (((i * 37) % 53) / 53) * 0.36,
    r: unit * (1.0 + (i % 3) * 0.22),
    fall: hh * (0.26 + (i % 4) * 0.08),
    delay: (i * 1.7) % 9,
    duration: 8 + (i % 3) * 1.6,
  }));
  return (
    <svg style={{ position: "absolute", left: origin.x, top: origin.y, width: w, height: hh, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        {/* the body of a drop: clear, lit from the upper left, shaded at its lower edge */}
        <radialGradient id={`${uid}-body`} cx="42%" cy="38%" r="62%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.8" stopColor="#101822" stopOpacity="0.26" />
          <stop offset="0.93" stopColor="#101822" stopOpacity="0.14" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.38" />
        </radialGradient>
        <linearGradient id={`${uid}-track`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.34" />
        </linearGradient>
      </defs>
      {/* a breath of fog on the glass: it fills the outline of the glass, which clips it */}
      {fog ? <motion.rect x={-w * 0.1} y={-hh * 0.05} width={w * 1.2} height={hh * 1.1} fill="#f4f9ff" animate={{ opacity: [0.05, 0.11, 0.05] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} /> : null}
      {dew.map((drop, i) => (
        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 1] }} transition={{ duration: 1.4, delay: drop.delay * 0.5 }}>
          <ellipse cx={drop.x * w} cy={drop.y * hh} rx={drop.r * 0.9} ry={drop.r} fill={`url(#${uid}-body)`} />
          <circle cx={drop.x * w - drop.r * 0.32} cy={drop.y * hh - drop.r * 0.38} r={Math.max(0.5, drop.r * 0.24)} fill="#fff" opacity="0.95" />
        </motion.g>
      ))}
      {runs.map((drop, i) => {
        const x = drop.x * w;
        const y = drop.y * hh;
        const times = [0, 0.5, 0.62, 0.92, 1];
        const loop = { duration: drop.duration, delay: drop.delay, repeat: Infinity, times, ease: "easeIn" as const };
        return (
          <g key={`r${i}`}>
            {/* the wet track it leaves, which dries */}
            <motion.rect x={x - drop.r * 0.28} y={y} width={drop.r * 0.56} rx={drop.r * 0.28} fill={`url(#${uid}-track)`} initial={{ height: 0, opacity: 0 }} animate={{ height: [0, 0, drop.fall * 0.3, drop.fall, drop.fall], opacity: [0, 0, 0.9, 0.7, 0] }} transition={loop} />
            <motion.g initial={{ y: 0, scale: 0.2, opacity: 0 }} animate={{ y: [0, 0, drop.fall * 0.3, drop.fall, drop.fall], scale: [0.2, 1, 1.08, 1, 0.9], opacity: [0, 1, 1, 1, 0] }} transition={loop} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              {/* heavy at the bottom, like a drop that hangs */}
              <path d={`M ${x} ${y - drop.r * 1.25} C ${x + drop.r * 0.95} ${y - drop.r * 0.3}, ${x + drop.r * 1.05} ${y + drop.r * 1.1}, ${x} ${y + drop.r * 1.15} C ${x - drop.r * 1.05} ${y + drop.r * 1.1}, ${x - drop.r * 0.95} ${y - drop.r * 0.3}, ${x} ${y - drop.r * 1.25} Z`} fill={`url(#${uid}-body)`} />
              <ellipse cx={x - drop.r * 0.34} cy={y - drop.r * 0.2} rx={drop.r * 0.2} ry={drop.r * 0.34} fill="#fff" opacity="0.95" />
              <ellipse cx={x + drop.r * 0.3} cy={y + drop.r * 0.72} rx={drop.r * 0.3} ry={drop.r * 0.14} fill="#fff" opacity="0.4" />
            </motion.g>
          </g>
        );
      })}
    </svg>
  );
}

/** A cold tint that breathes and a mist along the bottom. */
function ColdAir() {
  return (
    <>
      <motion.div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(150,200,255,0.08), rgba(90,140,220,0.16))", mixBlendMode: "screen" }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div style={{ position: "absolute", left: "-10%", right: "-10%", bottom: "-6%", height: "34%", pointerEvents: "none", background: "radial-gradient(60% 70% at 50% 100%, rgba(255,255,255,0.4), rgba(255,255,255,0) 70%)", filter: "blur(14px)" }} animate={{ x: ["-4%", "4%", "-4%"], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
    </>
  );
}

/** Bubbles rise inside the glass; ice catches the light. */
function Fizz({ region, map }: { region: Region; map: Map }) {
  const origin = map.px({ x: region.x, y: region.y });
  const w = map.len(region.w);
  const scaleY = map.px({ x: 0, y: 100 }).y - map.px({ x: 0, y: 0 }).y;
  const hh = (region.h / 100) * scaleY;
  const bubbles = Array.from({ length: 22 }, (_, i) => ({ x: ((i * 23) % 100) / 100, r: Math.max(1, map.len(0.25 + (i % 3) * 0.18)), delay: (i * 0.43) % 4, duration: 2.6 + (i % 4) * 0.5 }));
  const glints = Array.from({ length: 6 }, (_, i) => ({ x: ((i * 31) % 100) / 100, y: ((i * 17) % 100) / 100, delay: (i * 0.8) % 4 }));
  return (
    <svg style={{ position: "absolute", left: origin.x, top: origin.y, width: w, height: hh, overflow: "visible", pointerEvents: "none" }}>
      {bubbles.map((bubble, i) => (
        <motion.circle key={i} r={bubble.r} fill="rgba(255,255,255,0.85)" initial={{ cx: bubble.x * w, cy: hh, opacity: 0 }} animate={{ cy: [hh, 0], cx: [bubble.x * w, bubble.x * w + 3, bubble.x * w - 2, bubble.x * w], opacity: [0, 0.9, 0.9, 0] }} transition={{ duration: bubble.duration, delay: bubble.delay, repeat: Infinity, ease: "easeIn" }} />
      ))}
      {glints.map((glint, i) => (
        <motion.path key={`g${i}`} d="M0-4 L0.9-0.9 L4 0 L0.9 0.9 L0 4 L-0.9 0.9 L-4 0 L-0.9-0.9 Z" fill="#fff" transform={`translate(${glint.x * w} ${glint.y * hh})`} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1, 0.3] }} transition={{ duration: 1.8, delay: glint.delay, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
      ))}
    </svg>
  );
}

/** Light catching glaze, honey, berries or glass: a star that blooms and fades, each in its own rhythm. */
function Glints({ points, size }: { points: Point[]; size: number }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
      {points.map((point, i) => (
        <motion.g key={i} transform={`translate(${point.x} ${point.y})`} style={{ transformBox: "fill-box", transformOrigin: "center" }} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 0.95, 0], scale: [0.3, 1, 0.4], rotate: [0, 25] }} transition={{ duration: 2.4, delay: (i * 1.1) % 5, repeat: Infinity, repeatDelay: 2.6 + (i % 3), ease: "easeInOut" }}>
          <path d={`M0 ${-size * 4} L${size * 0.8} ${-size * 0.8} L${size * 4} 0 L${size * 0.8} ${size * 0.8} L0 ${size * 4} L${-size * 0.8} ${size * 0.8} L${-size * 4} 0 L${-size * 0.8} ${-size * 0.8} Z`} fill="#fff" opacity="0.9" />
          <circle r={size * 1.6} fill="#fff" opacity="0.6" style={{ filter: "blur(2px)" }} />
        </motion.g>
      ))}
    </svg>
  );
}

/** A soft window light that slides across the plate every few seconds. */
function Sweep() {
  return (
    <motion.div
      aria-hidden="true"
      style={{ position: "absolute", top: "-20%", bottom: "-20%", width: "45%", pointerEvents: "none", background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,250,240,0.32) 45%, rgba(255,255,255,0) 100%)", mixBlendMode: "soft-light", filter: "blur(6px)" }}
      initial={{ left: "-50%" }}
      animate={{ left: ["-50%", "110%"] }}
      transition={{ duration: 3.6, repeat: Infinity, repeatDelay: 4.5, ease: "easeInOut" }}
    />
  );
}

/**
 * Noise that drifts and the photograph displaced along it: silk waves, liquid
 * swirls, a cup's surface that trembles, steam torn into wisps. Units are CSS
 * pixels of the image.
 */
function FlowFilters() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter id="lp-flow-silk" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0026 0.008" numOctaves="1" seed="4" result="noise" />
        <feOffset in="noise" result="moved">
          <animate attributeName="dx" values="0;90;0" dur="20s" repeatCount="indefinite" />
          <animate attributeName="dy" values="0;24;0" dur="15s" repeatCount="indefinite" />
        </feOffset>
        <feDisplacementMap in="SourceGraphic" in2="moved" scale="16" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="lp-liquid" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.014 0.022" numOctaves="1" seed="7" result="noise" />
        <feOffset in="noise" result="moved">
          <animate attributeName="dx" values="0;36;0" dur="9s" repeatCount="indefinite" />
          <animate attributeName="dy" values="0;-28;0" dur="7s" repeatCount="indefinite" />
        </feOffset>
        <feDisplacementMap in="SourceGraphic" in2="moved" scale="7" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="lp-wisp" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.028 0.02" numOctaves="2" seed="3" result="noise" />
        <feOffset in="noise" result="moved">
          <animate attributeName="dy" values="0;-60;-120" dur="6s" repeatCount="indefinite" />
          <animate attributeName="dx" values="0;14;0" dur="5s" repeatCount="indefinite" />
        </feOffset>
        <feDisplacementMap in="SourceGraphic" in2="moved" scale="14" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="lp-flow-liquid" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.008" numOctaves="1" seed="11" result="noise" />
        <feOffset in="noise" result="moved">
          <animate attributeName="dx" values="0;-50;0" dur="17s" repeatCount="indefinite" />
          <animate attributeName="dy" values="0;-70;0" dur="13s" repeatCount="indefinite" />
        </feOffset>
        <feDisplacementMap in="SourceGraphic" in2="moved" scale="14" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

/** A mask that fades the given edges (percent of the image) to nothing. */
function fadeMask(fade: { top?: number; right?: number; bottom?: number; left?: number }): CSSProperties {
  const edge = (dir: string, size = 0) => (size ? `linear-gradient(to ${dir}, transparent 0, #000 ${size}%)` : "linear-gradient(#000, #000)");
  const mask = [edge("bottom", fade.top), edge("left", fade.right), edge("top", fade.bottom), edge("right", fade.left)].join(", ");
  return { maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" } as CSSProperties;
}
