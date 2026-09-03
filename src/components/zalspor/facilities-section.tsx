'use client'

import { useState } from 'react'
import {
  Activity,
  Dumbbell,
  Flame,
  Footprints,
  Loader2,
  Plus,
  Power,
  Trophy,
  Users,
  Waves,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, ApiError } from './api'
import { FACILITY_TYPE_LABELS, formatPrice, type Facility } from './types'

const FACILITY_ICONS: Record<string, typeof Trophy> = {
  FOOTBALL: Trophy,
  TENNIS: Activity,
  BASKETBALL: Flame,
  PADEL: Zap,
  GYM: Dumbbell,
  PISCINE: Waves,
  MULTISPORT: Footprints,
}

type NewFacilityForm = {
  name: string
  type: string
  description: string
  pricePerHour: string
  capacity: string
}

function AddFacilityDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<NewFacilityForm>({
    name: '',
    type: 'MULTISPORT',
    description: '',
    pricePerHour: '10000',
    capacity: '10',
  })
  const [submitting, setSubmitting] = useState(false)
  const set = (patch: Partial<NewFacilityForm>) => setForm((prev) => ({ ...prev, ...patch }))

  const canSubmit = form.name.trim().length > 2 && Number(form.pricePerHour) >= 0 && Number(form.capacity) > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const result = await apiFetch<{ facility: Facility }>('/api/facilities', {
        method: 'POST',
        auth: true,
        body: {
          name: form.name.trim(),
          type: form.type,
          description: form.description.trim() || null,
          pricePerHour: Number(form.pricePerHour),
          capacity: Number(form.capacity),
        },
      })
      toast({ title: 'Installation créée ✅', description: `${result.facility.name} est disponible à la réservation.` })
      set({ name: '', description: '' })
      onCreated()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Création impossible',
        description: error instanceof ApiError ? error.message : 'Réessayez.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="size-5 text-primary" />
            Ajouter une installation
          </DialogTitle>
          <DialogDescription>Un nouveau terrain ou une nouvelle salle réservable.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fac-name">Nom *</Label>
            <Input
              id="fac-name"
              placeholder="Ex. Court de tennis n°2"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              required
              minLength={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="fac-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => set({ type: v })}>
                <SelectTrigger id="fac-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FACILITY_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fac-capacity">Capacité</Label>
              <Input
                id="fac-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set({ capacity: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fac-price">Tarif horaire (FCFA) *</Label>
            <Input
              id="fac-price"
              type="number"
              min={0}
              step={500}
              value={form.pricePerHour}
              onChange={(e) => set({ pricePerHour: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fac-desc">Description</Label>
            <Textarea
              id="fac-desc"
              rows={2}
              placeholder="Équipements, particularités…"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Créer l&apos;installation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FacilitiesSection({
  facilities,
  loading,
  onRefresh,
  onUnauthorized,
}: {
  facilities: Facility[]
  loading: boolean
  onRefresh: () => void
  onUnauthorized: () => void
}) {
  const { toast } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function toggleActive(facility: Facility) {
    setBusyId(facility.id)
    try {
      await apiFetch(`/api/facilities/${facility.id}`, {
        method: 'PATCH',
        auth: true,
        body: { active: !facility.active },
      })
      toast({
        title: facility.active ? 'Installation désactivée' : 'Installation réactivée',
        description: facility.name,
      })
      onRefresh()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      toast({
        title: 'Action impossible',
        description: error instanceof ApiError ? error.message : 'Réessayez.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Terrains & salles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {facilities.filter((f) => f.active).length} actives sur {facilities.length}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="lg" className="shadow-sm">
          <Plus className="size-4" />
          Ajouter une installation
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin mr-2" />
          Chargement des installations…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-[560px] overflow-y-auto zalspor-scroll pr-1">
          {facilities.map((f) => {
            const Icon = FACILITY_ICONS[f.type] ?? Trophy
            return (
              <Card key={f.id} className={busyId === f.id ? 'opacity-50' : undefined}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <Badge variant={f.active ? 'secondary' : 'destructive'}>
                      {f.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-snug mt-2">{f.name}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-8">{f.description}</p>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="font-semibold">{formatPrice(f.pricePerHour)}/h</span>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Users className="size-3.5" /> {f.capacity} pers.
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => toggleActive(f)}
                  >
                    <Power className="size-4" />
                    {f.active ? 'Désactiver' : 'Réactiver'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AddFacilityDialog open={addOpen} onOpenChange={setAddOpen} onCreated={onRefresh} />
    </div>
  )
}
