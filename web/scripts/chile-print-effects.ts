/**
 * Where things move in the Chile print, in PDF points of each spread:
 * steam over cups and pans, bubbles and condensation in cold glasses, the V60
 * pour, glints and light sweeps. `chile-photos.ts` turns these into the
 * living-photo specs of each cut photograph.
 */
export type Pt = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

export type Effect =
  | ({ kind: "steam"; w: number; rise?: number; count?: number; strength?: number } & Pt)
  | ({ kind: "bubbles"; count?: number; size?: number; tint?: string } & Box)
  | ({ kind: "drips"; count?: number } & Box)
  | ({ kind: "glint"; size?: number } & Pt)
  | ({ kind: "sweep"; tint?: string; every?: number } & Box)
  | ({ kind: "pour"; from: Pt; to: Pt; rx: number; ry: number })
  | ({ kind: "pulse"; r: number; color: string } & Pt)
  | ({ kind: "travel"; x0: number; x1: number; y: number; color: string; delay?: number });


const cups = (points: [number, number][], w = 40): Effect[] => points.map(([x, y]) => ({ kind: "steam", x, y, w }));
const glints = (points: [number, number][], size = 5): Effect[] => points.map(([x, y]) => ({ kind: "glint", x, y, size }));

/** Effects by photo key (drawn above that photo) and by spread (`s4`, drawn on top). */
export const PRINT_EFFECTS: Record<string, Effect[]> = {
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

