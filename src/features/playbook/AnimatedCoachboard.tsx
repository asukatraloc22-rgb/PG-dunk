import type { CoachActionType, CoachFrame, CoachInstruction, CourtRole } from "../../data/coachboard-animations";

const COLORS: Record<CoachActionType | "court" | "paint" | "lines" | "offense" | "defense" | "ball", string> = {
  court: "#243247",
  paint: "#31435a",
  lines: "#e8edf5",
  offense: "#f59e0b",
  defense: "#ef4444",
  ball: "#ea580c",
  move: "#f8fafc",
  pass: "#60a5fa",
  dribble: "#fbbf24",
  screen: "#34d399",
  cut: "#f8fafc",
  roll: "#fb7185",
  pop: "#c084fc",
  shot: "#fb923c",
};

type AnimatedCoachboardProps = {
  frame: CoachFrame;
  previousFrame?: CoachFrame;
  step: number;
  totalSteps: number;
  actionLabel: string;
};

const ROLE_POINTS: Record<CourtRole, { x: number; y: number }> = {
  top: { x: 50, y: 20 },
  "slot-left": { x: 32, y: 34 },
  "slot-right": { x: 68, y: 34 },
  "wing-left": { x: 20, y: 48 },
  "wing-right": { x: 80, y: 48 },
  "corner-left": { x: 12, y: 76 },
  "corner-right": { x: 88, y: 76 },
  "elbow-left": { x: 34, y: 39 },
  "elbow-right": { x: 66, y: 39 },
  "block-left": { x: 36, y: 62 },
  "block-right": { x: 64, y: 62 },
  "short-corner-left": { x: 18, y: 67 },
  "short-corner-right": { x: 82, y: 67 },
  "dunker-left": { x: 30, y: 76 },
  "dunker-right": { x: 70, y: 76 },
  inbound: { x: 50, y: 90 },
  rim: { x: 50, y: 71 },
};

const toSvg = (x: number, y: number) => ({ x: (x / 100) * 500, y: (y / 100) * 600 });

function entityPoint(frame: CoachFrame, id: string) {
  const player = frame.players.find((item) => item.id === id);
  if (player) return toSvg(player.x, player.y);
  const rolePoint = ROLE_POINTS[id as CourtRole] ?? ROLE_POINTS.top;
  return toSvg(rolePoint.x, rolePoint.y);
}

