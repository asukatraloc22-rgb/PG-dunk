import { CalendarDays, Dumbbell, LibraryBig, Sparkles } from "lucide-react";
import { MeneurProgramLibrary } from "./MeneurProgramLibrary";
import { WeeklyPlanner } from "../tracking/WeeklyPlanner";
import type { MeneurDayKey, MeneurPlannedSession } from "../../data/meneur-program";
import type { Workout } from "../../types/domain";
import { WorkoutExecution } from "./WorkoutExecution";

type TrainingHubProps = {
  activeWorkout: Workout | null;
  onCloseWorkout: () => void;
  onStartSession: (session: MeneurPlannedSession) => void;
  onAddToPlanner: (day: MeneurDayKey, session: MeneurPlannedSession) => void;
};

export function TrainingHub({ activeWorkout, onCloseWorkout, onStartSession, onAddToPlanner }: TrainingHubProps) {
  return (
    <section className="space-y-7">
      <header className="rize-rise-in">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300/70">Entraîner</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">Ton système de séance.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Le programme donne la direction, le planning choisit le moment et l’exécution transforme chaque séance en progression mesurable. Tout se passe ici, en local.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3" aria-label="Organisation de l’entraînement">
        <div className="rize-glass-card relative rounded-2xl p-4"><LibraryBig size={18} className="text-orange-300" /><p className="mt-5 text-sm font-black text-white">1. Choisir</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Pars de la bibliothèque Meneur ou d’un workout personnalisé.</p></div>
        <div className="rize-glass-card relative rounded-2xl p-4"><CalendarDays size={18} className="text-sky-300" /><p className="mt-5 text-sm font-black text-white">2. Planifier</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Dépose la séance dans ta semaine sans perdre sa structure.</p></div>
        <div className="rize-glass-card relative rounded-2xl p-4"><Dumbbell size={18} className="text-emerald-300" /><p className="mt-5 text-sm font-black text-white">3. Exécuter</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Lance les séries, les repos et l’historique depuis le même moteur.</p></div>
      </div>

      {activeWorkout && <div className="rize-glass-card relative rounded-[2rem] p-3 sm:p-5"><div className="mb-3 flex items-center gap-2 px-1"><Sparkles size={17} className="text-orange-300" /><p className="text-sm font-black text-white">Séance en cours</p></div><WorkoutExecution workout={activeWorkout} onClose={onCloseWorkout} /></div>}

      <div className="rize-glass-card relative rounded-[2rem] p-4 sm:p-6">
        <div className="mb-5 flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300"><LibraryBig size={19} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Bibliothèque source</p><h3 className="mt-1 text-xl font-black text-white">Le Meneur Complet</h3><p className="mt-1 text-xs text-slate-500">La base originale, directement planifiable ou lançable.</p></div></div>
        <MeneurProgramLibrary embedded onStartSession={onStartSession} onAddToPlanner={onAddToPlanner} />
      </div>

      <div className="rize-glass-card relative rounded-[2rem] p-4 sm:p-6">
        <div className="mb-5 flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300"><CalendarDays size={19} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300/70">Orchestration</p><h3 className="mt-1 text-xl font-black text-white">Planning de la semaine</h3><p className="mt-1 text-xs text-slate-500">Retrouve, déplace et valide tes séances au même endroit.</p></div></div>
        <WeeklyPlanner embedded onStartSession={onStartSession} />
      </div>
    </section>
  );
}
