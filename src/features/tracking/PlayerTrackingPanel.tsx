import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, HeartPulse, Scale, Trash2 } from "lucide-react";

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
  try { return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback)) as T; } catch { return fallback; }
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
      <div><h2 className="text-xl font-semibold text-white">Suivi du joueur</h2><p className="mt-1 text-sm text-slate-400">Historique, poids et prévention issus de Le-Meneur-Complet.</p></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
          <div className="mb-4 flex items-center gap-2"><Activity className="text-orange-400" size={20} /><h3 className="text-lg font-semibold text-white">Enregistrer une séance</h3></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="date" value={session.date} onChange={(e) => setSession({ ...session, date: e.target.value })} className="input-field" />
            <select value={session.fatigue} onChange={(e) => setSession({ ...session, fatigue: Number(e.target.value) })} className="input-field">{[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>Fatigue {v}/5</option>)}</select>
            <input value={session.title} onChange={(e) => setSession({ ...session, title: e.target.value })} placeholder="Nom de la séance" className="input-field sm:col-span-2" />
            <input type="number" min="0" value={session.exercisesDone || ""} onChange={(e) => setSession({ ...session, exercisesDone: Number(e.target.value) })} placeholder="Exercices réalisés" className="input-field" />
            <input type="number" min="0" value={session.exercisesTotal || ""} onChange={(e) => setSession({ ...session, exercisesTotal: Number(e.target.value) })} placeholder="Exercices prévus" className="input-field" />
            <input type="number" min="0" value={session.shootAtt || ""} onChange={(e) => setSession({ ...session, shootAtt: Number(e.target.value) })} placeholder="Tirs tentés" className="input-field" />
            <input type="number" min="0" value={session.shootMade || ""} onChange={(e) => setSession({ ...session, shootMade: Number(e.target.value) })} placeholder="Tirs réussis" className="input-field" />
            <textarea value={session.note} onChange={(e) => setSession({ ...session, note: e.target.value })} placeholder="Sensations et notes" className="input-field sm:col-span-2" />
          </div>
          <button onClick={saveSession} className="mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 font-semibold text-white">Enregistrer la séance</button>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6"><div className="mb-4 flex items-center gap-2"><CalendarDays className="text-orange-400" size={20} /><h3 className="text-lg font-semibold text-white">Historique</h3></div>{sessions.length === 0 ? <p className="text-sm text-slate-500">Aucune séance enregistrée.</p> : <div className="max-h-80 space-y-2 overflow-auto">{sessions.slice(0, 20).map((entry, index) => <div key={`${entry.date}-${index}`} className="flex items-start gap-3 rounded-xl bg-slate-900/50 p-3"><div className="min-w-0 flex-1"><p className="font-medium text-white">{entry.date} — {entry.title}</p><p className="text-sm text-slate-400">Fatigue {entry.fatigue}/5 · {entry.exercisesDone}/{entry.exercisesTotal} exercices{entry.shootAtt ? ` · Tir ${entry.shootMade || 0}/${entry.shootAtt}` : ""}</p>{entry.note && <p className="mt-1 text-sm text-slate-500">{entry.note}</p>}</div><button aria-label="Supprimer la séance" onClick={() => setSessions((current) => current.filter((_, i) => i !== index))} className="text-slate-500 hover:text-red-400"><Trash2 size={16} /></button></div>)}</div>}</div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6"><div className="mb-4 flex items-center gap-2"><Scale className="text-orange-400" size={20} /><h3 className="text-lg font-semibold text-white">Suivi du poids</h3></div><div className="flex flex-wrap gap-3"><input type="date" value={weight.date} onChange={(e) => setWeight({ ...weight, date: e.target.value })} className="input-field" /><input type="number" step="0.1" value={weight.value} onChange={(e) => setWeight({ ...weight, value: e.target.value })} placeholder="Poids en kg" className="input-field" /><button onClick={addWeight} className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white">Ajouter</button></div>{weightStats && <div className="mt-5 grid grid-cols-3 gap-2 text-center"><div><p className="text-xl font-bold text-white">{weightStats.current.toFixed(1)} kg</p><p className="text-xs text-slate-500">Actuel</p></div><div><p className="text-xl font-bold text-orange-400">{weightStats.gain >= 0 ? "+" : ""}{weightStats.gain.toFixed(1)} kg</p><p className="text-xs text-slate-500">Évolution</p></div><div><p className="text-xl font-bold text-white">{weightStats.remaining.toFixed(1)} kg</p><p className="text-xs text-slate-500">Restant vers +8</p></div></div>}<div className="mt-4 space-y-2">{weights.slice().reverse().map((entry, index) => <div key={`${entry.date}-${index}`} className="flex justify-between rounded-lg bg-slate-900/50 p-2 text-sm"><span className="text-slate-400">{entry.date}</span><span className="text-white">{entry.value.toFixed(1)} kg</span></div>)}</div></div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6"><div className="mb-4 flex items-center gap-2"><HeartPulse className="text-orange-400" size={20} /><h3 className="text-lg font-semibold text-white">Journal blessures</h3></div><p className="mb-4 text-xs text-slate-500">Je suis une IA, pas un professionnel de santé. Ces informations ne constituent pas un diagnostic.</p><div className="flex flex-wrap gap-2">{Object.entries(INJURY_TYPES).map(([id, info]) => <button key={id} onClick={() => { setSelectedInjury(id); setInjury({ ...injury, type: id }); }} className={`rounded-lg px-3 py-2 text-left text-xs ${selectedInjury === id ? "bg-orange-500/20 text-orange-300" : "bg-slate-900/50 text-slate-400"}`}>{info.name}</button>)}</div><div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-slate-300"><p className="font-medium text-white">{INJURY_TYPES[selectedInjury].name}</p><p className="mt-1">{INJURY_TYPES[selectedInjury].short}</p><p className="mt-2 text-slate-400"><strong>Signes :</strong> {INJURY_TYPES[selectedInjury].signs}</p><p className="mt-1 text-slate-400"><strong>Prise en charge générale :</strong> {INJURY_TYPES[selectedInjury].care}</p><p className="mt-1 text-slate-400"><strong>À éviter :</strong> {INJURY_TYPES[selectedInjury].avoid}</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><input type="date" value={injury.date} onChange={(e) => setInjury({ ...injury, date: e.target.value })} className="input-field" /><select value={injury.status} onChange={(e) => setInjury({ ...injury, status: e.target.value })} className="input-field"><option>En cours</option><option>En amélioration</option><option>Résolue</option></select><input type="number" min="0" max="10" value={injury.pain || ""} onChange={(e) => setInjury({ ...injury, pain: Number(e.target.value) })} placeholder="Douleur /10" className="input-field" /><input value={injury.note} onChange={(e) => setInjury({ ...injury, note: e.target.value })} placeholder="Note" className="input-field" /></div><button onClick={saveInjury} className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 font-semibold text-red-300">Enregistrer dans le journal</button><div className="mt-4 space-y-2">{injuries.map((entry, index) => <div key={`${entry.date}-${index}`} className="flex justify-between rounded-lg bg-slate-900/50 p-3 text-sm"><div><p className="text-white">{entry.date} — {entry.type}</p><p className="text-slate-400">{entry.status} · Douleur {entry.pain}/10{entry.note ? ` · ${entry.note}` : ""}</p></div><button aria-label="Supprimer la blessure" onClick={() => setInjuries((current) => current.filter((_, i) => i !== index))} className="text-slate-500 hover:text-red-400"><Trash2 size={16} /></button></div>)}</div></div>
      </div>
    </section>
  );
}
