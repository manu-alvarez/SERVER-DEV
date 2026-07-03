"use client";

import { ArrowRight, ChevronRight, Clock, FileText, Shield, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 110, damping: 18 } },
} as const;

const features = [
  {
    icon: FileText,
    title: "Códigos de tarifa automáticos",
    text: "Cada parte se analiza contra la tarifa MAPFRE de La Rioja 2026 y se asignan los códigos correctos al instante.",
    iconBg: "from-primary/30 via-primary/10 to-transparent text-primary",
    iconRing: "ring-primary/20",
  },
  {
    icon: Shield,
    title: "100% local, 0% riesgo",
    text: "Tus credenciales viven en tu llavero. Los datos se procesan en local, nunca salen de tu equipo.",
    iconBg: "from-info/30 via-info/10 to-transparent text-info",
    iconRing: "ring-info/20",
  },
  {
    icon: Zap,
    title: "De 2 min a 30 seg",
    text: "Lo que antes era un proceso manual de varios minutos, ahora es una confirmación de un click.",
    iconBg: "from-secondary/30 via-secondary/10 to-transparent text-secondary",
    iconRing: "ring-secondary/20",
  },
] as const;

const stats = [
  { value: "12", label: "Partes procesados hoy", change: "+24% vs ayer" },
  { value: "1m 24s", label: "Tiempo medio por parte", change: "−32% vs antes" },
  { value: "0", label: "Errores de código", change: "Últimos 30 días" },
  { value: "97%", label: "Precisión de códigos", change: "Tarifa MAPFRE 2026" },
] as const;

export default function Home() {
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="portal-card relative overflow-hidden"
      >
        <div className="portal-card-inner glass-card p-6 sm:p-10 lg:p-14"
        style={{
          backgroundImage:
            "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 50%), radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--secondary) 8%, transparent) 0%, transparent 50%)",
        }}
        >
        <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-primary/30 blur-[100px] animate-pulse-glow" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-secondary/20 blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.03]" />
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-primary/10" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]"
        >
          <div>
            <motion.div variants={itemVariants}>
              <Badge variant="default" className="gap-1.5 shadow-lg shadow-primary/20">
                <Sparkles className="h-3 w-3" />
                Beta · Junio 2026
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-5 text-3xl font-bold leading-[1.08] tracking-tight sm:mt-7 sm:text-4xl lg:text-[3.5rem] lg:leading-[1.02]"
            >
              Automatiza tus partes{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, #e60028 0%, #ff4d6a 35%, #ffb3c1 55%, #ff4d6a 75%, #e60028 100%)",
                  backgroundSize: "200% 100%",
                  animation: "gradient-shift 5s ease-in-out infinite",
                }}
              >
                MAPFRE
              </span>{" "}
              con{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, #e60028 0%, #ff4d6a 35%, #ffb3c1 55%, #ff4d6a 75%, #e60028 100%)",
                  backgroundSize: "200% 100%",
                  animation: "gradient-shift 5s ease-in-out infinite",
                }}
              >
                IA
              </span>
              .
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              INFOCOL procesa los expedientes FIN del portal, aplica los códigos de tarifa correctos
              y rellena los formularios. Tú solo revisas y confirmas.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="portal-card inline-block" style={{ borderRadius: 30, padding: 2 }}>
                <Button
                  size="lg"
                  className="portal-card-inner px-6"
                  style={{
                    backgroundColor: "transparent", border: "none", color: "white"
                  }}
                >
                  Abrir Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/expedientes">
                <Button size="lg" variant="outline" className="px-6 backdrop-blur-xl">
                  Ver Expedientes
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                RGPD / LOPD compliant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-secondary">⌘</span>
                Open Source
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-info" />
                90% menos tiempo
              </span>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 blur-2xl" />
            <div className="glass relative overflow-hidden rounded-2xl border border-border/40 p-1 shadow-2xl shadow-primary/20">
              <div className="rounded-[14px] bg-gradient-to-br from-card/95 to-card/70 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-success shadow-sm shadow-success/50" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      En vivo · InfoCol
                    </span>
                  </div>
                  <Badge variant="success" className="font-mono">
                    V67391281
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      Descripción
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug">
                      Fuga de agua en tubería del baño
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-2.5 py-1.5 ring-1 ring-primary/20">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                      Códigos asignados
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {["YYDDDYT", "XADDD2T", "SMDDDIT"].map((c) => (
                      <span
                        key={c}
                        className="rounded-md bg-primary/15 px-2 py-1 font-mono text-[11px] font-semibold text-primary ring-1 ring-primary/20"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-t border-border/30 pt-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Mano de obra</p>
                      <p className="text-sm font-semibold tabular-nums">72.50 €</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Materiales</p>
                      <p className="text-sm font-semibold tabular-nums">45.00 €</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Desplazamiento</p>
                      <p className="text-sm font-semibold tabular-nums">0.00 €</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/30 pt-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                      <p className="text-xl font-bold tabular-nums text-foreground">117.50 €</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-semibold text-warning ring-1 ring-warning/20">
                      <Clock className="h-3 w-3" />
                      Esperando Aceptar manual
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -right-8 -z-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          </motion.div>
        </motion.div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid gap-4 sm:grid-cols-3"
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="portal-card"
          >
            <div className="portal-card-inner glass group rounded-2xl border border-border/30 p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.iconBg} ring-1 ${f.iconRing} backdrop-blur-xl`}
            >
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid gap-px overflow-hidden sm:grid-cols-4"
      >
        {stats.map((s) => (
          <div key={s.label} className="portal-card">
          <div className="portal-card-inner bg-card/60 p-5 transition-colors hover:bg-card/80">
            <p className="text-3xl font-bold tracking-tight tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs font-medium text-foreground">{s.label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{s.change}</p>
          </div>
          </div>
        ))}
      </motion.section>
    </div>
  );
}
