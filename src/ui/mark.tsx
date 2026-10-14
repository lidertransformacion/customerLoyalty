import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { create } from "qrcode";

import { copy } from "@/src/i18n/strings";
import { ink } from "@/src/ui/theme";

export function Mark({
  value,
  size = 168,
  label = copy.home.counterCodeLabel,
}: {
  value: string;
  size?: number;
  label?: string;
}) {
  const cells = useMemo(() => {
    const code = create(value, { errorCorrectionLevel: "M" });
    const size = code.modules.size;
    const runs: { x: number; y: number; w: number }[] = [];
    for (let y = 0; y < size; y += 1) {
      let x = 0;
      while (x < size) {
        if (!code.modules.get(y, x)) {
          x += 1;
          continue;
        }
        const start = x;
        while (x < size && code.modules.get(y, x)) x += 1;
        runs.push({ x: start, y, w: x - start });
      }
    }
    return { size, runs };
  }, [value]);

  const quiet = 2;
  const side = cells.size + quiet * 2;

  return (
    <View accessibilityRole="image" accessibilityLabel={label}>
      <Svg width={size} height={size} viewBox={`0 0 ${side} ${side}`}>
        <Rect width={side} height={side} fill="#ffffff" />
        {cells.runs.map((run) => (
          <Rect
            key={`${run.y}-${run.x}`}
            x={run.x + quiet}
            y={run.y + quiet}
            width={run.w}
            height={1}
            fill={ink}
          />
        ))}
      </Svg>
    </View>
  );
}
