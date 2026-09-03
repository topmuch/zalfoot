import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return isoDate(d)
}

async function main() {
  console.log('🌱 Seed Zalfoot — terrains de football à l’heure…')

  // Purge
  await db.session.deleteMany()
  await db.reservation.deleteMany()
  await db.calendarEvent.deleteMany()
  await db.facility.deleteMany()
  await db.admin.deleteMany()
  await db.setting.deleteMany()

  // Administrateurs — admin par défaut (compte de démo affiché sur la page de connexion)
  await db.admin.create({
    data: {
      name: 'Awa Diop',
      email: 'admin@zalfoot.com',
      passwordHash: hashPassword('admin123'),
      role: 'SUPER_ADMIN',
      phone: '+221 77 123 45 67',
    },
  })

  await db.admin.create({
    data: {
      name: 'Moussa Traoré',
      email: 'moussa@zalfoot.com',
      passwordHash: hashPassword('zalfoot123'),
      role: 'ADMIN',
      phone: '+221 76 987 65 43',
    },
  })

  // Terrains de football (uniquement — location à l'heure)
  const [terrainA, terrainB, five] = await Promise.all(
    [
      {
        name: 'Terrain A — Gazon synthétique 11v11',
        type: 'FOOTBALL',
        description:
          'Grand terrain 11v11 en gazon synthétique dernière génération, éclairage nocturne, buts avec filets, vestiaires et douches.',
        pricePerHour: 15000,
        capacity: 22,
      },
      {
        name: 'Terrain B — Gazon naturel 11v11',
        type: 'FOOTBALL',
        description:
          'Pelouse naturelle entretenue, idéale pour les matchs amicaux et les entraînements d’équipe.',
        pricePerHour: 12000,
        capacity: 22,
      },
      {
        name: 'Terrain C — Five 5v5 éclairé',
        type: 'FOOTBALL',
        description:
          'Mini-terrain 5v5 en gazon synthétique, filets de hauteur, parfait pour les matchs entre amis le soir.',
        pricePerHour: 8000,
        capacity: 12,
      },
    ].map((data) => db.facility.create({ data })),
  )

  // Réservations d'exemple (créneaux 08:00 → minuit, paiement Wave)
  const reservationsData: Array<{
    customerName: string
    customerEmail?: string
    customerPhone?: string
    facilityId: string
    date: string
    startTime: string
    endTime: string
    status: string
    amount?: number
    paymentStatus?: string
    paymentMethod?: string
    notes?: string
    source: string
  }> = [
    { customerName: 'ASC Jaraaf', customerEmail: 'contact@jaraaf.sn', customerPhone: '+221 77 111 22 33', facilityId: terrainA.id, date: daysFromNow(0), startTime: '18:00', endTime: '20:00', status: 'CONFIRMED', amount: 30000, paymentStatus: 'PAID', paymentMethod: 'WAVE', notes: 'Match amical de Ligue 1', source: 'PUBLIC' },
    { customerName: 'Groupe des Yoff', customerPhone: '+221 78 222 33 44', facilityId: five.id, date: daysFromNow(0), startTime: '20:00', endTime: '21:00', status: 'CONFIRMED', amount: 8000, paymentStatus: 'PAID', paymentMethod: 'WAVE', notes: 'Five hebdomadaire entre voisins', source: 'PUBLIC' },
    { customerName: 'Team Dakar United', customerPhone: '+221 77 333 44 55', facilityId: terrainA.id, date: daysFromNow(1), startTime: '19:00', endTime: '21:00', status: 'PENDING', amount: 30000, paymentStatus: 'UNPAID', paymentMethod: 'WAVE', notes: 'En attente du paiement Wave', source: 'PUBLIC' },
    { customerName: 'Ibrahima Sow', customerEmail: 'i.sow@outlook.com', customerPhone: '+221 76 111 88 99', facilityId: terrainB.id, date: daysFromNow(1), startTime: '17:00', endTime: '18:00', status: 'CONFIRMED', amount: 12000, paymentStatus: 'PAID', paymentMethod: 'WAVE', source: 'PUBLIC' },
    { customerName: 'FC Ouakam Espoirs', customerEmail: 'espoirs@ouakam.sn', customerPhone: '+221 77 222 99 88', facilityId: terrainB.id, date: daysFromNow(2), startTime: '16:00', endTime: '18:00', status: 'CONFIRMED', amount: 24000, paymentStatus: 'PAID', paymentMethod: 'ON_SITE', notes: 'Entraînement des U17', source: 'ADMIN' },
    { customerName: 'Les amis de Parcelles', customerPhone: '+221 78 456 12 34', facilityId: five.id, date: daysFromNow(3), startTime: '21:00', endTime: '23:00', status: 'PENDING', amount: 16000, paymentStatus: 'UNPAID', paymentMethod: 'WAVE', source: 'PUBLIC' },
    { customerName: 'Ousmane Ba', customerPhone: '+221 76 555 66 77', facilityId: terrainA.id, date: daysFromNow(4), startTime: '20:00', endTime: '22:00', status: 'CONFIRMED', amount: 30000, paymentStatus: 'PAID', paymentMethod: 'WAVE', source: 'PUBLIC' },
    { customerName: 'Tournoi corporatif Sonatel', customerPhone: '+221 33 800 00 00', facilityId: terrainB.id, date: daysFromNow(5), startTime: '14:00', endTime: '18:00', status: 'CONFIRMED', amount: 48000, paymentStatus: 'PAID', paymentMethod: 'ON_SITE', notes: 'Tournoi inter-services, 4 équipes', source: 'ADMIN' },
    { customerName: 'Mariama Sy', customerEmail: 'm.sy@gmail.com', customerPhone: '+221 77 654 32 10', facilityId: five.id, date: daysFromNow(-1), startTime: '19:00', endTime: '20:00', status: 'CANCELLED', notes: 'Annulé par le client (pluie)', source: 'PUBLIC' },
    { customerName: 'Lycée Kennedy — EPS', customerEmail: 'eps@kennedy.edu', facilityId: terrainA.id, date: daysFromNow(-2), startTime: '09:00', endTime: '11:00', status: 'CONFIRMED', amount: 30000, paymentStatus: 'PAID', paymentMethod: 'ON_SITE', notes: 'Cours d’EPS, facture mensuelle', source: 'ADMIN' },
  ]

  for (const r of reservationsData) {
    await db.reservation.create({ data: r })
  }

  // Événements du calendrier
  const eventsData = [
    { title: 'Entraînement FC Zalfoot', description: 'Séance hebdomadaire de l’équipe résidence.', type: 'ENTRAINEMENT', facilityId: terrainA.id, date: daysFromNow(0), startTime: '08:00', endTime: '10:00' },
    { title: 'Maintenance gazon — Terrain B', description: 'Tonte et regarnissage : terrain fermé le matin.', type: 'MAINTENANCE', facilityId: terrainB.id, date: daysFromNow(2), startTime: '06:00', endTime: '12:00' },
    { title: 'Tournoi amical du week-end', description: 'Phase finale du tournoi amical 8 équipes. Public bienvenu.', type: 'EVENEMENT', facilityId: terrainA.id, date: daysFromNow(5), startTime: '14:00', endTime: '20:00' },
    { title: 'Stage détection jeunes U15', description: 'Détection en partenariat avec la fédération régionale.', type: 'EVENEMENT', facilityId: terrainB.id, date: daysFromNow(7), startTime: '09:00', endTime: '16:00' },
    { title: 'Nuit du five', description: 'Le terrain C reste ouvert jusqu’à 23 h pour les nocturnes.', type: 'DISPONIBILITE', facilityId: five.id, date: daysFromNow(3), startTime: '20:00', endTime: '23:00' },
    { title: 'Match reporté — Integrales', description: 'Créneau bloqué pour un match de championnat reporté.', type: 'EVENEMENT', facilityId: terrainA.id, date: daysFromNow(1), startTime: '15:00', endTime: '17:00' },
  ]

  for (const e of eventsData) {
    await db.calendarEvent.create({ data: e })
  }

  const counts = {
    admins: await db.admin.count(),
    facilities: await db.facility.count(),
    reservations: await db.reservation.count(),
    events: await db.calendarEvent.count(),
  }
  console.log('✅ Seed terminé :', counts)
  console.log('👤 Admin de démo : admin@zalfoot.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed échoué :', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
