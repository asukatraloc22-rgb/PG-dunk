import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LaunchSplash } from "./components/LaunchSplash";
import {
  Dumbbell, Zap, Target, Clock, Trash2, ChevronDown, ChevronUp,
  History, Sparkles, AlertCircle, Loader2, Heart, Flame, Activity,
  BookOpen, BrainCircuit, Trophy, Plus, Timer, Pause, Play, RotateCcw,
  Layout, TrendingUp, Eye, CheckCircle, XCircle, Copy, Pencil, Download, RefreshCw, X, Film, Sun, Moon
} from 'lucide-react';

import type { Workout } from "./types/domain";
import { PerformancePanel } from "./features/performance/PerformancePanel";
import { PlayerTrackingPanel } from "./features/tracking/PlayerTrackingPanel";
import { CustomWorkoutBuilder } from "./features/training/CustomWorkoutBuilder";
import { WorkoutExecution } from "./features/training/WorkoutExecution";
import { TrainingHub } from "./features/training/TrainingHub";
import { AnimatedCoachboard } from "./features/playbook/AnimatedCoachboard";
import { HighlightsLibrary } from "./features/highlights/HighlightsLibrary";
import type { MeneurDayKey, MeneurPlannedSession } from "./data/meneur-program";
import { deleteWorkout as persistDeleteWorkout, listWorkouts, saveWorkout as persistSaveWorkout, setWorkoutFavorite, updateWorkout as persistUpdateWorkout } from "./lib/workout-repository";
import {
  COURT_ZONES,
  DIFFICULTY_LEVELS,
  FOCUS_AREAS,
  IQ_SCENARIOS as BASE_IQ_SCENARIOS,
  PHASES,
  PLAYBOOK_PLAYS as BASE_PLAYBOOK_PLAYS,
} from "./data/domain-data";
import { IQ_ADVANCED_SCENARIOS, IQ_CATEGORIES, IQ_EXTRA_SCENARIOS, IQ_GLOSSARY, IQ_LESSONS, IQ_PLAY_LIBRARY } from "./data/iq-library";
import { COACHBOARD_PLAY_IDS, getCoachboardFrames } from "./data/coachboard-animations";
import { COURT_GEOMETRY } from "./data/court-geometry";
import { activatePwaUpdate } from "./pwa";

const IQ_SCENARIOS = [...BASE_IQ_SCENARIOS, ...IQ_EXTRA_SCENARIOS, ...IQ_ADVANCED_SCENARIOS];
type PlaybookSectionId = "offense" | "defense" | "sideline";
type PlaybookSubsection = "Offense de base" | "Offense contre une défense" | "Défense : fondamentaux" | "Défense selon l’attaque" | "Sideline · médiane" | "Sideline · sous le panier";

type PlaybookEntry = {
  id: string;
  name: string;
  category: string;
  description: string;
  roles: string[];
  coachingPoints: string[];
  section: PlaybookSectionId;
  subsection: PlaybookSubsection;
};

const STATIC_COACH_PLAYS: Array<Omit<PlaybookEntry, "section" | "subsection">> = [
  { id: "spacing-5out", name: "5-Out Motion", category: "Offense de base", description: "Pass & cut avec cinq spots ouverts et remplissage après la coupe.", roles: ["1 à 5", "5-Out"], coachingPoints: ["Corner spacing", "Basket cut", "Fill behind"] },
  { id: "spacing-4out", name: "4-Out / Dunker Spot", category: "Offense de base", description: "Quatre extérieurs, un joueur dans le dunker spot et une driving lane claire.", roles: ["4-Out", "Dunker"], coachingPoints: ["Middle drive", "Low-man read", "Dump-off"] },
  { id: "spacing-pnr-rules", name: "High PnR Rules", category: "Offense de base", description: "Alignement et lectures fondamentales du pick-and-roll central.", roles: ["Ball handler", "Screener"], coachingPoints: ["Angle d’écran", "Turn the corner", "Pocket pass"] },
  { id: "zone23-overload", name: "Zone 2-3 Overload", category: "Offense contre une défense", description: "Surcharge d’un côté avec high post, baseline cut et skip pass.", roles: ["High post", "Baseline runner"], coachingPoints: ["Touch the nail", "Baseline cut", "Corner three"] },
  { id: "zone23-highpost", name: "Zone 2-3 High Post", category: "Offense contre une défense", description: "Flash au nail pour déplacer le center et ouvrir les sorties.", roles: ["Flash", "Corner spacing"], coachingPoints: ["High-post touch", "Turn and read", "Kick-out"] },
  { id: "zone32-baseline", name: "Zone 3-2 Baseline Runner", category: "Offense contre une défense", description: "Runner de corner à corner derrière une zone 3-2.", roles: ["Runner", "Middle flash"], coachingPoints: ["Baseline timing", "Hit the runner", "Middle touch"] },
  { id: "press-14-flat", name: "Press Break 1-4 Flat", category: "Offense contre une défense", description: "Remise en jeu 1-4 avec coupes croisées et sécurité d’avancée.", roles: ["Inbounder", "Four receivers"], coachingPoints: ["Crossing cuts", "Safety valve", "Advance"] },
  { id: "defense-shell", name: "Shell Defense · closeout & gap", category: "Défense : fondamentaux", description: "Installer la première ligne : closeout équilibré, gap help, no-middle et box-out.", roles: ["On-ball defender", "Gap help", "Low man"], coachingPoints: ["See ball and man", "No-middle", "Closeout puis rebound"] },
  { id: "defense-23-zone", name: "2-3 Zone · paint first", category: "Défense : fondamentaux", description: "Deux défenseurs hauts, deux ailes responsables des corners et center protecteur de la peinture.", roles: ["Top line", "Wing coverage", "Paint anchor"], coachingPoints: ["Protect the rim", "Contest outside shots", "Communicate rotations"] },
  { id: "defense-vs-pnr", name: "Défendre le Pick-and-Roll", category: "Défense selon l’attaque", description: "Choisir drop, ice, switch ou blitz selon le profil du porteur et du screener.", roles: ["Point of attack", "Screen defender", "Low man"], coachingPoints: ["Call the coverage", "Tag the roller", "X-out weak side"] },
  { id: "defense-vs-5out", name: "Défendre le 5-Out", category: "Défense selon l’attaque", description: "Fermer les drives sans perdre les corners, puis communiquer sur les cuts et les handoffs.", roles: ["No-middle", "Gap", "Rotation"], coachingPoints: ["Shrink then recover", "Top-lock shooter", "Finish possession"] },
  { id: "defense-vs-post", name: "Défendre le Post-Up", category: "Défense selon l’attaque", description: "Deny l’entrée, jouer derrière ou en trois-quarts et préparer le dig sans abandonner le tir extérieur.", roles: ["Post defender", "Dig defender", "Weak-side rebound"], coachingPoints: ["Early three-quarter", "Dig then recover", "Hit first"] },
  { id: "slob-floppy", name: "SLOB · Floppy quick hitter", category: "Sideline · médiane", description: "Remise depuis la ligne de touche avec double sortie, safety et lecture chrono.", roles: ["Inbounder", "Shooter", "Safety"], coachingPoints: ["Use the sideline", "Read chase/switch", "Keep a safety"] },
  { id: "blob-box-screen", name: "BLOB · Box screen-the-screener", category: "Sideline · sous le panier", description: "Remise sous le panier avec lob, écran du screener et sortie de sécurité.", roles: ["Inbounder", "Lob target", "Screen-the-screener"], coachingPoints: ["Sell the first cut", "Stationary screens", "Second option"] },
];

