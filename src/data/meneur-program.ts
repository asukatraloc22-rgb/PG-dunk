export type MeneurDayKey = "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi" | "samedi" | "dimanche";

export interface MeneurExercise {
  id: string;
  name: string;
  prescription: string;
}

export interface MeneurDayProgram {
  key: MeneurDayKey;
  label: string;
  title: string;
  type: "strength" | "basket" | "legday";
  tags: string[];
  technique?: string;
  exercises: MeneurExercise[];
}

export const MENEUR_DAYS: MeneurDayProgram[] = [
  { key: "lundi", label: "Lundi", title: "Tir (main forte) + push adapté + saut #1", type: "strength", tags: ["Tir", "Haut du corps", "Saut"], exercises: [
    { id: "lu1", name: "Écartés couchés (bras verrouillés)", prescription: "4 × 12–15" },
    { id: "lu2", name: "Développé unilatéral (bras droit)", prescription: "4 × 12" },
    { id: "lu3", name: "Élévations latérales", prescription: "3 × 15–20" },
    { id: "lu4", name: "Isométrie épaule (bras gauche)", prescription: "3 × 30 sec, si indolore" },
    { id: "lu5", name: "Gainage lombaires (Superman)", prescription: "3 × 45 sec" },
    { id: "lu6", name: "Abdos (relevés de jambes / crunchs)", prescription: "3 × 15–20" },
  ] },
  { key: "mardi", label: "Mardi", title: "Dribble main faible + pull adapté + isométrie #1", type: "strength", tags: ["Dribble", "Main faible", "Isométrie"], technique: "Dribble — focus main faible", exercises: [
    { id: "ma1", name: "Rowing bûcheron (bras droit seul)", prescription: "4 × 12–15" },
    { id: "ma2", name: "Pull-over haltère (coudes fixes)", prescription: "3 × 15" },
    { id: "ma3", name: "Curl concentré (bras droit)", prescription: "3 × 12–15" },
    { id: "ma4", name: "Gainage anti-rotation (abdos)", prescription: "3 × 12 / côté" },
    { id: "ma5", name: "Wall sit", prescription: "3 × 30–45 sec" },
    { id: "ma6", name: "Isometric squat hold", prescription: "3 × 20–30 sec" },
  ] },
  { key: "mercredi", label: "Mercredi", title: "Basket + isométrie #2", type: "basket", tags: ["Équipe", "Isométrie"], exercises: [
    { id: "me1", name: "Planche classique", prescription: "3 × 40–60 sec" },
    { id: "me2", name: "Isometric calf raise hold", prescription: "3 × 20 sec, si aucune douleur cheville" },
  ] },
  { key: "jeudi", label: "Jeudi", title: "Saut #2 (matin) + jambes (soir)", type: "legday", tags: ["Jambes", "Explosivité", "Saut"], exercises: [
    { id: "je1", name: "Squats gobelet", prescription: "4 × 12–15, RIR 2" },
    { id: "je2", name: "Fentes bulgares", prescription: "3 × 10–12 / jambe" },
    { id: "je3", name: "Soulevé de terre roumain", prescription: "3 × 12" },
    { id: "je4", name: "Équilibre unijambe", prescription: "3 × 30 sec / jambe" },
    { id: "je5", name: "Mollets sur marche", prescription: "3 × 15–20" },
  ] },
  { key: "vendredi", label: "Vendredi", title: "Tir / défense + tronc / bras droit + iso #3", type: "strength", tags: ["Tir", "Défense", "Tronc"], technique: "Tir (1 main), défense & lecture", exercises: [
    { id: "ve1", name: "Curl marteau (bras droit)", prescription: "3 × 15" },
    { id: "ve2", name: "Gainage planche (sur avant-bras)", prescription: "3 × 45 sec" },
    { id: "ve3", name: "Élévations (bras droit lourd, gauche léger)", prescription: "3 × 12 chacune" },
    { id: "ve4", name: "Abdos : Russian twists légers", prescription: "3 × 20 touches" },
    { id: "ve5", name: "Isometric push hold ou Hollow Body", prescription: "3 × 20 sec" },
    { id: "ve6", name: "Planche latérale", prescription: "3 × 30 sec / côté" },
  ] },
  { key: "samedi", label: "Samedi", title: "Basket équipe / match", type: "basket", tags: ["Équipe", "Match"], exercises: [] },
  { key: "dimanche", label: "Dimanche", title: "Basket équipe / match + récupération", type: "basket", tags: ["Équipe", "Récupération"], exercises: [] },
];

export const MENEUR_TECHNIQUE_BLOCKS = [
  { day: "Lundi", title: "Tir — bloc principal", badge: "Priorité #1", blocks: [
    ["Échauffement + mécanique", "10 min", "Form shooting près du cercle, un bras, forme pure, puis recul progressif selon la réussite"],
    ["Catch-and-shoot", "15 min", "5 spots autour de l’arc, réception-tir, viser 70 % ou plus avant de reculer"],
    ["Tir après dribble", "10 min", "1–2 dribbles puis tir, sortie d’écran imaginaire des deux côtés"],
    ["Lancers francs sous fatigue", "10 min", "Sprint court puis série de lancers francs pour simuler la fatigue de match"],
    ["Finition combinée", "15 min", "2–3 dribbles, feinte de passe puis tir en enchaînement fluide"],
  ]},
  { day: "Mardi", title: "Dribble & finition", badge: "Ballhandling", blocks: [
    ["Échauffement dribble", "10 min", "Dribble stationnaire, priorité main faible, deux ballons si possible"],
    ["Combo moves en mouvement", "15 min", "Crossover, between the legs, hésitation et spin move en traversant le terrain"],
    ["Attaque du cercle", "15 min", "Finitions des deux mains : layup, euro step et floater"],
    ["Dribble sous pression", "10 min", "Cônes rapprochés, changements de direction à vitesse maximale"],
    ["Tir combiné", "10 min", "Dribble + tir pour conserver le travail de shoot"],
  ]},
  { day: "Vendredi", title: "Tir en mouvement, passe & défense", badge: "Complet", blocks: [
    ["Footwork défensif", "10 min", "Glissades latérales, closeouts, position basse et changements d’appui"],
    ["Tir en mouvement", "15 min", "Curl, tir après écran imaginaire et catch-and-shoot rapide"],
    ["Passe", "15 min", "Passes à une main, overhead, sous pression et lecture du pick-and-roll"],
    ["Tirs contestés", "10 min", "Simuler une main sur le tir et déclencher rapidement à la réception"],
    ["Lancers francs", "10 min", "Série finale en fatigue"],
  ]},
];
