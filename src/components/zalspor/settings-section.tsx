'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BadgeCheck,
  Bell,
  Loader2,
  Mail,
  Search,
  Settings as SettingsIcon,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { ApiError, apiFetch, getToken } from './api'
import { invalidateSiteIdentity } from './site-settings'
import type { FullSettings } from './types'

/** Section « Paramètres » : identité (nom + logo), SEO et notifications e-mail. */
export function SettingsSection({ onUnauthorized }: { onUnauthorized: () => void }) {
  const { toast } = useToast()
  const [settings, setSettings] = useState<FullSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingCard, setSavingCard] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [testing, setTesting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<FullSettings>('/api/settings?full=1', { auth: true })
      .then((data) => {
        if (!cancelled) setSettings(data)
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) onUnauthorized()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [onUnauthorized])

  const set = (patch: Partial<FullSettings>) => setSettings((prev) => (prev ? { ...prev, ...patch } : prev))

  /** Enregistre les clés d'une carte (PUT partiel). */
  async function saveCard(card: string, payload: Record<string, string>) {
    if (!settings || savingCard) return
    setSavingCard(card)
    try {
      const updated = await apiFetch<FullSettings>('/api/settings', {
        method: 'PUT',
        auth: true,
        body: payload,
      })
      setSettings(updated)
      if (card === 'identity') invalidateSiteIdentity()
      toast({ title: 'Paramètres enregistrés ✅' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      toast({
        title: 'Enregistrement impossible',
        description: error instanceof ApiError ? error.message : 'Réessayez.',
        variant: 'destructive',
      })
    } finally {
      setSavingCard(null)
    }
  }

  /** Téléverse un nouveau logo (FormData). */
  async function uploadLogo(file: File) {
    if (uploading) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const token = getToken()
      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      })
      const data = (await res.json().catch(() => null)) as { path?: string; error?: string } | null
      if (!res.ok || !data?.path) {
        throw new ApiError(data?.error ?? 'Téléversement impossible.', res.status)
      }
      set({ siteLogo: data.path })
      invalidateSiteIdentity()
      toast({ title: 'Logo mis à jour ✅', description: 'Il est visible immédiatement sur tout le site.' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      toast({
        title: 'Téléversement impossible',
        description: error instanceof Error ? error.message : 'Réessayez.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /** Envoie un e-mail de test avec les réglages enregistrés en base. */
  async function sendTest() {
    if (testing) return
    setTesting(true)
    try {
      const result = await apiFetch<{ to: string }>('/api/settings/test-email', {
        method: 'POST',
        auth: true,
      })
      toast({ title: 'E-mail de test envoyé ✅', description: `Envoyé à ${result.to}.` })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      toast({
        title: 'Envoi impossible',
        description: error instanceof ApiError ? error.message : 'Réessayez.',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin mr-2" />
        Chargement des paramètres…
      </div>
    )
  }

  const smtpReady = Boolean(settings.smtpHost.trim() && settings.smtpPort.trim() && settings.smtpFrom.trim())
  const seoTitlePreview = settings.seoTitle?.trim()
    ? settings.siteName
      ? `${settings.siteName} — ${settings.seoTitle}`
      : settings.seoTitle
    : `${settings.siteName || 'Zalfoot'} — Location de terrains de football à l'heure`

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Paramètres</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Identité du site, référencement (SEO) et notifications e-mail des commandes.
        </p>
      </div>

      {/* ===== Identité : nom + logo ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="size-5 text-primary" />
            Nom & logo du site
          </CardTitle>
          <CardDescription>Nom affiché dans le titre du navigateur et les e-mails, et logo du site.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2 max-w-md">
            <Label htmlFor="site-name">Nom du site</Label>
            <Input
              id="site-name"
              placeholder="Zalfoot"
              maxLength={60}
              value={settings.siteName}
              onChange={(e) => set({ siteName: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Logo</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex size-24 items-center justify-center rounded-xl border bg-muted/40 overflow-hidden shrink-0">
                <img
                  src={settings.siteLogo || '/logo.webp'}
                  alt="Logo actuel"
                  className="max-h-20 max-w-20 object-contain"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {uploading ? 'Téléversement…' : 'Changer le logo'}
                  </Button>
                  {settings.siteLogo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading || savingCard === 'identity'}
                      onClick={() => {
                        set({ siteLogo: null })
                        saveCard('identity', { site_logo: '' })
                      }}
                    >
                      <X className="size-4" />
                      Réinitialiser
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP ou SVG · 2 Mo max · appliqué immédiatement partout.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadLogo(file)
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={savingCard === 'identity'}
              onClick={() => saveCard('identity', { site_name: settings.siteName })}
            >
              {savingCard === 'identity' ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
              Enregistrer le nom
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== SEO ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5 text-primary" />
            Référencement (SEO)
          </CardTitle>
          <CardDescription>
            Titre et description affichés par Google. Appliqués après rechargement de la page.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo-title">Titre SEO</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.seoTitle ?? '').length}/70
              </span>
            </div>
            <Input
              id="seo-title"
              placeholder="Location de terrains de football à l'heure"
              maxLength={70}
              value={settings.seoTitle ?? ''}
              onChange={(e) => set({ seoTitle: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo-description">Description</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.seoDescription ?? '').length}/320
              </span>
            </div>
            <Textarea
              id="seo-description"
              placeholder="Réservez votre terrain de football en gazon synthétique…"
              rows={3}
              maxLength={320}
              value={settings.seoDescription ?? ''}
              onChange={(e) => set({ seoDescription: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo-keywords">Mots-clés (séparés par des virgules)</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.seoKeywords ?? '').length}/400
              </span>
            </div>
            <Input
              id="seo-keywords"
              placeholder="football, terrain, gazon synthétique, Kaolack, Mbour…"
              maxLength={400}
              value={settings.seoKeywords ?? ''}
              onChange={(e) => set({ seoKeywords: e.target.value })}
            />
          </div>

          {/* Aperçu façon résultat Google */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-2">Aperçu dans les résultats de recherche</p>
            <p className="text-emerald-700 dark:text-emerald-400 text-sm">{seoTitlePreview.slice(0, 70)}</p>
            <p className="text-xs text-muted-foreground">
              zalfoot.sn · Croisement Kaolack - Mbour
            </p>
            <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">
              {(settings.seoDescription ?? '').trim() ||
                "Réservez votre terrain de football en gazon synthétique à l'heure : horaires 08h–01h du matin, 25 000 FCFA/h, acompte Wave."}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={savingCard === 'seo'}
              onClick={() =>
                saveCard('seo', {
                  seo_title: settings.seoTitle ?? '',
                  seo_description: settings.seoDescription ?? '',
                  seo_keywords: settings.seoKeywords ?? '',
                })
              }
            >
              {savingCard === 'seo' ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
              Enregistrer le SEO
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Notifications e-mail ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            Notifications e-mail de commande
          </CardTitle>
          <CardDescription>
            Recevez un e-mail à chaque nouvelle réservation client (avec créneau, montant et acompte).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Mail className="size-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Activer les notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Un e-mail est envoyé à chaque réservation enregistrée.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.emailNotificationsEnabled}
              onCheckedChange={(checked) => set({ emailNotificationsEnabled: checked })}
              aria-label="Activer les notifications e-mail"
            />
          </div>

          <div className="grid gap-2 max-w-md">
            <Label htmlFor="notif-email">Adresse de réception des commandes</Label>
            <Input
              id="notif-email"
              type="email"
              placeholder="commandes@zalfoot.sn"
              value={settings.notificationEmail}
              onChange={(e) => set({ notificationEmail: e.target.value })}
            />
          </div>

          {/* SMTP */}
          <div className="rounded-xl border p-4 grid gap-4 bg-muted/20">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-semibold">Serveur SMTP d&apos;envoi</p>
              <Badge variant={smtpReady ? 'default' : 'outline'} className="gap-1.5">
                {smtpReady ? <BadgeCheck className="size-3" /> : null}
                {smtpReady ? 'Configuré' : 'À compléter'}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="smtp-host">Hôte SMTP</Label>
                <Input
                  id="smtp-host"
                  placeholder="smtp.example.com"
                  value={settings.smtpHost}
                  onChange={(e) => set({ smtpHost: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  placeholder="587"
                  inputMode="numeric"
                  value={settings.smtpPort}
                  onChange={(e) => set({ smtpPort: e.target.value.replace(/\D/g, '') })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtp-from">Expéditeur</Label>
                <Input
                  id="smtp-from"
                  type="email"
                  placeholder="no-reply@zalfoot.sn"
                  value={settings.smtpFrom}
                  onChange={(e) => set({ smtpFrom: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtp-user">Utilisateur</Label>
                <Input
                  id="smtp-user"
                  placeholder="no-reply@zalfoot.sn"
                  autoComplete="off"
                  value={settings.smtpUser}
                  onChange={(e) => set({ smtpUser: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtp-password">Mot de passe</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={settings.smtpPassword}
                  onChange={(e) => set({ smtpPassword: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 h-10">
                <span className="text-sm text-muted-foreground">Connexion SSL/TLS (port 465)</span>
                <Switch
                  checked={settings.smtpSecure}
                  onCheckedChange={(checked) => set({ smtpSecure: checked })}
                  aria-label="Connexion SSL"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Exemples : Brevo (smtp-relay.brevo.com:587), Gmail (smtp.gmail.com:587 avec mot de passe
              d&apos;application), OVH, Hostinger… Laissez le mot de passe vide pour un relais sans authentification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              disabled={testing}
              onClick={sendTest}
            >
              {testing ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              {testing ? 'Envoi…' : 'Envoyer un e-mail de test'}
            </Button>
            <Button
              disabled={savingCard === 'email'}
              onClick={() =>
                saveCard('email', {
                  notification_email: settings.notificationEmail,
                  email_notifications_enabled: settings.emailNotificationsEnabled ? 'true' : 'false',
                  smtp_host: settings.smtpHost,
                  smtp_port: settings.smtpPort,
                  smtp_user: settings.smtpUser,
                  smtp_password: settings.smtpPassword,
                  smtp_from: settings.smtpFrom,
                  smtp_secure: settings.smtpSecure ? 'true' : 'false',
                })
              }
            >
              {savingCard === 'email' ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
              Enregistrer les e-mails
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            « Envoyer un e-mail de test » utilise les réglages enregistrés : cliquez d&apos;abord sur « Enregistrer les
            e-mails ».
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
