import type { CourtZone, IQScenario, PlaybookPlay } from "../types/domain";

export const COURT_ZONES: CourtZone[] = [
  { id: "rim", name: "Restricted Area", x: 50, y: 85, points: 2 },
  { id: "paint", name: "Paint", x: 50, y: 75, points: 2 },
  { id: "mid-left", name: "Mid-Range Left", x: 30, y: 60, points: 2 },
  { id: "mid-right", name: "Mid-Range Right", x: 70, y: 60, points: 2 },
  { id: "corner-left", name: "Corner 3 Left", x: 15, y: 70, points: 3 },
  { id: "corner-right", name: "Corner 3 Right", x: 85, y: 70, points: 3 },
  { id: "wing-left", name: "Wing 3 Left", x: 25, y: 40, points: 3 },
  { id: "wing-right", name: "Wing 3 Right", x: 75, y: 40, points: 3 },
  { id: "top", name: "Top of Key", x: 50, y: 25, points: 3 },
];

export const FOCUS_AREAS = [
  { value: "vertical jump", label: "Saut Vertical", icon: "🦘" },
  { value: "explosiveness", label: "Explosivité", icon: "⚡" },
  { value: "strength", label: "Force Maximale", icon: "💪" },
  { value: "mobility", label: "Mobilité", icon: "🧘" },
  { value: "core stability", label: "Core & Stabilité", icon: "🧠" },
  { value: "recovery", label: "Récupération Active", icon: "🔄" },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Débutant", color: "bg-emerald-500" },
  { value: "intermediate", label: "Intermédiaire", color: "bg-amber-500" },
  { value: "elite", label: "Élite", color: "bg-red-500" },
] as const;

export const PHASES = [
  "Préparation Générale",
  "Développement Force",
  "Conversion Puissance",
  "Pic de Forme",
  "Récupération",
] as const;

export const PLAYBOOK_PLAYS: PlaybookPlay[] = [
  {
    id: "pnr-roll",
    name: "Pick & Roll",
    category: "P&R Actions",
    description: "Le poseur d'écran roule vers le panier après l'écran",
    roles: ["Ball Handler", "Screener", "Corner", "Wing", "Dunker"],
    coachingPoints: ["Lire la défense", "Attirer deux défenseurs", "Passer au bon moment"],
  },
  {
    id: "pnr-pop",
    name: "Pick & Pop",
    category: "P&R Actions",
    description: "Le poseur d'écran s'écarte pour un tir extérieur",
    roles: ["Ball Handler", "Shooter", "Corner", "Roller", "Lob"],
    coachingPoints: ["Écart rapide", "Espacement correct", "Tir ouvert"],
  },
];

export const IQ_SCENARIOS: IQScenario[] = [
  {
    id: "2v1-break",
    name: "Fast Break 2v1",
    category: "Transition",
    question: "Tu es en contre-attaque 2v1. Ton coéquipier court à droite. Le défenseur te prend en charge. Que fais-tu?",
    options: [
      { text: "Je tire rapidement", correct: false, feedback: "Le joueur ouvert est la meilleure option" },
      { text: "Je passe à mon coéquipier", correct: true, feedback: "Exact! 2v1 = passe au joueur libre" },
      { text: "J'hésite et regarde", correct: false, feedback: "L'hésitation tue la transition" },
      { text: "Je m'arrête", correct: false, feedback: "Jamais s'arrêter en transition" },
    ],
  },
];
