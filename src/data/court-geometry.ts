export type CourtPoint = {
  x: number;
  y: number;
};

/**
 * Repère tactique normalisé du demi-terrain RIZE.
 * x=0..100 : ligne de touche gauche -> ligne de touche droite.
 * y=0..100 : milieu du terrain -> baseline/panier.
 */
export const COURT_GEOMETRY = {
  baselineY: 100,
  midcourtY: 0,
  paint: { left: 34, right: 66, freeThrowY: 60 },
  freeThrowCircle: { x: 50, y: 60, radius: 12 },
  restrictedAreaRadius: 8,
  rim: { x: 50, y: 88 },
  backboard: { left: 44, right: 56, y: 94 },
  threePoint: {
    sideX: 8,
    intersectionY: 76,
    center: { x: 50, y: 88 },
    radius: 44,
  },
  halfCourtCircle: { x: 50, y: 0, radius: 12 },
} as const;

export const COURT_ROLE_POINTS: Record<string, CourtPoint> = {
  top: { x: 50, y: 22 },
  "slot-left": { x: 34, y: 34 },
  "slot-right": { x: 66, y: 34 },
  "wing-left": { x: 20, y: 46 },
  "wing-right": { x: 80, y: 46 },
  "corner-left": { x: 6, y: 78 },
  "corner-right": { x: 94, y: 78 },
  "elbow-left": { x: 34, y: 60 },
  "elbow-right": { x: 66, y: 60 },
  "block-left": { x: 34, y: 76 },
  "block-right": { x: 66, y: 76 },
  "short-corner-left": { x: 20, y: 73 },
  "short-corner-right": { x: 80, y: 73 },
  "dunker-left": { x: 27, y: 82 },
  "dunker-right": { x: 73, y: 82 },
  inbound: { x: 50, y: 98 },
  rim: COURT_GEOMETRY.rim,
};

export const COURT_SPOTS = [
  { id: "rim", name: "Rim / Restricted Area", ...COURT_ROLE_POINTS.rim, points: 2 },
  { id: "paint", name: "Paint / Short Paint", x: 50, y: 76, points: 2 },
  { id: "short-corner-left", name: "Short Corner Left", ...COURT_ROLE_POINTS["short-corner-left"], points: 2 },
  { id: "short-corner-right", name: "Short Corner Right", ...COURT_ROLE_POINTS["short-corner-right"], points: 2 },
  { id: "mid-left", name: "Mid-Range Left", x: 34, y: 58, points: 2 },
  { id: "mid-right", name: "Mid-Range Right", x: 66, y: 58, points: 2 },
  { id: "corner-left", name: "Corner 3 Left", ...COURT_ROLE_POINTS["corner-left"], points: 3 },
  { id: "corner-right", name: "Corner 3 Right", ...COURT_ROLE_POINTS["corner-right"], points: 3 },
  { id: "wing-left", name: "Wing 3 Left", ...COURT_ROLE_POINTS["wing-left"], points: 3 },
  { id: "wing-right", name: "Wing 3 Right", ...COURT_ROLE_POINTS["wing-right"], points: 3 },
  { id: "slot-left", name: "Slot 3 Left", ...COURT_ROLE_POINTS["slot-left"], points: 3 },
  { id: "slot-right", name: "Slot 3 Right", ...COURT_ROLE_POINTS["slot-right"], points: 3 },
  { id: "top", name: "Top of Key", ...COURT_ROLE_POINTS.top, points: 3 },
] as const;

export type CourtSpotId = (typeof COURT_SPOTS)[number]["id"];
