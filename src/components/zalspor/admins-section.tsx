'use client'

import { useState } from 'react'
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MoreHorizontal,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, ApiError } from './api'
import { formatDateTimeFr, type Admin } from './types'

type CreateAdminForm = {
  name: string
  email: string
  phone: string
  role: string
  password: string
  confirmPassword: string
}

const EMPTY_FORM: CreateAdminForm = {
  name: '',
  email: '',
  phone: '',
  role: 'ADMIN',
  password: '',
  confirmPassword: '',
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * Dialogue « Créer un administrateur ».
 * Ce bouton crée réellement le compte via POST /api/admins (hachage scrypt côté serveur).
 */
function CreateAdminDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<CreateAdminForm>(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CreateAdminForm, string>>>({})

  const set = (patch: Partial<CreateAdminForm>) => setForm((prev) => ({ ...prev, ...patch }))

  function validate(): boolean {
    const e: Partial<Record<keyof CreateAdminForm, string>> = {}
    if (form.name.trim().length < 2) e.name = 'Indiquez le nom complet (2 caractères minimum).'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Adresse e-mail invalide.'
    if (form.password.length < 6) e.password = 'Le mot de passe doit contenir au moins 6 caractères.'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Les deux mots de passe ne correspondent pas.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (submitting) return
    if (!validate()) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Corrigez les champs en rouge puis réessayez.',
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    try {
      const result = await apiFetch<{ admin: Admin }>('/api/admins', {
        method: 'POST',
        auth: true,
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          role: form.role,
          password: form.password,
        },
      })
      toast({
        title: 'Administrateur créé avec succès 🎉',
        description: `${result.admin.name} (${result.admin.email}) peut maintenant se connecter au dashboard.`,
      })
      setForm(EMPTY_FORM)
      setErrors({})
      onCreated()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Création impossible. Réessayez.'
      toast({ title: 'Échec de la création du compte', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setForm(EMPTY_FORM)
          setErrors({})
        }
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg zalspor-scroll max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="size-5 text-primary" />
            Créer un administrateur
          </DialogTitle>
          <DialogDescription>
            Le nouveau compte pourra se connecter immédiatement avec son e-mail et son mot de passe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="admin-name">Nom complet *</Label>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="admin-name"
                placeholder="Ex. Aïssatou Diallo"
                className={`pl-9 ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                aria-invalid={Boolean(errors.name)}
              />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="admin-email">E-mail *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="nouveau.admin@zalspor.com"
                  className={`pl-9 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-phone"
                  placeholder="+221 77 000 00 00"
                  className="pl-9"
                  value={form.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-role">Rôle</Label>
            <Select value={form.role} onValueChange={(v) => set({ role: v })}>
              <SelectTrigger id="admin-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="size-4" /> Administrateur
                  </span>
                </SelectItem>
                <SelectItem value="SUPER_ADMIN">
                  <span className="flex items-center gap-2">
                    <BadgeCheck className="size-4" /> Super administrateur
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Le super administrateur peut gérer les comptes et les installations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="admin-password">Mot de passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="6 caractères min."
                  className={`pl-9 pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  value={form.password}
                  onChange={(e) => set({ password: e.target.value })}
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-confirm">Confirmation *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Répétez le mot de passe"
                  className={`pl-9 ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  value={form.confirmPassword}
                  onChange={(e) => set({ confirmPassword: e.target.value })}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              {submitting ? 'Création…' : 'Créer le compte administrateur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminsSection({
  admins,
  currentAdmin,
  loading,
  onRefresh,
  onUnauthorized,
}: {
  admins: Admin[]
  currentAdmin: Admin
  loading: boolean
  onRefresh: () => void
  onUnauthorized: () => void
}) {
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const isSuperAdmin = currentAdmin.role === 'SUPER_ADMIN'

  async function toggleActive(admin: Admin) {
    setBusyId(admin.id)
    try {
      await apiFetch(`/api/admins/${admin.id}`, {
        method: 'PATCH',
        auth: true,
        body: { active: !admin.active },
      })
      toast({
        title: admin.active ? 'Compte désactivé' : 'Compte réactivé',
        description: `${admin.name} ${admin.active ? 'ne peut plus' : 'peut à nouveau'} se connecter.`,
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

  async function deleteAdmin(admin: Admin) {
    setBusyId(admin.id)
    try {
      await apiFetch(`/api/admins/${admin.id}`, { method: 'DELETE', auth: true })
      toast({ title: 'Compte supprimé', description: `${admin.name} a été retiré des administrateurs.` })
      onRefresh()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      toast({
        title: 'Suppression impossible',
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
          <h2 className="text-2xl font-extrabold tracking-tight">Administrateurs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {admins.length} compte{admins.length > 1 ? 's' : ''} avec accès au dashboard
          </p>
        </div>

        {/* ===== Bouton CRÉER UN ADMINISTRATEUR (fonctionnel) ===== */}
        <Button onClick={() => setCreateOpen(true)} size="lg" className="shadow-sm" disabled={!isSuperAdmin}>
          <UserPlus className="size-4" />
          Créer un administrateur
        </Button>
      </div>

      {!isSuperAdmin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Seul un super administrateur peut créer ou gérer des comptes administrateurs.
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Comptes existants</CardTitle>
          <CardDescription>Gérez les accès à l&apos;espace d&apos;administration Zalspor.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="size-6 animate-spin mr-2" />
              Chargement des administrateurs…
            </div>
          ) : (
            <div className="max-h-[440px] overflow-y-auto zalspor-scroll border-t">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead>Administrateur</TableHead>
                    <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Créé le</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id} className={busyId === admin.id ? 'opacity-50' : undefined}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 border">
                            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                              {initials(admin.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium flex items-center gap-1.5 flex-wrap">
                              {admin.name}
                              {admin.id === currentAdmin.id && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  Vous
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{admin.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{admin.phone ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={admin.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                          {admin.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.active ? 'outline' : 'destructive'}>
                          {admin.active ? 'Actif' : 'Désactivé'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDateTimeFr(admin.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isSuperAdmin && admin.id !== currentAdmin.id ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8" aria-label="Actions">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => toggleActive(admin)}>
                                <ShieldCheck className="size-4" />
                                {admin.active ? 'Désactiver' : 'Réactiver'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteAdmin(admin)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-4" />
                                Supprimer le compte
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={onRefresh} />
    </div>
  )
}
