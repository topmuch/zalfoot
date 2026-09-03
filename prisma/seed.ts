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
  console.log('🌱 Seed Zalspor…')

  // Purge
  await db.session.deleteMany()
  await db.reservation.deleteMany()
  await db.calendarEvent.deleteMany()
  await db.facility.deleteMany()
  await db.admin.deleteMany()

  // Administrateurs — admin par défaut (compte de démo affiché sur la page de connexion)
  await db.admin.create({
    data: {
      name: 'Awa Diop',
      email: 'admin@zalspor.com',
      passwordHash: hashPassword('admin123'),
      role: 'SUPER_ADMIN',
      phone: '+221 77 123 45 67',
    },
  })

  await db.admin.create({
    data: {
      name: 'Moussa Traoré',
      email: 'moussa@zalspor.com',
      passwordHash: hashPassword('zalspor123'),
      role: 'ADMIN',
      phone: '+221 76 987 65 43',
    },
  })

  // Installations sportives
  const facilities = await Promise.all(
    [
      {
        name: 'Terrain de Football — ZALSPOR Arena',
        type: 'FOOTBALL',
        description: 'Terrain en gazon synthétique dernière génération, éclairage nocturne, vestiaires.',
        pricePerHour: 15000,
        capacity: 22,
      },
      {
        name: 'Court de Tennis n°1',
        type: 'TENNIS',
        description: 'Court en béton poreux (green set), filet réglementaire, raquettes en location.',
        pricePerHour: 8000,
        capacity: 4,
      },
      {
        name: 'Gymnase Basket — Salle A',
        type: 'BASKETBALL',
        description: 'Parquet sportif homologué FIBA, 2 paniers, tribunes de 200 places.',
        pricePerHour: 10000,
        capacity: 14,
      },
      {
        name: 'Padel Center — Court vitré',
        type: 'PADEL',
        description: 'Court vitré panoramique, gazon synthétique, location de palas.',
        pricePerHour: 12000,
        capacity: 4,
      },
      {
        name: 'Salle de Fitness & Musculation',
        type: 'GYM',
        description: '150 m² équipés, coaching personnalisé, ouverte de 6h à 22h.',
        pricePerHour: 5000,
        capacity: 30,
      },
      {
        name: 'Piscine Olympique 25 m',
        type: 'PISCINE',
        description: 'Bassin 6 couloirs chauffé, maître-nageur présent à chaque séance.',
        pricePerHour: 6000,
        capacity: 20,
      },
    ].map((data) => db.facility.create({ data })),
  )

  // Réservations d'exemple
  const [football, tennis, basket, padel, gym, piscine] = facilities

  const reservationsData: Array<{
    customerName: string
    customerEmail?: string
    customerPhone?: string
    facilityId: string
    date: string
    startTime: string
    endTime: string
    status: string
    notes?: string
    source: string
  }> = [
    { customerName: 'ASC Jaraaf', customerEmail: 'contact@jaraaf.sn', customerPhone: '+221 77 111 22 33', facilityId: football.id, date: daysFromNow(0), startTime: '18:00', endTime: '20:00', status: 'CONFIRMED', notes: 'Match amical de Ligue 1', source: 'PUBLIC' },
    { customerName: 'Fatou Ndiaye', customerEmail: 'fatou.nd@gmail.com', customerPhone: '+221 78 222 33 44', facilityId: tennis.id, date: daysFromNow(0), startTime: '10:00', endTime: '11:00', status: 'CONFIRMED', source: 'PUBLIC' },
    { customerName: 'Team Dakar Basket', customerPhone: '+221 77 333 44 55', facilityId: basket.id, date: daysFromNow(1), startTime: '19:00', endTime: '21:00', status: 'PENDING', notes: 'En attente du versement de l\'acompte', source: 'PUBLIC' },
    { customerName: 'Ibrahima Sow', customerEmail: 'i.sow@outlook.com', facilityId: padel.id, date: daysFromNow(1), startTime: '17:00', endTime: '18:00', status: 'CONFIRMED', source: 'PUBLIC' },
    { customerName: 'Groupe Fitness Matin', facilityId: gym.id, date: daysFromNow(2), startTime: '07:00', endTime: '08:00', status: 'CONFIRMED', notes: 'Cours collectif animé par le coach', source: 'ADMIN' },
    { customerName: 'Club Natation Espoirs', customerEmail: 'natation@espoirs.sn', facilityId: piscine.id, date: daysFromNow(3), startTime: '16:00', endTime: '17:30', status: 'PENDING', source: 'PUBLIC' },
    { customerName: 'Ousmane Ba', customerPhone: '+221 76 555 66 77', facilityId: football.id, date: daysFromNow(4), startTime: '20:00', endTime: '22:00', status: 'CONFIRMED', source: 'PUBLIC' },
    { customerName: 'Coupe Padel Amis', facilityId: padel.id, date: daysFromNow(5), startTime: '14:00', endTime: '18:00', status: 'CONFIRMED', notes: 'Tournoi amateur 8 équipes', source: 'ADMIN' },
    { customerName: 'Mariama Sy', customerEmail: 'm.sy@gmail.com', facilityId: tennis.id, date: daysFromNow(-1), startTime: '15:00', endTime: '16:00', status: 'CANCELLED', notes: 'Annulé par le client (météo)', source: 'PUBLIC' },
    { customerName: 'Lycée Kennedy — EPS', customerEmail: 'eps@kennedy.edu', facilityId: basket.id, date: daysFromNow(-2), startTime: '09:00', endTime: '11:00', status: 'CONFIRMED', notes: 'Cours d\'EPS, facture mensuelle', source: 'ADMIN' },
  ] as any[]

  for (const r of reservationsData) {
    await db.reservation.create({ data: r })
  }

  // Événements du calendrier
  const eventsData = [
    { title: 'Entraînement FC Zalspor', description: 'Séance hebdomadaire de l\'équipe résidence.', type: 'ENTRAINEMENT', facilityId: football.id, date: daysFromNow(0), startTime: '08:00', endTime: '10:00' },
    { title: 'Maintenance gazon synthétique', description: 'Brossage et remplissage granulats — terrain fermé.', type: 'MAINTENANCE', facilityId: football.id, date: daysFromNow(2), startTime: '06:00', endTime: '12:00' },
    { title: 'Tournoi de Padel — Coupe Zalspor', description: 'Phase finale, 8 paires qualifiées. Public bienvenu.', type: 'EVENEMENT', facilityId: padel.id, date: daysFromNow(5), startTime: '14:00', endTime: '20:00' },
    { title: 'Cours collectif Aquagym', description: 'Animation par notre maître-nageuse Aïssatou.', type: 'ENTRAINEMENT', facilityId: piscine.id, date: daysFromNow(1), startTime: '11:00', endTime: '12:00' },
    { title: 'Ouverture exceptionnelle nuit', description: 'La salle de fitness est ouverte jusqu\'à minuit.', type: 'DISPONIBILITE', facilityId: gym.id, date: daysFromNow(3), startTime: '20:00', endTime: '23:59' },
    { title: 'Stage détection jeunes', description: 'Détection U15 en partenariat avec la fédération.', type: 'EVENEMENT', facilityId: basket.id, date: daysFromNow(7), startTime: '09:00', endTime: '16:00' },
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
  console.log('👤 Admin de démo : admin@zalspor.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed échoué :', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
