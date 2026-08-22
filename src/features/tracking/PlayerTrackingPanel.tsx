import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  Scale,
  Trash2,
  TrendingUp,
} from "lucide-react";

type SessionLog = {
  date: string;
  title: string;
  fatigue: number;
  note: string;
  exercisesDone: number;
  exercisesTotal: number;
  shootAtt?: number;
  shootMade?: number;
};

type WeightEntry = { date: string; value: number };
type InjuryEntry = { date: string; type: string; pain: number; status: string; note: string };
type InjuryInfo = { name: string; short: string; signs: string; care: string; avoid: string };

const INJURY_TYPES: Record<string, InjuryInfo> = {
  cheville: { name: "Entorse de cheville", short: "Douleur ou gonflement après torsion", signs: "Douleur latérale, gonflement ou douleur à l’appui.", care: "Repos relatif et reprise progressive lorsque l’appui est indolore.", avoid: "Éviter les sauts et changements de direction si la douleur persiste." },
  "genou-rotulien": { name: "Tendinite rotulienne", short: "Douleur sous la rotule à l’effort", signs: "Douleur sous la rotule pendant ou après les sauts.", care: "Réduire temporairement le volume et demander un avis professionnel si cela persiste.", avoid: "Ne pas continuer à augmenter la charge malgré une douleur croissante." },
  "genou-anterieur": { name: "Douleur antérieure du genou", short: "Douleur diffuse autour de la rotule", signs: "Douleur à l’avant du genou, parfois lors des escaliers ou squats.", care: "Adapter le volume et faire évaluer la cause si la douleur revient.", avoid: "Ne pas ignorer une douleur répétée à chaque séance." },
  epaule: { name: "Épaule", short: "Douleur au tir ou bras levé", signs: "Douleur lors du tir ou lorsque le bras passe au-dessus de la tête.", care: "Réduire les mouvements douloureux et consulter un professionnel de santé.", avoid: "Éviter les séries proches de l’échec en présence de douleur." },
  doigt: { name: "Doigt de basket", short: "Douleur après un ballon mal reçu", signs: "Douleur, gonflement ou difficulté à tendre le doigt.", care: "Protéger la zone et demander un avis médical si une déformation persiste.", avoid: "Ne pas forcer l’extension d’un doigt douloureux ou déformé." },
  lombaires: { name: "Lombalgie", short: "Douleur du bas du dos", signs: "Douleur ou raideur après une charge ou un pivot.", care: "Repos relatif, mouvements doux et avis professionnel si nécessaire.", avoid: "Éviter les charges lourdes jusqu’à disparition de la douleur." },
  coude: { name: "Coude", short: "Douleur du coude de la main faible", signs: "Douleur sous charge ou en fin d’extension.", care: "Réduire les charges douloureuses et demander un avis professionnel.", avoid: "Éviter les extensions et passes violentes pendant un épisode douloureux." },
};

const today = () => new Date().toISOString().slice(0, 10);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback)) as T;
  } catch {
    return fallback;
  }
}

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-3 text-sm text-white shadow-inner shadow-black/10 transition placeholder:text-slate-600 focus:border-orange-400/70";
const cardClass = "rounded-[1.75rem] border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6";

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-slate-400"><span>{children}</span>{hint && <span className="normal-case tracking-normal text-slate-600">{hint}</span>}</span>;
}

function SectionHeading({ icon: Icon, eyebrow, title, description }: { icon: typeof Activity; eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300 ring-1 ring-orange-400/15"><Icon size={19} /></div>
      <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">{eyebrow}</p><h3 className="mt-1 text-lg font-black tracking-[-0.02em] text-white">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></div>
    </div>
  );
}

