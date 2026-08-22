import { useState, useEffect, useRef } from 'react';
import {
  Dumbbell, Zap, Target, Clock, Trash2, ChevronDown, ChevronUp,
  History, Sparkles, AlertCircle, Loader2, Heart, Flame, Activity,
  BookOpen, BrainCircuit, Trophy, Plus, Timer, Pause, Play, RotateCcw,
  Layout, TrendingUp, Eye, CheckCircle, XCircle
} from 'lucide-react';

import type { Workout } from "./types/domain";
import { PerformancePanel } from "./features/performance/PerformancePanel";
import { WeeklyPlanner } from "./features/tracking/WeeklyPlanner";
import { PlayerTrackingPanel } from "./features/tracking/PlayerTrackingPanel";
import { deleteWorkout as persistDeleteWorkout, listWorkouts, saveWorkout as persistSaveWorkout, setWorkoutFavorite } from "./lib/workout-repository";
import {
  COURT_ZONES,
  DIFFICULTY_LEVELS,
  FOCUS_AREAS,
  IQ_SCENARIOS,
  PHASES,
  PLAYBOOK_PLAYS,
} from "./data/domain-data";

function App() {
  const [activeTab, setActiveTab] = useState<'workouts' | 'performance' | 'planner' | 'tracking' | 'iq' | 'playbook' | 'sniper' | 'timer'>('workouts');
  const [workoutTab, setWorkoutTab] = useState<'generate' | 'history' | 'favorites'>('generate');

  // Workout states
  const [generatedWorkout, setGeneratedWorkout] = useState<Workout | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const [favoriteWorkouts, setFavoriteWorkouts] = useState<Workout[]>([]);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusArea, setFocusArea] = useState('vertical jump');
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [energyLevel, setEnergyLevel] = useState(7);
  const [currentPhase, setCurrentPhase] = useState('Développement Force');
  const [limitations, setLimitations] = useState('');
  const [specificGoals, setSpecificGoals] = useState('');

  // IQ Quiz states
  const [currentScenario, setCurrentScenario] = useState(0);
  const [iqScore, setIqScore] = useState(0);
  const [iqAnswers, setIqAnswers] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Sniper Tracker states
  const [sniperShots, setSniperShots] = useState<{ zone: string; made: boolean }[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.localStorage.getItem('pgDunkSniperShots') || '[]') as { zone: string; made: boolean }[];
    } catch {
      return [];
    }
  });
  const [selectedSniperZone, setSelectedSniperZone] = useState<string | null>(null);
  const [sniperMode, setSniperMode] = useState<'add' | 'view'>('add');
  const [sniperStats, setSniperStats] = useState<Record<string, { made: number; total: number }>>({});

  // Timer states
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(90);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Playbook states
  const [selectedPlay, setSelectedPlay] = useState(PLAYBOOK_PLAYS[0]);

  useEffect(() => {
    let cancelled = false;
    listWorkouts().then((workouts) => {
      if (cancelled) return;
      setSavedWorkouts(workouts);
      setFavoriteWorkouts(workouts.filter((workout) => workout.is_favorite));
    }).catch(() => setError('Impossible de charger les workouts sauvegardés.'));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerRemaining]);

  useEffect(() => {
    window.localStorage.setItem('pgDunkSniperShots', JSON.stringify(sniperShots));
    const stats: Record<string, { made: number; total: number }> = {};
    sniperShots.forEach((shot) => {
      if (!stats[shot.zone]) stats[shot.zone] = { made: 0, total: 0 };
      stats[shot.zone].total++;
      if (shot.made) stats[shot.zone].made++;
    });
    setSniperStats(stats);
  }, [sniperShots]);

  const generateWorkout = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedWorkout(null);
    try {
      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ energy: energyLevel, time: duration, needs: `${focusArea}. ${specificGoals}. ${limitations}`.trim(), format: 'solo' }),
      });
      const data = await response.json() as { workout?: string; error?: string };
      if (!response.ok || !data.workout) throw new Error(data.error || 'Le service IA est indisponible.');
      setGeneratedWorkout({
        title: `Workout IA — ${focusArea}`,
        description: data.workout,
        focusArea,
        difficulty,
        durationMinutes: duration,
        exercises: [],
        is_favorite: false,
      });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Impossible de générer le workout.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkout = async (workout: Workout) => {
    try {
      const saved = await persistSaveWorkout(workout);
      setSavedWorkouts((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setGeneratedWorkout(null);
    } catch {
      setError('Impossible de sauvegarder ce workout.');
    }
  };

  const toggleFavorite = async (workout: Workout) => {
    if (!workout.id) return;
    const nextFavorite = !workout.is_favorite;
    try {
      await setWorkoutFavorite(workout.id, nextFavorite);
      const updatedWorkout = { ...workout, is_favorite: nextFavorite };
      setSavedWorkouts((current) => current.map((item) => item.id === workout.id ? updatedWorkout : item));
      setFavoriteWorkouts((current) => nextFavorite ? [updatedWorkout, ...current.filter((item) => item.id !== workout.id)] : current.filter((item) => item.id !== workout.id));
    } catch {
      setError('Impossible de modifier ce favori.');
    }
  };

  const deleteWorkout = async (id: string) => {
    try {
      await persistDeleteWorkout(id);
      setSavedWorkouts((current) => current.filter((workout) => workout.id !== id));
      setFavoriteWorkouts((current) => current.filter((workout) => workout.id !== id));
    } catch {
      setError('Impossible de supprimer ce workout.');
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedWorkouts(newExpanded);
  };

  const handleIqAnswer = (optionIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(optionIndex);
    setShowFeedback(true);
    if (IQ_SCENARIOS[currentScenario].options[optionIndex].correct) {
      setIqScore(iqScore + 1);
    }
    setIqAnswers([...iqAnswers, optionIndex]);
  };

  const nextScenario = () => {
    if (currentScenario < IQ_SCENARIOS.length - 1) {
      setCurrentScenario(currentScenario + 1);
      setShowFeedback(false);
      setSelectedAnswer(null);
    }
  };

  const resetIqQuiz = () => {
    setCurrentScenario(0);
    setIqScore(0);
    setIqAnswers([]);
    setShowFeedback(false);
    setSelectedAnswer(null);
  };

  const addSniperShot = (zone: string, made: boolean) => {
    setSniperShots((current) => [...current, { zone, made }]);
    setSelectedSniperZone(null);
  };

  const clearSniperShots = () => {
    setSniperShots([]);
    setSniperStats({});
    setSelectedSniperZone(null);
  };

  const startTimer = () => {
    setTimerRemaining(timerSeconds);
    setTimerRunning(true);
  };

  const stopTimer = () => {
    setTimerRunning(false);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerRemaining(timerSeconds);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'beginner': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'intermediate': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'elite': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const WorkoutCard = ({ workout, isPreview = false }: { workout: Workout; isPreview?: boolean }) => {
    const isExpanded = expandedWorkouts.has(workout.id || 'preview');
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-orange-500/30 transition-all">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(workout.difficulty)}`}>
                  {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <Clock size={14} /> {workout.durationMinutes} min
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <Dumbbell size={14} /> {workout.exercises.length} ex.
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{workout.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2">{workout.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isPreview && workout.id && (
                <>
                  <button onClick={() => toggleFavorite(workout)} className={`p-2 rounded-lg transition-colors ${workout.is_favorite ? 'text-orange-400 bg-orange-500/20' : 'text-slate-500 hover:text-orange-400 hover:bg-orange-500/10'}`}>
                    <Heart size={18} fill={workout.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => deleteWorkout(workout.id!)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </>
              )}
              {isPreview && (
                <button onClick={() => saveWorkout(workout)} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25">
                  Sauvegarder
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Target size={14} className="text-orange-400" />
            <span className="text-sm text-slate-300">{workout.focusArea}</span>
          </div>
        </div>
        <div className="border-t border-slate-700/50">
          <button onClick={() => toggleExpand(workout.id || 'preview')} className="w-full px-5 py-3 flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors">
            <span className="text-sm font-medium">{workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)} sets au total</span>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {isExpanded && (
            <div className="px-5 pb-5 space-y-3">
              {workout.exercises.map((exercise, index) => (
                <div key={index} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-lg flex items-center justify-center text-xs font-bold">{index + 1}</span>
                        <h4 className="font-medium text-white">{exercise.name}</h4>
                      </div>
                      {exercise.notes && <p className="text-slate-500 text-sm mt-2 leading-relaxed">{exercise.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1.5"><span className="text-slate-500">Sets:</span><span className="text-orange-400 font-medium">{exercise.sets}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-slate-500">Reps:</span><span className="text-orange-400 font-medium">{exercise.reps}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-slate-500">Repos:</span><span className="text-orange-400 font-medium">{exercise.restSeconds}s</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const CourtVisualization = ({ plays }: { plays?: boolean }) => (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-orange-950/30 rounded-2xl border-2 border-orange-500/30 overflow-hidden">
      {/* Court lines */}
      <div className="absolute inset-x-0 top-4 h-16 border-2 border-orange-500/20 rounded-b-full" style={{ marginLeft: '15%', marginRight: '15%' }} />
      <div className="absolute inset-x-0 top-16 h-24 border-2 border-orange-500/20" style={{ marginLeft: '25%', marginRight: '25%' }} />
      <div className="absolute left-1/2 top-4 w-16 h-16 bg-orange-500/10 rounded-full -translate-x-1/2" />
      <div className="absolute left-1/2 top-20 w-6 h-6 bg-orange-500/30 rounded-full -translate-x-1/2" />
      {/* Three point line */}
      <div className="absolute left-0 bottom-0 right-0 h-1/2 border-t-2 border-orange-500/30 rounded-t-[50%]" style={{ marginLeft: '5%', marginRight: '5%' }} />
      {/* Players if plays mode */}
      {plays && selectedPlay && (
        <>
          <div className="absolute top-12 left-1/2 w-8 h-8 bg-orange-500 rounded-full -translate-x-1/2 flex items-center justify-center text-white text-xs font-bold">1</div>
          <div className="absolute top-24 left-1/4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
          <div className="absolute top-24 right-1/4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">5</div>
          <div className="absolute top-40 left-[15%] w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
          <div className="absolute top-40 right-[15%] w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
        </>
      )}
      {/* Sniper zones if not plays mode */}
      {!plays && (
        <>
          {COURT_ZONES.map((zone) => {
            const stats = sniperStats[zone.id];
            const percentage = stats ? Math.round((stats.made / stats.total) * 100) : 0;
            return (
              <button
                key={zone.id}
                onClick={() => sniperMode === 'add' && setSelectedSniperZone(zone.id)}
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  sniperMode === 'add' ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                } ${selectedSniperZone === zone.id ? 'ring-2 ring-white scale-110' : ''} ${stats ? (percentage > 50 ? 'bg-green-500/50 text-green-400' : 'bg-red-500/50 text-red-400') : 'bg-slate-700/50 text-slate-400'}`}
                style={{ left: `${zone.x}%`, top: `${zone.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                {stats ? `${stats.made}/${stats.total}` : '+'}
              </button>
            );
          })}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07152a] pb-24 text-slate-100 md:pb-8">
      <div className="pointer-events-none fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      <div className="pointer-events-none fixed -left-24 -top-24 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 md:py-8">
        <header className="mb-6 rounded-[2rem] border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl md:mb-8 md:px-6 md:py-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-2xl shadow-lg shadow-orange-500/30 ring-1 ring-orange-300/30 sm:h-14 sm:w-14">
                <img src="/icons/icon-192.png" alt="Logo RIZE" className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">RIZE</h1>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">Prêt</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Le gestionnaire personnel du basketteur</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-right md:flex">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Système personnel</p>
                <p className="mt-1 text-sm font-semibold text-slate-200">Construis ton prochain niveau</p>
              </div>
              <CheckCircle className="text-emerald-400" size={20} />
            </div>
          </div>

          <nav className="mt-5 hidden gap-2 overflow-x-auto border-t border-white/10 pt-4 md:flex" aria-label="Navigation principale">
            {[
              { id: 'workouts', label: "Aujourd'hui", icon: Activity },
              { id: 'performance', label: 'Progresser', icon: TrendingUp },
              { id: 'planner', label: 'Entraîner', icon: Layout },
              { id: 'tracking', label: 'Suivi', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon size={17} />
                {tab.label}
              </button>
            ))}
            <span className="mx-1 border-l border-white/10" />
            {[
              { id: 'iq', label: 'IQ', icon: BrainCircuit },
              { id: 'playbook', label: 'Playbook', icon: BookOpen },
              { id: 'sniper', label: 'Sniper', icon: Target },
              { id: 'timer', label: 'Timer', icon: Timer },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-white/10 text-orange-300' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>

          <nav className="mt-4 flex gap-2 overflow-x-auto border-t border-white/10 pt-4 md:hidden" aria-label="Outils mobiles">
            {[
              { id: 'iq', label: 'IQ', icon: BrainCircuit },
              { id: 'playbook', label: 'Playbook', icon: BookOpen },
              { id: 'sniper', label: 'Sniper', icon: Target },
              { id: 'timer', label: 'Timer', icon: Timer },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  activeTab === tab.id ? 'bg-white/10 text-orange-300' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <main>
          {/* PERFORMANCE TAB */}
          {activeTab === 'performance' && <PerformancePanel />}

          {/* PLANNER TAB */}
          {activeTab === 'planner' && <WeeklyPlanner />}

          {/* PLAYER TRACKING TAB */}
          {activeTab === 'tracking' && <PlayerTrackingPanel />}

          {/* WORKOUTS TAB */}
          {activeTab === 'workouts' && (
            <div className="space-y-6">
              <section className="rize-rise-in rize-glow-pulse relative overflow-hidden rounded-[2rem] border border-orange-300/20 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-5 shadow-2xl shadow-orange-950/30 sm:p-7">
                <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" />
                <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-xl">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-orange-100/80">Aujourd’hui</p>
                    <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Construis ton prochain niveau.</h2>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-orange-50/85">Une séance claire, une mesure honnête, une progression qui s’accumule.</p>
                  </div>
                  <button onClick={() => setWorkoutTab('generate')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-slate-900">
                    <Sparkles size={17} />
                    Préparer ma séance
                  </button>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Résumé de progression">
                {[
                  { label: 'Workouts', value: savedWorkouts.length, detail: 'sauvegardés', icon: Dumbbell, tone: 'text-orange-300' },
                  { label: 'Favoris', value: favoriteWorkouts.length, detail: 'à reprendre', icon: Heart, tone: 'text-rose-300' },
                  { label: 'Tirs', value: Object.values(sniperStats).reduce((sum, stat) => sum + stat.total, 0), detail: 'enregistrés', icon: Target, tone: 'text-sky-300' },
                  { label: 'Minuteur', value: `${Math.floor(timerRemaining / 60)}:${String(timerRemaining % 60).padStart(2, '0')}`, detail: 'prêt à lancer', icon: Timer, tone: 'text-emerald-300' },
                ].map((metric) => (
                  <div key={metric.label} className={`rize-rise-in rize-delay-${['Workouts', 'Favoris', 'Tirs', 'Minuteur'].indexOf(metric.label) + 1} rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/10 backdrop-blur-xl`}>
                    <div className="flex items-center justify-between"><metric.icon size={17} className={metric.tone} /><span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{metric.label}</span></div>
                    <p className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">{metric.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
                  </div>
                ))}
              </section>

              {/* Sub-tabs */}
              <nav className="rize-rise-in flex justify-center gap-2">
                {[
                  { id: 'generate', label: 'Générer', icon: Sparkles },
                  { id: 'history', label: 'Historique', icon: History },
                  { id: 'favorites', label: 'Favoris', icon: Heart },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setWorkoutTab(tab.id as typeof workoutTab)}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                      workoutTab === tab.id
                        ? 'bg-slate-700/50 text-orange-400 border border-orange-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </nav>

              {workoutTab === 'generate' && (
                <>
                  {/* Generator form */}
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Focus area */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">Zone de focus</label>
                        <div className="grid grid-cols-2 gap-2">
                          {FOCUS_AREAS.map((area) => (
                            <button
                              key={area.value}
                              onClick={() => setFocusArea(area.value)}
                              className={`px-3 py-2 rounded-xl text-left flex items-center gap-2 transition-all text-sm ${
                                focusArea === area.value
                                  ? 'bg-orange-500/20 border-2 border-orange-500/50 text-orange-400'
                                  : 'bg-slate-900/50 border-2 border-slate-700/50 text-slate-300 hover:border-slate-600'
                              }`}
                            >
                              <span>{area.icon}</span>
                              <span className="font-medium">{area.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration and difficulty */}
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Durée: {duration} min</label>
                          <input
                            type="range"
                            min="30"
                            max="120"
                            step="15"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Niveau</label>
                          <div className="flex gap-2">
                            {DIFFICULTY_LEVELS.map((level) => (
                              <button
                                key={level.value}
                                onClick={() => setDifficulty(level.value)}
                                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                  difficulty === level.value
                                    ? 'border-2 border-orange-500/50 bg-orange-500/20 text-orange-400'
                                    : 'border-2 border-slate-700/50 bg-slate-900/50 text-slate-300 hover:border-slate-600'
                                }`}
                              >
                                {level.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Energy level */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          <Flame size={14} className="inline mr-2 text-orange-400" />
                          Énergie: {energyLevel}/10
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={energyLevel}
                          onChange={(e) => setEnergyLevel(Number(e.target.value))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>

                      {/* Phase */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          <Activity size={14} className="inline mr-2 text-orange-400" />
                          Phase actuelle
                        </label>
                        <select
                          value={currentPhase}
                          onChange={(e) => setCurrentPhase(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border-2 border-slate-700/50 text-slate-200 focus:border-orange-500/50 focus:outline-none"
                        >
                          {PHASES.map((phase) => (
                            <option key={phase} value={phase}>{phase}</option>
                          ))}
                        </select>
                      </div>

                      {/* Limitations */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Limitations (virgules)</label>
                        <input
                          type="text"
                          value={limitations}
                          onChange={(e) => setLimitations(e.target.value)}
                          placeholder="Ex: genou droit, bas du dos"
                          className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border-2 border-slate-700/50 text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:outline-none"
                        />
                      </div>

                      {/* Goals */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Objectifs spécifiques (virgules)</label>
                        <input
                          type="text"
                          value={specificGoals}
                          onChange={(e) => setSpecificGoals(e.target.value)}
                          placeholder="Ex: améliorer RSI, one leg jump"
                          className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border-2 border-slate-700/50 text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={generateWorkout}
                      disabled={isLoading}
                      className="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Zap size={20} />
                          Générer le Workout
                        </>
                      )}
                    </button>

                    {error && (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                        <AlertCircle size={20} />
                        <p>{error}</p>
                      </div>
                    )}
                  </div>

                  {/* Generated workout */}
                  {generatedWorkout && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="text-orange-400" size={20} />
                        <h2 className="text-xl font-semibold text-white">Workout Généré</h2>
                      </div>
                      <WorkoutCard workout={generatedWorkout} isPreview />
                    </div>
                  )}
                </>
              )}

              {workoutTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Historique Local</h2>
                  </div>
                  {savedWorkouts.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="mx-auto text-slate-600 mb-4" size={48} />
                      <p className="text-slate-400">Aucun workout généré pour le moment</p>
                    </div>
                  ) : (
                    savedWorkouts.map((workout) => <WorkoutCard key={workout.id} workout={workout} />)
                  )}
                </div>
              )}

              {workoutTab === 'favorites' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Favoris Locaux</h2>
                    <span className="text-slate-500 text-sm">{favoriteWorkouts.length} favoris</span>
                  </div>
                  {favoriteWorkouts.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="mx-auto text-slate-600 mb-4" size={48} />
                      <p className="text-slate-400">Aucun favori</p>
                    </div>
                  ) : (
                    favoriteWorkouts.map((workout) => <WorkoutCard key={workout.id} workout={workout} />)
                  )}
                </div>
              )}
            </div>
          )}

          {/* IQ TAB */}
          {activeTab === 'iq' && (
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="text-orange-300" size={24} />
                    <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Maîtriser</p><h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-white">IQ Meneur</h2></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-200">
                      Score <span className="text-orange-300">{iqScore}/{IQ_SCENARIOS.length}</span>
                    </div>
                    <button onClick={resetIqQuiz} className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 flex items-center gap-2">
                      <RotateCcw size={16} />
                      Reset
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-lg">
                      {IQ_SCENARIOS[currentScenario].category}
                    </span>
                    <span>Question {currentScenario + 1}/{IQ_SCENARIOS.length}</span>
                  </div>
                  <h3 className="text-lg text-white font-medium">{IQ_SCENARIOS[currentScenario].question}</h3>
                </div>

                <div className="grid gap-3">
                  {IQ_SCENARIOS[currentScenario].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleIqAnswer(index)}
                      disabled={showFeedback}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        showFeedback
                          ? option.correct
                            ? 'bg-green-500/20 border-green-500/50 text-green-400'
                            : selectedAnswer === index
                              ? 'bg-red-500/20 border-red-500/50 text-red-400'
                              : 'bg-slate-900/50 border-white/10 text-slate-300'
                          : 'bg-slate-900/50 border-white/10 text-slate-300 hover:border-orange-400/40 hover:bg-orange-500/5'
                      }`}
                    >
                      <p className="font-medium">{option.text}</p>
                      {showFeedback && selectedAnswer === index && (
                        <p className="text-sm mt-2 opacity-80">{option.feedback}</p>
                      )}
                    </button>
                  ))}
                </div>

                {showFeedback && (
                  <button
                    onClick={nextScenario}
                    disabled={currentScenario >= IQ_SCENARIOS.length - 1}
                    className="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:from-orange-600 hover:to-amber-600 transition-all"
                  >
                    {currentScenario >= IQ_SCENARIOS.length - 1 ? 'Quiz terminé!' : 'Question suivante'}
                  </button>
                )}
              </div>

              {/* IQ Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Trophy className="text-orange-400" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Score maximal</p>
                      <p className="text-2xl font-bold text-white">{iqAnswers.filter((_, i) => IQ_SCENARIOS[i].options[iqAnswers[i]]?.correct).length * 100}/100</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Target className="text-blue-400" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Questions répondues</p>
                      <p className="text-2xl font-bold text-white">{iqAnswers.length}/{IQ_SCENARIOS.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-green-400" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Progression</p>
                      <p className="text-2xl font-bold text-white">{Math.round((iqAnswers.length / IQ_SCENARIOS.length) * 100)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PLAYBOOK TAB */}
          {activeTab === 'playbook' && (
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              {/* Play list */}
              <div className="space-y-3">
                <div className="mb-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300/70">Maîtriser</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Playbook</h2><p className="mt-1 text-sm text-slate-500">Lis le jeu, puis exécute avec intention.</p></div>
                {PLAYBOOK_PLAYS.map((play) => (
                  <button
                    key={play.id}
                    onClick={() => setSelectedPlay(play)}
                    className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                      selectedPlay.id === play.id
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded">{play.category}</span>
                    </div>
                    <h3 className="font-semibold">{play.name}</h3>
                    <p className="text-sm opacity-70 mt-1">{play.description}</p>
                  </button>
                ))}
              </div>

              {/* Play visualization */}
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Layout className="text-orange-300" size={22} />
                  <h3 className="text-lg font-semibold text-white">{selectedPlay.name}</h3>
                </div>

                <CourtVisualization plays />

                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Rôles</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlay.roles.map((role, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm">{role}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Points clés</h4>
                    <ul className="space-y-2">
                      {selectedPlay.coachingPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                          <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SNIPER TRACKER TAB */}
          {activeTab === 'sniper' && (
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Target className="text-orange-300" size={22} />
                    <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Entraîner</p><h2 className="mt-1 text-lg font-black text-white">Sniper Tracker</h2></div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSniperMode('add')}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sniperMode === 'add' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700/50 text-slate-400'}`}
                    >
                      <Plus size={16} className="inline mr-1" />
                      Ajouter
                    </button>
                    <button
                      onClick={() => setSniperMode('view')}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sniperMode === 'view' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700/50 text-slate-400'}`}
                    >
                      <Eye size={16} className="inline mr-1" />
                      Stats
                    </button>
                  </div>
                </div>

                <CourtVisualization />

                {selectedSniperZone && (
                  <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
                    <p className="mb-3 text-sm text-orange-200">Résultat pour {COURT_ZONES.find((zone) => zone.id === selectedSniperZone)?.name}</p>
                    <div className="flex gap-2">
                      <button onClick={() => addSniperShot(selectedSniperZone, true)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500/20 px-3 py-2 text-sm text-green-300"><CheckCircle size={16} /> Réussi</button>
                      <button onClick={() => addSniperShot(selectedSniperZone, false)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300"><XCircle size={16} /> Raté</button>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <button onClick={clearSniperShots} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all">
                    <Trash2 size={16} className="inline mr-2" />
                    Effacer tout
                  </button>
                </div>
              </div>

              {/* Stats panel */}
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300/70">Analyse</p><h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-white">Statistiques de tir</h2>

                <div className="space-y-3">
                  {COURT_ZONES.map((zone) => {
                    const stats = sniperStats[zone.id];
                    const percentage = stats ? Math.round((stats.made / stats.total) * 100) : 0;
                    return (
                      <div key={zone.id} className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-slate-300 text-sm">{zone.name}</p>
                        </div>
                        <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${percentage > 50 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-slate-400 text-sm w-16 text-right">
                          {stats ? `${stats.made}/${stats.total}` : '0/0'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total</span>
                    <span className="text-2xl font-bold text-white">
                      {sniperShots.filter((s) => s.made).length}/{sniperShots.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-slate-400">Percentage</span>
                    <span className={`text-xl font-bold ${sniperShots.length > 0 && (sniperShots.filter((s) => s.made).length / sniperShots.length) > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                      {sniperShots.length > 0 ? Math.round((sniperShots.filter((s) => s.made).length / sniperShots.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TIMER TAB */}
          {activeTab === 'timer' && (
            <div className="max-w-md mx-auto">
              <div className="rounded-[2rem] border border-white/10 bg-slate-900/65 p-6 text-center shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
                <Timer className="mx-auto text-orange-400 mb-6" size={48} />

                <div className="text-6xl font-bold text-white mb-6 font-mono">
                  {Math.floor(timerRemaining / 60)}:{(timerRemaining % 60).toString().padStart(2, '0')}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Durée (secondes)</label>
                  <input
                    type="number"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Number(e.target.value))}
                    disabled={timerRunning}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border-2 border-slate-700/50 text-white text-center text-2xl focus:border-orange-500/50 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="flex justify-center gap-4">
                  {!timerRunning ? (
                    <button
                      onClick={startTimer}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
                    >
                      <Play size={20} />
                      Démarrer
                    </button>
                  ) : (
                    <button
                      onClick={stopTimer}
                      className="px-8 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-500/30 transition-all"
                    >
                      <Pause size={20} />
                      Pause
                    </button>
                  )}
                  <button
                    onClick={resetTimer}
                    className="px-8 py-3 bg-slate-700/50 text-slate-300 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700 transition-all"
                  >
                    <RotateCcw size={20} />
                    Reset
                  </button>
                </div>

                {/* Quick presets */}
                <div className="mt-6">
                  <p className="text-sm text-slate-400 mb-3">Temps de repos rapides</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[30, 45, 60, 90, 120, 180].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setTimerSeconds(preset);
                          setTimerRemaining(preset);
                        }}
                        disabled={timerRunning}
                        className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-all"
                      >
                        {preset >= 60 ? `${preset / 60}min` : `${preset}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-slate-900/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden" aria-label="Navigation mobile principale">
          {[
            { id: 'workouts', label: "Aujourd'hui", icon: Activity },
            { id: 'performance', label: 'Progresser', icon: TrendingUp },
            { id: 'planner', label: 'Entraîner', icon: Layout },
            { id: 'tracking', label: 'Suivi', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === tab.id ? 'bg-orange-500/15 text-orange-300' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>RIZE — Le gestionnaire personnel du basketteur</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
