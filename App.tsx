import { useState, useEffect, useRef } from 'react';
import {
  Dumbbell, Zap, Target, Clock, Trash2, RefreshCw, ChevronDown, ChevronUp,
  History, Sparkles, AlertCircle, Loader2, Heart, Flame, Activity,
  BookOpen, BrainCircuit, Trophy, Plus, Timer, Pause, Play, RotateCcw,
  Layout, TrendingUp, Eye
} from 'lucide-react';

// Types
interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
}

interface Workout {
  id?: string;
  title: string;
  description: string;
  focusArea: string;
  difficulty: string;
  durationMinutes: number;
  exercises: Exercise[];
  is_favorite?: boolean;
  created_at?: string;
}

// Court zones for the sniper tracker
const COURT_ZONES = [
  { id: 'rim', name: 'Restricted Area', x: 50, y: 85, points: 2 },
  { id: 'paint', name: 'Paint', x: 50, y: 75, points: 2 },
  { id: 'mid-left', name: 'Mid-Range Left', x: 30, y: 60, points: 2 },
  { id: 'mid-right', name: 'Mid-Range Right', x: 70, y: 60, points: 2 },
  { id: 'corner-left', name: 'Corner 3 Left', x: 15, y: 70, points: 3 },
  { id: 'corner-right', name: 'Corner 3 Right', x: 85, y: 70, points: 3 },
  { id: 'wing-left', name: 'Wing 3 Left', x: 25, y: 40, points: 3 },
  { id: 'wing-right', name: 'Wing 3 Right', x: 75, y: 40, points: 3 },
  { id: 'top', name: 'Top of Key', x: 50, y: 25, points: 3 },
];

const FOCUS_AREAS = [
  { value: 'vertical jump', label: 'Saut Vertical', icon: '🦘' },
  { value: 'explosiveness', label: 'Explosivité', icon: '⚡' },
  { value: 'strength', label: 'Force Maximale', icon: '💪' },
  { value: 'mobility', label: 'Mobilité', icon: '🧘' },
  { value: 'core stability', label: 'Core & Stabilité', icon: '🧠' },
  { value: 'recovery', label: 'Récupération Active', icon: '🔄' },
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Débutant', color: 'bg-emerald-500' },
  { value: 'intermediate', label: 'Intermédiaire', color: 'bg-amber-500' },
  { value: 'elite', label: 'Élite', color: 'bg-red-500' },
];

const PHASES = ['Préparation Générale', 'Développement Force', 'Conversion Puissance', 'Pic de Forme', 'Récupération'];

// Playbook data
const PLAYBOOK_PLAYS = [
  {
    id: 'pnr-roll',
    name: 'Pick & Roll',
    category: 'P&R Actions',
    description: 'Le poseur d\'écran roule vers le panier après l\'écran',
    roles: ['Ball Handler', 'Screener', 'Corner', 'Wing', 'Dunker'],
    coachingPoints: ['Lire la défense', 'Attirer deux défenseurs', 'Passer au bon moment'],
  },
  {
    id: 'pnr-pop',
    name: 'Pick & Pop',
    category: 'P&R Actions',
    description: 'Le poseur d\'écran s\'écarte pour un tir extérieur',
    roles: ['Ball Handler', 'Shooter', 'Corner', 'Roller', 'Lob'],
    coachingPoints: ['Écart rapide', 'Espacement correct', 'Tir ouvert'],
  },
];

// IQ Scenarios
const IQ_SCENARIOS = [
  {
    id: '2v1-break',
    name: 'Fast Break 2v1',
    category: 'Transition',
    question: 'Tu es en contre-attaque 2v1. Ton coéquipier court à droite. Le défenseur te prend en charge. Que fais-tu?',
    options: [
      { text: 'Je tire rapidement', correct: false, feedback: 'Le joueur ouvert est la meilleure option' },
      { text: 'Je passe à mon coéquipier', correct: true, feedback: 'Exact! 2v1 = passe au joueur libre' },
      { text: 'J\'hésite et regarde', correct: false, feedback: 'L\'héitation tue la transition' },
      { text: 'Je m\'arrête', correct: false, feedback: 'Jamais s\'arrêter en transition' },
    ],
  },
];

