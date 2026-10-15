import QRCode from "qrcode";
import { useMemo } from "react";

type Props = { value: string; size?: number; dark?: string; accent?: string };

/** A QR drawn with soft modules and roast-colored finders. Readable by any scanner. */
export function Qr({ value, size = 180, dark = "#1b1612", accent = "#7a4328" }: Props) {
  const code = useMemo(() => QRCode.create(value, { errorCorrectionLevel: "M" }), [value]);
  const count = code.modules.size;
  const data = code.modules.data;
  const cell = size / (count + 2);
  const dots: { x: number; y: number; finder: boolean }[] = [];
  for (let y = 0; y < count; y += 1) {
    for (let x = 0; x < count; x += 1) {
      if (!data[y * count + x]) continue;
      const finder =
        (x < 7 && y < 7) || (x >= count - 7 && y < 7) || (x < 7 && y >= count - 7);
      dots.push({ x, y, finder });
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={value} data-testid="qr">
      <rect width={size} height={size} rx={size * 0.1} fill="#fff" />
      {dots.map((dot) => (
        <rect
          key={`${dot.x}-${dot.y}`}
          x={(dot.x + 1) * cell + cell * 0.08}
          y={(dot.y + 1) * cell + cell * 0.08}
          width={cell * 0.84}
          height={cell * 0.84}
          rx={dot.finder ? cell * 0.18 : cell * 0.42}
          fill={dot.finder ? accent : dark}
        />
      ))}
    </svg>
  );
}