function classifyPlaybookEntry(play: { id: string; category: string; name: string }): Pick<PlaybookEntry, "section" | "subsection"> {
  const key = `${play.id} ${play.category} ${play.name}`.toLowerCase();
  if (key.includes("blob") || key.includes("box lob") || key.includes("under basket") || key.includes("sous le panier")) return { section: "sideline", subsection: "Sideline · sous le panier" };
  if (key.includes("slob") || key.includes("sideline") || key.includes("médiane") || key.includes("elevator") || key.includes("floppy")) return { section: "sideline", subsection: "Sideline · médiane" };
  if (key.includes("offense contre une défense") || key.includes("zone offense") || key.includes("zone23") || key.includes("zone32") || key.includes("press break") || key.includes("matchup offense")) return { section: "offense", subsection: "Offense contre une défense" };
  if (key.includes("defense") || key.includes("défense") || key.includes("closeout") || key.includes("rotation")) return { section: "defense", subsection: key.includes("vs-") || key.includes("selon") ? "Défense selon l’attaque" : "Défense : fondamentaux" };
  return { section: "offense", subsection: "Offense de base" };
}

const PLAYBOOK_PLAYS: PlaybookEntry[] = [...BASE_PLAYBOOK_PLAYS, ...IQ_PLAY_LIBRARY.map((play) => ({ id: play.id, name: play.name, category: play.family, description: play.objective, roles: [play.format, play.level], coachingPoints: play.reads })), ...STATIC_COACH_PLAYS].map((play) => ({ ...play, ...classifyPlaybookEntry(play) }));

type IQProgress = { currentScenario: number; score: number; answers: number[]; };
type PwaInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
let timerAudioContext: AudioContext | null = null;

function getTimerAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  try {
    timerAudioContext ??= new AudioContextConstructor();
    return timerAudioContext;
  } catch {
    return null;
  }
}

function primeTimerAudio() {
  const context = getTimerAudioContext();
  if (context?.state === "suspended") void context.resume();
}

function playTimerCompletionTone() {
  const context = getTimerAudioContext();
  if (!context) {
    if (typeof navigator !== "undefined") navigator.vibrate?.([140, 80, 140]);
    return;
  }
  try {
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(1046, now + 0.14);
    oscillator.frequency.setValueAtTime(880, now + 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.36, now + 0.018);
    gain.gain.setValueAtTime(0.28, now + 0.13);
    gain.gain.setValueAtTime(0.22, now + 0.27);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.52);
    if (typeof navigator !== "undefined") navigator.vibrate?.([140, 80, 140]);
  } catch {
    // Les navigateurs peuvent bloquer Web Audio sans interaction préalable : le minuteur reste fonctionnel.
  }
}

const TIMER_STORAGE_KEY = "rizeTimerState";
type TimerSnapshot = { timerSeconds: number; timerRemaining: number; timerRunning: boolean; endedWhileAway: boolean };

function readTimerSnapshot(): TimerSnapshot {
  const fallback = { timerSeconds: 90, timerRemaining: 90, timerRunning: false, endedWhileAway: false };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(window.localStorage.getItem(TIMER_STORAGE_KEY) || "null") as { duration?: number; endsAt?: number; running?: boolean } | null;
    if (!saved?.running || !saved.endsAt) return fallback;
    const timerSeconds = Math.max(1, Math.round(saved.duration ?? 90));
    const timerRemaining = Math.max(0, Math.ceil((saved.endsAt - Date.now()) / 1000));
    if (timerRemaining === 0) {
      window.localStorage.removeItem(TIMER_STORAGE_KEY);
      return { timerSeconds, timerRemaining: 0, timerRunning: false, endedWhileAway: true };
    }
    return { timerSeconds, timerRemaining, timerRunning: true, endedWhileAway: false };
  } catch {
    return fallback;
  }
}

