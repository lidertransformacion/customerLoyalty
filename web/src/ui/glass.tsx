import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  dark?: boolean;
  strong?: boolean;
  pill?: boolean;
  flat?: boolean;
  lens?: boolean;
  onPhoto?: boolean;
};

/** A Liquid Glass surface. The specular highlight follows the pointer. */
export function Glass({
  children,
  dark,
  strong,
  pill,
  flat,
  lens,
  onPhoto,
  className,
  style,
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const classes = [
    "glass",
    dark ? "dark" : "",
    strong ? "strong" : "",
    pill ? "pill" : "",
    flat ? "flat" : "",
    lens ? "lens" : "",
    onPhoto ? "on-photo" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={classes}
      style={style}
      onPointerMove={(event) => {
        const node = ref.current;
        if (!node) return;
        const box = node.getBoundingClientRect();
        node.style.setProperty("--sx", `${((event.clientX - box.left) / box.width) * 100}%`);
        node.style.setProperty("--sy", `${((event.clientY - box.top) / box.height) * 100}%`);
        rest.onPointerMove?.(event);
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * The refraction map behind `.glass.lens` on Chromium.
 * A rounded field whose displacement grows toward the rim, so the backdrop bends
 * at the edges like it does through thick glass. Safari and Firefox keep the
 * blur and the rim highlight only.
 */
export function LensFilter() {
  const [map, setMap] = useState<string | null>(null);

  useEffect(() => {
    let supported = false;
    try {
      supported = CSS.supports("backdrop-filter", "url(#x)") || CSS.supports("-webkit-backdrop-filter", "url(#x)");
    } catch {
      supported = false;
    }
    const ua = navigator.userAgent;
    const chromium = /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Safari\/[\d.]+$/.test(ua.replace(/Chrome\/[\d.]+ /, ""));
    if (!supported || !chromium) return;

    const size = 160;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const image = ctx.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const u = (x / (size - 1)) * 2 - 1;
        const v = (y / (size - 1)) * 2 - 1;
        const edge = Math.max(Math.abs(u), Math.abs(v));
        const strength = Math.pow(Math.min(1, edge), 5);
        const dx = -u * strength;
        const dy = -v * strength;
        const i = (y * size + x) * 4;
        image.data[i] = Math.round(128 + dx * 127);
        image.data[i + 1] = Math.round(128 + dy * 127);
        image.data[i + 2] = 128;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    setMap(canvas.toDataURL("image/png"));
    document.documentElement.classList.add("lens");
  }, []);

  if (!map) return null;
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter id="liquid-lens" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feImage href={map} preserveAspectRatio="none" result="map" x="0" y="0" width="100%" height="100%" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="22" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

export const glassStyle: CSSProperties = {};
