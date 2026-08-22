import { useMemo, useState } from "react";
import {
  calculateApex,
  calculateApexDeficit,
  calculateJumpHeightFromFrames,
  calculateJumpHeightFromFlightTime,
  calculateProgressPercent,
  calculateRSI,
} from "./calculations";

function formatNumber(value: number, decimals = 1) {
  return Number.isFinite(value) ? value.toFixed(decimals) : "0.0";
}

export function PerformancePanel() {
  const [reachCm, setReachCm] = useState(229);
  const [jumpCm, setJumpCm] = useState(35);
  const [targetApexCm, setTargetApexCm] = useState(320);
  const [flightTime, setFlightTime] = useState(0.53);
  const [contactTime, setContactTime] = useState(0.25);
  const [takeoffFrame, setTakeoffFrame] = useState(0);
  const [landingFrame, setLandingFrame] = useState(127);

  const metrics = useMemo(() => {
    const videoJump = calculateJumpHeightFromFrames(takeoffFrame, landingFrame);
    const apex = calculateApex(reachCm, jumpCm);
    return {
      videoJump,
      flightJump: calculateJumpHeightFromFlightTime(flightTime),
      rsi: calculateRSI(jumpCm, contactTime),
      apex,
      deficit: calculateApexDeficit(targetApexCm, apex),
      progress: calculateProgressPercent(jumpCm, apex - reachCm, targetApexCm - reachCm),
    };
  }, [contactTime, flightTime, jumpCm, landingFrame, reachCm, takeoffFrame, targetApexCm]);

  const field = (label: string, value: number, onChange: (value: number) => void, step = 1) => (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-xl border-2 border-slate-700/50 bg-slate-900/50 px-3 py-2 text-white focus:border-orange-500/50 focus:outline-none"
      />
    </label>
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-white">Performance & détente</h2>
          <p className="mt-1 text-sm text-slate-400">Calculs locaux issus de My-Vertical-Jump, prêts à être reliés à l’historique.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {field("Envergure debout (cm)", reachCm, setReachCm)}
          {field("Détente actuelle (cm)", jumpCm, setJumpCm)}
          {field("Objectif d’apex (cm)", targetApexCm, setTargetApexCm)}
          {field("Temps de vol (s)", flightTime, setFlightTime, 0.01)}
          {field("Temps de contact (s)", contactTime, setContactTime, 0.01)}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Apex calculé", `${formatNumber(metrics.apex)} cm`],
          ["Déficit objectif", `${formatNumber(metrics.deficit)} cm`],
          ["RSI", formatNumber(metrics.rsi, 2)],
          ["Progression", `${formatNumber(metrics.progress)}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-bold text-orange-400">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h3 className="text-lg font-semibold text-white">Analyse vidéo</h3>
        <p className="mt-1 text-sm text-slate-400">Saisis les images de décollage et d’atterrissage d’une vidéo à 240 FPS.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {field("Image décollage", takeoffFrame, setTakeoffFrame)}
          {field("Image atterrissage", landingFrame, setLandingFrame)}
        </div>
        <div className="mt-5 rounded-xl bg-slate-900/50 p-4 text-sm text-slate-300">
          Détente estimée par vidéo : <strong className="text-orange-400">{formatNumber(metrics.videoJump)} cm</strong>.
          Détente estimée par temps de vol : <strong className="text-orange-400">{formatNumber(metrics.flightJump)} cm</strong>.
        </div>
      </div>
    </section>
  );
}
