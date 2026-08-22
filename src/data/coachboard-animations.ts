export type CoachPlayer = { id: string; label: string; team: "offense" | "defense"; x: number; y: number };
export type CoachFrame = { title: string; players: CoachPlayer[]; ball: { x: number; y: number }; ballTarget?: { x: number; y: number } };

const baseOffense = (): CoachPlayer[] => [
  { id: "o1", label: "1", team: "offense", x: 50, y: 27 },
  { id: "o2", label: "2", team: "offense", x: 18, y: 38 },
  { id: "o3", label: "3", team: "offense", x: 82, y: 38 },
  { id: "o4", label: "4", team: "offense", x: 30, y: 55 },
  { id: "o5", label: "5", team: "offense", x: 70, y: 55 },
];
const baseDefense = (): CoachPlayer[] => [
  { id: "d1", label: "x1", team: "defense", x: 50, y: 34 },
  { id: "d2", label: "x2", team: "defense", x: 24, y: 44 },
  { id: "d3", label: "x3", team: "defense", x: 76, y: 44 },
  { id: "d4", label: "x4", team: "defense", x: 34, y: 62 },
  { id: "d5", label: "x5", team: "defense", x: 66, y: 62 },
];
const frame = (title: string, changes: Record<string, [number, number]>, ball: [number, number], ballTarget?: [number, number]): CoachFrame => ({
  title,
  players: [...baseOffense(), ...baseDefense()].map((player) => ({ ...player, ...(changes[player.id] ? { x: changes[player.id][0], y: changes[player.id][1] } : {}) })),
  ball: { x: ball[0], y: ball[1] },
  ballTarget: ballTarget ? { x: ballTarget[0], y: ballTarget[1] } : undefined,
});

