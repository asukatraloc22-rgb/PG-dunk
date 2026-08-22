import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Timer } from "lucide-react";
import type { Workout } from "../../types/domain";

type WorkoutExecutionProps = { workout: Workout; onClose: () => void };

export function WorkoutExecution({ workout, onClose }: WorkoutExecutionProps) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(1);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const exercise = workout.exercises[exerciseIndex];
  const totalSets = useMemo(() => workout.exercises.reduce((total, item) => total + item.sets, 0), [workout.exercises]);
  const completedSets = workout.exercises.slice(0, exerciseIndex).reduce((total, item) => total + item.sets, 0) + setIndex - 1;
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;

  useEffect(() => {
    if (!restRunning || restRemaining <= 0) return;
    const interval = window.setInterval(() => setRestRemaining((current) => {
      if (current <= 1) { setRestRunning(false); return 0; }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [restRunning, restRemaining]);

  const finish = () => {
    const history = JSON.parse(window.localStorage.getItem("rize_workout_history") || "[]") as Array<Record<string, unknown>>;
    window.localStorage.setItem("rize_workout_history", JSON.stringify([{ workoutId: workout.id, title: workout.title, completedAt: new Date().toISOString(), durationMinutes: Math.round((Date.now() - startedAt) / 60000), completedSets: totalSets, totalSets }, ...history]));
    onClose();
  };

  const completeSet = () => {
    if (!exercise) return;
    if (setIndex < exercise.sets) { setSetIndex((current) => current + 1); setRestRemaining(exercise.restSeconds); setRestRunning(exercise.restSeconds > 0); return; }
    if (exerciseIndex < workout.exercises.length - 1) { setExerciseIndex((current) => current + 1); setSetIndex(1); setRestRemaining(exercise.restSeconds); setRestRunning(exercise.restSeconds > 0); return; }
    finish();
  };

  if (!exercise) return null;
  return <section className="mx-auto max-w-2xl space-y-4 rounded-[2rem] border border-orange-300/15 bg-slate-900/80 p-4 shadow-2xl shadow-black/20 sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">Session en cours</p><h2 className="mt-1 text-2xl font-black text-white">{workout.title}</h2><p className="mt-1 text-sm text-slate-500">{exerciseIndex + 1}/{workout.exercises.length} · {workout.focusArea}</p></div><button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-white/5 hover:text-white">Quitter</button></div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-950"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-200" style={{ width: `${progress}%` }} /></div>
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Exercice {exerciseIndex + 1}</p><h3 className="mt-2 text-2xl font-black text-white">{exercise.name}</h3><p className="mt-2 text-sm text-slate-400">{exercise.notes || "Reste propre techniquement et contrôle chaque répétition."}</p><div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/[0.04] p-3 text-center"><p className="text-[10px] font-bold uppercase text-slate-600">Set</p><p className="mt-1 text-xl font-black text-white">{setIndex}/{exercise.sets}</p></div><div className="rounded-xl bg-white/[0.04] p-3 text-center"><p className="text-[10px] font-bold uppercase text-slate-600">Reps / time</p><p className="mt-1 text-xl font-black text-white">{exercise.reps}</p></div><div className="rounded-xl bg-white/[0.04] p-3 text-center"><p className="text-[10px] font-bold uppercase text-slate-600">Repos</p><p className="mt-1 text-xl font-black text-white">{exercise.restSeconds}s</p></div></div></div>
    {restRemaining > 0 && <div className="flex items-center justify-between rounded-2xl border border-sky-300/15 bg-sky-500/10 p-4"><div className="flex items-center gap-2"><Timer className="text-sky-300" size={18} /><div><p className="text-xs font-black uppercase tracking-wider text-sky-200">Rest timer</p><p className="text-sm text-slate-400">Respire, prépare la prochaine série.</p></div></div><div className="flex items-center gap-2"><span className="text-2xl font-black text-white">{restRemaining}s</span><button type="button" onClick={() => setRestRunning((running) => !running)} className="rounded-lg bg-sky-300/15 p-2 text-sky-200">{restRunning ? <Pause size={15} /> : <Play size={15} />}</button><button type="button" onClick={() => { setRestRemaining(0); setRestRunning(false); }} className="rounded-lg p-2 text-slate-500 hover:text-white"><RotateCcw size={15} /></button></div></div>}
    <div className="flex gap-2"><button type="button" disabled={exerciseIndex === 0 && setIndex === 1} onClick={() => { if (setIndex > 1) setSetIndex((current) => current - 1); else { setExerciseIndex((current) => current - 1); setSetIndex(workout.exercises[exerciseIndex - 1]?.sets ?? 1); } }} className="rounded-xl border border-white/10 px-4 py-3 text-slate-400 disabled:opacity-30"><ChevronLeft size={18} /></button><button type="button" onClick={completeSet} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-black text-white"><Check size={17} />{exerciseIndex === workout.exercises.length - 1 && setIndex === exercise.sets ? "Terminer la séance" : "Valider la série"}</button><button type="button" disabled={exerciseIndex === workout.exercises.length - 1 && setIndex === exercise.sets} onClick={() => { if (setIndex < exercise.sets) setSetIndex((current) => current + 1); else { setExerciseIndex((current) => current + 1); setSetIndex(1); } }} className="rounded-xl border border-white/10 px-4 py-3 text-slate-400 disabled:opacity-30"><ChevronRight size={18} /></button></div>
  </section>;
}
