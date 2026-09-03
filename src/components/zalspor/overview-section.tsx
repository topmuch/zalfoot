'use client'

import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Hourglass,
  Plus,
  TrendingUp,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  PAYMENT_STATUS_META,
  RESERVATION_STATUS_META,
  formatDateFr,
  formatHourLabel,
  formatPrice,
  type Admin,
  type Facility,
  type Stats,
} from './types'

export function OverviewSection({
  stats,
  facilities,
  currentAdmin,
  onGoToReservations,
  onGoToCalendar,
  onGoToAdmins,
}: {
  stats: Stats | null
  facilities: Facility[]
  currentAdmin: Admin
  onGoToReservations: () => void
  onGoToCalendar: () => void
  onGoToAdmins: () => void
}) {
  const cards = [
    {
      title: 'Réservations totales',
      value: stats?.totalReservations ?? 0,
      icon: CalendarDays,
      hint: `${stats?.pendingReservations ?? 0} en attente`,
      action: onGoToReservations,
    },
    {
      title: 'Confirmées',
      value: stats?.confirmedReservations ?? 0,
      icon: CheckCircle2,
      hint: `${stats?.cancelledReservations ?? 0} annulées`,
      action: onGoToReservations,
    },
    {
      title: 'Revenus estimés',
      value: formatPrice(stats?.estimatedRevenue ?? 0),
      icon: CircleDollarSign,
      hint: `${stats?.unpaidReservations ?? 0} en attente d’acompte`,
      action: onGoToReservations,
    },
    {
      title: 'Acomptes encaissés',
      value: formatPrice(stats?.paidRevenue ?? 0),
      icon: Wallet,
      hint: 'acomptes Wave reçus (5 000 F/h)',
      action: onGoToReservations,
    },
    {
      title: 'Événements planifiés',
      value: stats?.totalEvents ?? 0,
      icon: Activity,
      hint: 'au calendrier',
      action: onGoToCalendar,
    },
    {
      title: 'Terrains actifs',
      value: stats?.activeFacilities ?? 0,
      icon: TrendingUp,
      hint: `${facilities.length} au total`,
      action: onGoToCalendar,
    },
    {
      title: 'Administrateurs',
      value: stats?.totalAdmins ?? 0,
      icon: ShieldCheck,
      hint: 'comptes actifs',
      action: onGoToAdmins,
    },
  ]

  const chartData = (stats?.daily ?? []).map((d) => ({
    jour: formatDateFr(d.date).replace(/\s\d{4}$/, '').replace(/^\w/, (c) => c.toUpperCase()),
    reservations: d.count,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">
          Bonjour {currentAdmin.name.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Voici l&apos;activité de Zalfoot — location de terrains de football à l&apos;heure.
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title} className="overflow-hidden group cursor-pointer" onClick={c.action}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="size-4" />
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-extrabold mt-3 leading-none">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{c.title}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Graphique */}
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Réservations des 14 derniers jours
            </CardTitle>
            <CardDescription>Volume des nouvelles demandes par jour.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                Aucune donnée pour le moment.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="resGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="jour"
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--card)',
                        fontSize: 12,
                      }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reservations"
                      name="Réservations"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#resGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prochaines réservations */}
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              Prochaines réservations
            </CardTitle>
            <CardDescription>Les créneaux à venir confirmés ou en attente.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-72 overflow-y-auto zalspor-scroll border-t">
              {(stats?.upcoming ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Aucune réservation à venir.
                </p>
              ) : (
                <ul className="divide-y">
                  {(stats?.upcoming ?? []).slice(0, 6).map((r) => {
                    const meta = RESERVATION_STATUS_META[r.status] ?? { label: r.status, variant: 'outline' as const }
                    const payMeta = PAYMENT_STATUS_META[r.paymentStatus] ?? {
                      label: r.paymentStatus,
                      variant: 'outline' as const,
                    }
                    return (
                      <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold leading-none">
                          <Hourglass className="size-3 mb-0.5" />
                          {r.startTime}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{r.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.facility?.name ?? '—'} · {formatDateFr(r.date)} · {r.startTime}–
                            {formatHourLabel(r.endTime)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          {r.paymentMethod ? (
                            <Badge
                              variant={payMeta.variant}
                              className="px-1.5 py-0 text-[10px] leading-4"
                            >
                              {payMeta.label}
                            </Badge>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accès rapides */}
      <Card>
        <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold flex items-center gap-2">
              <Users className="size-4 text-primary" /> Accès rapides
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez une réservation, un événement au calendrier ou créez un compte administrateur.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onGoToReservations}>
              <Plus className="size-4" />
              Réservation
            </Button>
            <Button variant="outline" onClick={onGoToCalendar}>
              <Plus className="size-4" />
              Événement
            </Button>
            <Button variant="outline" onClick={onGoToAdmins}>
              <ShieldCheck className="size-4" />
              Créer un admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
