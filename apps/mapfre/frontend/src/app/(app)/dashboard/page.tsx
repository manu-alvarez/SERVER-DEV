"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stat = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: typeof FileText;
  color: string;
};
const stats: Stat[] = [
  {
    label: "Expedientes Hoy",
    value: "12",
    change: "+24%",
    trend: "up",
    icon: FileText,
    color: "primary",
  },
  {
    label: "Procesados",
    value: "11",
    change: "91.7%",
    trend: "up",
    icon: CheckCircle2,
    color: "success",
  },
  {
    label: "Tiempo Medio",
    value: "1m 24s",
    change: "-32%",
    trend: "down",
    icon: Clock,
    color: "info",
  },
  {
    label: "Errores de código",
    value: "0",
    change: "0%",
    trend: "neutral",
    icon: CheckCircle2,
    color: "warning",
  },
];

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    ring: "ring-primary/20",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
    ring: "ring-success/20",
  },
  info: {
    bg: "bg-info/10",
    text: "text-info",
    ring: "ring-info/20",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    ring: "ring-warning/20",
  },
};

const recentExpedientes = [
  {
    id: "V67391281",
    description: "Fuga de agua en tubería del baño",
    status: "Completado",
    time: "12 min",
    code: "YYDDDYT + XADDD2T",
    cost: "117.50 €",
    duration: "12 min",
  },
  {
    id: "V67391291",
    description: "Rotura de tubería en cocina",
    status: "Completado",
    time: "35 min",
    code: "YYDDDYT + XADDD1T",
    cost: "85.00 €",
    duration: "8 min",
  },
  {
    id: "V67391301",
    description: "Cambio de grifo monomando",
    status: "Pendiente",
    time: "1h",
    code: "JEDDD1T",
    cost: "70.00 €",
    duration: "—",
  },
];

const tarifaDistribution = [
  { code: "YYDDDYT + XADDD2T", name: "Exclusión con cala", count: 4, pct: 36, amount: "170.00 €" },
  { code: "YYDDDYT + XADDD1T", name: "Exclusión sin cala", count: 3, pct: 27, amount: "97.50 €" },
  { code: "JEDDD1T", name: "Sustitución grifería", count: 2, pct: 18, amount: "70.00 €" },
  { code: "FADDD8T", name: "Desplazamiento >20km", count: 2, pct: 18, amount: "15.00 €" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.2 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
} as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default function DashboardPage() {
  const [processing, setProcessing] = useState(false);
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 noise"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1">
              <Zap className="h-2.5 w-2.5" />
              Sesión activa
            </Badge>
            <span className="text-xs text-muted-foreground">Jueves 4 de junio · 2026</span>
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            {greeting()}, <span className="text-gradient">Pedro</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Tienes 1 expediente pendiente y 11 partes procesados esta mañana.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => {
            setProcessing(true);
            setTimeout(() => setProcessing(false), 2000);
          }}
        >
          {processing ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-4 w-4" />
          )}
          {processing ? "Procesando..." : "Procesar pendientes"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const colors = colorMap[stat.color];
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className="group"
            >
              <Card className="relative overflow-hidden p-6">
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
                <div className="relative flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.bg} ring-1 ${colors.ring}`}
                  >
                    <stat.icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  {stat.change && (
                    <div
                      className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        stat.trend === "up"
                          ? "bg-success/10 text-success"
                          : stat.trend === "down"
                            ? "bg-danger/10 text-danger"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : stat.trend === "down" ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : null}
                      {stat.change}
                    </div>
                  )}
                </div>
                <div className="relative mt-5">
                  <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Expedientes Recientes</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Últimos 30 minutos</p>
                </div>
                <Link href="/expedientes">
                  <Button variant="ghost" size="sm">
                    Ver todos
                    <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentExpedientes.map((exp, _idx) => (
                <motion.a
                  key={exp.id}
                  href={`/expedientes/${exp.id}`}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition-all hover:border-border/40 hover:bg-muted/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">{exp.id}</span>
                      <Badge variant={exp.status === "Completado" ? "success" : "warning"}>
                        {exp.status === "Completado" ? "✓" : "●"} {exp.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                      {exp.description}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {exp.code} · {exp.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{exp.cost}</p>
                    <p className="text-[10px] text-muted-foreground">{exp.duration}</p>
                  </div>
                </motion.a>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Distribución de Códigos</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Tarifa MAPFRE La Rioja 2026</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tarifaDistribution.map((item, idx) => (
                <motion.div
                  key={item.code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {item.code}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-medium text-foreground">{item.amount}</span>
                      <span className="text-muted-foreground">{item.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{
                        duration: 1.2,
                        delay: 0.6 + idx * 0.1,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-400"
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Resumen de tarifa</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Códigos aplicados hoy</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
                <span className="text-xs text-muted-foreground">Total importe</span>
                <span className="text-sm font-bold text-foreground">352.50 €</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-info/5 px-3 py-2">
                <span className="text-xs text-muted-foreground">Partes procesados</span>
                <span className="text-sm font-bold text-foreground">11</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-success/5 px-3 py-2">
                <span className="text-xs text-muted-foreground">Sin errores</span>
                <span className="text-sm font-bold text-foreground">0</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Próximos Pasos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  icon: AlertTriangle,
                  color: "text-warning",
                  text: "1 expediente pendiente de revisar",
                  time: "V67391301",
                },
                {
                  icon: Activity,
                  color: "text-info",
                  text: "Sincronización InfoCol completada",
                  time: "hace 2 min",
                },
                {
                  icon: CheckCircle2,
                  color: "text-success",
                  text: "Backup local cifrado realizado",
                  time: "hace 1h",
                },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/40`}
                  >
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.text}</p>
                    <p className="text-[10px] text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
