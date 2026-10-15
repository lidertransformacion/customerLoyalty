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
  /** Where bubbles rise. */
  fizz?: Region[];
};

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

  const map = frame ? mapper(frame, photo.focus ?? "50% 50%") : null;
  const live = effects && !reduced && visible && map !== null;

  return (
    <motion.div
      ref={tilt.ref}
      className={className}
      data-testid={testId}
      style={{ position: "relative", overflow: "hidden", borderRadius: radius, transformPerspective: 1000, rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: "preserve-3d", background: "#1b1612", ...style }}
    >
      <motion.div style={{ position: "absolute", inset: 0, x: shiftX, y: shiftY }}>
        <motion.img
          ref={imgRef}
          src={photo.src}
          alt=""
          draggable={false}
          style={{ position: "absolute", inset: "-6%", width: "112%", maxWidth: "none", height: "112%", objectFit: "cover", objectPosition: photo.focus ?? "50% 50%" }}
          animate={drift && !reduced && !videoOk ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
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
            {photo.sweat?.map((region, i) => <Sweat key={`sw${i}`} region={region} map={map} uid={`${uid}s${i}`} />)}
            {photo.fizz?.map((region, i) => <Fizz key={`fz${i}`} region={region} map={map} />)}
            {!videoOk && photo.pours?.map((pour, i) => (
              <Stream key={`p${i}`} uid={`${uid}p${i}`} spec={{ from: map.px(pour.from), to: map.px(pour.to), width: Math.max(2.5, map.len(pour.width)), color: pour.color, spiral: map.len(pour.spiral ?? 0), body: pour.body ?? true, ...(pour.speed !== undefined ? { speed: pour.speed } : {}) }} />
            ))}
            {photo.steam?.map((point, i) => <Steam key={`st${i}`} at={map.px(point)} size={map.len(9)} index={i} />)}
          </>
        ) : null}
        {photo.mood === "cold" && live ? <ColdAir /> : null}
      </motion.div>
      <motion.div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(240px 160px at var(--mx) var(--my), rgba(255,255,255,0.2), rgba(255,255,255,0) 70%)", ["--mx" as string]: sheenX, ["--my" as string]: sheenY, mixBlendMode: "soft-light" }} />
      {children ? <div style={{ position: "absolute", inset: 0 }}>{children}</div> : null}
    </motion.div>
  );
}

type Map = ReturnType<typeof mapper>;

/** Real steam: soft blobs that rise, swell, sway and dissolve. */
function Steam({ at, size, index }: { at: Point; size: number; index: number }) {
  const blobs = Array.from({ length: 7 }, (_, i) => ({
    dx: ((i * 37) % 21) - 10,
    s: size * (0.7 + ((i * 13) % 7) * 0.12),
    delay: ((i * 0.47 + index * 0.31) % 2.6),
    duration: 2.6 + ((i * 7) % 5) * 0.3,
    sway: ((i % 2 ? 1 : -1) * (6 + ((i * 5) % 9))),
  }));
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: at.x, top: at.y, width: 0, height: 0, pointerEvents: "none" }}>
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          style={{ position: "absolute", left: blob.dx - blob.s / 2, top: -blob.s / 2, width: blob.s, height: blob.s, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 40%, rgba(255,255,255,0) 70%)", filter: `blur(${Math.max(4, blob.s * 0.22)}px)`, mixBlendMode: "screen" }}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.55, 0.4, 0], y: [0, -size * 1.4, -size * 3.2, -size * 4.6], x: [0, blob.sway * 0.4, blob.sway, blob.sway * 0.6], scale: [0.5, 1, 1.5, 2] }}
          transition={{ duration: blob.duration, delay: blob.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/** Condensation: droplets form on the glass, grow, and some run down. Frost twinkles. */
function Sweat({ region, map, uid }: { region: Region; map: Map; uid: string }) {
  const origin = map.px({ x: region.x, y: region.y });
  const w = map.len(region.w);
  const h = map.len(region.h) * (map.len(100) / map.len(100));
  const drops = Array.from({ length: 30 }, (_, i) => ({
    x: ((i * 37) % 100) / 100,
    y: ((i * 53) % 100) / 100,
    r: Math.max(1.5, map.len(0.5 + ((i * 7) % 5) * 0.28)),
    delay: (i * 0.7) % 7,
    slide: i % 4 === 0,
    duration: 5 + (i % 4),
  }));
  const sparks = Array.from({ length: 8 }, (_, i) => ({ x: ((i * 41) % 100) / 100, y: ((i * 29) % 100) / 100, delay: (i * 0.9) % 5 }));
  const scaleY = map.px({ x: 0, y: 100 }).y - map.px({ x: 0, y: 0 }).y;
  const hh = (region.h / 100) * scaleY;
  void h;
  return (
    <svg style={{ position: "absolute", left: origin.x, top: origin.y, width: w, height: hh, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <radialGradient id={`${uid}-drop`} cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#e4f2ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#8fb8e8" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      {drops.map((drop, i) => (
        <motion.ellipse
          key={i}
          cx={drop.x * w}
          rx={drop.r * 0.8}
          ry={drop.r}
          fill={`url(#${uid}-drop)`}
          initial={{ cy: drop.y * hh, opacity: 0, scale: 0.2 }}
          animate={drop.slide ? { cy: [drop.y * hh, drop.y * hh, drop.y * hh + hh * 0.25, drop.y * hh + hh * 0.4], opacity: [0, 0.95, 0.95, 0], scale: [0.3, 1, 1.2, 0.7] } : { cy: drop.y * hh, opacity: [0, 0.95, 0.95, 0], scale: [0.2, 1, 1.05, 0.9] }}
          transition={{ duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: "easeInOut", times: drop.slide ? [0, 0.55, 0.85, 1] : [0, 0.2, 0.8, 1] }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
      {sparks.map((spark, i) => (
        <motion.path
          key={`s${i}`}
          d="M0-4 L0.9-0.9 L4 0 L0.9 0.9 L0 4 L-0.9 0.9 L-4 0 L-0.9-0.9 Z"
          fill="#fff"
          transform={`translate(${spark.x * w} ${spark.y * hh})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1, 0.3] }}
          transition={{ duration: 2.2, delay: spark.delay, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
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