export const getCoachboardFrames = (playId: string): CoachFrame[] => {
  switch (playId) {
    case "pnr-roll":
    case "high-pnr": return [
      frame("Disposition", {}, [50, 27]),
      frame("5 arrive en sprint", { o5: [50, 38], d5: [57, 43] }, [50, 27], [50, 38]),
      frame("1 utilise l’écran", { o1: [66, 43], o5: [50, 38], d1: [59, 42], d5: [62, 47] }, [66, 43], [70, 55]),
      frame("Roll + lectures", { o1: [68, 48], o5: [56, 67], d1: [66, 51], d5: [58, 61], d3: [72, 48] }, [68, 48], [56, 67]),
    ];
    case "pnr-pop": return [
      frame("Disposition", {}, [50, 27]),
      frame("5 pose l’écran", { o5: [50, 38], d5: [58, 43] }, [50, 27], [50, 38]),
      frame("1 utilise le screen", { o1: [66, 43], o5: [50, 38], d1: [59, 42], d5: [62, 47] }, [66, 43], [70, 38]),
      frame("Pop extérieur", { o1: [66, 48], o5: [58, 36], d1: [65, 51], d5: [58, 42], d3: [72, 46] }, [66, 48], [58, 36]),
    ];
    case "empty-corner-pnr": return [
      frame("Empty corner", { o3: [82, 22] }, [50, 27]),
      frame("Le corner se vide", { o1: [50, 34], o3: [82, 22], o5: [50, 39], d5: [58, 43] }, [50, 34], [50, 39]),
      frame("Attaque du milieu", { o1: [59, 48], o5: [50, 39], d1: [55, 48], d5: [60, 48] }, [59, 48], [50, 39]),
      frame("Punir le low man", { o1: [61, 57], o5: [55, 67], o2: [20, 29], d1: [59, 55], d5: [58, 61] }, [61, 57], [20, 29]),
    ];
    case "spain-pnr": return [
      frame("Horns Spain", { o4: [38, 38], o5: [62, 38] }, [50, 27]),
      frame("1 utilise le PnR", { o1: [65, 42], o5: [50, 38], o2: [28, 42], d1: [59, 42], d5: [61, 43] }, [65, 42], [50, 38]),
      frame("2 backscreen x5", { o1: [68, 51], o5: [55, 64], o2: [42, 45], d1: [65, 51], d5: [54, 60], d2: [43, 52] }, [68, 51], [55, 64]),
      frame("Lob ou pop", { o1: [70, 54], o5: [56, 68], o2: [32, 25], d1: [66, 54], d5: [58, 63] }, [70, 54], [56, 68]),
    ];
    case "pistol": return [
      frame("Transition", { o1: [68, 31], o2: [82, 40], o5: [60, 52] }, [68, 31]),
      frame("Dribble-at", { o1: [67, 38], o2: [72, 39], o5: [53, 45], d1: [63, 40], d2: [75, 45] }, [67, 38], [72, 39]),
      frame("DHO + écran", { o1: [58, 48], o2: [66, 40], o5: [50, 44], d1: [59, 48], d2: [68, 45], d5: [55, 50] }, [66, 40], [58, 48]),
      frame("Turn the corner", { o1: [48, 61], o2: [63, 42], o5: [50, 56], d1: [50, 58], d2: [65, 45] }, [48, 61], [50, 56]),
    ];
    case "horns-fist": return [
      frame("Horns", { o4: [37, 39], o5: [63, 39] }, [50, 27]),
      frame("Entrée elbow", { o1: [48, 37], o4: [37, 39], o5: [63, 39], d1: [48, 43] }, [48, 37], [50, 39]),
      frame("Fist PnR", { o1: [63, 47], o5: [52, 39], o4: [39, 29], d1: [58, 47], d5: [61, 45] }, [63, 47], [52, 39]),
      frame("Pop / roll", { o1: [67, 55], o5: [55, 66], o4: [38, 25], d1: [65, 54], d5: [58, 61] }, [67, 55], [55, 66]),
    ];
    case "zoom-action": return [
      frame("Sortie stagger", { o2: [30, 61], o4: [42, 57], o5: [58, 57] }, [50, 27]),
      frame("Curl ou fade", { o2: [42, 46], o4: [45, 54], o5: [58, 54], d2: [37, 48] }, [50, 27], [42, 46]),
      frame("Réception", { o2: [67, 34], o4: [48, 51], o5: [58, 51], d2: [62, 38] }, [67, 34], [67, 34]),
      frame("Tir ou PnR", { o2: [70, 32], o1: [58, 40], o5: [58, 48], d2: [68, 36] }, [70, 32], [58, 48]),
    ];
    case "blob-box-lob": return [
      frame("Box BLOB", { o2: [38, 58], o3: [62, 58], o4: [38, 67], o5: [62, 67], o1: [50, 27] }, [50, 86]),
      frame("Écrans croisés", { o2: [50, 62], o3: [50, 55], o4: [35, 64], o5: [65, 64] }, [50, 86], [50, 62]),
      frame("Cible au cercle", { o2: [50, 72], o3: [25, 42], o4: [36, 62], o5: [64, 62] }, [50, 86], [50, 72]),
    ];
    case "slob-elevator": return [
      frame("SLOB", { o2: [38, 57], o3: [62, 57], o1: [50, 27] }, [4, 45]),
      frame("Feinte vers le bas", { o1: [50, 35], o2: [45, 61], o3: [55, 61] }, [4, 45], [50, 35]),
      frame("Elevator fermé", { o1: [50, 28], o2: [46, 40], o3: [54, 40], o4: [40, 58], o5: [60, 58] }, [4, 45], [50, 28]),
      frame("Tir rapide", { o1: [50, 22], o2: [47, 28], o3: [53, 28] }, [4, 45], [50, 22]),
    ];
    default: return [frame("Disposition", {}, [50, 27]), frame("Action", { o1: [60, 44], o5: [54, 60] }, [60, 44], [54, 60])];
  }
};