function App() {
  const [activeTab, setActiveTab] = useState<'workouts' | 'iq' | 'playbook' | 'sniper' | 'timer'>('workouts');
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
  const [sniperShots, setSniperShots] = useState<{ zone: string; made: boolean }[]>([]);
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
    if (sniperShots.length > 0) {
      const stats: Record<string, { made: number; total: number }> = {};
      sniperShots.forEach((shot) => {
        if (!stats[shot.zone]) stats[shot.zone] = { made: 0, total: 0 };
        stats[shot.zone].total++;
        if (shot.made) stats[shot.zone].made++;
      });
      setSniperStats(stats);
    }
  }, [sniperShots]);

  const generateWorkout = () => {
    setIsLoading(true);
    setError(null);
    setGeneratedWorkout(null);

    // Fausse génération de workout en local (remplace l'appel à la base de données)
    setTimeout(() => {
      setGeneratedWorkout({
        id: Date.now().toString(),
        title: "Workout Démo (" + focusArea + ")",
        description: "Généré localement sans base de données.",
        focusArea: focusArea,
        difficulty: difficulty,
        durationMinutes: duration,
        exercises: [
          { name: "Échauffement Articulaire", sets: 1, reps: "5 min", restSeconds: 0, notes: "Réveil musculaire" },
          { name: "Exercice principal", sets: 3, reps: "10", restSeconds: 60, notes: "Concentre-toi sur la forme" }
        ],
        is_favorite: false
      });
      setIsLoading(false);
    }, 1000);
  };

  const saveWorkout = (workout: Workout) => {
    const newWorkout = { ...workout, id: Date.now().toString() };
    setSavedWorkouts([newWorkout, ...savedWorkouts]);
    setGeneratedWorkout(null);
  };

  const toggleFavorite = (workout: Workout) => {
    if (!workout.id) return;
    
    // Si c'est déjà un favori, on l'enlève des favoris
    if (workout.is_favorite) {
      const updatedFavorites = favoriteWorkouts.filter(w => w.id !== workout.id);
      setFavoriteWorkouts(updatedFavorites);
      
      const updatedSaved = savedWorkouts.map(w => w.id === workout.id ? { ...w, is_favorite: false } : w);
      setSavedWorkouts(updatedSaved);
    } else {
      // Sinon, on l'ajoute
      const updatedWorkout = { ...workout, is_favorite: true };
      setFavoriteWorkouts([updatedWorkout, ...favoriteWorkouts]);
      
      const updatedSaved = savedWorkouts.map(w => w.id === workout.id ? updatedWorkout : w);
      setSavedWorkouts(updatedSaved);
    }
  };

  const deleteWorkout = (id: string) => {
    setSavedWorkouts(savedWorkouts.filter((w) => w.id !== id));
    setFavoriteWorkouts(favoriteWorkouts.filter((w) => w.id !== id));
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedWorkouts);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
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
    setSniperShots([...sniperShots, { zone, made }]);
  };

  const clearSniperShots = () => {
    setSniperShots([]);
    setSniperStats({});
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
                onClick={() => sniperMode === 'add' && addSniperShot(zone.id, Math.random() > 0.4)}
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  sniperMode === 'add' ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                } ${stats ? (percentage > 50 ? 'bg-green-500/50 text-green-400' : 'bg-red-500/50 text-red-400') : 'bg-slate-700/50 text-slate-400'}`}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Trophy className="text-white" size={22} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              PG Dunk & IQ Suite
            </h1>
          </div>
          <p className="text-slate-400 text-sm">Système complet d'entraînement (Mode Démo Local)</p>
        </header>

        {/* Main Tabs */}
        <nav className="flex justify-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'workouts', label: 'Workouts IA', icon: Activity },
            { id: 'iq', label: 'IQ Meneur', icon: BrainCircuit },
            { id: 'playbook', label: 'Playbook', icon: BookOpen },
            { id: 'sniper', label: 'Sniper Tracker', icon: Target },
            { id: 'timer', label: 'Timer', icon: Timer },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main>
          {/* WORKOUTS TAB */}
          {activeTab === 'workouts' && (
            <div className="space-y-6">
              {/* Sub-tabs */}
              <nav className="flex justify-center gap-2">
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
                          Générer le Workout (Mock local)
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
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="text-orange-400" size={24} />
                    <h2 className="text-xl font-semibold text-white">IQ Meneur - Quiz</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-slate-400">
                      Score: <span className="text-orange-400 font-bold">{iqScore}/{IQ_SCENARIOS.length}</span>
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
                      className={`p-4 rounded-xl text-left transition-all border-2 ${
                        showFeedback
                          ? option.correct
                            ? 'bg-green-500/20 border-green-500/50 text-green-400'
                            : selectedAnswer === index
                              ? 'bg-red-500/20 border-red-500/50 text-red-400'
                              : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-orange-500/50 hover:bg-slate-700/50'
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
            <div className="grid md:grid-cols-2 gap-6">
              {/* Play list */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-white mb-4">Playbook - Schémas</h2>
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
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Layout className="text-orange-400" size={22} />
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
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="text-orange-400" size={22} />
                    <h2 className="text-lg font-semibold text-white">Court Tracker</h2>
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

                <div className="mt-4 flex justify-end">
                  <button onClick={clearSniperShots} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all">
                    <Trash2 size={16} className="inline mr-2" />
                    Effacer tout
                  </button>
                </div>
              </div>

              {/* Stats panel */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Statistiques de tir</h2>

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
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center">
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

        {/* Footer */}
        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>PG Dunk & IQ Suite - Mode Local</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
