import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, Gauge, Target, TrendingUp, Video, Zap } from "lucide-react";
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

type PerformanceProfile = { heightCm: number; weightKg: number; reachCm: number };
const DEFAULT_PROFILE: PerformanceProfile = { heightCm: 178, weightKg: 77, reachCm: 229 };
function readPerformanceProfile(): PerformanceProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const saved = JSON.parse(window.localStorage.getItem("rizePerformanceProfile") || "null") as Partial<PerformanceProfile> | null;
    return { heightCm: saved?.heightCm || DEFAULT_PROFILE.heightCm, weightKg: saved?.weightKg || DEFAULT_PROFILE.weightKg, reachCm: saved?.reachCm || DEFAULT_PROFILE.reachCm };
  } catch {
    return DEFAULT_PROFILE;
  }
}

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-3 text-sm text-white shadow-inner shadow-black/10 transition placeholder:text-slate-600 focus:border-orange-400/70 focus:outline-none";
const cardClass = "rounded-[1.75rem] border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6";

function Field({ label, value, onChange, step = 1, hint }: { label: string; value: number; onChange: (value: number) => void; step?: number; hint?: string }) {
  return <label className="block"><span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}{hint && <span className="normal-case tracking-normal text-slate-600">{hint}</span>}</span><input type="number" value={value} step={step} onChange={(event) => onChange(Number(event.target.value))} className={inputClass} /></label>;
}

