/**
 * Migration ponctuelle — terrains 100 % gazon synthétique :
 * renomme et redécrit les terrains pour refléter le gazon synthétique
 * (plus aucune mention de pelouse naturelle) + cohérence de l'événement
 * de maintenance du calendrier.
 *
 * Exécution : bun run scripts/update-terrains-synthetique.ts
 */
import { db } from '@/lib/db'

const UPDATES: Array<{ match: string; name: string; description: string }> = [
  {
    match: 'Terrain A — Gazon synthétique 11v11',
    name: 'Terrain A — Gazon synthétique 11v11',
    description:
      'Grand terrain 11v11 en gazon synthétique dernière génération : surface stable par tous les temps, éclairage nocturne, buts avec filets, vestiaires et douches.',
  },
  {
    match: 'Terrain B — Gazon naturel 11v11',
    name: 'Terrain B — Gazon synthétique 11v11',
    description:
      'Grand terrain 11v11 en gazon synthétique dernière génération : drainage rapide, jeu propre même en saison des pluies, buts avec filets et éclairage nocturne.',
  },
  {
    match: 'Terrain C — Five 5v5 éclairé',
    name: 'Terrain C — Gazon synthétique 5v5',
    description:
      'Mini-terrain 5v5 en gazon synthétique dernière génération, filets de hauteur, éclairage nocturne — parfait pour les matchs entre amis le soir.',
  },
]

async function main() {
  console.log('🌱 Terrains 100 % gazon synthétique…')

  for (const update of UPDATES) {
    const facility = await db.facility.findFirst({ where: { name: { startsWith: update.match.split(' — ')[0] } } })
    if (!facility) {
      console.warn(`⚠️ Terrain non trouvé pour « ${update.match} » — ignoré.`)
      continue
    }
    await db.facility.update({
      where: { id: facility.id },
      data: { name: update.name, description: update.description },
    })
    console.log(`✅ ${facility.name} → ${update.name}`)
  }

  // Cohérence : la maintenance ne « tond » plus une pelouse naturelle
  const maintenance = await db.calendarEvent.findFirst({
    where: { title: { contains: 'Maintenance gazon' } },
  })
  if (maintenance) {
    await db.calendarEvent.update({
      where: { id: maintenance.id },
      data: {
        description: 'Brossage et désinfection des fibres du gazon synthétique : terrain fermé le matin.',
      },
    })
    console.log('✅ Événement « Maintenance gazon » mis à jour (fibres synthétiques).')
  }

  const facilities = await db.facility.findMany({ orderBy: { name: 'asc' } })
  console.log('📋 Terrains en base :')
  for (const f of facilities) {
    console.log(`   • ${f.name} — ${f.pricePerHour} FCFA/h — ${f.capacity} joueurs`)
  }
}

main()
  .catch((error) => {
    console.error('❌ Échec de la migration :', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
