import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
type Day = (typeof DAYS)[number];
type Schedule = Record<Day, string[]>;

const DEFAULT_SCHEDULE: Schedule = {
  lundi: ["Force bas du corps", "Mobilité hanches & chevilles"],
  mardi: ["Tir : volume et zones"],
  mercredi: ["Récupération active", "Étirements"],
  jeudi: ["Explosivité & détente", "Core"],
  vendredi: ["Playbook & IQ meneur"],
  samedi: ["Session libre / match"],
  dimanche: ["Repos complet"],
};

function readSchedule(): Schedule {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE;
  try {
    const saved = window.localStorage.getItem("pgDunkWeeklySchedule");
    return saved ? { ...DEFAULT_SCHEDULE, ...JSON.parse(saved) } : DEFAULT_SCHEDULE;
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

export function WeeklyPlanner() {
  const [schedule, setSchedule] = useState<Schedule>(readSchedule);
  const [selectedDay, setSelectedDay] = useState<Day>("lundi");
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    window.localStorage.setItem("pgDunkWeeklySchedule", JSON.stringify(schedule));
  }, [schedule]);

  const updateDay = (day: Day, tasks: string[]) => setSchedule((current) => ({ ...current, [day]: tasks }));

  const addTask = () => {
    const task = newTask.trim();
    if (!task) return;
    updateDay(selectedDay, [...schedule[selectedDay], task]);
    setNewTask("");
  };

  const editTask = (day: Day, index: number) => {
    const replacement = window.prompt("Modifier la session", schedule[day][index]);
    if (!replacement?.trim()) return;
    const tasks = [...schedule[day]];
    tasks[index] = replacement.trim();
    updateDay(day, tasks);
  };

  const removeTask = (day: Day, index: number) => {
    updateDay(day, schedule[day].filter((_, taskIndex) => taskIndex !== index));
  };

  const moveTask = (day: Day, index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= schedule[day].length) return;
    const tasks = [...schedule[day]];
    [tasks[index], tasks[target]] = [tasks[target], tasks[index]];
    updateDay(day, tasks);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="text-xl font-semibold text-white">Planning hebdomadaire</h2>
        <p className="mt-1 text-sm text-slate-400">Organisation locale des sessions, issue du planner de My-Vertical-Jump.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value as Day)} className="rounded-xl border-2 border-slate-700/50 bg-slate-900/50 px-3 py-2 text-white">
            {DAYS.map((day) => <option key={day} value={day}>{day[0].toUpperCase() + day.slice(1)}</option>)}
          </select>
          <input value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addTask(); }} placeholder="Ajouter une session" className="min-w-0 flex-1 rounded-xl border-2 border-slate-700/50 bg-slate-900/50 px-3 py-2 text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:outline-none" />
          <button onClick={addTask} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 font-semibold text-white"><Plus size={18} /> Ajouter</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DAYS.map((day) => (
          <div key={day} className={`rounded-2xl border p-5 ${selectedDay === day ? "border-orange-500/50 bg-orange-500/5" : "border-slate-700/50 bg-slate-800/50"}`}>
            <button onClick={() => setSelectedDay(day)} className="mb-4 text-left text-lg font-semibold capitalize text-white">{day}</button>
            <div className="space-y-2">
              {schedule[day].map((task, index) => (
                <div key={`${task}-${index}`} className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 p-3">
                  <span className="min-w-0 flex-1 text-sm text-slate-300">{task}</span>
                  <button aria-label="Monter la session" onClick={() => moveTask(day, index, -1)} className="text-slate-500 hover:text-white"><ChevronUp size={15} /></button>
                  <button aria-label="Descendre la session" onClick={() => moveTask(day, index, 1)} className="text-slate-500 hover:text-white"><ChevronDown size={15} /></button>
                  <button aria-label="Modifier la session" onClick={() => editTask(day, index)} className="text-slate-500 hover:text-orange-400"><Pencil size={15} /></button>
                  <button aria-label="Supprimer la session" onClick={() => removeTask(day, index)} className="text-slate-500 hover:text-red-400"><Trash2 size={15} /></button>
                </div>
              ))}
              {schedule[day].length === 0 && <p className="text-sm text-slate-500">Aucune session prévue.</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
