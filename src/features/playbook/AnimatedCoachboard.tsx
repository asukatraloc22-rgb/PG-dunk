import type { CoachActionType, CoachFrame, CoachInstruction, CourtRole } from "../../data/coachboard-animations";
import { COURT_GEOMETRY, COURT_ROLE_POINTS, COURT_SPOTS } from "../../data/court-geometry";

const COLORS: Record<CoachActionType | "court" | "paint" | "lines" | "offense" | "defense" | "ball", string> = {
  court: "#a9683d",
  paint: "#c98752",
  lines: "#fff1dc",
  offense: "#f59e0b",
  defense: "#2563eb",
  ball: "#ea580c",
  move: "#fff7ed",
  pass: "#60a5fa",
  dribble: "#fde047",
  screen: "#34d399",
  cut: "#f8fafc",
  roll: "#fb7185",
  pop: "#c084fc",
  shot: "#f97316",
};

type AnimatedCoachboardProps = {
  frame: CoachFrame;
  previousFrame?: CoachFrame;
  step: number;
  totalSteps: number;
  actionLabel: string;
};

type Point = { x: number; y: number };

const toSvg = (point: Point): Point => ({ x: point.x * 5, y: point.y * 6 });
const normalizedPoint = (x: number, y: number): Point => ({ x, y });
const rolePoint = (role: CourtRole): Point => COURT_ROLE_POINTS[role];

function entityPoint(frame: CoachFrame, id: string): Point {
  const player = frame.players.find((item) => item.id === id);
  if (player) return normalizedPoint(player.x, player.y);
  return rolePoint(id as CourtRole) ?? rolePoint("top");
}

function labelForSpot(id: string) {
  return {
    rim: "RIM",
    paint: "PAINT",
    "short-corner-left": "SHORT",
    "short-corner-right": "SHORT",
    "mid-left": "MID",
    "mid-right": "MID",
    "corner-left": "CORNER",
    "corner-right": "CORNER",
    "wing-left": "WING",
    "wing-right": "WING",
    "slot-left": "SLOT",
    "slot-right": "SLOT",
    top: "TOP",
  }[id] ?? id;
}

