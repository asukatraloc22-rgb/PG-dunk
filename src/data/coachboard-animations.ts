import { COURT_ROLE_POINTS } from "./court-geometry";

export type CoachActionType = "move" | "pass" | "dribble" | "screen" | "cut" | "roll" | "pop" | "shot" | "defense";
export type CourtRole = "top" | "slot-left" | "slot-right" | "wing-left" | "wing-right" | "corner-left" | "corner-right" | "elbow-left" | "elbow-right" | "block-left" | "block-right" | "short-corner-left" | "short-corner-right" | "dunker-left" | "dunker-right" | "inbound" | "rim";

export type CoachPlayer = {
  id: string;
  label: string;
  team: "offense" | "defense";
  role: CourtRole;
  x: number;
  y: number;
};

export type CoachInstruction = {
  type: CoachActionType;
  from: string;
  to: string;
  label: string;
};

export type CoachFrame = {
  title: string;
  teachingPoint: string;
  players: CoachPlayer[];
  ball: { x: number; y: number; owner?: string };
  instructions: CoachInstruction[];
  ballTarget?: { x: number; y: number };
};

const clamp = (value: number) => Math.min(96, Math.max(4, value));
const point = (role: CourtRole, dx = 0, dy = 0) => ({
  x: clamp(COURT_ROLE_POINTS[role].x + dx),
  y: clamp(COURT_ROLE_POINTS[role].y + dy),
});

const BASE_PLAYERS: Record<string, CoachPlayer> = {
  o1: { id: "o1", label: "1", team: "offense", role: "top", ...point("top") },
  o2: { id: "o2", label: "2", team: "offense", role: "corner-left", ...point("corner-left") },
  o3: { id: "o3", label: "3", team: "offense", role: "corner-right", ...point("corner-right") },
  o4: { id: "o4", label: "4", team: "offense", role: "wing-left", ...point("wing-left") },
  o5: { id: "o5", label: "5", team: "offense", role: "wing-right", ...point("wing-right") },
  d1: { id: "d1", label: "x1", team: "defense", role: "top", ...point("top", 0, 5) },
  d2: { id: "d2", label: "x2", team: "defense", role: "corner-left", ...point("corner-left", 5, 3) },
  d3: { id: "d3", label: "x3", team: "defense", role: "corner-right", ...point("corner-right", -5, 3) },
  d4: { id: "d4", label: "x4", team: "defense", role: "wing-left", ...point("wing-left", 4, 3) },
  d5: { id: "d5", label: "x5", team: "defense", role: "wing-right", ...point("wing-right", -4, 3) },
};

type CoachPositionChange = { id: string; x: number; y: number; role?: CourtRole };
const position = (id: string, role: CourtRole, dx = 0, dy = 0): CoachPositionChange => ({ id, role, ...point(role, dx, dy) });
const customPosition = (id: string, x: number, y: number, role?: CourtRole): CoachPositionChange => ({ id, x, y, ...(role ? { role } : {}) });
const action = (type: CoachActionType, from: string, to: string, label: string): CoachInstruction => ({ type, from, to, label });

function makeFrame(
  title: string,
  teachingPoint: string,
  changes: CoachPositionChange[],
  ball: CoachFrame["ball"],
  instructions: CoachInstruction[] = [],
  ballTarget?: CoachFrame["ballTarget"],
): CoachFrame {
  const changeMap = new Map(changes.map((change) => [change.id, change]));
  return {
    title,
    teachingPoint,
    players: Object.values(BASE_PLAYERS).map((player) => ({ ...player, ...(changeMap.get(player.id) ?? {}) })),
    ball,
    instructions,
    ballTarget,
  };
}

export const COACHBOARD_PLAY_IDS = new Set([
  "spacing-5out", "spacing_5out", "spacing-4out", "spacing_4out", "spacing-pnr-rules", "spacing_pnr_rules",
  "pnr-roll", "high-pnr", "pnr-pop", "empty-corner-pnr", "spain-pnr", "spain_pnr", "horns-flare", "horns-fist", "pistol-action", "pistol",
  "zone23-overload", "zone23_overload", "zone23-highpost", "zone23_highpost", "zone32-baseline", "zone32_baseline", "press-14-flat", "press_14_flat",
]);

