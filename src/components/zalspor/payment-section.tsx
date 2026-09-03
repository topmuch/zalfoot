'use client'

import { useEffect, useState } from 'react'
import {
  Eraser,
  ExternalLink,
  Link2,
  Loader2,
  Save,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, ApiError } from './api'

const LINK_MAX_LENGTH = 500
const LINK_PATTERN = /^https?:\/\//i

/** Tronque un lien trop long pour l'affichage (~60 caractères). */
function truncateLink(link: string, max = 60): string {
  return link.length > max ? `${link.slice(0, max - 1)}…` : link
}

/** Validation côté client du lien Wave (vide = désactivation autorisée). */
function validateLink(value: string): string | null {
  const link = value.trim()
  if (!link) return null
  if (!LINK_PATTERN.test(link)) return 'Le lien doit commencer par http:// ou https://.'
  if (link.length > LINK_MAX_LENGTH) return `Le lien est trop long (${LINK_MAX_LENGTH} caractères maximum).`
  return null
}

/**
 * Section « Paiement Wave » : configuration du lien de paiement Wave Business
 * utilisé par les clients lors de la réservation.
 */
export function PaymentSection({ onUnauthorized }: { onUnauthorized: () => void }) {
  const { toast } = useToast()
  const [link, setLink] = useState('')
  const [savedLink, setSavedLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Chargement du réglage existant (route publique)
  useEffect(() => {
    let cancelled = false
    apiFetch<{ wavePaymentLink: string | null }>('/api/settings')
      .then((data) => {
        if (cancelled) return
        setSavedLink(data.wavePaymentLink)
        setLink(data.wavePaymentLink ?? '')
      })
      .catch(() => {
        if (cancelled) return
        toast({
          title: 'Réglages indisponibles',
          description: 'Impossible de charger le lien de paiement Wave.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [toast])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (saving || loading) return
    const validationError = validateLink(link)
    setError(validationError)
    if (validationError) return
    setSaving(true)
    try {
      const result = await apiFetch<{ wavePaymentLink: string | null }>('/api/settings', {
        method: 'PUT',
        auth: true,
        body: { wavePaymentLink: link.trim() },
      })
      setSavedLink(result.wavePaymentLink)
      setError(null)
      toast({
        title: 'Lien Wave enregistré',
        description: result.wavePaymentLink
          ? 'Le paiement Wave est actif pour les nouvelles réservations.'
          : 'Aucun lien enregistré : les clients paieront sur place.',
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onUnauthorized()
      const message = err instanceof ApiError ? err.message : 'Enregistrement impossible. Réessayez.'
      setError(message)
      toast({ title: 'Enregistrement impossible', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  /** Vide le champ et désactive le lien enregistré (chaîne vide côté API). */
  async function handleClear() {
    if (saving || loading) return
    setLink('')
    setError(null)
    if (!savedLink) return
    setSaving(true)
    try {
      await apiFetch<{ wavePaymentLink: string | null }>('/api/settings', {
        method: 'PUT',
        auth: true,
        body: { wavePaymentLink: '' },
      })
      setSavedLink(null)
      toast({
        title: 'Lien Wave désactivé',
        description: 'Les clients paieront sur place.',
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onUnauthorized()
      toast({
        title: 'Action impossible',
        description: err instanceof ApiError ? err.message : 'Réessayez.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Paiement Wave</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez le lien de paiement Wave Business utilisé par les clients lors de la réservation.
        </p>
      </div>

      {/* ===== État actuel ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            État du paiement en ligne
          </CardTitle>
          <CardDescription>Lien actuellement proposé aux clients lors de la réservation.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="size-4 animate-spin" />
              Chargement du réglage…
            </div>
          ) : savedLink ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <Badge className="border-transparent bg-emerald-600 text-white">Activé</Badge>
                <code className="text-xs font-mono text-muted-foreground break-all" title={savedLink}>
                  {truncateLink(savedLink)}
                </code>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => window.open(savedLink, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="size-4" />
                Ouvrir
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Badge variant="outline">Non configuré</Badge>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Collez le lien de paiement fourni par votre application Wave Business (onglet Paiements →
                Liens de paiement). Tant qu&apos;aucun lien n&apos;est enregistré, les clients réservent mais
                paient sur place.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Formulaire ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="size-5 text-primary" />
            Configuration du lien
          </CardTitle>
          <CardDescription>Enregistrez, testez ou désactivez le lien de paiement Wave.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="wave-link">Lien de paiement Wave Business</Label>
              <Input
                id="wave-link"
                type="text"
                inputMode="url"
                placeholder="https://pay.wave.com/..."
                value={link}
                onChange={(e) => {
                  setLink(e.target.value)
                  setError(null)
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'wave-link-error' : 'wave-link-help'}
                disabled={loading}
              />
              {error ? (
                <p id="wave-link-error" className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <p id="wave-link-help" className="text-xs text-muted-foreground leading-relaxed">
                Balises optionnelles remplacées automatiquement dans l&apos;URL lors de la redirection du
                client :{' '}
                <code className="font-mono text-foreground/80">{`{amount}`}</code> (montant en FCFA) et{' '}
                <code className="font-mono text-foreground/80">{`{reference}`}</code> (référence de la
                réservation) — ex.&nbsp;
                <code className="font-mono">https://pay.wave.com/m/xxxx/c/?amount={`{amount}`}</code>.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || loading}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              <Button type="button" variant="outline" onClick={handleClear} disabled={saving || loading}>
                <Eraser className="size-4" />
                Effacer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