function pathFor(instruction: CoachInstruction, frame: CoachFrame) {
  const from = entityPoint(frame, instruction.from);
  const to = entityPoint(frame, instruction.to);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const curve = Math.max(12, Math.min(36, Math.abs(dx) * 0.18));
  const controlX = from.x + dx * 0.5;
  const controlY = from.y + dy * 0.5 - curve;
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

function actionName(type: CoachActionType) {
  return { move: "Move", pass: "Pass", dribble: "Dribble", screen: "Screen", cut: "Cut", roll: "Roll", pop: "Pop", shot: "Shot", defense: "Defensive rotation" }[type];
}

function actionStroke(type: CoachActionType) {
  return COLORS[type];
}

function markerFor(type: CoachActionType) {
  return type === "screen" || type === "defense" ? undefined : `url(#rize-${type}-arrow)`;
}

export function AnimatedCoachboard({ frame, step, totalSteps, actionLabel }: AnimatedCoachboardProps) {
  const actionTypes = Array.from(new Set(frame.instructions.map((instruction) => instruction.type)));
  return (
    <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
      <div className="aspect-[5/6]">
        <svg viewBox="0 0 500 600" className="h-full w-full" role="img" aria-label={`Coachboard, ${frame.title}`}>
          <defs>
            {(["move", "pass", "dribble", "cut", "roll", "pop", "shot"] as CoachActionType[]).map((type) => <marker key={type} id={`rize-${type}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={actionStroke(type)} /></marker>)}
            <pattern id="rize-court-grain" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 0 22 L 22 0" stroke="#ffffff" strokeOpacity=".025" /></pattern>
          </defs>
          <rect width="500" height="600" fill={COLORS.court} />
          <rect width="500" height="600" fill="url(#rize-court-grain)" />
          <g fill="none" stroke={COLORS.lines} strokeWidth="3" strokeOpacity=".9">
            <rect x="4" y="4" width="492" height="592" rx="8" />
            <rect x="170" y="0" width="160" height="240" fill={COLORS.paint} fillOpacity=".45" />
            <line x1="170" y1="240" x2="330" y2="240" />
            <path d="M 170 240 A 80 80 0 0 1 330 240" strokeDasharray="10 10" />
            <path d="M 330 240 A 80 80 0 0 1 170 240" />
            <path d="M 40 0 L 40 120 A 210 210 0 0 0 460 120 L 460 0" />
            <line x1="220" y1="24" x2="280" y2="24" strokeWidth="6" />
            <circle cx="250" cy="38" r="10" stroke={COLORS.ball} />
            <line x1="0" y1="480" x2="500" y2="480" />
            <circle cx="250" cy="480" r="60" />
          </g>

          <g fill="none" strokeLinecap="round">
            {frame.instructions.map((instruction, index) => <path key={`${instruction.type}-${instruction.from}-${instruction.to}-${index}`} d={pathFor(instruction, frame)} stroke={actionStroke(instruction.type)} strokeWidth={instruction.type === "screen" ? 7 : instruction.type === "defense" ? 3 : 4} strokeDasharray={instruction.type === "pass" ? "10 8" : instruction.type === "defense" ? "3 8" : undefined} markerEnd={markerFor(instruction.type)} opacity=".95" />)}
            {frame.instructions.filter((instruction) => instruction.type === "screen").map((instruction, index) => { const point = entityPoint(frame, instruction.from); return <line key={`screen-bar-${index}`} x1={point.x - 10} y1={point.y - 10} x2={point.x + 10} y2={point.y + 10} stroke={COLORS.screen} strokeWidth="5" />; })}
          </g>

          {frame.instructions.map((instruction, index) => { const from = entityPoint(frame, instruction.from); const to = entityPoint(frame, instruction.to); const center = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }; return <g key={`label-${instruction.type}-${index}`}><rect x={center.x - 30} y={center.y - 10} width="60" height="18" rx="9" fill="#0f172a" fillOpacity=".86" /><text x={center.x} y={center.y + 4} textAnchor="middle" fill={actionStroke(instruction.type)} fontSize="9" fontWeight="800">{actionName(instruction.type)}</text></g>; })}

          {frame.players.map((player) => { const position = toSvg(player.x, player.y); return <g key={player.id} transform={`translate(${position.x} ${position.y})`}><circle r="18" fill={player.team === "offense" ? COLORS.offense : COLORS.defense} fillOpacity={player.team === "offense" ? 1 : .18} stroke={player.team === "offense" ? "#ffedd5" : COLORS.defense} strokeWidth="3" /><text y="6" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800">{player.label}</text></g>; })}
          <g transform={`translate(${toSvg(frame.ball.x, frame.ball.y).x} ${toSvg(frame.ball.x, frame.ball.y).y})`}><circle r="11" fill={COLORS.ball} stroke="#fff7ed" strokeWidth="2" /><path d="M -8 -4 Q 0 0 8 4 M -4 -10 Q 0 0 -4 10" fill="none" stroke="#fff7ed" strokeWidth="1.5" /></g>
        </svg>
      </div>
      <div className="border-t border-white/10 bg-slate-950/90 px-3 py-3"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300/70">{actionLabel}</p><p className="mt-0.5 text-sm font-black text-white">{frame.title}</p></div><span className="shrink-0 text-[10px] font-bold text-slate-500">Étape {step + 1}/{totalSteps}</span></div><p className="mt-2 text-xs leading-relaxed text-slate-400">{frame.teachingPoint}</p></div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 bg-slate-950/70 px-3 py-2 text-[10px] font-bold text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Attaque</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />Défense</span>{actionTypes.map((type) => <span key={type}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: actionStroke(type) }} />{actionName(type)}</span>)}</div>
    </div>
  );
}
