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

const BASE_PLAYERS: Record<string, CoachPlayer> = {
  o1: { id: "o1", label: "1", team: "offense", role: "top", x: 50, y: 20 },
  o2: { id: "o2", label: "2", team: "offense", role: "corner-left", x: 12, y: 76 },
  o3: { id: "o3", label: "3", team: "offense", role: "corner-right", x: 88, y: 76 },
  o4: { id: "o4", label: "4", team: "offense", role: "wing-left", x: 18, y: 48 },
  o5: { id: "o5", label: "5", team: "offense", role: "wing-right", x: 82, y: 48 },
  d1: { id: "d1", label: "x1", team: "defense", role: "top", x: 50, y: 29 },
  d2: { id: "d2", label: "x2", team: "defense", role: "corner-left", x: 18, y: 69 },
  d3: { id: "d3", label: "x3", team: "defense", role: "corner-right", x: 82, y: 69 },
  d4: { id: "d4", label: "x4", team: "defense", role: "wing-left", x: 28, y: 49 },
  d5: { id: "d5", label: "x5", team: "defense", role: "wing-right", x: 72, y: 49 },
};

type CoachPositionChange = { id: string; x: number; y: number; role?: CourtRole };
const position = (id: string, x: number, y: number, role?: CourtRole): CoachPositionChange => ({ id, x, y, ...(role ? { role } : {}) });
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
        makeFrame("5-Out · spacing", "Tout le monde est au-dessus de la ligne à 3 points : top, wings et corners ouverts.", [], { x: 50, y: 20, owner: "o1" }),
        makeFrame("Pass & cut", "Après la passe, le joueur coupe fort vers le rim avant de remplir le prochain spot.", [position("o1", 18, 48, "wing-left"), position("o2", 12, 76, "corner-left"), position("o4", 50, 70, "rim")], { x: 18, y: 48, owner: "o1" }, [action("pass", "o1", "o4", "Pass"), action("cut", "o1", "rim", "Cut"), action("move", "o4", "slot-left", "Replace")], { x: 18, y: 48 }),
        makeFrame("Drive & drift", "Le porteur attaque le closeout ; le corner opposé reste un safety valve et le côté ballon drift.", [position("o1", 43, 42, "slot-left"), position("o2", 25, 65, "short-corner-left"), position("o4", 50, 72, "rim")], { x: 43, y: 42, owner: "o1" }, [action("dribble", "o1", "rim", "Drive"), action("move", "o2", "short-corner-left", "Drift"), action("move", "o3", "corner-right", "Stay spaced")]),
        makeFrame("Kick-out ou finish", "La lecture finale dépend de l’aide : finish au cercle, kick-out au corner ou skip pass côté faible.", [position("o1", 50, 60, "rim"), position("o2", 12, 76, "corner-left"), position("o3", 88, 76, "corner-right")], { x: 50, y: 60, owner: "o1" }, [action("dribble", "o1", "rim", "Finish"), action("pass", "o1", "o3", "Kick-out"), action("shot", "o3", "rim", "Shot")], { x: 88, y: 76 }),
      ];
    case "spacing-4out":
    case "spacing_4out":
      return [
        makeFrame("4-Out · dunker spot", "Quatre joueurs occupent top, wings et corner ; le 5 garde le short corner opposé.", [position("o5", 35, 76, "dunker-left")], { x: 50, y: 20, owner: "o1" }),
        makeFrame("Drive middle", "Le 1 attaque le milieu. Le 5 reste bas pour ne pas fermer la driving lane.", [position("o1", 38, 48, "slot-left"), position("o5", 35, 76, "dunker-left"), position("d1", 42, 45), position("d5", 45, 69)], { x: 38, y: 48, owner: "o1" }, [action("dribble", "o1", "rim", "Middle drive"), action("move", "o5", "dunker-left", "Hold dunker spot")]),
        makeFrame("Low-man decision", "Si le low man quitte le dunker spot, le 1 sert le 5 ou le corner opposé.", [position("o1", 45, 62, "rim"), position("o5", 50, 74, "rim"), position("d1", 45, 55), position("d5", 50, 68)], { x: 45, y: 62, owner: "o1" }, [action("pass", "o1", "o5", "Dump-off"), action("cut", "o5", "rim", "Seal"), action("defense", "d5", "o5", "Low-man help")]),
        makeFrame("Finish ou kick-out", "La peinture est attaquée sans sacrifier les deux corners.", [position("o1", 50, 65, "rim"), position("o5", 50, 72, "rim")], { x: 50, y: 65, owner: "o1" }, [action("shot", "o1", "rim", "Finish"), action("pass", "o1", "o2", "Kick-out corner")], { x: 12, y: 76 }),
      ];
    case "spacing-pnr-rules":
    case "spacing_pnr_rules":
    case "pnr-roll":
    case "high-pnr":
      return [
        makeFrame("High PnR · alignment", "Le porteur est top, le screener au high slot, les deux corners restent occupés.", [position("o5", 50, 38, "top")], { x: 50, y: 20, owner: "o1" }),
        makeFrame("Set the screen", "Le 5 pose un angle d’écran légal et le 1 arrive épaule contre épaule.", [position("o1", 50, 30, "top"), position("o5", 50, 38, "top"), position("d1", 50, 31), position("d5", 58, 42)], { x: 50, y: 30, owner: "o1" }, [action("screen", "o5", "o1", "On-ball screen"), action("dribble", "o1", "slot-right", "Use screen")]),
        makeFrame("Turn the corner", "Le 1 lit drop, switch, hedge ou blitz ; le 5 plonge vers le rim.", [position("o1", 64, 44, "slot-right"), position("o5", 55, 67, "rim"), position("d1", 60, 45), position("d5", 58, 58)], { x: 64, y: 44, owner: "o1" }, [action("dribble", "o1", "rim", "Turn corner"), action("roll", "o5", "rim", "Roll"), action("defense", "d1", "o1", "Contain")], { x: 55, y: 67 }),
        makeFrame("Pocket pass ou finish", "La pocket pass arrive avant la rotation du low man ; sinon le porteur finit au cercle.", [position("o1", 60, 55, "rim"), position("o5", 55, 70, "rim"), position("d1", 57, 54), position("d5", 60, 63)], { x: 60, y: 55, owner: "o1" }, [action("pass", "o1", "o5", "Pocket pass"), action("shot", "o1", "rim", "Finish")], { x: 55, y: 70 }),
      ];
    case "pnr-pop":
      return [
        makeFrame("Pick & Pop · alignment", "Le screener démarre au high slot ; les corners sont occupés et le côté faible est dégagé.", [position("o5", 50, 38, "top")], { x: 50, y: 20, owner: "o1" }),
        makeFrame("Screen puis reject", "Le porteur utilise l’écran ou rejette si le défenseur anticipe le middle.", [position("o1", 62, 42, "slot-right"), position("o5", 50, 38, "top"), position("d1", 58, 43), position("d5", 62, 45)], { x: 62, y: 42, owner: "o1" }, [action("screen", "o5", "o1", "Screen"), action("dribble", "o1", "slot-right", "Reject / use")]),
        makeFrame("Pop to space", "Le 5 s’écarte derrière la ligne à 3 points pendant que le 1 garde la menace de drive.", [position("o1", 60, 52, "slot-right"), position("o5", 68, 35, "wing-right"), position("d1", 58, 50), position("d5", 64, 42)], { x: 60, y: 52, owner: "o1" }, [action("pop", "o5", "wing-right", "Pop"), action("pass", "o1", "o5", "Hit the pop")], { x: 68, y: 35 }),
        makeFrame("Shot ou drive", "Le 5 tire si le closeout est tardif ; le 1 attaque le closeout si la défense sort trop fort.", [position("o1", 62, 50, "slot-right"), position("o5", 68, 35, "wing-right")], { x: 68, y: 35, owner: "o5" }, [action("shot", "o5", "rim", "Pop three"), action("dribble", "o1", "rim", "Attack closeout")]),
      ];
    case "empty-corner-pnr":
      return [
        makeFrame("Empty corner", "Le corner côté ballon se vide avant l’écran pour ouvrir le driving lane.", [position("o3", 82, 25, "wing-right"), position("o5", 50, 38, "top")], { x: 50, y: 20, owner: "o1" }),
        makeFrame("Clear then screen", "Le 3 monte ; le 5 pose l’écran côté vide et le low man doit choisir.", [position("o1", 50, 35, "top"), position("o3", 82, 25, "wing-right"), position("o5", 50, 38, "top"), position("d5", 58, 42)], { x: 50, y: 35, owner: "o1" }, [action("move", "o3", "wing-right", "Clear corner"), action("screen", "o5", "o1", "Empty-side screen")]),
        makeFrame("Middle drive", "Le porteur attaque le milieu sans aide immédiate depuis le corner vide.", [position("o1", 58, 48, "slot-right"), position("o5", 50, 39, "top"), position("d1", 55, 48), position("d5", 60, 48)], { x: 58, y: 48, owner: "o1" }, [action("dribble", "o1", "rim", "Middle drive"), action("defense", "d5", "o1", "Low-man decision")]),
        makeFrame("Hit the roll or spray", "La passe arrive au roller ou au corner faible si l’aide quitte son joueur.", [position("o1", 62, 57, "rim"), position("o5", 55, 68, "rim"), position("o2", 20, 30, "slot-left")], { x: 62, y: 57, owner: "o1" }, [action("pass", "o1", "o5", "Hit roller"), action("pass", "o1", "o2", "Skip pass")], { x: 55, y: 68 }),
      ];
    case "spain-pnr":
    case "spain_pnr":
      return [
        makeFrame("Spain · horns", "Le 4 et le 5 partent aux elbows ; le 1 est top, les corners sont réellement ouverts.", [position("o1", 50, 20, "top"), position("o4", 32, 39, "elbow-left"), position("o5", 68, 39, "elbow-right"), position("o2", 12, 76, "corner-left"), position("o3", 88, 76, "corner-right")], { x: 50, y: 20, owner: "o1" }),
        makeFrame("High ball screen", "Le 5 pose le PnR ; le 1 utilise l’écran vers le côté avec le corner opposé intact.", [position("o1", 64, 42, "slot-right"), position("o5", 50, 38, "top"), position("o4", 32, 39, "elbow-left"), position("o2", 28, 48, "wing-left"), position("d1", 58, 42), position("d5", 61, 43)], { x: 64, y: 42, owner: "o1" }, [action("screen", "o5", "o1", "Ball screen"), action("dribble", "o1", "slot-right", "Use screen")]),
        makeFrame("Spain backscreen", "Le 4 pose un backscreen dans le dos du défenseur du 5 ; le 5 roule au cercle.", [position("o1", 68, 52, "slot-right"), position("o4", 44, 45, "slot-left"), position("o5", 55, 63, "rim"), position("d1", 64, 52), position("d2", 44, 52), position("d5", 55, 57)], { x: 68, y: 52, owner: "o1" }, [action("screen", "o4", "d5", "Backscreen"), action("roll", "o5", "rim", "Roll"), action("dribble", "o1", "rim", "Read" )], { x: 55, y: 63 }),
        makeFrame("Lob, pocket or kick-out", "Le 1 choisit lob/pocket pass, finition ou kick-out selon le low man et le tag.", [position("o1", 70, 55, "rim"), position("o5", 56, 69, "rim"), position("o2", 12, 76, "corner-left"), position("o3", 88, 76, "corner-right")], { x: 70, y: 55, owner: "o1" }, [action("pass", "o1", "o5", "Lob / pocket"), action("pass", "o1", "o2", "Kick-out"), action("shot", "o5", "rim", "Finish")], { x: 56, y: 69 }),
      ];
    case "horns-flare":
    case "horns-fist":
      return [
        makeFrame("Horns · entry", "Les deux bigs sont aux elbows, les wings dans les corners et le 1 top.", [position("o4", 34, 39, "elbow-left"), position("o5", 66, 39, "elbow-right")], { x: 50, y: 20, owner: "o1" }),
        makeFrame("Fist entry", "Le 1 entre la balle à l’elbow puis coupe ; le côté faible reste spacé.", [position("o1", 48, 38, "elbow-left"), position("o4", 34, 39, "elbow-left"), position("o5", 66, 39, "elbow-right")], { x: 48, y: 38, owner: "o1" }, [action("pass", "o1", "o4", "Elbow entry"), action("cut", "o1", "rim", "Cut")]),
        makeFrame("Flare screen", "Le 5 pose un flare dans le dos pour libérer le 4 vers l’aile.", [position("o1", 62, 47, "slot-right"), position("o4", 55, 31, "wing-right"), position("o5", 52, 42, "top"), position("d4", 55, 42)], { x: 62, y: 47, owner: "o1" }, [action("screen", "o5", "d4", "Flare screen"), action("cut", "o4", "wing-right", "Flare out"), action("pass", "o1", "o4", "Hit shooter")], { x: 55, y: 31 }),
        makeFrame("Shot or PnR", "Si le tir n’est pas disponible, le 5 enchaîne en PnR et le 4 remplit le spacing.", [position("o1", 64, 50, "slot-right"), position("o4", 75, 30, "wing-right"), position("o5", 52, 42, "top")], { x: 55, y: 31, owner: "o4" }, [action("shot", "o4", "rim", "Flare shot"), action("screen", "o5", "o1", "Flow into PnR")]),
      ];
    case "pistol-action":
    case "pistol":
      return [
        makeFrame("Pistol · transition", "Le 1 avance dans le slot, le 2 est dans l’aile et le 5 arrive lancé.", [position("o1", 30, 27, "slot-left"), position("o2", 14, 48, "wing-left"), position("o5", 54, 34, "top")], { x: 30, y: 27, owner: "o1" }),
        makeFrame("Dribble-at", "Le 1 dribble vers le 2 ; le 2 lit backdoor, handoff ou sortie vers l’aile.", [position("o1", 25, 40, "wing-left"), position("o2", 20, 43, "wing-left"), position("o5", 50, 42, "top"), position("d1", 28, 38), position("d2", 26, 47)], { x: 25, y: 40, owner: "o1" }, [action("dribble", "o1", "o2", "Dribble-at"), action("cut", "o2", "rim", "Backdoor option")]),
        makeFrame("Handoff + screen", "Le 5 arrive pour un DHO et le 1 pose un écran de sortie après le handoff.", [position("o1", 32, 50, "slot-left"), position("o2", 47, 43, "slot-left"), position("o5", 42, 48, "top"), position("d1", 34, 48), position("d2", 50, 46), position("d5", 43, 52)], { x: 47, y: 43, owner: "o2" }, [action("pass", "o1", "o2", "DHO handoff"), action("screen", "o5", "o2", "Handoff screen")]),
        makeFrame("Turn the corner", "Le receveur attaque le closeout avec le 5 en roll et les corners ouverts.", [position("o2", 48, 62, "rim"), position("o5", 50, 58, "rim"), position("o1", 45, 43, "slot-left")], { x: 48, y: 62, owner: "o2" }, [action("dribble", "o2", "rim", "Turn corner"), action("roll", "o5", "rim", "Roll"), action("shot", "o2", "rim", "Finish")]),
      ];
    case "zone23-overload":
    case "zone23_overload":
      return [
        makeFrame("Zone 2-3 · overload", "On surcharge un côté avec top, wing, corner et high post pour déplacer deux défenseurs.", [position("o1", 50, 20, "top"), position("o2", 18, 48, "wing-left"), position("o4", 12, 76, "corner-left"), position("o5", 48, 54, "elbow-left")], { x: 50, y: 20, owner: "o1" }),
        makeFrame("Touch the high post", "La balle arrive au high post pour forcer la zone à choisir entre le nail et le corner.", [position("o1", 38, 28, "slot-left"), position("o5", 48, 50, "elbow-left"), position("d1", 42, 38), position("d5", 50, 70)], { x: 48, y: 50, owner: "o5" }, [action("pass", "o1", "o5", "High-post touch"), action("move", "o4", "corner-left", "Stay corner")]),
        makeFrame("Baseline cut", "Le corner coupe derrière la zone pendant que le high post lit le shooter.", [position("o5", 48, 50, "elbow-left"), position("o4", 50, 72, "rim"), position("d3", 32, 65)], { x: 48, y: 50, owner: "o5" }, [action("cut", "o4", "rim", "Baseline cut"), action("pass", "o5", "o4", "Hit baseline"), action("defense", "d3", "o4", "Zone rotation")]),
        makeFrame("Skip pass", "Si la zone collapse, la passe skip trouve le shooter côté faible.", [position("o1", 65, 38, "slot-right"), position("o3", 88, 76, "corner-right")], { x: 65, y: 38, owner: "o1" }, [action("pass", "o1", "o3", "Skip pass"), action("shot", "o3", "rim", "Corner three")], { x: 88, y: 76 }),
      ];
    case "zone23-highpost":
    case "zone23_highpost":
      return [
        makeFrame("Zone 2-3 · high post", "Le 5 part du dunker spot et attaque le nail avant que la zone ne soit installée.", [position("o5", 82, 76, "dunker-right")], { x: 50, y: 20, owner: "o1" }),
        makeFrame("Flash to nail", "Le 5 flashe au high post ; les wings restent dans les fenêtres de passe.", [position("o1", 32, 28, "slot-left"), position("o5", 50, 52, "elbow-left")], { x: 32, y: 28, owner: "o1" }, [action("cut", "o5", "elbow-left", "High-post flash"), action("pass", "o1", "o5", "Feed the nail")]),
        makeFrame("Turn and read", "Le high post pivote vers le cercle, le corner ou le skip côté faible.", [position("o5", 50, 52, "elbow-left"), position("o2", 12, 76, "corner-left"), position("o3", 88, 76, "corner-right")], { x: 50, y: 52, owner: "o5" }, [action("dribble", "o5", "rim", "Turn middle"), action("pass", "o5", "o3", "Skip out")]),
        makeFrame("Finish / kick-out", "La décision finale dépend du low man : finish si la ligne est libre, kick-out si la zone collapse.", [position("o5", 50, 68, "rim")], { x: 50, y: 68, owner: "o5" }, [action("shot", "o5", "rim", "Finish"), action("pass", "o5", "o2", "Kick-out")]),
      ];
    case "zone32-baseline":
    case "zone32_baseline":
      return [
        makeFrame("Zone 3-2 · baseline runner", "Le runner démarre dans le corner et traverse la baseline derrière la zone.", [position("o4", 12, 76, "corner-left"), position("o5", 50, 55, "elbow-left")], { x: 50, y: 20, owner: "o1" }),
        makeFrame("Baseline run", "Le 4 sprinte de corner à corner ; le 5 occupe le middle pour fixer le low defender.", [position("o4", 50, 82, "short-corner-left"), position("o5", 50, 55, "elbow-left")], { x: 32, y: 28, owner: "o1" }, [action("cut", "o4", "corner-right", "Baseline runner"), action("move", "o5", "elbow-left", "Middle occupy")]),
        makeFrame("Hit the runner", "Le top ou le high post sert le runner si le défenseur est en retard.", [position("o4", 88, 76, "corner-right"), position("o1", 32, 28, "slot-left"), position("d3", 78, 70)], { x: 88, y: 76, owner: "o4" }, [action("pass", "o1", "o4", "Hit runner"), action("shot", "o4", "rim", "Corner shot")]),
        makeFrame("Middle flash", "Si la zone suit le runner, la passe revient au middle flash ou au top shooter.", [position("o4", 88, 76, "corner-right"), position("o5", 50, 52, "elbow-left")], { x: 50, y: 52, owner: "o5" }, [action("pass", "o4", "o5", "High-post touch"), action("shot", "o5", "rim", "Middle shot")]),
      ];
    case "press-14-flat":
    case "press_14_flat":
      return [
        makeFrame("1-4 Flat · press break", "Le 1 démarre bas et les quatre autres joueurs s’alignent au-dessus de la ligne des lancers francs.", [position("o1", 50, 88, "inbound"), position("o2", 18, 62, "wing-left"), position("o3", 38, 62, "slot-left"), position("o4", 62, 62, "slot-right"), position("o5", 82, 62, "wing-right")], { x: 50, y: 88, owner: "o1" }),
        makeFrame("Crossing cuts", "Les deux coupes croisées créent une première fenêtre de passe ; le second joueur remonte comme safety.", [position("o1", 50, 88, "inbound"), position("o2", 38, 72, "slot-left"), position("o3", 22, 46, "wing-left"), position("o4", 78, 46, "wing-right"), position("o5", 62, 72, "slot-right")], { x: 50, y: 88, owner: "o1" }, [action("cut", "o2", "slot-right", "Cross cut"), action("cut", "o3", "wing-left", "Release"), action("move", "o5", "slot-right", "Safety")]),
        makeFrame("Inbound pass", "Le 1 passe au premier receveur libre, puis court immédiatement comme safety valve.", [position("o1", 38, 78, "slot-left"), position("o2", 38, 72, "slot-left"), position("o3", 22, 46, "wing-left"), position("o4", 78, 46, "wing-right"), position("o5", 62, 72, "slot-right")], { x: 38, y: 72, owner: "o2" }, [action("pass", "o1", "o2", "Inbound pass"), action("move", "o1", "top", "Advance")]),
        makeFrame("Advance and organize", "Une fois la première ligne franchie, on retrouve le spacing 4-Out ou 5-Out.", [position("o1", 50, 22, "top"), position("o2", 12, 76, "corner-left"), position("o3", 88, 76, "corner-right"), position("o4", 22, 48, "wing-left"), position("o5", 78, 48, "wing-right")], { x: 50, y: 22, owner: "o1" }, [action("move", "o1", "top", "Organize"), action("move", "o2", "corner-left", "Fill corner"), action("move", "o3", "corner-right", "Fill corner")]),
      ];
    default:
      return [makeFrame("Disposition", "Sélectionne un play avec une chorégraphie Coachboard dédiée.", [], { x: 50, y: 20, owner: "o1" })];
  }
};