export function PerformancePanel() {
  const profile = useMemo(readPerformanceProfile, []);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [weightKg, setWeightKg] = useState(profile.weightKg);
  const [reachCm, setReachCm] = useState(profile.reachCm);
  const [jumpCm, setJumpCm] = useState(71);
  const [targetApexCm, setTargetApexCm] = useState(320);
  const [flightTime, setFlightTime] = useState(0.53);
  const [contactTime, setContactTime] = useState(0.25);
  const [takeoffFrame, setTakeoffFrame] = useState(0);
  const [landingFrame, setLandingFrame] = useState(127);

  useEffect(() => {
    window.localStorage.setItem("rizePerformanceProfile", JSON.stringify({ heightCm, weightKg, reachCm }));
  }, [heightCm, weightKg, reachCm]);

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
      dunkReady: apex >= targetApexCm,
    };
  }, [contactTime, flightTime, jumpCm, landingFrame, reachCm, takeoffFrame, targetApexCm]);

  const rsiFeedback = metrics.rsi < 1.5
    ? { label: "Amortisseur · ressort mou", text: "Travaille la rigidité réflexe, la qualité des contacts et la force du pied. Le score est un repère, pas un diagnostic.", tone: "text-rose-300", border: "border-rose-300/15 bg-rose-500/5" }
    : metrics.rsi < 2.5
      ? { label: "Zone adaptive fonctionnelle", text: "Tu as une base exploitable. Cherche des contacts plus courts sans sacrifier le contrôle de l’atterrissage.", tone: "text-amber-300", border: "border-amber-300/15 bg-amber-500/5" }
      : { label: "Rigidité élastique élevée", text: "Bonne capacité de restitution sur ce test. Continue à suivre la qualité du rebond et la fraîcheur avant d’augmenter la charge.", tone: "text-emerald-300", border: "border-emerald-300/15 bg-emerald-500/5" };

  const metricsCards = [
    { label: "Apex calculé", value: `${formatNumber(metrics.apex)} cm`, detail: "envergure + détente", icon: Target, color: "text-orange-300" },
    { label: "Déficit objectif", value: `${formatNumber(metrics.deficit)} cm`, detail: "reste à construire", icon: ArrowUpRight, color: "text-amber-300" },
    { label: "RSI", value: formatNumber(metrics.rsi, 2), detail: rsiFeedback.label, icon: Zap, color: "text-sky-300" },
    { label: "Progression", value: `${formatNumber(metrics.progress)}%`, detail: "vers l’objectif", icon: TrendingUp, color: "text-emerald-300" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300/70">Performance</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">Mesure ton explosivité.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">Des repères simples pour comprendre ton niveau et savoir quoi travailler ensuite.</p></div><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Gauge size={16} className="text-orange-300" /> Calculs instantanés</div></div>

      <div className={cardClass}><div className="mb-5 flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300 ring-1 ring-orange-400/15"><Activity size={19} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Mesures de base</p><h3 className="mt-1 text-lg font-black tracking-[-0.02em] text-white">Ton point de départ</h3><p className="mt-1 text-sm text-slate-500">Ces repères sont sauvegardés localement sur cet appareil.</p></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Taille" hint="cm" value={heightCm} onChange={setHeightCm} /><Field label="Poids" hint="kg" value={weightKg} onChange={setWeightKg} step={0.1} /><Field label="Standing Reach" hint="cm" value={reachCm} onChange={setReachCm} /><Field label="Détente actuelle" hint="cm" value={jumpCm} onChange={setJumpCm} /><Field label="Objectif d’apex" hint="320 cm = rim + marge" value={targetApexCm} onChange={setTargetApexCm} /><Field label="Temps de vol" hint="secondes" value={flightTime} onChange={setFlightTime} step={0.01} /><Field label="Temps de contact" hint="secondes" value={contactTime} onChange={setContactTime} step={0.01} /></div></div>

      <div className={`rounded-2xl border p-4 ${metrics.dunkReady ? "border-emerald-300/20 bg-emerald-500/10" : "border-amber-300/15 bg-amber-500/5"}`}><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Dunk target</p><p className={`mt-1 text-lg font-black ${metrics.dunkReady ? "text-emerald-200" : "text-amber-200"}`}>{metrics.dunkReady ? `DUNK READY · +${formatNumber(metrics.apex - targetApexCm)} cm` : `Il manque ${formatNumber(metrics.deficit)} cm`}</p></div><Target size={19} className={metrics.dunkReady ? "text-emerald-300" : "text-amber-300"} /></div><p className="mt-2 text-xs leading-relaxed text-slate-400">Apex = Standing Reach + détente. Le calcul donne un repère mécanique vers une cible d’arceau de {formatNumber(targetApexCm, 0)} cm.</p></div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metricsCards.map((metric, index) => <div key={metric.label} className={`rize-rise-in rize-delay-${index + 1} rounded-2xl border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl`}><div className="flex items-center justify-between"><metric.icon size={17} className={metric.color} /><span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">{metric.label}</span></div><p className={`mt-4 text-2xl font-black tracking-[-0.04em] ${metric.color}`}>{metric.value}</p><p className="mt-1 text-xs text-slate-500">{metric.detail}</p></div>)}</div>

      <div className={`rounded-2xl border p-4 ${rsiFeedback.border}`}><div className="flex items-start gap-3"><Zap size={20} className={rsiFeedback.tone} /><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">RSI · Reactive Strength Index</p><p className={`mt-1 text-base font-black ${rsiFeedback.tone}`}>{rsiFeedback.label}</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{rsiFeedback.text}</p><p className="mt-2 text-[11px] text-slate-600">Formule : (hauteur de saut en mètres) ÷ temps de contact au sol en secondes.</p></div></div></div>

      <div className={cardClass}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300 ring-1 ring-sky-400/15"><Video size={19} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300/70">Analyse vidéo</p><h3 className="mt-1 text-lg font-black tracking-[-0.02em] text-white">Lis ton impulsion</h3><p className="mt-1 text-sm text-slate-500">Saisis les images de décollage et d’atterrissage d’une vidéo à 240 FPS.</p></div></div><span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-300">240 FPS</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Image décollage" hint="frame" value={takeoffFrame} onChange={setTakeoffFrame} /><Field label="Image atterrissage" hint="frame" value={landingFrame} onChange={setLandingFrame} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">Détente vidéo</p><p className="mt-2 text-xl font-black text-white">{formatNumber(metrics.videoJump)} <span className="text-sm font-semibold text-slate-500">cm</span></p></div><div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">Détente temps de vol</p><p className="mt-2 text-xl font-black text-white">{formatNumber(metrics.flightJump)} <span className="text-sm font-semibold text-slate-500">cm</span></p></div></div></div>
    </section>
  );
}
