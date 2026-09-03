import nodemailer from 'nodemailer'
import { formatDateFr } from '@/components/zalspor/types'
import { getFullSettings, SETTING_KEYS } from '@/lib/settings'

/**
 * Notifications e-mail des commandes (nouvelles réservations).
 * SMTP configurable dans l'onglet « Paramètres » du dashboard.
 * Toutes les fonctions sont sûres : elles n'établissent une connexion
 * que si les réglages sont complets et n'échouent jamais bruyamment.
 */

const CONNECTION_TIMEOUT_MS = 8000

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

/** SMTP configuré ? (hôte + port + expéditeur) */
export function isSmtpConfigured(smtp: { smtpHost: string; smtpPort: string; smtpFrom: string }): boolean {
  return Boolean(smtp.smtpHost.trim() && smtp.smtpPort.trim() && smtp.smtpFrom.trim())
}

function buildTransport(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    connectionTimeout: CONNECTION_TIMEOUT_MS,
  })
}

/** Envoie un e-mail de test à l'adresse de notification (bouton « Tester »). */
export async function sendTestEmail(siteName: string): Promise<{ ok: true; to: string }> {
  const settings = await getFullSettings()
  if (!settings.emailNotificationsEnabled) {
    throw new Error('Les notifications e-mail sont désactivées.')
  }
  if (!settings.notificationEmail) {
    throw new Error("Aucune adresse de réception n'est configurée.")
  }
  if (!isSmtpConfigured(settings)) {
    throw new Error('SMTP incomplet : renseignez au minimum hôte, port et expéditeur.')
  }

  const transport = buildTransport({
    host: settings.smtpHost,
    port: Number(settings.smtpPort) || 587,
    secure: settings.smtpSecure,
    user: settings.smtpUser,
    pass: settings.smtpPassword,
    from: settings.smtpFrom,
  })

  await transport.sendMail({
    from: settings.smtpFrom,
    to: settings.notificationEmail,
    subject: `[${siteName}] E-mail de test`,
    text: `Ceci est un e-mail de test envoyé depuis les paramètres de ${siteName}.\nSi vous le lisez, la configuration SMTP fonctionne.`,
    html: `<p>Ceci est un <strong>e-mail de test</strong> envoyé depuis les paramètres de <strong>${siteName}</strong>.</p><p>Si vous le lisez, la configuration SMTP fonctionne. ✅</p>`,
  })

  return { ok: true, to: settings.notificationEmail }
}

type ReservationLike = {
  reference: string
  customerName: string
  customerPhone: string | null
  facility: { name: string } | null
  date: string
  startTime: string
  endTime: string
  amount: number | null
  depositAmount: number | null
  source: string
}

/** Notification « nouvelle commande » — appelée après chaque création de réservation. */
export async function sendReservationNotification(reservation: ReservationLike): Promise<boolean> {
  try {
    const settings = await getFullSettings()
    if (!settings.emailNotificationsEnabled || !settings.notificationEmail) return false
    if (!isSmtpConfigured(settings)) return false

    const transport = buildTransport({
      host: settings.smtpHost,
      port: Number(settings.smtpPort) || 587,
      secure: settings.smtpSecure,
      user: settings.smtpUser,
      pass: settings.smtpPassword,
      from: settings.smtpFrom,
    })

    const siteName = settings.siteName || 'Zalfoot'
    const total = reservation.amount != null ? `${reservation.amount.toLocaleString('fr-FR')} FCFA` : '—'
    const deposit =
      reservation.depositAmount != null ? `${reservation.depositAmount.toLocaleString('fr-FR')} FCFA` : '—'

    await transport.sendMail({
      from: settings.smtpFrom,
      to: settings.notificationEmail,
      subject: `🎾 [${siteName}] Nouvelle réservation — ${reservation.customerName} · ${formatDateFr(reservation.date)} ${reservation.startTime}`,
      text: [
        `Nouvelle réservation reçue sur ${siteName} :`,
        '',
        `Client : ${reservation.customerName}`,
        `Téléphone : ${reservation.customerPhone ?? '—'}`,
        `Terrain : ${reservation.facility?.name ?? '—'}`,
        `Date : ${formatDateFr(reservation.date)}`,
        `Créneau : ${reservation.startTime} – ${reservation.endTime}`,
        `Total : ${total}`,
        `Acompte : ${deposit}`,
        `Référence : ${reservation.reference}`,
        `Source : ${reservation.source === 'ADMIN' ? 'Créée par un administrateur' : 'Site web (client)'}`,
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #059669;">🎾 Nouvelle réservation — ${siteName}</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 10px; color: #666;">Client</td><td style="padding: 6px 10px;"><strong>${reservation.customerName}</strong></td></tr>
            <tr style="background: #f6f8f6;"><td style="padding: 6px 10px; color: #666;">Téléphone</td><td style="padding: 6px 10px;">${reservation.customerPhone ?? '—'}</td></tr>
            <tr><td style="padding: 6px 10px; color: #666;">Terrain</td><td style="padding: 6px 10px;">${reservation.facility?.name ?? '—'}</td></tr>
            <tr style="background: #f6f8f6;"><td style="padding: 6px 10px; color: #666;">Date</td><td style="padding: 6px 10px;">${formatDateFr(reservation.date)}</td></tr>
            <tr><td style="padding: 6px 10px; color: #666;">Créneau</td><td style="padding: 6px 10px;"><strong>${reservation.startTime} – ${reservation.endTime}</strong></td></tr>
            <tr style="background: #f6f8f6;"><td style="padding: 6px 10px; color: #666;">Total</td><td style="padding: 6px 10px;">${total}</td></tr>
            <tr><td style="padding: 6px 10px; color: #666;">Acompte à encaisser</td><td style="padding: 6px 10px;">${deposit}</td></tr>
            <tr style="background: #f6f8f6;"><td style="padding: 6px 10px; color: #666;">Référence</td><td style="padding: 6px 10px; font-family: monospace;">${reservation.reference}</td></tr>
            <tr><td style="padding: 6px 10px; color: #666;">Source</td><td style="padding: 6px 10px;">${reservation.source === 'ADMIN' ? 'Administrateur' : 'Site web (client)'}</td></tr>
          </table>
          <p style="color: #999; font-size: 12px; margin-top: 16px;">Consultez le dashboard pour confirmer ou annuler cette réservation.</p>
        </div>`,
    })
    return true
  } catch (error) {
    console.warn('[email] notification échouée :', error instanceof Error ? error.message : error)
    return false
  }
}

// Ré-export pratique pour les routes API
export { SETTING_KEYS }
