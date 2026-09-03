'use client'

import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, ApiError, setToken } from './api'
import { Brand } from './brand'
import { ThemeToggle } from './theme-toggle'
import type { Admin } from './types'

export function AdminLogin({
  onBack,
  onSuccess,
}: {
  onBack: () => void
  onSuccess: (admin: Admin) => void
}) {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await apiFetch<{ token: string; admin: Admin }>('/api/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password },
      })
      setToken(result.token)
      toast({
        title: `Bienvenue, ${result.admin.name.split(' ')[0]} 👋`,
        description: 'Connexion réussie au dashboard Zalfoot.',
      })
      onSuccess(result.admin)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Connexion impossible. Réessayez.'
      toast({ title: 'Connexion échouée', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20">
      <header className="border-b bg-background/85 backdrop-blur">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brand size={80} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Retour au site</span>
              <span className="sm:hidden">Retour</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-7" />
            </span>
            <CardTitle className="text-2xl">Espace administrateur</CardTitle>
            <CardDescription>Connectez-vous pour accéder au dashboard de gestion.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="login-email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="vous@exemple.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                {submitting ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-background/60 py-4 text-center text-xs text-muted-foreground">
        Zalfoot © {new Date().getFullYear()} — Location de terrains de football à l&apos;heure
      </footer>
    </div>
  )
}
