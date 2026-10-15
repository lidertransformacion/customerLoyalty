type Props = { profile: string; size?: number; tone?: "ink" | "light" };

const BEAN = "M0-13c-5 0-8 6-8 13s3 13 8 13 8-6 8-13-3-13-8-13Zm0 3c1.4 3 1.4 17 0 20";

const PALETTE: Record<string, [string, string]> = {
  PAZ: ["#6b3a1f", "#3a2010"],
  LIBRE: ["#5a2e14", "#2a1408"],
  IMPACTO: ["#7a4a2a", "#3c2418"],
  ROCK: ["#4a2a1a", "#1f120a"],
  PUNK: ["#8a4a2a", "#4a2412"],
  COMPETITION: ["#9c6a45", "#5a3722"],
};

/** Whole beans, drifting a little, with the profile name behind them. Placement is static; the drift is CSS. */
export function Beans({ profile, size = 240, tone = "ink" }: Props) {
  const [light, dark] = tone === "light" ? ["#d9bf8f", "#b58a5a"] : (PALETTE[profile] ?? PALETTE.PAZ!);
  const label = tone === "light" ? "rgba(255,255,255,0.06)" : "rgba(27,22,18,0.06)";
  const shade = tone === "light" ? "rgba(0,0,0,0.25)" : "rgba(27,22,18,0.12)";
  const beans = Array.from({ length: 9 }, (_, i) => ({
    x: -70 + (i % 3) * 70 + ((i * 13) % 20) - 8,
    y: -50 + Math.floor(i / 3) * 52 + ((i * 7) % 14),
    rotate: (i * 47) % 180,
    scale: 1.1 + ((i * 5) % 4) * 0.12,
    delay: (i % 4) * 0.4,
    duration: 4 + (i % 3),
  }));
  return (
    <div style={{ display: "grid", placeItems: "center" }} data-testid="beans">
      <svg width={size} height={size * 0.8} viewBox="-120 -96 240 192" style={{ overflow: "visible" }}>
        <text x="0" y="24" textAnchor="middle" fontFamily="var(--serif)" fontWeight="500" fontSize="64" fill={label}>
          {profile}
        </text>
        {beans.map((bean, i) => (
          <g key={i} transform={`translate(${bean.x} ${bean.y}) rotate(${bean.rotate}) scale(${bean.scale})`}>
            <g className="drift" style={{ animationDelay: `${bean.delay}s`, animationDuration: `${bean.duration}s` }}>
              <ellipse cx="2" cy="4" rx="9" ry="13" fill={shade} />
              <path d={BEAN} fill={i % 2 ? light : dark} stroke={dark} strokeWidth="1" strokeLinecap="round" />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
