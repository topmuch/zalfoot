/**
 * Migration ponctuelle — nouvelle tarification Zalfoot :
 * 1. Tous les terrains passent à 25 000 FCFA / heure (tarif unique).
 * 2. Le lien de paiement Wave Business réel est configuré :
 *    https://pay.wave.com/m/M_sn_if40h6RgxkCj/c/sn/?amount={amount}
 *    ({amount} est remplacé par l'acompte : 5 000 F × heures réservées).
 * 3. Les réservations existantes sont recalculées :
 *    amount = heures × 25 000, depositAmount = heures × 5 000.
 *
 * Exécution : bun run scripts/apply-new-pricing.ts
 */
import { db } from '@/lib/db'
import { computeDeposit } from '@/lib/pricing'
import { WAVE_LINK_KEY } from '@/app/api/settings/route'

const WAVE_PAYMENT_LINK = 'https://pay.wave.com/m/M_sn_if40h6RgxkCj/c/sn/?amount={amount}'

function toMinutes(time: string, asEnd = false): number {
  const [h, m] = time.split(':').map(Number)
  const minutes = (h || 0) * 60 + (m || 0)
  return asEnd && minutes === 0 ? 24 * 60 : minutes
}

async function main() {
  console.log('💰 Nouvelle tarification : 25 000 FCFA/h, acompte 5 000 FCFA/h via Wave…')

  // 1) Tarif unique 25 000 FCFA / heure
  const terrains = await db.facility.updateMany({
    data: { pricePerHour: 25000 },
  })
  console.log(`✅ ${terrains.count} terrain(s) mis à 25 000 FCFA/heure.`)

  // 2) Lien de paiement Wave Business réel
  await db.setting.upsert({
    where: { key: WAVE_LINK_KEY },
    update: { value: WAVE_PAYMENT_LINK },
    create: { key: WAVE_LINK_KEY, value: WAVE_PAYMENT_LINK },
  })
  console.log(`✅ Lien Wave configuré : ${WAVE_PAYMENT_LINK}`)

  // 3) Recalcul des montants des réservations existantes
  const reservations = await db.reservation.findMany()
  let updated = 0
  for (const r of reservations) {
    const hours = Math.max((toMinutes(r.endTime, true) - toMinutes(r.startTime)) / 60, 0)
    await db.reservation.update({
      where: { id: r.id },
      data: {
        amount: Math.round(hours * 25000),
        depositAmount: computeDeposit(hours),
      },
    })
    updated++
  }
  console.log(`✅ ${updated} réservation(s) recalculée(s) (total + acompte).`)
}

main()
  .catch((error) => {
    console.error('❌ Échec de la migration :', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