export const getCoachboardFrames = (playId: string): CoachFrame[] => {
  switch (playId) {
    case "spacing-5out":
    case "spacing_5out":
      return [
        makeFrame("5-Out · spacing", "Le 1 est au top, les 2 et 3 occupent les corners et les 4 et 5 gardent les wings. Les cinq spots restent ouverts.", [], { ...point("top"), owner: "o1" }),
        makeFrame("Pass & basket cut", "Le 1 passe à l’aile puis coupe fort au cercle. Le receveur garde le ballon haut pour lire l’aide.", [position("o4", "wing-left"), position("o1", "top")], { ...point("top"), owner: "o1" }, [action("pass", "o1", "o4", "Pass"), action("cut", "o1", "rim", "Basket cut")], point("wing-left")),
        makeFrame("Fill behind the cut", "Le joueur du corner remplit le top lorsque le cutter traverse la peinture ; le corner opposé reste une sortie de sécurité.", [position("o1", "rim"), position("o2", "top"), position("o4", "wing-left")], { ...point("wing-left"), owner: "o4" }, [action("cut", "o1", "corner-right", "Clear through"), action("move", "o2", "top", "Fill top")]),
      ];
    case "spacing-4out":
    case "spacing_4out":
      return [
        makeFrame("4-Out · dunker spot", "Le 1, les deux wings et le corner faible étirent la défense ; le 5 est dans le dunker spot côté faible.", [position("o5", "dunker-right"), position("o2", "corner-left"), position("o3", "corner-right")], { ...point("top"), owner: "o1" }),
        makeFrame("Middle drive", "Le 1 attaque le milieu avec une driving lane libre. Le 5 reste bas pour occuper le low man.", [position("o5", "dunker-right"), position("d1", "slot-left", 0, 2), position("d5", "dunker-right", -5, -3)], { ...point("top"), owner: "o1" }, [action("dribble", "o1", "rim", "Middle drive"), action("defense", "d5", "o5", "Tag low man")]),
        makeFrame("Dump-off ou kick-out", "Si le low man quitte le dunker spot, le 1 joue le dump-off ; sinon il ressort vers un corner sans fermer la peinture.", [position("o1", "rim"), position("o5", "block-right"), position("o2", "corner-left"), position("o3", "corner-right")], { ...point("rim"), owner: "o1" }, [action("pass", "o1", "o5", "Dump-off"), action("pass", "o1", "o2", "Kick-out"), action("shot", "o2", "rim", "Corner three")], point("corner-left")),
      ];
    case "spacing-pnr-rules":
    case "spacing_pnr_rules":
    case "pnr-roll":
    case "high-pnr":
      return [
        makeFrame("High PnR · alignment", "Le 1 est au top, le 5 monte au high slot, les deux corners et la weak-side wing gardent les lignes de drive ouvertes.", [customPosition("o5", 50, 34, "top"), position("o2", "corner-left"), position("o3", "corner-right"), position("o4", "wing-left")], { ...point("top"), owner: "o1" }),
        makeFrame("Set the screen", "Le 5 pose un écran on-ball à l’épaule du défenseur. Le 1 arrive épaule contre épaule et protège la balle.", [position("o1", "top"), customPosition("o5", 50, 34, "top"), position("d1", "top", 0, 4), customPosition("d5", 58, 36, "top")], { ...point("top"), owner: "o1" }, [action("screen", "o5", "o1", "On-ball screen"), action("dribble", "o1", "slot-right", "Use screen")]),
        makeFrame("Turn the corner", "Le porteur sort du screen vers le slot droit ; le 5 roule dans l’axe du cercle pendant que le low man doit choisir.", [position("o1", "slot-right"), position("o5", "block-right"), position("d1", "slot-right", -4, 3), position("d5", "block-right", 5, -4)], { ...point("slot-right"), owner: "o1" }, [action("dribble", "o1", "rim", "Turn corner"), action("roll", "o5", "rim", "Roll"), action("defense", "d5", "o5", "Low-man tag")], point("rim")),
        makeFrame("Pocket pass ou finish", "La pocket pass doit partir avant la rotation du low man ; si la fenêtre se ferme, le porteur termine au cercle.", [position("o1", "slot-right", 0, 12), position("o5", "block-right"), position("d1", "slot-right", -2, 12), position("d5", "block-right", 5, -2)], { ...point("slot-right", 0, 12), owner: "o1" }, [action("pass", "o1", "o5", "Pocket pass"), action("shot", "o1", "rim", "Finish")], point("block-right")),
      ];
    case "pnr-pop":
      return [
        makeFrame("Pick & Pop · alignment", "Le screener part du high slot ; les corners sont occupés et le côté faible reste assez large pour le drive.", [customPosition("o5", 50, 34, "top"), position("o2", "corner-left"), position("o3", "corner-right")], { ...point("top"), owner: "o1" }),
        makeFrame("Screen puis reject", "Le 1 utilise l’écran ou rejette si le défenseur anticipe le middle. Le 5 garde son angle légal.", [position("o1", "top"), customPosition("o5", 50, 34, "top"), position("d1", "top", 0, 4), customPosition("d5", 58, 36, "top")], { ...point("top"), owner: "o1" }, [action("screen", "o5", "o1", "Screen"), action("dribble", "o1", "slot-right", "Use / reject")]),
        makeFrame("Pop behind the arc", "Après l’écran, le 5 s’écarte vers l’aile droite derrière la ligne à trois points ; le 1 garde la menace de drive.", [position("o1", "slot-right", 0, 8), position("o5", "wing-right"), position("d1", "slot-right", -4, 8), position("d5", "wing-right", -5, 3)], { ...point("slot-right", 0, 8), owner: "o1" }, [action("pop", "o5", "wing-right", "Pop to three"), action("pass", "o1", "o5", "Hit the pop")], point("wing-right")),
        makeFrame("Pop three", "Le receveur est placé sur la wing à trois points, pas dans la peinture. Le 5 tire si le closeout arrive en retard.", [position("o1", "slot-right", 0, 8), position("o5", "wing-right"), position("d5", "wing-right", -7, 3)], { ...point("wing-right"), owner: "o5" }, [action("shot", "o5", "rim", "Wing three")], point("rim")),
      ];
    case "empty-corner-pnr":
      return [
        makeFrame("Empty corner · clear", "Le corner côté ballon est vidé avant l’écran. Le 3 monte à la wing pour éloigner le low man.", [position("o1", "top"), position("o3", "corner-right"), customPosition("o5", 50, 34, "top")], { ...point("top"), owner: "o1" }),
        makeFrame("Clear then screen", "Le corner droit se vide vers la wing ; le 5 pose ensuite l’écran côté vide pour ouvrir le middle drive.", [position("o3", "wing-right"), customPosition("o5", 50, 34, "top"), customPosition("d5", 58, 36, "top")], { ...point("top"), owner: "o1" }, [action("move", "o3", "wing-right", "Clear corner"), action("screen", "o5", "o1", "Empty-side screen")]),
        makeFrame("Middle drive", "Le 1 attaque le milieu sans aide immédiate du corner vide ; le 5 roule derrière la ligne de drive.", [position("o1", "slot-right", 0, 8), position("o3", "wing-right"), position("o5", "block-right"), position("d1", "slot-right", -4, 8), position("d5", "block-right", 5, -3)], { ...point("slot-right", 0, 8), owner: "o1" }, [action("dribble", "o1", "rim", "Middle drive"), action("roll", "o5", "rim", "Roll"), action("defense", "d5", "o1", "Low-man decision")]),
        makeFrame("Hit the roll or spray", "La première lecture est le roller ; si l’aide quitte le côté faible, la passe ressort sur le shooter de la wing.", [position("o1", "rim"), position("o3", "wing-right"), position("o5", "block-right")], { ...point("rim"), owner: "o1" }, [action("pass", "o1", "o5", "Hit roller"), action("pass", "o1", "o3", "Spray out")], point("block-right")),
      ];
    case "spain-pnr":
    case "spain_pnr":
      return [
        makeFrame("Spain · horns entry", "Les 4 et 5 commencent aux elbows, le 1 est au top et les deux corners sont réellement occupés.", [position("o1", "top"), position("o4", "elbow-left"), position("o5", "elbow-right"), position("o2", "corner-left"), position("o3", "corner-right")], { ...point("top"), owner: "o1" }),
        makeFrame("High ball screen", "Le 5 monte poser le high PnR. Le 1 utilise l’écran vers le slot droit, en gardant le corner faible disponible.", [position("o1", "slot-right", 0, 8), position("o5", "elbow-right"), position("o4", "elbow-left"), position("d1", "slot-right", -4, 8), position("d5", "elbow-right", -5, 2)], { ...point("top"), owner: "o1" }, [action("screen", "o5", "o1", "Ball screen"), action("dribble", "o1", "slot-right", "Use screen")]),
        makeFrame("Spain backscreen", "Le 4 pose un backscreen dans le dos du défenseur du 5 ; le 5 roule et le 1 garde la balle sous contrôle.", [position("o1", "slot-right", 0, 12), position("o4", "block-left"), position("o5", "block-right"), position("d1", "slot-right", -4, 10), position("d5", "block-right", 5, -4)], { ...point("slot-right", 0, 12), owner: "o1" }, [action("screen", "o4", "d5", "Backscreen"), action("roll", "o5", "rim", "Roll"), action("dribble", "o1", "rim", "Read")], point("block-right")),
        makeFrame("Lob, pocket or kick-out", "Le 1 lit le low man : lob/pocket vers le 5, finition au cercle ou kick-out vers un corner si la zone collapse.", [position("o1", "rim"), position("o5", "block-right"), position("o2", "corner-left"), position("o3", "corner-right")], { ...point("rim"), owner: "o1" }, [action("pass", "o1", "o5", "Lob / pocket"), action("pass", "o1", "o2", "Kick-out"), action("shot", "o5", "rim", "Finish")], point("block-right")),
      ];
    case "horns-flare":
    case "horns-fist":
      return [
        makeFrame("Horns · entry", "Les deux bigs occupent les elbows, les wings sont dans les corners et le 1 garde la balle au top.", [position("o1", "top"), position("o4", "elbow-left"), position("o5", "elbow-right"), position("o2", "corner-left"), position("o3", "corner-right")], { ...point("top"), owner: "o1" }),
        makeFrame("Elbow entry", "Le 1 entre la balle au 4 à l’elbow puis coupe vers le corner faible pour libérer le côté fort.", [position("o1", "top"), position("o4", "elbow-left"), position("o2", "corner-left")], { ...point("top"), owner: "o1" }, [action("pass", "o1", "o4", "Elbow entry"), action("cut", "o1", "corner-left", "Clear out")], point("elbow-left")),
        makeFrame("Flare screen", "Le 5 pose un flare pour le 1 vers la wing droite. Le passeur garde l’angle et ne force pas la passe dans la peinture.", [position("o1", "wing-right"), position("o4", "elbow-left"), position("o5", "elbow-right"), position("d4", "wing-right", -5, 3)], { ...point("elbow-left"), owner: "o4" }, [action("screen", "o5", "o1", "Flare screen"), action("cut", "o1", "wing-right", "Flare out"), action("pass", "o4", "o1", "Hit shooter")], point("wing-right")),
        makeFrame("Flare three", "Le 1 reçoit sur la wing derrière la ligne à trois points. Le tir est une lecture distincte du mouvement de sortie.", [position("o1", "wing-right"), position("o4", "elbow-left"), position("o5", "elbow-right")], { ...point("wing-right"), owner: "o1" }, [action("shot", "o1", "rim", "Flare three")], point("rim")),
      ];
    case "pistol-action":
    case "pistol":
      return [
        makeFrame("Pistol · early offense", "Le 1 avance dans le slot gauche, le 2 court vers la wing et le 5 arrive comme second screener.", [position("o1", "slot-left"), position("o2", "wing-left"), position("o5", "elbow-left")], { ...point("slot-left"), owner: "o1" }),
        makeFrame("Dribble-at / handoff", "Le 1 dribble vers le 2. Le 2 peut backdoor si son défenseur refuse la réception ; le 5 prépare l’écran de sortie.", [position("o1", "wing-left"), position("o2", "wing-left", 7, 0), position("o5", "elbow-left"), position("d1", "wing-left", 4, 4), position("d2", "wing-left", -4, 3)], { ...point("wing-left"), owner: "o1" }, [action("dribble", "o1", "o2", "Dribble-at"), action("cut", "o2", "rim", "Backdoor option")]),
        makeFrame("Handoff + screen", "Le 2 reçoit le handoff et tourne l’épaule autour du 5. Le 1 remplit derrière l’action pour garder le spacing.", [position("o1", "slot-left"), position("o2", "wing-left"), position("o5", "elbow-left"), position("d1", "wing-left", 4, 4), position("d2", "wing-left", -5, 3), position("d5", "elbow-left", -5, 2)], { ...point("wing-left"), owner: "o2" }, [action("pass", "o1", "o2", "Handoff"), action("screen", "o5", "o2", "Handoff screen")]),
        makeFrame("Turn the corner", "Le 2 attaque le closeout, le 5 roule vers le cercle et les deux corners restent ouverts pour le kick-out.", [position("o2", "rim"), position("o5", "block-left"), position("o1", "slot-left")], { ...point("rim"), owner: "o2" }, [action("dribble", "o2", "rim", "Turn corner"), action("roll", "o5", "rim", "Roll"), action("shot", "o2", "rim", "Finish")], point("rim")),
      ];
    case "zone23-overload":
    case "zone23_overload":
      return [
        makeFrame("Zone 2-3 · overload", "On surcharge le côté gauche avec top, wing, corner et high post ; le corner droit reste le skip outlet.", [position("o1", "top"), position("o2", "wing-left"), position("o4", "corner-left"), position("o5", "elbow-left"), position("o3", "corner-right"), customPosition("d1", 42, 31), customPosition("d2", 58, 31), customPosition("d3", 28, 61), customPosition("d4", 72, 61), customPosition("d5", 50, 70)], { ...point("top"), owner: "o1" }, [action("defense", "d1", "o2", "Left wing coverage"), action("defense", "d2", "o3", "Right wing coverage"), action("defense", "d3", "o4", "Left corner coverage"), action("defense", "d4", "o3", "Right corner coverage"), action("defense", "d5", "rim", "Protect paint")]),
        makeFrame("Touch the high post", "La balle touche le 5 au high post pour forcer le défenseur central à choisir entre le nail et le corner.", [position("o5", "elbow-left"), position("o4", "corner-left"), customPosition("d1", 40, 34), customPosition("d5", 50, 68)], { ...point("top"), owner: "o1" }, [action("pass", "o1", "o5", "High-post touch"), action("defense", "d5", "o5", "Tag the nail")], point("elbow-left")),
        makeFrame("Baseline cut", "Depuis le high post, le 4 coupe le long de la baseline derrière la zone. Le 5 garde la passe courte ou le tir.", [position("o5", "elbow-left"), position("o4", "rim"), position("o2", "wing-left"), customPosition("d3", 34, 72)], { ...point("elbow-left"), owner: "o5" }, [action("cut", "o4", "rim", "Baseline cut"), action("pass", "o5", "o4", "Hit baseline"), action("defense", "d3", "o4", "Zone rotation")], point("rim")),
        makeFrame("Skip pass · corner three", "Si la zone collapse sur le cut, le 5 ressort vers le corner faible. Le shooter est placé sur le vrai spot de corner à trois points.", [position("o5", "elbow-left"), position("o3", "corner-right"), customPosition("d2", 58, 42), customPosition("d4", 72, 63)], { ...point("elbow-left"), owner: "o5" }, [action("pass", "o5", "o3", "Skip pass"), action("shot", "o3", "rim", "Corner three"), action("defense", "d4", "o3", "Closeout corner")], point("corner-right")),
      ];
    case "zone23-highpost":
    case "zone23_highpost":
      return [
        makeFrame("Zone 2-3 · flash", "Le 5 part du dunker spot, les quatre extérieurs occupent top, wings et corner pour ouvrir le high post.", [position("o1", "top"), position("o2", "wing-left"), position("o3", "wing-right"), position("o4", "corner-left"), position("o5", "dunker-right")], { ...point("top"), owner: "o1" }),
        makeFrame("Flash to the nail", "Le 5 flashe au high post. La passe doit arriver dans la fenêtre avant que le center de zone ne puisse bump le cutter.", [position("o5", "elbow-left"), position("o1", "top"), position("o2", "wing-left")], { ...point("top"), owner: "o1" }, [action("cut", "o5", "elbow-left", "High-post flash"), action("pass", "o1", "o5", "Feed the nail")], point("elbow-left")),
        makeFrame("Turn and read", "Le high post pivote vers le cercle, le corner ou le skip côté faible selon la rotation du low defender.", [position("o5", "elbow-left"), position("o2", "corner-left"), position("o3", "wing-right")], { ...point("elbow-left"), owner: "o5" }, [action("dribble", "o5", "rim", "Turn middle"), action("pass", "o5", "o3", "Skip out")]),
        makeFrame("Finish / kick-out", "Si la zone ne collapse pas, le 5 finit depuis le short paint. Si elle collapse, il ressort vers le corner.", [position("o5", "rim"), position("o2", "corner-left")], { ...point("rim"), owner: "o5" }, [action("shot", "o5", "rim", "Finish"), action("pass", "o5", "o2", "Kick-out")], point("rim")),
      ];
    case "zone32-baseline":
    case "zone32_baseline":
      return [
        makeFrame("Zone 3-2 · baseline runner", "Le runner démarre au corner gauche, le 5 occupe le high post et les trois extérieurs gardent la zone étirée.", [position("o1", "top"), position("o2", "wing-left"), position("o3", "wing-right"), position("o4", "corner-left"), position("o5", "elbow-left")], { ...point("top"), owner: "o1" }),
        makeFrame("Baseline run", "Le 4 traverse la baseline de corner à corner derrière la zone pendant que le 5 fixe le middle defender.", [position("o4", "corner-left"), position("o5", "elbow-left")], { ...point("top"), owner: "o1" }, [action("cut", "o4", "corner-right", "Baseline runner"), action("move", "o5", "elbow-left", "Middle occupy")]),
        makeFrame("Hit the runner", "Le passeur sert le runner lorsqu’il arrive au corner droit, placé derrière la ligne à trois points.", [position("o4", "corner-right"), position("o1", "top")], { ...point("top"), owner: "o1" }, [action("pass", "o1", "o4", "Hit runner"), action("shot", "o4", "rim", "Corner three")], point("corner-right")),
        makeFrame("Middle flash", "Si la zone suit le runner, la balle revient au high post ou au top shooter pour punir la rotation.", [position("o4", "corner-right"), position("o5", "elbow-left")], { ...point("corner-right"), owner: "o4" }, [action("pass", "o4", "o5", "High-post touch"), action("shot", "o5", "rim", "Middle touch")], point("elbow-left")),
      ];
    case "press-14-flat":
    case "press_14_flat":
      return [
        makeFrame("1-4 Flat · inbound", "Le 1 est sur la ligne de fond pour la remise en jeu ; les quatre receveurs sont alignés au-dessus de la ligne des lancers francs.", [position("o1", "inbound"), customPosition("o2", 18, 42, "wing-left"), customPosition("o3", 38, 42, "slot-left"), customPosition("o4", 62, 42, "slot-right"), customPosition("o5", 82, 42, "wing-right")], { ...point("inbound"), owner: "o1" }),
        makeFrame("Crossing cuts", "Les deux coupes croisées créent une première fenêtre de passe ; le receveur opposé reste la safety valve.", [position("o1", "inbound"), customPosition("o2", 38, 52, "slot-left"), customPosition("o3", 22, 32, "wing-left"), customPosition("o4", 78, 32, "wing-right"), customPosition("o5", 62, 52, "slot-right")], { ...point("inbound"), owner: "o1" }, [action("cut", "o2", "slot-right", "Cross cut"), action("cut", "o3", "wing-left", "Release"), action("move", "o5", "slot-right", "Safety")]),
        makeFrame("Inbound pass", "Le 1 passe au premier receveur libre puis remonte immédiatement pour devenir une sortie de sécurité.", [position("o1", "inbound"), customPosition("o2", 28, 45, "wing-left"), customPosition("o3", 22, 32, "wing-left"), customPosition("o4", 78, 32, "wing-right"), customPosition("o5", 62, 52, "slot-right")], { x: 28, y: 45, owner: "o2" }, [action("pass", "o1", "o2", "Inbound pass"), action("move", "o1", "top", "Advance")], point("wing-left")),
        makeFrame("Advance and organize", "Une fois la première ligne franchie, l’équipe revient dans un spacing 5-Out clair avant de lancer l’action suivante.", [position("o1", "top"), position("o2", "corner-left"), position("o3", "corner-right"), position("o4", "wing-left"), position("o5", "wing-right")], { ...point("top"), owner: "o1" }, [action("move", "o1", "top", "Organize")]),
      ];
    default:
      return [makeFrame("Disposition", "Sélectionne un play avec une chorégraphie Coachboard dédiée.", [], { ...point("top"), owner: "o1" })];
  }
};