function curvedPath(from: Point, to: Point, offset = 0) {
  const start = toSvg(from);
  const end = toSvg(to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const normalX = -dy / length;
  const normalY = dx / length;
  const control = {
    x: (start.x + end.x) / 2 + normalX * offset,
    y: (start.y + end.y) / 2 + normalY * offset,
  };
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}

function shotPath(from: Point, to: Point) {
  const start = toSvg(from);
  const end = toSvg(to);
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const control = {
    x: (start.x + end.x) / 2,
    y: Math.max(24, Math.min(start.y, end.y) - Math.min(86, distance * 0.24)),
  };
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}

function actionName(type: CoachActionType) {
  return {
    move: "Move",
    pass: "Pass",
    dribble: "Dribble",
    screen: "Screen",
    cut: "Cut",
    roll: "Roll",
    pop: "Pop",
    shot: "Shot",
    defense: "Defense",
  }[type];
}

function actionStroke(type: CoachActionType) {
  return COLORS[type];
}

function markerFor(type: CoachActionType) {
  return type === "screen" ? undefined : `url(#rize-${type}-arrow)`;
}

function screenBar(frame: CoachFrame, instruction: CoachInstruction) {
  const screen = toSvg(entityPoint(frame, instruction.from));
  const target = toSvg(entityPoint(frame, instruction.to));
  const angle = Math.atan2(target.y - screen.y, target.x - screen.x);
  const perpendicular = { x: -Math.sin(angle), y: Math.cos(angle) };
  const halfLength = 22;
  return {
    start: { x: screen.x - perpendicular.x * halfLength, y: screen.y - perpendicular.y * halfLength },
    end: { x: screen.x + perpendicular.x * halfLength, y: screen.y + perpendicular.y * halfLength },
  };
}

function threePointPath() {
  const { sideX, intersectionY, center } = COURT_GEOMETRY.threePoint;
  const start = toSvg({ x: sideX, y: intersectionY });
  const end = toSvg({ x: 100 - sideX, y: intersectionY });
  const centerPoint = toSvg(center);
  const radius = Math.hypot(start.x - centerPoint.x, start.y - centerPoint.y);
  return `M ${start.x} 0 L ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y} L ${end.x} 0`;
}

export function AnimatedCoachboard({ frame, previousFrame, step, totalSteps, actionLabel }: AnimatedCoachboardProps) {
  const actionTypes = Array.from(new Set(frame.instructions.map((instruction) => instruction.type)));
  const paint = COURT_GEOMETRY.paint;
  const freeThrow = toSvg(COURT_GEOMETRY.freeThrowCircle);
  const rim = toSvg(COURT_GEOMETRY.rim);
  const backboard = COURT_GEOMETRY.backboard;

  return (
    <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[1.5rem] border border-orange-200/30 bg-[#a9683d] shadow-2xl shadow-black/30">
      <div className="aspect-[5/6]">
        <svg viewBox="0 0 500 600" className="h-full w-full" role="img" aria-label={`Coachboard, ${frame.title}`}>
          <defs>
            <linearGradient id="rize-court-wood" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8d4f2d" />
              <stop offset="0.5" stopColor="#b87545" />
              <stop offset="1" stopColor="#8d4f2d" />
            </linearGradient>
            <linearGradient id="rize-paint-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6b45c" stopOpacity=".28" />
              <stop offset="1" stopColor="#7a351f" stopOpacity=".42" />
            </linearGradient>
            <filter id="rize-player-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#241107" floodOpacity=".48" />
            </filter>
            <filter id="rize-ball-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffb347" floodOpacity=".8" />
            </filter>
            {(["move", "pass", "dribble", "cut", "roll", "pop", "defense", "shot"] as CoachActionType[]).map((type) => (
              <marker key={type} id={`rize-${type}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={actionStroke(type)} />
              </marker>
            ))}
          </defs>

          <rect width="500" height="600" fill="url(#rize-court-wood)" />
          <path d="M 0 600 H 500 V 0 H 0 Z" fill="url(#rize-court-grain)" opacity=".22" />
          <defs>
            <pattern id="rize-court-grain" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 0 28 L 28 0" stroke="#fff" strokeOpacity=".06" />
            </pattern>
          </defs>

          <g fill="none" stroke={COLORS.lines} strokeWidth="3" strokeOpacity=".92">
            <rect x="4" y="4" width="492" height="592" rx="10" />
            <rect x={paint.left * 5} y={paint.freeThrowY * 6} width={(paint.right - paint.left) * 5} height={(100 - paint.freeThrowY) * 6} fill="url(#rize-paint-glow)" strokeOpacity=".82" />
            <line x1={paint.left * 5} y1={paint.freeThrowY * 6} x2={paint.right * 5} y2={paint.freeThrowY * 6} />
            <path d={`M ${freeThrow.x - 60} ${freeThrow.y} A 60 60 0 0 1 ${freeThrow.x + 60} ${freeThrow.y}`} strokeDasharray="10 10" />
            <path d={`M ${freeThrow.x + 60} ${freeThrow.y} A 60 60 0 0 1 ${freeThrow.x - 60} ${freeThrow.y}`} />
            <path d={threePointPath()} />
            <path d={`M ${rim.x - COURT_GEOMETRY.restrictedAreaRadius * 5} ${rim.y} A ${COURT_GEOMETRY.restrictedAreaRadius * 5} ${COURT_GEOMETRY.restrictedAreaRadius * 5} 0 0 1 ${rim.x + COURT_GEOMETRY.restrictedAreaRadius * 5} ${rim.y}`} strokeWidth="2" />
            <line x1={backboard.left * 5} y1={backboard.y * 6} x2={backboard.right * 5} y2={backboard.y * 6} strokeWidth="6" />
            <circle cx={rim.x} cy={rim.y} r="12" stroke={COLORS.ball} />
            <line x1="0" y1="4" x2="500" y2="4" strokeWidth="3" />
            <path d="M 190 4 A 60 60 0 0 1 310 4" />
          </g>

          <g pointerEvents="none" fill={COLORS.lines} fillOpacity=".28" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="1.2">
            {COURT_SPOTS.filter((spot) => !["rim", "paint"].includes(spot.id)).map((spot) => {
              const spotPoint = toSvg(spot);
              return <text key={spot.id} x={spotPoint.x} y={spotPoint.y - 24}>{labelForSpot(spot.id)}{spot.points === 3 ? " · 3" : " · 2"}</text>;
            })}
          </g>

          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {frame.instructions.map((instruction, index) => {
              if (instruction.type === "screen") return null;
              const movementTypes: CoachActionType[] = ["move", "cut", "dribble", "roll", "pop"];
              const fromFrame = previousFrame && movementTypes.includes(instruction.type) ? previousFrame : frame;
              const from = entityPoint(fromFrame, instruction.from);
              const to = entityPoint(frame, instruction.to);
              const path = instruction.type === "shot" ? shotPath(from, to) : curvedPath(from, to, instruction.type === "pass" ? (index % 2 ? 8 : -8) : instruction.type === "dribble" ? (index % 2 ? 12 : -12) : 0);
              return (
                <path
                  key={`${instruction.type}-${instruction.from}-${instruction.to}-${index}`}
                  d={path}
                  stroke={actionStroke(instruction.type)}
                  strokeWidth={instruction.type === "defense" ? 3 : instruction.type === "shot" ? 3 : 4}
                  strokeDasharray={instruction.type === "pass" ? "10 8" : instruction.type === "shot" ? "4 7" : undefined}
                  markerEnd={markerFor(instruction.type)}
                  opacity=".96"
                />
              );
            })}

            {frame.instructions.filter((instruction) => instruction.type === "screen").map((instruction, index) => {
              const bar = screenBar(frame, instruction);
              const current = toSvg(entityPoint(frame, instruction.from));
              const previous = previousFrame ? toSvg(entityPoint(previousFrame, instruction.from)) : current;
              return (
                <g key={`screen-${instruction.from}-${index}`}>
                  {previousFrame && (previous.x !== current.x || previous.y !== current.y) && <path d={`M ${previous.x} ${previous.y} L ${current.x} ${current.y}`} stroke={COLORS.screen} strokeWidth="3" strokeDasharray="5 7" opacity=".7" />}
                  <line x1={bar.start.x} y1={bar.start.y} x2={bar.end.x} y2={bar.end.y} stroke={COLORS.screen} strokeWidth="7" />
                </g>
              );
            })}
          </g>

          <g pointerEvents="none">
            {frame.instructions.map((instruction, index) => {
              const movementTypes: CoachActionType[] = ["move", "cut", "dribble", "roll", "pop"];
              const fromFrame = previousFrame && movementTypes.includes(instruction.type) ? previousFrame : frame;
              const from = toSvg(entityPoint(fromFrame, instruction.from));
              const to = toSvg(entityPoint(frame, instruction.to));
              const center = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 + ((index % 3) - 1) * 15 };
              const text = instruction.label || actionName(instruction.type);
              const width = Math.max(48, text.length * 6.2 + 18);
              return (
                <g key={`label-${instruction.type}-${index}`}>
                  <rect x={center.x - width / 2} y={center.y - 12} width={width} height="20" rx="10" fill="#321c13" fillOpacity=".88" />
                  <text x={center.x} y={center.y + 2} textAnchor="middle" fill={actionStroke(instruction.type)} fontSize="9" fontWeight="800">{text}</text>
                </g>
              );
            })}
          </g>

          <g>
            {frame.players.map((player) => {
              const position = toSvg(player);
              const isOffense = player.team === "offense";
              return (
                <g key={player.id} transform={`translate(${position.x} ${position.y})`}>
                  <circle r="21" fill={isOffense ? COLORS.offense : "#111827"} fillOpacity={isOffense ? .28 : .42} stroke={isOffense ? "#ffedd5" : COLORS.defense} strokeOpacity=".42" strokeWidth="2" />
                  <circle r="17" fill={isOffense ? COLORS.offense : "#111827"} fillOpacity={isOffense ? 1 : .94} stroke={isOffense ? "#fff7ed" : "#93c5fd"} strokeWidth="2.5" filter="url(#rize-player-shadow)" />
                  <circle r="11" fill="none" stroke={isOffense ? "#fff7ed" : "#bfdbfe"} strokeOpacity=".32" strokeWidth="1.5" />
                  <text y="5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">{player.label}</text>
                  <text y="-24" textAnchor="middle" fill={isOffense ? "#fff7ed" : "#bfdbfe"} fillOpacity=".76" fontSize="7" fontWeight="900" letterSpacing=".8">{isOffense ? "OFF" : "DEF"}</text>
                </g>
              );
            })}
          </g>

          <g transform={`translate(${toSvg(frame.ball).x} ${toSvg(frame.ball).y})`}>
            <circle r="17" fill="#ea580c" fillOpacity=".16" filter="url(#rize-ball-glow)" />
            <circle r="11" fill={COLORS.ball} stroke="#fff7ed" strokeWidth="2" filter="url(#rize-ball-glow)" />
            <path d="M -8 -4 Q 0 0 8 4 M -4 -10 Q 0 0 -4 10" fill="none" stroke="#fff7ed" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
      <div className="border-t border-white/10 bg-slate-950/90 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300/70">{actionLabel}</p><p className="mt-0.5 text-sm font-black text-white">{frame.title}</p></div>
          <span className="shrink-0 text-[10px] font-bold text-slate-500">Étape {step + 1}/{totalSteps}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{frame.teachingPoint}</p>
        {frame.instructions.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Actions du frame courant">{frame.instructions.slice(0, 5).map((instruction, index) => <span key={`${instruction.type}-${instruction.label}-${index}`} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em]" style={{ color: actionStroke(instruction.type) }}>{index + 1}. {instruction.label || actionName(instruction.type)}</span>)}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 bg-slate-950/70 px-3 py-2 text-[10px] font-bold text-slate-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Attaque</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-600" />Défense</span>
        {actionTypes.map((type) => <span key={type}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: actionStroke(type) }} />{actionName(type)}</span>)}
      </div>
    </div>
  );
}