export function PlayerTrackingPanel() {
  const [sessions, setSessions] = useState<SessionLog[]>(() => read("meneur_history", []));
  const [weights, setWeights] = useState<WeightEntry[]>(() => read("meneur_weight_log", []));
  const [injuries, setInjuries] = useState<InjuryEntry[]>(() => read("meneur_injury_log", []));
  const [session, setSession] = useState({ date: today(), title: "Séance basket", fatigue: 3, note: "", exercisesDone: 0, exercisesTotal: 0, shootAtt: 0, shootMade: 0 });
  const [weight, setWeight] = useState({ date: today(), value: "" });
  const [injury, setInjury] = useState({ date: today(), type: "cheville", pain: 0, status: "En cours", note: "" });
  const [selectedInjury, setSelectedInjury] = useState("cheville");

  useEffect(() => { window.localStorage.setItem("meneur_history", JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { window.localStorage.setItem("meneur_weight_log", JSON.stringify(weights)); }, [weights]);
  useEffect(() => { window.localStorage.setItem("meneur_injury_log", JSON.stringify(injuries)); }, [injuries]);

  const weightStats = useMemo(() => {
    if (!weights.length) return null;
    const ordered = [...weights].sort((a, b) => a.date.localeCompare(b.date));
    const first = ordered[0].value;
    const current = ordered[ordered.length - 1].value;
    const gain = current - first;
    return { current, gain, remaining: Math.max(0, 8 - gain), progress: Math.min(100, Math.max(0, (gain / 8) * 100)) };
  }, [weights]);

  const saveSession = () => {
    if (!session.date || !session.title.trim()) return;
    setSessions((current) => [{ ...session, title: session.title.trim(), shootAtt: session.shootAtt || undefined, shootMade: session.shootMade || undefined }, ...current]);
    setSession((current) => ({ ...current, note: "", exercisesDone: 0, exercisesTotal: 0, shootAtt: 0, shootMade: 0 }));
  };

  const addWeight = () => {
    const value = Number(weight.value);
    if (!weight.date || !Number.isFinite(value) || value <= 0) return;
    setWeights((current) => [...current, { date: weight.date, value }].sort((a, b) => a.date.localeCompare(b.date)));
    setWeight({ date: today(), value: "" });
  };

  const saveInjury = () => {
    if (!injury.date) return;
    setInjuries((current) => [{ ...injury, type: INJURY_TYPES[injury.type].name }, ...current]);
    setInjury((current) => ({ ...current, note: "", pain: 0 }));
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300/70">Journal de progression</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">Ton travail, en clair.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">Enregistre ce qui s’est vraiment passé pour prendre de meilleures décisions à la prochaine séance.</p></div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><CheckCircle2 size={16} /> Données enregistrées localement</div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className={cardClass}>
          <SectionHeading icon={Activity} eyebrow="Séance" title="Enregistrer une séance" description="Quelques secondes pour garder une trace utile." />
          <div className="grid gap-4 sm:grid-cols-2">
            <label><FieldLabel>Date</FieldLabel><input type="date" value={session.date} onChange={(e) => setSession({ ...session, date: e.target.value })} className={inputClass} /></label>
            <label><FieldLabel hint="1 = frais · 5 = épuisé">Fatigue</FieldLabel><select value={session.fatigue} onChange={(e) => setSession({ ...session, fatigue: Number(e.target.value) })} className={inputClass}>{[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>Niveau {v}/5</option>)}</select></label>
            <label className="sm:col-span-2"><FieldLabel>Nom de la séance</FieldLabel><input value={session.title} onChange={(e) => setSession({ ...session, title: e.target.value })} placeholder="Ex. Explosivité + tirs en sortie de dribble" className={inputClass} /></label>
            <label><FieldLabel hint="réalisés">Exercices</FieldLabel><input type="number" min="0" value={session.exercisesDone || ""} onChange={(e) => setSession({ ...session, exercisesDone: Number(e.target.value) })} placeholder="0" className={inputClass} /></label>
            <label><FieldLabel hint="prévus">Objectif</FieldLabel><input type="number" min="0" value={session.exercisesTotal || ""} onChange={(e) => setSession({ ...session, exercisesTotal: Number(e.target.value) })} placeholder="0" className={inputClass} /></label>
            <label><FieldLabel>Tirs tentés</FieldLabel><input type="number" min="0" value={session.shootAtt || ""} onChange={(e) => setSession({ ...session, shootAtt: Number(e.target.value) })} placeholder="0" className={inputClass} /></label>
            <label><FieldLabel>Tirs réussis</FieldLabel><input type="number" min="0" value={session.shootMade || ""} onChange={(e) => setSession({ ...session, shootMade: Number(e.target.value) })} placeholder="0" className={inputClass} /></label>
            <label className="sm:col-span-2"><FieldLabel>Ressenti</FieldLabel><textarea value={session.note} onChange={(e) => setSession({ ...session, note: e.target.value })} placeholder="Ce qui était propre, ce qui doit être repris, ton niveau d’énergie…" className={`${inputClass} min-h-28 resize-y`} /></label>
          </div>
          <button onClick={saveSession} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:shadow-orange-900/40"><CheckCircle2 size={17} /> Enregistrer la séance</button>
        </div>

        <div className={cardClass}>
          <SectionHeading icon={CalendarDays} eyebrow="Historique" title="Tes dernières séances" description="Retrouve les signaux qui comptent." />
          {sessions.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-6 text-center"><Dumbbell className="text-slate-700" size={28} /><p className="mt-3 text-sm font-semibold text-slate-300">Ton historique commencera ici.</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-600">Enregistre ta prochaine séance pour créer ton fil de progression.</p></div> : <div className="max-h-[32rem] space-y-3 overflow-auto pr-1">{sessions.slice(0, 20).map((entry, index) => <div key={`${entry.date}-${index}`} className="group rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:border-orange-400/20 hover:bg-slate-950/60"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300"><TrendingUp size={16} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="font-bold text-white">{entry.title}</p><span className="text-xs text-slate-600">{entry.date}</span></div><p className="mt-1 text-xs text-slate-400">Fatigue {entry.fatigue}/5 · {entry.exercisesDone}/{entry.exercisesTotal} exercices{entry.shootAtt ? ` · Tirs ${entry.shootMade || 0}/${entry.shootAtt}` : ""}</p>{entry.note && <p className="mt-3 border-l-2 border-orange-500/30 pl-3 text-sm leading-relaxed text-slate-500">{entry.note}</p>}</div><button aria-label="Supprimer la séance" onClick={() => setSessions((current) => current.filter((_, i) => i !== index))} className="rounded-lg p-2 text-slate-600 opacity-60 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"><Trash2 size={16} /></button></div></div>)}</div>}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className={cardClass}>
          <SectionHeading icon={Scale} eyebrow="Corps" title="Suivi du poids" description="Observe la tendance, pas seulement le chiffre." />
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label><FieldLabel>Date</FieldLabel><input type="date" value={weight.date} onChange={(e) => setWeight({ ...weight, date: e.target.value })} className={inputClass} /></label><label><FieldLabel>Poids</FieldLabel><input type="number" step="0.1" value={weight.value} onChange={(e) => setWeight({ ...weight, value: e.target.value })} placeholder="72,5 kg" className={inputClass} /></label><button onClick={addWeight} className="rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm font-black text-orange-200 transition hover:bg-orange-500/20">Ajouter</button></div>
          {weightStats ? <div className="mt-5 rounded-2xl bg-slate-950/40 p-4"><div className="grid grid-cols-3 gap-3 text-center"><div><p className="text-xl font-black text-white">{weightStats.current.toFixed(1)} <span className="text-xs font-semibold text-slate-500">kg</span></p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">Actuel</p></div><div><p className="text-xl font-black text-orange-300">{weightStats.gain >= 0 ? "+" : ""}{weightStats.gain.toFixed(1)} <span className="text-xs font-semibold text-slate-500">kg</span></p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">Évolution</p></div><div><p className="text-xl font-black text-white">{weightStats.remaining.toFixed(1)} <span className="text-xs font-semibold text-slate-500">kg</span></p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">Restant vers +8</p></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all" style={{ width: `${weightStats.progress}%` }} /></div></div> : <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-5 text-center text-sm text-slate-600">Ajoute ta première mesure pour voir ta tendance.</div>}
          <div className="mt-4 space-y-2">{weights.slice().reverse().map((entry, index) => <div key={`${entry.date}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-950/30 px-3 py-2 text-sm"><span className="text-slate-500">{entry.date}</span><span className="font-bold text-white">{entry.value.toFixed(1)} kg</span></div>)}</div>
        </div>

        <div className={cardClass}>
          <SectionHeading icon={HeartPulse} eyebrow="Prévention" title="Journal blessures" description="Garde une trace des zones à protéger." />
          <p className="mb-4 rounded-xl border border-amber-300/10 bg-amber-300/5 px-3 py-2 text-xs leading-relaxed text-amber-100/60">Ces informations ne constituent pas un diagnostic. En cas de douleur persistante ou importante, demande l’avis d’un professionnel de santé.</p>
          <div className="flex gap-2 overflow-x-auto pb-1">{Object.entries(INJURY_TYPES).map(([id, info]) => <button key={id} onClick={() => { setSelectedInjury(id); setInjury({ ...injury, type: id }); }} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${selectedInjury === id ? "bg-orange-500/15 text-orange-200 ring-1 ring-orange-400/30" : "bg-slate-950/40 text-slate-500 hover:text-slate-300"}`}>{info.name}</button>)}</div>
          <div className="mt-4 rounded-2xl border border-orange-400/10 bg-orange-500/5 p-4"><p className="font-bold text-white">{INJURY_TYPES[selectedInjury].name}</p><p className="mt-1 text-sm text-slate-400">{INJURY_TYPES[selectedInjury].short}</p><div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-500"><p><strong className="text-slate-300">Signes :</strong> {INJURY_TYPES[selectedInjury].signs}</p><p><strong className="text-slate-300">À faire :</strong> {INJURY_TYPES[selectedInjury].care}</p><p><strong className="text-slate-300">À éviter :</strong> {INJURY_TYPES[selectedInjury].avoid}</p></div></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><label><FieldLabel>Date</FieldLabel><input type="date" value={injury.date} onChange={(e) => setInjury({ ...injury, date: e.target.value })} className={inputClass} /></label><label><FieldLabel>Statut</FieldLabel><select value={injury.status} onChange={(e) => setInjury({ ...injury, status: e.target.value })} className={inputClass}><option>En cours</option><option>En amélioration</option><option>Résolue</option></select></label><label><FieldLabel>Douleur <span className="normal-case tracking-normal text-slate-600">/10</span></FieldLabel><input type="number" min="0" max="10" value={injury.pain || ""} onChange={(e) => setInjury({ ...injury, pain: Number(e.target.value) })} placeholder="0" className={inputClass} /></label><label><FieldLabel>Note</FieldLabel><input value={injury.note} onChange={(e) => setInjury({ ...injury, note: e.target.value })} placeholder="Contexte ou évolution" className={inputClass} /></label></div>
          <button onClick={saveInjury} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-200 transition hover:bg-rose-500/20"><HeartPulse size={17} /> Ajouter au journal</button>
          <div className="mt-4 space-y-2">{injuries.map((entry, index) => <div key={`${entry.date}-${index}`} className="flex items-center gap-3 rounded-xl bg-slate-950/35 p-3"><div className="flex-1"><p className="text-sm font-bold text-white">{entry.type}</p><p className="mt-1 text-xs text-slate-500">{entry.date} · {entry.status} · Douleur {entry.pain}/10{entry.note ? ` · ${entry.note}` : ""}</p></div><button aria-label="Supprimer la blessure" onClick={() => setInjuries((current) => current.filter((_, i) => i !== index))} className="rounded-lg p-2 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 size={16} /></button></div>)}</div>
        </div>
      </div>
    </section>
  );
}
