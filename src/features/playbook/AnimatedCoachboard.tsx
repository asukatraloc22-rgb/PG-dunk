import type { CoachFrame, CoachPlayer } from "../../data/coachboard-animations";

const COLORS = {
  court: "#253449",
  paint: "#34445a",
  lines: "#e8edf5",
  offense: "#f59e0b",
  defense: "#ef4444",
  ball: "#ea580c",
  move: "#ffffff",
  pass: "#60a5fa",
  dribble: "#fbbf24",
  screen: "#10b981",
};

type AnimatedCoachboardProps = {
  frame: CoachFrame;
  previousFrame: CoachFrame;
  step: number;
  totalSteps: number;
  actionLabel: string;
};

const toSvg = (x: number, y: number) => ({ x: (x / 100) * 500, y: (y / 100) * 600 });
const playerAt = (frame: CoachFrame, id: string) => frame.players.find((player) => player.id === id);

function movementPath(previous: CoachPlayer, current: CoachPlayer) {
  const from = toSvg(previous.x, previous.y);
  const to = toSvg(current.x, current.y);
  const curve = Math.max(8, Math.min(28, Math.abs(to.x - from.x) * 0.22));
  return `M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${Math.min(from.y, to.y) - curve} ${to.x} ${to.y}`;
}

export function AnimatedCoachboard({ frame, previousFrame, step, totalSteps, actionLabel }: AnimatedCoachboardProps) {
  return (
    <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
      <div className="aspect-[5/6]">
        <svg viewBox="0 0 500 600" className="h-full w-full" role="img" aria-label={`Coachboard tactique, ${frame.title}`}>
          <defs>
            <marker id="rize-move-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.move} /></marker>
            <marker id="rize-pass-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.pass} /></marker>
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
          <g fill="none" strokeLinecap="round" markerEnd="url(#rize-move-arrow)">
            {frame.players.filter((player) => player.team === "offense").map((player) => { const previous = playerAt(previousFrame, player.id); if (!previous || (previous.x === player.x && previous.y === player.y)) return null; const isScreen = frame.title.toLowerCase().includes("screen") || frame.title.toLowerCase().includes("écran"); return <path key={player.id} d={movementPath(previous, player)} stroke={isScreen ? COLORS.screen : COLORS.move} strokeWidth={isScreen ? 5 : 3} strokeDasharray={isScreen ? "1 0" : "8 7"} markerEnd={isScreen ? undefined : "url(#rize-move-arrow)"} />; })}
            {frame.ballTarget && <path d={`M ${toSvg(frame.ball.x, frame.ball.y).x} ${toSvg(frame.ball.x, frame.ball.y).y} L ${toSvg(frame.ballTarget.x, frame.ballTarget.y).x} ${toSvg(frame.ballTarget.x, frame.ballTarget.y).y}`} stroke={COLORS.pass} strokeWidth="3" strokeDasharray="8 7" markerEnd="url(#rize-pass-arrow)" />}
          </g>
          {frame.players.map((player) => { const position = toSvg(player.x, player.y); return <g key={player.id} transform={`translate(${position.x} ${position.y})`} className="transition-transform duration-500 ease-out"><circle r="18" fill={player.team === "offense" ? COLORS.offense : COLORS.defense} fillOpacity={player.team === "offense" ? 1 : .2} stroke={player.team === "offense" ? "#ffedd5" : COLORS.defense} strokeWidth="3" /><text y="6" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800">{player.label}</text></g>; })}
          <g transform={`translate(${toSvg(frame.ball.x, frame.ball.y).x} ${toSvg(frame.ball.x, frame.ball.y).y})`} className="transition-transform duration-500 ease-out"><circle r="11" fill={COLORS.ball} stroke="#fff7ed" strokeWidth="2" /><path d="M -8 -4 Q 0 0 8 4 M -4 -10 Q 0 0 -4 10" fill="none" stroke="#fff7ed" strokeWidth="1.5" /></g>
        </svg>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950/85 px-3 py-2.5"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300/70">{actionLabel}</p><p className="mt-0.5 text-xs font-bold text-white">{frame.title}</p></div><span className="text-[10px] font-bold text-slate-500">Étape {step + 1}/{totalSteps}</span></div>
      <div className="flex flex-wrap items-center gap-3 border-t border-white/5 bg-slate-950/60 px-3 py-2 text-[10px] font-bold text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Attaque</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />Défense</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-400" />Passe</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />Écran</span></div>
    </div>
  );
}