const readIQProgress = (): IQProgress => {
  if (typeof window === "undefined") return { currentScenario: 0, score: 0, answers: [] };
  try {
    const saved = JSON.parse(window.localStorage.getItem("rizeIqProgress") || "null") as Partial<IQProgress> | null;
    return {
      currentScenario: Math.min(Math.max(saved?.currentScenario ?? 0, 0), IQ_SCENARIOS.length - 1),
      score: Math.max(saved?.score ?? 0, 0),
      answers: Array.isArray(saved?.answers) ? saved.answers : [],
    };
  } catch {
    return { currentScenario: 0, score: 0, answers: [] };
  }
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("rizeTheme") === "light" ? "light" : "dark";
  });
  const [activeTab, setActiveTab] = useState<'workouts' | 'training' | 'performance' | 'tracking' | 'highlights' | 'iq' | 'playbook' | 'sniper' | 'timer'>('workouts');
  const [pwaUpdate, setPwaUpdate] = useState<ServiceWorkerRegistration | null>(null);
  const [installPrompt, setInstallPrompt] = useState<PwaInstallPrompt | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [workoutTab, setWorkoutTab] = useState<'generate' | 'history' | 'favorites' | 'builder'>('generate');

  // Workout states
  const [generatedWorkout, setGeneratedWorkout] = useState<Workout | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
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
  const [currentScenario, setCurrentScenario] = useState(() => readIQProgress().currentScenario);
  const [iqScore, setIqScore] = useState(() => readIQProgress().score);
  const [iqAnswers, setIqAnswers] = useState<number[]>(() => readIQProgress().answers);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [iqLessonCategory, setIqLessonCategory] = useState("Toutes");
  const [selectedIqLessonId, setSelectedIqLessonId] = useState(IQ_LESSONS[0]?.id ?? "");
  const [iqMode, setIqMode] = useState<"library" | "quiz" | "glossary">("library");
  const [showIqFlashcard, setShowIqFlashcard] = useState(false);

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
  const [initialTimerSnapshot] = useState(readTimerSnapshot);
  const [timerSeconds, setTimerSeconds] = useState(initialTimerSnapshot.timerSeconds);
  const [timerRunning, setTimerRunning] = useState(initialTimerSnapshot.timerRunning);
  const [timerRemaining, setTimerRemaining] = useState(initialTimerSnapshot.timerRemaining);
  const [timerEndedWhileAway, setTimerEndedWhileAway] = useState(initialTimerSnapshot.endedWhileAway);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerCompletionToneRef = useRef(initialTimerSnapshot.endedWhileAway);

  // Playbook states
  const [selectedPlay, setSelectedPlay] = useState(PLAYBOOK_PLAYS[0]);
  const [playStep, setPlayStep] = useState(0);
  const [showCoachSheet, setShowCoachSheet] = useState(false);
  const [playView, setPlayView] = useState<"choose" | "coachboard" | "details">("choose");
  const [playbookSection, setPlaybookSection] = useState<PlaybookSectionId>("offense");

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
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    window.localStorage.setItem("rizeTheme", theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f4f7fb" : "#07152a");
  }, [theme]);

  useEffect(() => {
    const isFullScreenLayerOpen = showIqFlashcard || (activeTab === "playbook" && playView === "coachboard");
    document.body.classList.toggle("rize-modal-open", isFullScreenLayerOpen);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showIqFlashcard) setShowIqFlashcard(false);
      if (playView === "coachboard") setPlayView("choose");
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("rize-modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeTab, playView, showIqFlashcard]);

  useEffect(() => {
    const handleUpdateAvailable = (event: Event) => {
      const registration = (event as CustomEvent<ServiceWorkerRegistration>).detail;
      if (registration) setPwaUpdate(registration);
    };
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as PwaInstallPrompt);
    };
    const handleAppInstalled = () => setInstallPrompt(null);

    window.addEventListener('pgdunk:update-available', handleUpdateAvailable);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('pgdunk:update-available', handleUpdateAvailable);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const syncConnection = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', syncConnection);
    window.addEventListener('offline', syncConnection);
    return () => {
      window.removeEventListener('online', syncConnection);
      window.removeEventListener('offline', syncConnection);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, 0);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    setPlayStep(0);
    setShowCoachSheet(false);
  }, [selectedPlay.id]);

  useEffect(() => {
    if (timerRunning) timerCompletionToneRef.current = false;
    if (!timerRunning && timerRemaining === 0 && !timerCompletionToneRef.current && !timerEndedWhileAway) {
      timerCompletionToneRef.current = true;
      playTimerCompletionTone();
      window.localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, [timerRunning, timerRemaining, timerEndedWhileAway]);

  useEffect(() => {
    if (!timerRunning) return;
    const syncTimerWithDeadline = () => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(TIMER_STORAGE_KEY) || "null") as { endsAt?: number } | null;
        if (!saved?.endsAt) return;
        const nextRemaining = Math.max(0, Math.ceil((saved.endsAt - Date.now()) / 1000));
        setTimerRemaining(nextRemaining);
        if (nextRemaining === 0) {
          window.localStorage.removeItem(TIMER_STORAGE_KEY);
          setTimerRunning(false);
        }
      } catch {
        // Le minuteur continue avec son état React si le stockage local est indisponible.
      }
    };
    timerRef.current = setInterval(syncTimerWithDeadline, 250);
    document.addEventListener("visibilitychange", syncTimerWithDeadline);
    window.addEventListener("pageshow", syncTimerWithDeadline);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", syncTimerWithDeadline);
      window.removeEventListener("pageshow", syncTimerWithDeadline);
    };
  }, [timerRunning]);

  useEffect(() => {
    window.localStorage.setItem('rizeIqProgress', JSON.stringify({ currentScenario, score: iqScore, answers: iqAnswers }));
  }, [currentScenario, iqScore, iqAnswers]);

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

  const updateExistingWorkout = async (workout: Workout) => {
    const updated = await persistUpdateWorkout(workout);
    setSavedWorkouts((current) => current.map((item) => item.id === updated.id ? updated : item));
    setFavoriteWorkouts((current) => updated.is_favorite ? current.map((item) => item.id === updated.id ? updated : item) : current.filter((item) => item.id !== updated.id));
    setEditingWorkout(null);
    setWorkoutTab('history');
  };

  const startMeneurSession = (session: MeneurPlannedSession) => {
    setActiveWorkout({ id: session.id, title: session.title, description: `Séance du Meneur Complet${session.technique ? ` · ${session.technique}` : ""}`, focusArea: "Meneur Complet", difficulty: "advanced", durationMinutes: 45, exercises: session.exercises.map((exercise) => ({ name: exercise.name, sets: Number(exercise.prescription.match(/^(\\d+)/)?.[1] || 3), reps: exercise.prescription, restSeconds: 60, notes: exercise.prescription })) });
    setActiveTab("training");
  };

  const duplicateWorkout = async (workout: Workout) => {
    await saveWorkout({ ...workout, id: undefined, title: `${workout.title} — copie`, is_favorite: false });
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
    window.localStorage.removeItem('rizeIqProgress');
  };

  const filteredIQLessons = iqLessonCategory === "Toutes" ? IQ_LESSONS : IQ_LESSONS.filter((lesson) => lesson.category === iqLessonCategory);
  const selectedIqLesson = IQ_LESSONS.find((lesson) => lesson.id === selectedIqLessonId) ?? filteredIQLessons[0] ?? IQ_LESSONS[0];
  const selectedIQPlay = IQ_PLAY_LIBRARY.find((play) => play.id === selectedPlay.id);
  const coachboardFrames = getCoachboardFrames(selectedPlay.id);
  const activeCoachFrame = coachboardFrames[playStep % coachboardFrames.length];
  const previousCoachFrame = coachboardFrames[(playStep - 1 + coachboardFrames.length) % coachboardFrames.length];
  const coachboardAction = activeCoachFrame.instructions[0] ? activeCoachFrame.instructions[0].label : "Disposition";

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
    primeTimerAudio();
    const safeSeconds = Math.max(1, Math.round(timerSeconds));
    window.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ duration: safeSeconds, endsAt: Date.now() + safeSeconds * 1000, running: true }));
    timerCompletionToneRef.current = false;
    setTimerEndedWhileAway(false);
    setTimerSeconds(safeSeconds);
    setTimerRemaining(safeSeconds);
    setTimerRunning(true);
  };

  const stopTimer = () => {
    window.localStorage.removeItem(TIMER_STORAGE_KEY);
    setTimerRunning(false);
  };

  const resetTimer = () => {
    window.localStorage.removeItem(TIMER_STORAGE_KEY);
    setTimerRunning(false);
    setTimerEndedWhileAway(false);
    setTimerRemaining(timerSeconds);
  };

  const replayTimerTone = () => {
    primeTimerAudio();
    playTimerCompletionTone();
    setTimerEndedWhileAway(false);
    timerCompletionToneRef.current = true;
  };

  const installPwa = async () => {
    if (!installPrompt) return;
    setIsInstalling(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstallPrompt(null);
    } finally {
      setIsInstalling(false);
    }
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
                  <button onClick={() => setActiveWorkout(workout)} className="p-2 rounded-lg text-slate-500 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors" aria-label="Démarrer le workout">
                    <Play size={18} />
                  </button>
                  <button onClick={() => { setEditingWorkout(workout); setWorkoutTab('builder'); }} className="p-2 rounded-lg text-slate-500 hover:text-orange-300 hover:bg-orange-500/10 transition-colors" aria-label="Modifier le workout">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => duplicateWorkout(workout)} className="p-2 rounded-lg text-slate-500 hover:text-sky-300 hover:bg-sky-500/10 transition-colors" aria-label="Dupliquer le workout">
                    <Copy size={18} />
                  </button>
                  <button onClick={() => deleteWorkout(workout.id!)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label="Supprimer le workout">
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

  const CourtVisualization = ({ plays }: { plays?: boolean }) => {
    const animationFrames = getCoachboardFrames(selectedPlay?.id ?? "");
    const activeFrame = animationFrames[playStep % animationFrames.length];
    const actionLabel = activeFrame.title.toLowerCase().includes("screen") || activeFrame.title.toLowerCase().includes("écran") ? "Écran" : activeFrame.title.toLowerCase().includes("roll") ? "Roll" : activeFrame.title.toLowerCase().includes("pop") ? "Pop" : activeFrame.title.toLowerCase().includes("tir") ? "Shot" : "Cut / move";
    const court = COURT_GEOMETRY;
    const toSvg = (x: number, y: number) => ({ x: x * 3, y: y * 4 });
    const rim = toSvg(court.rim.x, court.rim.y);
    const paint = court.paint;
    const freeThrow = toSvg(court.freeThrowCircle.x, court.freeThrowCircle.y);
    const threePointStart = toSvg(court.threePoint.sideX, court.threePoint.intersectionY);
    const threePointEnd = toSvg(100 - court.threePoint.sideX, court.threePoint.intersectionY);
    const threePointCenter = toSvg(court.threePoint.center.x, court.threePoint.center.y);
    const threePointRadius = Math.hypot(threePointStart.x - threePointCenter.x, threePointStart.y - threePointCenter.y);
    return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[1.5rem] border border-orange-200/30 bg-[#b96d39] shadow-2xl shadow-black/25">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,220,170,0.16),transparent_42%)]" />
      <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" role="img" aria-label="Demi-terrain de basketball">
        <rect width="300" height="400" fill="#b96d39" />
        <rect x="5" y="5" width="290" height="390" rx="7" fill="none" stroke="#fff4e6" strokeOpacity=".9" strokeWidth="2" />
        <rect x={paint.left * 3} y={paint.freeThrowY * 4} width={(paint.right - paint.left) * 3} height={(100 - paint.freeThrowY) * 4} fill="#f4bc83" fillOpacity=".2" stroke="#fff4e6" strokeOpacity=".9" strokeWidth="2" />
        <line x1={paint.left * 3} y1={paint.freeThrowY * 4} x2={paint.right * 3} y2={paint.freeThrowY * 4} stroke="#fff4e6" strokeOpacity=".9" strokeWidth="2" />
        <path d={`M ${freeThrow.x - 36} ${freeThrow.y} A 36 36 0 0 1 ${freeThrow.x + 36} ${freeThrow.y}`} fill="none" stroke="#fff4e6" strokeOpacity=".9" strokeWidth="2" strokeDasharray="4 4" />
        <path d={`M ${freeThrow.x + 36} ${freeThrow.y} A 36 36 0 0 1 ${freeThrow.x - 36} ${freeThrow.y}`} fill="none" stroke="#fff4e6" strokeOpacity=".9" strokeWidth="2" />
        <path d={`M ${threePointStart.x} 0 L ${threePointStart.x} ${threePointStart.y} A ${threePointRadius} ${threePointRadius} 0 0 1 ${threePointEnd.x} ${threePointEnd.y} L ${threePointEnd.x} 0`} fill="none" stroke="#fff4e6" strokeOpacity=".9" strokeWidth="2" />
        <path d={`M ${rim.x - court.restrictedAreaRadius * 3} ${rim.y} A ${court.restrictedAreaRadius * 3} ${court.restrictedAreaRadius * 3} 0 0 1 ${rim.x + court.restrictedAreaRadius * 3} ${rim.y}`} fill="none" stroke="#fff4e6" strokeOpacity=".9" strokeWidth="1.5" />
        <line x1={court.backboard.left * 3} y1={court.backboard.y * 4} x2={court.backboard.right * 3} y2={court.backboard.y * 4} stroke="#fff4e6" strokeOpacity=".95" strokeWidth="3" />
        <circle cx={rim.x} cy={rim.y} r="7" fill="none" stroke="#fff4e6" strokeOpacity=".95" strokeWidth="2" />
        <line x1="0" y1="4" x2="300" y2="4" stroke="#fff4e6" strokeOpacity=".9" strokeWidth="2" />
        <path d="M 114 4 A 36 36 0 0 1 186 4" fill="none" stroke="#fff4e6" strokeOpacity=".9" strokeWidth="2" />
      </svg>

      {plays && selectedPlay && activeFrame && (
        <div className="pointer-events-none absolute inset-0">
          {activeFrame.players.map((player) => <div key={player.id} className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-black text-white shadow-lg transition-all duration-500 ease-out ${player.team === "offense" ? "border-orange-200/70 bg-orange-500 shadow-orange-950/40" : "border-slate-200/60 bg-slate-800/85 shadow-slate-950/50"}`} style={{ left: `${player.x}%`, top: `${player.y}%` }}>{player.label}</div>)}
          <div className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-100 text-[9px] font-black text-amber-950 shadow-lg shadow-amber-950/40 transition-all duration-500 ease-out" style={{ left: `${activeFrame.ball.x}%`, top: `${activeFrame.ball.y}%` }}>●</div>
          <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90">{actionLabel} · {activeFrame.title} · étape {playStep + 1}/{animationFrames.length}</div>
        </div>
      )}

      {!plays && COURT_ZONES.map((zone) => {
        const stats = sniperStats[zone.id];
        const percentage = stats ? Math.round((stats.made / stats.total) * 100) : 0;
        const safeX = Math.min(92, Math.max(8, zone.x));
        const safeY = Math.min(92, Math.max(8, zone.y));
        return (
          <button
            key={zone.id}
            aria-label={zone.name + (stats ? `, ${stats.made} sur ${stats.total} réussis` : '')}
            onClick={() => sniperMode === 'add' && setSelectedSniperZone(zone.id)}
            className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-black shadow-lg backdrop-blur-sm transition-transform ${sniperMode === 'add' ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'} ${selectedSniperZone === zone.id ? 'scale-110 border-white ring-2 ring-white/80' : ''} ${stats ? (percentage > 50 ? 'border-emerald-300/60 bg-emerald-500/70 text-white' : 'border-rose-300/60 bg-rose-500/70 text-white') : 'border-white/20 bg-slate-950/55 text-slate-200'}`}
            style={{ left: `${safeX}%`, top: `${safeY}%` }}
          >
            {stats ? `${stats.made}/${stats.total}` : `${zone.points}P`}
          </button>
        );
      })}
      {!plays && <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80">Clique une zone pour enregistrer</div>}
    </div>
    );
  };

  return (
    <>
      {showSplash && <LaunchSplash onComplete={() => setShowSplash(false)} />}
      <div className="rize-app min-h-screen overflow-x-hidden pb-32 text-slate-100 md:pb-8">
      <div className="pointer-events-none fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      <div className="pointer-events-none fixed -left-24 -top-24 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 md:py-8">
        <header className="rize-glass-shell mb-6 rounded-[2rem] p-4 md:mb-8 md:px-6 md:py-5">
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
              <button
                type="button"
                onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
                className="rize-theme-toggle self-start md:self-auto"
                aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                <span className="hidden sm:inline">{theme === "dark" ? "Clair" : "Sombre"}</span>
              </button>
          </div>

          <nav className="rize-nav-track mt-5 hidden gap-2 overflow-x-auto border-t pt-4 md:flex" aria-label="Navigation principale">
            {[
              { id: 'workouts', label: "Aujourd'hui", icon: Activity },
              { id: 'performance', label: 'Progresser', icon: TrendingUp },
              { id: 'training', label: 'Entraîner', icon: Dumbbell },
              { id: 'tracking', label: 'Suivi', icon: Activity },
              { id: 'highlights', label: 'Highlights', icon: Film },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  data-active={activeTab === tab.id}
                  className={`rize-nav-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'rize-nav-button-active'
                      : ''
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
                  data-active={activeTab === tab.id}
                  className="rize-nav-button flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>

          <nav className="rize-nav-track mt-4 flex gap-2 overflow-x-auto border-t pt-4 md:hidden" aria-label="Raccourcis mobiles">
            {[
              { id: 'training', label: 'Entraîner', icon: Dumbbell },
              { id: 'tracking', label: 'Suivi', icon: Activity },
              { id: 'playbook', label: 'Playbook', icon: BookOpen },
              { id: 'sniper', label: 'Sniper', icon: Target },
              { id: 'timer', label: 'Timer', icon: Timer },
              { id: 'highlights', label: 'Highlights', icon: Film },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  data-active={activeTab === tab.id}
                  className="rize-nav-button flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all"
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <main>
          {(pwaUpdate || installPrompt || !isOnline) && (
            <section
              className="rize-glass-card relative mb-5 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
              aria-live="polite"
            >
              {pwaUpdate ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-emerald-400/10 p-2 text-emerald-300"><RefreshCw size={18} /></div>
                    <div>
                      <p className="text-sm font-black text-white">Une version plus rapide est prête.</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">Mets RIZE à jour lorsque tu as terminé ta saisie en cours.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => activatePwaUpdate(pwaUpdate)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-xs font-black text-emerald-950 transition hover:bg-emerald-300 active:scale-[0.98]">
                      <RefreshCw size={15} /> Mettre à jour
                    </button>
                    <button onClick={() => setPwaUpdate(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white" aria-label="Rappeler plus tard"><X size={18} /></button>
                  </div>
                </>
              ) : !isOnline ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-amber-400/10 p-2 text-amber-300"><Activity size={18} /></div>
                    <div>
                      <p className="text-sm font-black text-white">Mode hors connexion</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">Tes outils et tes données locales restent disponibles sur cet appareil.</p>
                    </div>
                  </div>
                  <span className="self-start rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200 sm:self-auto">Local</span>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-orange-400/10 p-2 text-orange-300"><Download size={18} /></div>
                    <div>
                      <p className="text-sm font-black text-white">RIZE, toujours à portée de main.</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">Installe l’application pour retrouver ton plan de travail directement depuis ton écran d’accueil.</p>
                    </div>
                  </div>
                  <button onClick={() => void installPwa()} disabled={isInstalling} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 text-xs font-black text-white shadow-lg shadow-orange-950/20 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60">
                    <Download size={15} /> {isInstalling ? 'Installation…' : 'Installer'}
                  </button>
                </>
              )}
            </section>
          )}

          {/* PERFORMANCE TAB */}
          {activeTab === 'performance' && <PerformancePanel />}

          {/* TRAINING HUB */}
          {activeTab === 'training' && <TrainingHub
            activeWorkout={activeWorkout}
            onCloseWorkout={() => setActiveWorkout(null)}
            onStartSession={startMeneurSession}
            onAddToPlanner={(day: MeneurDayKey, session: MeneurPlannedSession) => {
              const saved = window.localStorage.getItem('pgDunkWeeklySchedule');
              const schedule = saved ? JSON.parse(saved) : {};
              const current = Array.isArray(schedule[day]) ? schedule[day] : [];
              window.localStorage.setItem('pgDunkWeeklySchedule', JSON.stringify({ ...schedule, [day]: [...current, session] }));
            }}
          />}

          {/* PLAYER TRACKING TAB */}
          {activeTab === 'tracking' && <PlayerTrackingPanel />}

          {/* HIGHLIGHTS TAB */}
          {activeTab === 'highlights' && <HighlightsLibrary />}

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

              <section className="rize-rise-in rounded-[1.5rem] border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-5" aria-label="Actions rapides">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">Rythme de la semaine</p>
                    <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-white">Choisis ton prochain mouvement.</h3>
                  </div>
                  <span className="hidden rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:block">1 action suffit</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: 'training', label: 'Préparer ma séance', detail: 'Programme, planning et exécution au même endroit.', icon: Dumbbell, tone: 'text-orange-300' },
                    { id: 'performance', label: 'Mesurer mes progrès', detail: 'Actualise détente, RSI et apex.', icon: TrendingUp, tone: 'text-emerald-300' },
                    { id: 'tracking', label: 'Vérifier ma récupération', detail: 'Readiness, fatigue et prévention.', icon: Heart, tone: 'text-sky-300' },
                  ].map((action) => (
                    <button key={action.id} onClick={() => setActiveTab(action.id as typeof activeTab)} className="group flex min-h-24 items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06] active:scale-[0.99]">
                      <div className={`rounded-xl bg-white/5 p-2.5 ${action.tone}`}><action.icon size={18} /></div>
                      <span>
                        <span className="block text-sm font-black text-white">{action.label}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-500 transition group-hover:text-slate-400">{action.detail}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Sub-tabs */}
              <nav className="rize-rise-in flex justify-center gap-2">
                {[
                  { id: 'builder', label: 'Créer', icon: Plus },
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

              {activeWorkout && <WorkoutExecution workout={activeWorkout} onClose={() => setActiveWorkout(null)} />}

              {!activeWorkout && workoutTab === 'builder' && <CustomWorkoutBuilder key={editingWorkout?.id ?? 'new'} initialWorkout={editingWorkout ?? undefined} onSave={editingWorkout ? updateExistingWorkout : saveWorkout} />}

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

                  <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 p-1.5"><button type="button" onClick={() => setIqMode("library")} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${iqMode === "library" ? "bg-orange-500/20 text-orange-200" : "text-slate-500 hover:text-slate-300"}`}>Bibliothèque</button><button type="button" onClick={() => setIqMode("quiz")} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${iqMode === "quiz" ? "bg-orange-500/20 text-orange-200" : "text-slate-500 hover:text-slate-300"}`}>Quiz situationnel</button><button type="button" onClick={() => setIqMode("glossary")} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${iqMode === "glossary" ? "bg-orange-500/20 text-orange-200" : "text-slate-500 hover:text-slate-300"}`}>Glossaire US</button></div>

                  {iqMode === "library" && <div className="rounded-2xl border border-orange-300/15 bg-orange-500/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Bibliothèque IQ</p><h3 className="mt-1 text-lg font-black text-white">Apprendre avant de répondre.</h3><p className="mt-1 text-sm text-slate-500">Leçons courtes sur l’attaque, la défense, la lecture et la gestion.</p></div>
                    <div className="flex gap-2 overflow-x-auto pb-1">{IQ_CATEGORIES.map((category) => <button key={category} onClick={() => { const nextLessons = category === "Toutes" ? IQ_LESSONS : IQ_LESSONS.filter((lesson) => lesson.category === category); setIqLessonCategory(category); setSelectedIqLessonId(nextLessons[0]?.id ?? ""); }} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${iqLessonCategory === category ? "bg-orange-500/20 text-orange-200" : "bg-slate-950/40 text-slate-500 hover:text-slate-300"}`}>{category}</button>)}</div>
                  </div>
                  <div className="mt-4 grid gap-2">{filteredIQLessons.map((lesson) => <button type="button" key={lesson.id} onClick={() => { setSelectedIqLessonId(lesson.id); setShowIqFlashcard(true); }} className={`rize-card-interactive flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/25 px-4 py-3.5 text-left ${selectedIqLesson?.id === lesson.id ? "border-orange-400/40 bg-orange-500/10" : ""}`}><div className="min-w-0"><p className="truncate text-sm font-black text-white">{lesson.title}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">{lesson.category} · {lesson.format ?? "Leçon pratique"}</p></div><div className="flex shrink-0 items-center gap-2"><span className="text-[10px] font-bold text-slate-600">{lesson.level}</span><span className="text-slate-500">›</span></div></button>)}</div>
                  {selectedIqLesson && <div className="hidden"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Fiche pratique · {selectedIqLesson.format ?? "Leçon"}</p><h4 className="mt-1 text-base font-black text-white">{selectedIqLesson.title}</h4><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{selectedIqLesson.summary}</p></div><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-400">{selectedIqLesson.level}</span></div><div className="mt-4 rounded-xl bg-white/[0.03] p-3"><p className="text-[10px] font-black uppercase tracking-wider text-orange-300/70">Principes à retenir</p><div className="mt-2 flex flex-wrap gap-2">{selectedIqLesson.principles.map((principle) => <span key={principle} className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-300">{principle}</span>)}</div>{selectedIqLesson.vocabulary && <p className="mt-3 text-xs text-slate-500"><span className="font-bold text-slate-400">Vocabulary :</span> {selectedIqLesson.vocabulary.join(" · ")}</p>}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Consignes coach</p><ul className="mt-2 space-y-1 text-xs text-slate-400">{(selectedIqLesson.coachCues ?? selectedIqLesson.principles).map((cue) => <li key={cue}>↳ {cue}</li>)}</ul></div><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Erreurs à corriger</p><ul className="mt-2 space-y-1 text-xs text-slate-400">{(selectedIqLesson.commonErrors ?? ["Rester passif", "Lire trop tard"]).map((error) => <li key={error}>× {error}</li>)}</ul></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-emerald-500/5 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300/70">Version solo</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{selectedIqLesson.soloPractice ?? "Visualiser la situation puis répéter le geste des deux côtés."}</p></div><div className="rounded-xl bg-sky-500/5 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-sky-300/70">Version équipe</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{selectedIqLesson.teamPractice ?? "Faire 5 répétitions sans défense puis passer en opposition réelle."}</p></div></div>{selectedIqLesson.pros && selectedIqLesson.cons && <div className="mt-4 grid gap-2 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300/70">Forces</p><p className="mt-1 text-xs text-slate-400">{selectedIqLesson.pros.join(" · ")}</p></div><div><p className="text-[10px] font-black uppercase tracking-wider text-rose-300/70">Limites</p><p className="mt-1 text-xs text-slate-400">{selectedIqLesson.cons.join(" · ")}</p></div></div>}</div>}
                  </div>}
                  {showIqFlashcard && selectedIqLesson && typeof document !== "undefined" && createPortal(<div className="rize-fullscreen-layer rize-iq-layer fixed inset-0 z-[70] flex items-stretch justify-center p-0 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={`Fiche ${selectedIqLesson.title}`} onClick={() => setShowIqFlashcard(false)}><div className="rize-fullscreen-panel rize-iq-flashcard h-[100dvh] w-full overflow-y-auto border-orange-300/20 p-5 shadow-2xl shadow-black/50 sm:p-8" onClick={(event) => event.stopPropagation()}><div className="mx-auto max-w-5xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Flashcard IQ · {selectedIqLesson.category}</p><h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white sm:text-4xl">{selectedIqLesson.title}</h3><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">{selectedIqLesson.summary}</p></div><button type="button" onClick={() => setShowIqFlashcard(false)} className="rize-control shrink-0 rounded-xl p-2" aria-label="Fermer la flashcard"><X size={18} /></button></div><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-orange-300/15 bg-orange-500/5 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300/70">Principes de jeu</p><div className="mt-3 flex flex-wrap gap-2">{selectedIqLesson.principles.map((principle) => <span key={principle} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200">{principle}</span>)}</div></div><div className="rounded-2xl border border-sky-300/15 bg-sky-500/5 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-300/70">American vocabulary</p><p className="mt-3 text-sm leading-relaxed text-slate-300">{selectedIqLesson.vocabulary?.length ? selectedIqLesson.vocabulary.join(" · ") : "Terminologie à compléter dans le glossaire."}</p></div></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300/70">Coach cues</p><ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-300">{(selectedIqLesson.coachCues ?? selectedIqLesson.principles).map((cue) => <li key={cue}>↳ {cue}</li>)}</ul></div><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-300/70">Common mistakes</p><ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-300">{(selectedIqLesson.commonErrors?.length ? selectedIqLesson.commonErrors : ["Rester passif après la passe", "Lire trop tard l’aide défensive"]).map((error) => <li key={error}>× {error}</li>)}</ul></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-emerald-500/5 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300/70">Solo transfer</p><p className="mt-2 text-sm leading-relaxed text-slate-300">{selectedIqLesson.soloPractice || "Visualise la situation puis répète les deux côtés du terrain."}</p></div><div className="rounded-2xl bg-violet-500/5 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300/70">Team transfer</p><p className="mt-2 text-sm leading-relaxed text-slate-300">{selectedIqLesson.teamPractice || "Répéter sans défense, puis ajouter la couverture et la lecture."}</p></div></div>{selectedIqLesson.relatedPlayIds && selectedIqLesson.relatedPlayIds.length > 0 && <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300/70">Playbook associé</p><button type="button" onClick={() => { const relatedPlay = PLAYBOOK_PLAYS.find((play) => selectedIqLesson.relatedPlayIds?.includes(play.id)); if (relatedPlay) { setSelectedPlay(relatedPlay); setActiveTab("playbook"); setPlayView("choose"); setShowIqFlashcard(false); } }} className="text-xs font-black text-orange-200 hover:text-white">Ouvrir le playbook →</button></div><div className="mt-3 flex flex-wrap gap-2">{selectedIqLesson.relatedPlayIds.map((playId) => <span key={playId} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${COACHBOARD_PLAY_IDS.has(playId) ? "bg-sky-500/15 text-sky-200" : "bg-white/5 text-slate-300"}`}>{playId}{COACHBOARD_PLAY_IDS.has(playId) ? " · Coachboard" : ""}</span>)}</div></div>}</div></div></div>, document.body)}
                  {iqMode === "glossary" && <div className="rounded-2xl border border-sky-300/15 bg-sky-500/5 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300/70">Terminologie internationale</p><h3 className="mt-1 text-lg font-black text-white">Glossaire basketball US</h3><p className="mt-1 text-sm text-slate-500">Les mots que tu entendras dans une salle, un film session ou un staff room.</p></div><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-400">{IQ_GLOSSARY.length} termes</span></div><div className="mt-4 divide-y divide-white/5">{IQ_GLOSSARY.map((entry) => <div key={entry.term} className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]"><div><p className="text-sm font-black text-white">{entry.term}</p><p className="text-[11px] text-sky-300/70">{entry.french}</p></div><p className="text-xs leading-relaxed text-slate-400">{entry.definition}</p></div>)}</div></div>}
                </div>

                {iqMode === "quiz" && <>
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
                </>}

              {/* IQ Stats */}
              <div className={`grid md:grid-cols-3 gap-4 ${iqMode === "quiz" ? "" : "hidden"}`}>
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
              <div className="space-y-4">
                <div className="mb-2"><p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300/70">Maîtriser</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Playbook</h2><p className="mt-1 text-sm text-slate-500">Choisis une famille tactique, puis un système adapté à la défense et au contexte.</p></div>
                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-950/35 p-1.5" role="tablist" aria-label="Sections du Playbook">
                  {([{ id: "offense", label: "Offense", detail: "Créer" }, { id: "defense", label: "Défense", detail: "Stopper" }, { id: "sideline", label: "Sideline", detail: "Remises" }] as Array<{ id: PlaybookSectionId; label: string; detail: string }>).map((section) => <button type="button" key={section.id} role="tab" aria-selected={playbookSection === section.id} onClick={() => { setPlaybookSection(section.id); const firstPlay = PLAYBOOK_PLAYS.find((play) => play.section === section.id); if (firstPlay) { setSelectedPlay(firstPlay); setPlayStep(0); setPlayView("choose"); setShowCoachSheet(false); } }} className={`rounded-xl px-2 py-2 text-left transition ${playbookSection === section.id ? "bg-orange-500 text-slate-950 shadow-lg shadow-orange-950/20" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}><span className="block text-[10px] font-black uppercase tracking-[0.14em]">{section.label}</span><span className={`mt-0.5 block text-[10px] font-bold ${playbookSection === section.id ? "text-slate-950/70" : "text-slate-600"}`}>{section.detail}</span></button>)}
                </div>
                {(["Offense de base", "Offense contre une défense"] as PlaybookSubsection[]).concat(["Défense : fondamentaux", "Défense selon l’attaque", "Sideline · médiane", "Sideline · sous le panier"] as PlaybookSubsection[]).filter((subsection) => PLAYBOOK_PLAYS.some((play) => play.section === playbookSection && play.subsection === subsection)).map((subsection) => <div key={subsection} className="space-y-2"><div className="flex items-center gap-2 px-1"><span className="h-1.5 w-1.5 rounded-full bg-orange-400" /><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{subsection}</p></div>{PLAYBOOK_PLAYS.filter((play) => play.section === playbookSection && play.subsection === subsection).map((play) => <button type="button" key={play.id} onClick={() => { setSelectedPlay(play); setPlayStep(0); setPlayView("choose"); setShowCoachSheet(false); }} className={`rize-card-interactive w-full rounded-2xl border p-4 text-left ${selectedPlay.id === play.id ? "border-orange-400/50 bg-orange-500/15 text-orange-100 shadow-lg shadow-orange-950/10" : "border-white/10 bg-slate-900/55 text-slate-300"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-black">{play.name}</h3><p className="mt-1 text-sm leading-relaxed text-slate-400">{play.description}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${COACHBOARD_PLAY_IDS.has(play.id) ? "bg-sky-500/15 text-sky-200" : "bg-white/5 text-slate-600"}`}>{COACHBOARD_PLAY_IDS.has(play.id) ? "BOARD" : "SHEET"}</span></div></button>)}
</div>)}
              </div>

              {/* Play visualization */}
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2"><Layout className="shrink-0 text-orange-300" size={22} /><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300/70">{selectedPlay.subsection}</p><h3 className="mt-1 text-lg font-black text-white">{selectedPlay.name}</h3></div></div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${COACHBOARD_PLAY_IDS.has(selectedPlay.id) ? "bg-sky-500/15 text-sky-200" : "bg-white/5 text-slate-500"}`}>{COACHBOARD_PLAY_IDS.has(selectedPlay.id) ? "COACHBOARD" : "COACH SHEET"}</span>
                </div>

                {playView === "choose" && <div className="rounded-2xl border border-orange-300/15 bg-orange-500/5 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Play sélectionné</p><h3 className="mt-1 text-xl font-black text-white">{selectedPlay.name}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">Choisis ton mode de lecture. Le Coachboard est disponible pour les plays structurés en frames ; la fiche coach reste disponible pour expliquer l’intention, les lectures et les limites.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setPlayView("coachboard")} disabled={!COACHBOARD_PLAY_IDS.has(selectedPlay.id)} className="rounded-2xl border border-sky-300/20 bg-sky-500/10 p-4 text-left transition hover:-translate-y-0.5 hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-40"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-300/70">Visuel</span><span className="mt-1 block text-base font-black text-white">Ouvrir le Coachboard</span><span className="mt-1 block text-xs leading-relaxed text-slate-500">Étape par étape : spacing, passes, cuts, screens, roll, pop et tir.</span></button><button type="button" onClick={() => { setPlayView("details"); setShowCoachSheet(true); }} className="rounded-2xl border border-orange-300/20 bg-orange-500/10 p-4 text-left transition hover:-translate-y-0.5 hover:bg-orange-500/15"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300/70">Coach sheet</span><span className="mt-1 block text-base font-black text-white">Lire l’explication</span><span className="mt-1 block text-xs leading-relaxed text-slate-500">Setup, objectif, lectures, pros/cons, rôles et drills.</span></button></div></div>}
                {playView === "coachboard" && typeof document !== "undefined" && createPortal(<div className="rize-fullscreen-layer fixed inset-0 z-[80] flex items-stretch justify-center bg-[#050b15] p-0 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={`Coachboard ${selectedPlay.name}`}><div className="rize-fullscreen-panel flex h-[100dvh] w-full flex-col overflow-y-auto bg-[#07152a] p-4 sm:p-6"><div className="mx-auto flex min-h-full w-full max-w-5xl flex-col"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300/75">Coachboard · lecture statique</p><h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">{selectedPlay.name}</h3><p className="mt-1 text-xs text-slate-500">Frame par frame · spacing, défense, passe et finition</p></div><button type="button" onClick={() => setPlayView("choose")} className="rize-control shrink-0 rounded-xl p-2" aria-label="Fermer le Coachboard"><X size={18} /></button></div><div className="flex flex-1 items-center justify-center py-5"><AnimatedCoachboard frame={activeCoachFrame} previousFrame={previousCoachFrame} step={playStep} totalSteps={coachboardFrames.length} actionLabel={coachboardAction} /></div><div className="mx-auto flex w-full max-w-[560px] flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-950/45 p-2"><div className="flex items-center gap-1"><button type="button" onClick={() => setPlayStep((current) => Math.max(0, current - 1))} disabled={playStep === 0} className="rize-control rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-35">Précédent</button><button type="button" onClick={() => setPlayStep(0)} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/15 px-3 py-2 text-xs font-black text-orange-200 transition hover:bg-orange-500/25"><RotateCcw size={13} />Réinitialiser</button><button type="button" onClick={() => setPlayStep((current) => Math.min(coachboardFrames.length - 1, current + 1))} disabled={playStep === coachboardFrames.length - 1} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-35">Étape suivante</button></div><div className="flex items-center gap-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Étapes</span><span className="text-[10px] font-black text-orange-200">{playStep + 1}/{coachboardFrames.length}</span></div></div></div></div></div>, document.body)}

                {selectedIQPlay && playView === "details" && <><button type="button" onClick={() => setPlayView("choose")} className="mb-3 text-xs font-black text-slate-500 hover:text-orange-200">← Retour aux options</button><button type="button" onClick={() => setShowCoachSheet((visible) => !visible)} className="mb-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-left transition hover:border-orange-300/25"><span><span className="block text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Option</span><span className="mt-1 block text-sm font-black text-white">{showCoachSheet ? "Masquer la fiche coach" : "Ouvrir la fiche coach"}</span></span><span className="text-lg text-slate-400">{showCoachSheet ? "⌃" : "⌄"}</span></button><div className={`mb-6 rounded-2xl border border-orange-300/15 bg-orange-500/5 p-4 ${showCoachSheet ? "" : "hidden"}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/70">Fiche coach</p><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-400">{selectedIQPlay.format} · {selectedIQPlay.level}</span></div><p className="mt-2 text-sm font-bold text-white">{selectedIQPlay.objective}</p><p className="mt-2 text-xs leading-relaxed text-slate-400"><span className="font-bold text-slate-300">Mise en place :</span> {selectedIQPlay.setup}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300/70">Lectures</p><ul className="mt-2 space-y-1 text-xs text-slate-400">{selectedIQPlay.reads.map((read) => <li key={read}>↳ {read}</li>)}</ul></div><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Séquence</p><ol className="mt-2 space-y-1 text-xs text-slate-400">{selectedIQPlay.sequence.map((step, index) => <li key={step}><span className="mr-1 font-bold text-orange-300">{index + 1}.</span>{step}</li>)}</ol></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-emerald-500/5 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300/70">Forces</p><p className="mt-1 text-xs text-slate-400">{selectedIQPlay.pros.join(" · ")}</p></div><div className="rounded-xl bg-rose-500/5 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-rose-300/70">Limites</p><p className="mt-1 text-xs text-slate-400">{selectedIQPlay.cons.join(" · ")}</p></div></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><p className="rounded-xl bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-400"><span className="font-bold text-slate-300">Solo :</span> {selectedIQPlay.soloTransfer}</p><p className="rounded-xl bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-400"><span className="font-bold text-slate-300">Équipe :</span> {selectedIQPlay.teamDrill}</p></div></div></>}

                <div className={`mt-6 space-y-4 ${showCoachSheet ? "" : "hidden"}`}>
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

                <div className="text-6xl font-bold text-white mb-6 font-mono" aria-live="polite" aria-atomic="true">
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

                                  {timerEndedWhileAway && <div className="mb-5 rounded-xl border border-orange-400/25 bg-orange-500/10 px-3 py-2.5 text-left text-xs leading-relaxed text-orange-200"><strong className="font-black">Minuteur terminé en arrière-plan.</strong> RIZE a rattrapé l’échéance. Un système mobile peut suspendre ou fermer une PWA et empêcher un son automatique ; tu peux réécouter la tonalité après ton retour.</div>}
                  {timerEndedWhileAway && <button type="button" onClick={replayTimerTone} className="mb-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-orange-300/30 bg-orange-500/15 px-3 py-2 text-xs font-black text-orange-200 transition hover:bg-orange-500/25"><Timer size={14} /> Réécouter la tonalité</button>}
                  <p className="mb-5 text-xs text-slate-500">Une tonalité locale plus audible et une vibration compatible sont déclenchées à la fin du compte à rebours.</p>

                  <div className="flex flex-wrap justify-center gap-3">

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

        <nav className="rize-bottom-nav fixed inset-x-3 z-50 grid grid-cols-4 gap-1 rounded-2xl border p-2 md:hidden" aria-label="Navigation mobile principale">
          {[
            { id: 'workouts', label: "Aujourd'hui", icon: Activity },
            { id: 'planner', label: 'Entraîner', icon: Layout },
            { id: 'performance', label: 'Progresser', icon: TrendingUp },
            { id: 'iq', label: 'Maîtriser', icon: BrainCircuit },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              data-active={activeTab === tab.id}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-all"
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
    </>
  );
}

export default App;
