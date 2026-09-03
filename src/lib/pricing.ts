// ============================================================
// Tarification — Zalfoot
// Location d'un terrain de football : 25 000 FCFA / heure.
// À la réservation, le client verse un acompte de 5 000 FCFA
// par heure réservée via Wave Business ; le solde est réglé
// sur place à l'arrivée.
// ============================================================

/** Acompte à verser à la réservation (FCFA par heure réservée) */
export const DEPOSIT_PER_HOUR = 5000

/** Calcule l'acompte (FCFA) pour une durée donnée en heures. */
export function computeDeposit(durationHours: number): number {
  return Math.round(durationHours * DEPOSIT_PER_HOUR)
}
