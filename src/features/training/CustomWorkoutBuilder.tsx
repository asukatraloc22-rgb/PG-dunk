import { useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import type { Exercise, Workout } from "../../types/domain";

type CustomWorkoutBuilderProps = { onSave: (workout: Workout) => Promise<void>; initialWorkout?: Workout };

const emptyExercise = (): Exercise => ({ name: "", sets: 3, reps: "8", restSeconds: 60, notes: "" });

export function CustomWorkoutBuilder({ onSave, initialWorkout }: CustomWorkoutBuilderProps) {
  const [title, setTitle] = useState(initialWorkout?.title ?? "Ma routine RIZE");
  const [description, setDescription] = useState(initialWorkout?.description ?? "");
  const [focusArea, setFocusArea] = useState(initialWorkout?.focusArea ?? "Ball handling");
  const [difficulty, setDifficulty] = useState(initialWorkout?.difficulty ?? "intermediate");
  const [durationMinutes, setDurationMinutes] = useState(initialWorkout?.durationMinutes ?? 45);
  const [exercises, setExercises] = useState<Exercise[]>(initialWorkout?.exercises?.length ? initialWorkout.exercises : [emptyExercise()]);
  const [isSaving, setIsSaving] = useState(false);

  const totalSets = useMemo(() => exercises.reduce((total, exercise) => total + (Number(exercise.sets) || 0), 0), [exercises]);
  const updateExercise = (index: number, patch: Partial<Exercise>) => setExercises((current) => current.map((exercise, exerciseIndex) => exerciseIndex === index ? { ...exercise, ...patch } : exercise));
  const addExercise = () => setExercises((current) => [...current, emptyExercise()]);
  const removeExercise = (index: number) => setExercises((current) => current.length === 1 ? current : current.filter((_, exerciseIndex) => exerciseIndex !== index));

  const submit = async () => {
    const validExercises = exercises.filter((exercise) => exercise.name.trim());
    if (!title.trim() || validExercises.length === 0) return;
    setIsSaving(true);
    try {
      await onSave({ title: title.trim(), description: description.trim() || "Routine personnalisée créée dans RIZE.", focusArea, difficulty, durationMinutes, exercises: validExercises, is_favorite: false });
      setExercises([emptyExercise()]);
      setTitle("Ma routine RIZE");
      setDescription("");
    } finally {
      setIsSaving(false);
    }
  };

  return <section className="space-y-4 rounded-[2rem] border border-orange-300/15 bg-slate-900/70 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
    <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">Builder</p><h3 className="mt-1 text-xl font-black text-white">{initialWorkout ? "Modifier ma séance" : "Créer ma séance"}</h3><p className="mt-1 text-sm leading-relaxed text-slate-500">{initialWorkout ? "Modifie ta routine puis remplace la version sauvegardée." : "Construis une routine adaptée à ton objectif, puis retrouve-la dans ta bibliothèque."}</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-bold text-slate-400">Nom de la routine<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none transition focus:border-orange-300/50" /></label>
      <label className="text-xs font-bold text-slate-400">Focus<input value={focusArea} onChange={(event) => setFocusArea(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none transition focus:border-orange-300/50" /></label>
      <label className="text-xs font-bold text-slate-400">Durée · {durationMinutes} min<input type="range" min="10" max="150" step="5" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="mt-3 w-full accent-orange-500" /></label>
      <label className="text-xs font-bold text-slate-400">Niveau<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-300/50"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="elite">Elite</option></select></label>
    </div>
    <label className="block text-xs font-bold text-slate-400">Intention de séance<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="Ex. handle sous pression, finition main faible…" className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-300/50" /></label>
    <div className="flex items-center justify-between"><div><p className="text-sm font-black text-white">Exercices</p><p className="text-xs text-slate-500">{exercises.length} blocs · {totalSets} sets</p></div><button type="button" onClick={addExercise} className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500/15 px-3 py-2 text-xs font-black text-orange-200 transition hover:bg-orange-500/25"><Plus size={15} />Ajouter</button></div>
    <div className="space-y-3">{exercises.map((exercise, index) => <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-orange-300/70">Bloc {index + 1}</span><button type="button" onClick={() => removeExercise(index)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300" aria-label={`Supprimer le bloc ${index + 1}`}><Trash2 size={15} /></button></div><input value={exercise.name} onChange={(event) => updateExercise(index, { name: event.target.value })} placeholder="Nom de l’exercice" className="mb-3 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-orange-300/50" /><div className="grid grid-cols-3 gap-2"><label className="text-[10px] font-bold text-slate-500">Sets<input type="number" min="1" value={exercise.sets} onChange={(event) => updateExercise(index, { sets: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/70 px-2 py-2 text-sm text-white outline-none" /></label><label className="text-[10px] font-bold text-slate-500">Reps / time<input value={exercise.reps} onChange={(event) => updateExercise(index, { reps: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/70 px-2 py-2 text-sm text-white outline-none" /></label><label className="text-[10px] font-bold text-slate-500">Repos<input type="number" min="0" step="5" value={exercise.restSeconds} onChange={(event) => updateExercise(index, { restSeconds: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/70 px-2 py-2 text-sm text-white outline-none" /></label></div><input value={exercise.notes} onChange={(event) => updateExercise(index, { notes: event.target.value })} placeholder="Coaching cue ou matériel" className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 outline-none placeholder:text-slate-600" /></div>)}</div>
    <button type="button" onClick={submit} disabled={isSaving || !title.trim() || !exercises.some((exercise) => exercise.name.trim())} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-950/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"><Check size={17} />{isSaving ? "Sauvegarde…" : initialWorkout ? "Enregistrer les modifications" : "Sauvegarder ma routine"}</button>
  </section>;
}
