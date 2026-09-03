import { db } from '@/lib/db'

/**
 * Réglages de la plateforme (model Setting clé/valeur).
 * Gérés depuis l'onglet « Paramètres » du dashboard administrateur.
 */

export const SETTING_KEYS = {
  wavePaymentLink: 'wave_payment_link',
  siteName: 'site_name',
  siteLogo: 'site_logo',
  seoTitle: 'seo_title',
  seoDescription: 'seo_description',
  seoKeywords: 'seo_keywords',
  notificationEmail: 'notification_email',
  emailNotificationsEnabled: 'email_notifications_enabled',
  smtpHost: 'smtp_host',
  smtpPort: 'smtp_port',
  smtpUser: 'smtp_user',
  smtpPassword: 'smtp_password',
  smtpSecure: 'smtp_secure',
  smtpFrom: 'smtp_from',
} as const

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]

/** Réglages accessibles sans authentification (identité publique du site). */
export type PublicSettings = {
  siteName: string
  siteLogo: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  wavePaymentLink: string | null
}

/** Réglages complets (dashboard, auth requise). */
export type FullSettings = PublicSettings & {
  notificationEmail: string
  emailNotificationsEnabled: boolean
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPassword: string
  smtpSecure: boolean
  smtpFrom: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PATH_REGEX = /^\/[\w\-./]+$/
export const SITE_NAME_MAX = 60
export const SEO_TITLE_MAX = 70
export const SEO_DESCRIPTION_MAX = 320
export const SEO_KEYWORDS_MAX = 400

/** Lit toutes les clés de réglages en base (map clé → valeur). */
export async function getSettingsMap(): Promise<Map<string, string>> {
  const rows = await db.setting.findMany()
  return new Map(rows.map((r) => [r.key, r.value]))
}

function boolSetting(map: Map<string, string>, key: string): boolean {
  return map.get(key) === 'true'
}

/** Sous-ensemble public (identité du site, SEO, lien Wave). */
export async function getPublicSettings(): Promise<PublicSettings> {
  const map = await getSettingsMap()
  return {
    siteName: map.get(SETTING_KEYS.siteName) || 'Zalfoot',
    siteLogo: map.get(SETTING_KEYS.siteLogo) || null,
    seoTitle: map.get(SETTING_KEYS.seoTitle) || null,
    seoDescription: map.get(SETTING_KEYS.seoDescription) || null,
    seoKeywords: map.get(SETTING_KEYS.seoKeywords) || null,
    wavePaymentLink: map.get(SETTING_KEYS.wavePaymentLink) || null,
  }
}

/** Réglages complets (réservés au dashboard). */
export async function getFullSettings(): Promise<FullSettings> {
  const map = await getSettingsMap()
  return {
    siteName: map.get(SETTING_KEYS.siteName) || 'Zalfoot',
    siteLogo: map.get(SETTING_KEYS.siteLogo) || null,
    seoTitle: map.get(SETTING_KEYS.seoTitle) || null,
    seoDescription: map.get(SETTING_KEYS.seoDescription) || null,
    seoKeywords: map.get(SETTING_KEYS.seoKeywords) || null,
    wavePaymentLink: map.get(SETTING_KEYS.wavePaymentLink) || null,
    notificationEmail: map.get(SETTING_KEYS.notificationEmail) || '',
    emailNotificationsEnabled: boolSetting(map, SETTING_KEYS.emailNotificationsEnabled),
    smtpHost: map.get(SETTING_KEYS.smtpHost) || '',
    smtpPort: map.get(SETTING_KEYS.smtpPort) || '',
    smtpUser: map.get(SETTING_KEYS.smtpUser) || '',
    smtpPassword: map.get(SETTING_KEYS.smtpPassword) || '',
    smtpSecure: boolSetting(map, SETTING_KEYS.smtpSecure),
    smtpFrom: map.get(SETTING_KEYS.smtpFrom) || '',
  }
}

/** Validation d'un champ de réglages (retourne l'erreur ou null si valide). */
export function validateSetting(key: string, value: string): string | null {
  switch (key) {
    case SETTING_KEYS.siteName:
      if (value.length > SITE_NAME_MAX) return `Le nom est trop long (${SITE_NAME_MAX} caractères maximum).`
      break
    case SETTING_KEYS.seoTitle:
      if (value.length > SEO_TITLE_MAX) return `Le titre SEO est trop long (${SEO_TITLE_MAX} caractères maximum).`
      break
    case SETTING_KEYS.seoDescription:
      if (value.length > SEO_DESCRIPTION_MAX)
        return `La description SEO est trop longue (${SEO_DESCRIPTION_MAX} caractères maximum).`
      break
    case SETTING_KEYS.seoKeywords:
      if (value.length > SEO_KEYWORDS_MAX) return `Les mots-clés sont trop longs (${SEO_KEYWORDS_MAX} caractères maximum).`
      break
    case SETTING_KEYS.siteLogo:
      if (value && !PATH_REGEX.test(value)) return 'Chemin de logo invalide.'
      break
    case SETTING_KEYS.notificationEmail:
    case SETTING_KEYS.smtpFrom:
      if (value && !EMAIL_REGEX.test(value) && !/^.+<.+@.+\..+>$/.test(value))
        return 'Adresse e-mail invalide.'
      break
    case SETTING_KEYS.smtpPort:
      if (value && !/^\d{1,5}$/.test(value)) return 'Port SMTP invalide.'
      break
    case SETTING_KEYS.wavePaymentLink:
      if (value && !/^https?:\/\//i.test(value)) return 'Le lien Wave doit commencer par https://.'
      if (value.length > 500) return 'Le lien Wave est trop long (500 caractères maximum).'
      break
    case SETTING_KEYS.emailNotificationsEnabled:
    case SETTING_KEYS.smtpSecure:
      if (value !== 'true' && value !== 'false') return 'Valeur booléenne invalide.'
      break
    default:
      return 'Réglage inconnu.'
  }
  return null
}
