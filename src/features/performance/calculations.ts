/**
 * Calcule la hauteur de détente à partir de la durée de vol.
 * `flightTimeSeconds` doit être exprimé en secondes.
 * La formule est basée sur h = g × t² / 8.
 */
export function calculateJumpHeightFromFlightTime(flightTimeSeconds: number): number {
  if (!Number.isFinite(flightTimeSeconds) || flightTimeSeconds <= 0) return 0;
  return (9.81 * flightTimeSeconds ** 2 * 100) / 8;
}

/**
 * Calcule une détente depuis des images vidéo et une fréquence d’images.
 */
export function calculateJumpHeightFromFrames(
  takeoffFrame: number,
  landingFrame: number,
  framesPerSecond = 240,
): number {
  if (
    !Number.isFinite(takeoffFrame) ||
    !Number.isFinite(landingFrame) ||
    !Number.isFinite(framesPerSecond) ||
    framesPerSecond <= 0 ||
    landingFrame <= takeoffFrame
  ) {
    return 0;
  }

  return calculateJumpHeightFromFlightTime((landingFrame - takeoffFrame) / framesPerSecond);
}

/**
 * Calcule le Reactive Strength Index (RSI).
 * `jumpHeightCm` est la hauteur de saut en centimètres et `contactTimeSeconds`
 * le temps de contact au sol en secondes.
 */
export function calculateRSI(jumpHeightCm: number, contactTimeSeconds: number): number {
  if (
    !Number.isFinite(jumpHeightCm) ||
    !Number.isFinite(contactTimeSeconds) ||
    jumpHeightCm <= 0 ||
    contactTimeSeconds <= 0
  ) {
    return 0;
  }

  return (jumpHeightCm / 100) / contactTimeSeconds;
}

/**
 * Calcule l’apex atteint à partir de l’envergure et de la détente.
 */
export function calculateApex(reachCm: number, jumpHeightCm: number): number {
  if (!Number.isFinite(reachCm) || !Number.isFinite(jumpHeightCm)) return 0;
  return Math.max(0, reachCm + jumpHeightCm);
}

/**
 * Calcule le déficit restant pour atteindre une cible d’apex.
 */
export function calculateApexDeficit(targetApexCm: number, currentApexCm: number): number {
  if (!Number.isFinite(targetApexCm) || !Number.isFinite(currentApexCm)) return 0;
  return Math.max(0, targetApexCm - currentApexCm);
}

export interface ProgressionPoint {
  value: number;
  date?: string;
}

/**
 * Retourne le pourcentage de progression vers une cible, borné entre 0 et 100.
 */
export function calculateProgressPercent(
  initialValue: number,
  currentValue: number,
  targetValue: number,
): number {
  if (
    !Number.isFinite(initialValue) ||
    !Number.isFinite(currentValue) ||
    !Number.isFinite(targetValue) ||
    targetValue === initialValue
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, ((currentValue - initialValue) / (targetValue - initialValue)) * 100),
  );
}
