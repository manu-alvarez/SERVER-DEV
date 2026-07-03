"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle,
  Clock,
  DollarSign,
  HardDrive,
  Loader2,
  MapPin,
  Route,
  Search,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { use, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const validIds = ["V67391281", "V67391291", "V67391301", "V67391311", "V67391321"];

const expedienteData = {
  id: "V67391281",
  description: "Fuga de agua en tubería del baño - Reparación urgente",
  notes:
    "Piso 3° - Humedad en pared medianera. El cliente reporta pérdida constante de agua desde hace 2 días.",
  status: "Completado",
  locality: "Lardero",
  activity: "Fontanería",
  address: "C/ Mayor 23, 3°B",
  policy: "MAPFRE 12345678",
  phone: "*** *** ***",
  assignedAt: "2026-06-04 08:30",
  completedAt: "2026-06-04 08:42",

  aiAnalysis: {
    confidence: 0.97,
    reasoning:
      "La descripción indica fuga activa en tubería embebida en pared del baño. Requiere apertura de pared (cala) para acceso a la tubería. Se clasifica como exclusión con cala (YYDDDYT + XADDD2T). Desplazamiento desde Logrono a Lardero: 4.5km (<20km, no aplica recargo). Material: tubería PEX 20mm + accesorios de conexión.",
    codes: [
      {
        code: "YYDDDYT",
        description: "Exclusión - Trabajo de apertura y cierre",
        price: "42.50 €",
        type: "primary",
      },
      {
        code: "XADDD2T",
        description: "Con cala - Suplemento por apertura en pared",
        price: "30.00 €",
        type: "secondary",
      },
      {
        code: "SMDDDIT",
        description: "Material fuera de tarifa",
        price: "45.00 €",
        type: "material",
      },
    ],
    questions: [
      { q: "¿Reutiliza grupo grifería?", a: "No" },
      { q: "¿Requiere andamio?", a: "No" },
      { q: "¿Trabajo en festivo?", a: "No" },
    ],
    displacement: {
      km: 0,
      amount: "0.00 €",
      reason: "Distancia < 20 km (Logrono → Lardero: 4.5 km)",
    },
  },

  timeline: [
    { action: "Expediente asignado", time: "08:30", icon: Clock },
    { action: "Análisis IA completado", time: "08:31", icon: Brain },
    { action: "Formulario rellenado", time: "08:32", icon: HardDrive },
    { action: "Confirmación humana", time: "08:42", icon: CheckCircle },
  ],
};

export default function ExpedienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reporting, setReporting] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  if (!validIds.includes(id)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24"
      >
        <Search className="h-16 w-16 text-muted-foreground/30" />
        <h1 className="mt-6 text-2xl font-bold">Expediente no encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          El ID &ldquo;{id}&rdquo; no existe en el sistema
        </p>
        <Link href="/expedientes">
          <Button className="mt-6">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Volver a expedientes
          </Button>
        </Link>
      </motion.div>
    );
  }

  const exp = expedienteData;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 } as const,
    },
  } as const;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Link
          href="/expedientes"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver a expedientes
        </Link>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Expediente {id}</h1>
            <Badge variant="success">✓ Completado</Badge>
          </div>
          <p className="mt-1 text-muted-foreground">{exp.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setReporting(true)}>
            {reporting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-1.5 h-4 w-4" />
            )}
            {reporting ? "Enviando..." : "Reportar Error"}
          </Button>
          <Button
            onClick={() => {
              setReprocessing(true);
              setTimeout(() => setReprocessing(false), 2500);
            }}
          >
            {reprocessing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Wrench className="mr-1.5 h-4 w-4" />
            )}
            {reprocessing ? "Reprocesando..." : "Reprocesar"}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>Análisis de Inteligencia Artificial</CardTitle>
            </div>
            <CardDescription>
              Confianza del análisis:{" "}
              <span className="font-semibold text-success">
                {(exp.aiAnalysis.confidence * 100).toFixed(0)}%
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <p className="text-sm leading-relaxed text-foreground/80">
                {exp.aiAnalysis.reasoning}
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Códigos de Tarifa Aplicados
              </h4>
              <div className="space-y-2">
                {exp.aiAnalysis.codes.map((code) => (
                  <motion.div
                    key={code.code}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between rounded-xl border border-border/20 bg-muted/10 p-3 transition-colors hover:border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          code.type === "primary"
                            ? "default"
                            : code.type === "secondary"
                              ? "secondary"
                              : "warning"
                        }
                      >
                        {code.type === "primary"
                          ? "Principal"
                          : code.type === "secondary"
                            ? "Secundario"
                            : "Material"}
                      </Badge>
                      <div>
                        <span className="font-mono text-sm font-medium text-primary">
                          {code.code}
                        </span>
                        <p className="text-xs text-muted-foreground">{code.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{code.price}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Preguntas del Formulario
              </h4>
              <div className="space-y-2">
                {exp.aiAnalysis.questions.map((qa) => (
                  <div
                    key={qa.q}
                    className="flex items-center justify-between rounded-lg border border-border/10 bg-muted/5 px-4 py-2.5"
                  >
                    <span className="text-sm text-muted-foreground">{qa.q}</span>
                    <Badge variant="outline">{qa.a}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Desplazamiento</h4>
              <div className="flex items-center gap-3 rounded-xl border border-border/20 bg-muted/10 p-3">
                <Route className="h-5 w-5 text-secondary" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {exp.aiAnalysis.displacement.km} km — {exp.aiAnalysis.displacement.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {exp.aiAnalysis.displacement.reason}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Actividad", value: exp.activity, icon: Wrench },
                { label: "Localidad", value: exp.locality, icon: MapPin },
                { label: "Dirección", value: exp.address, icon: MapPin },
                { label: "Asignado", value: exp.assignedAt, icon: Clock },
                { label: "Completado", value: exp.completedAt, icon: Clock },
              ].map((info) => (
                <div key={info.label} className="flex items-center gap-2.5">
                  <info.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    <p className="truncate text-sm font-medium text-foreground">{info.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Línea de Tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {exp.timeline.map((event, idx) => (
                  <div key={event.action} className="relative flex gap-3 pb-4 last:pb-0">
                    {idx < exp.timeline.length - 1 && (
                      <div className="absolute left-[11px] top-5 h-full w-px bg-border" />
                    )}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <event.icon className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{event.action}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Totales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Mano de obra
                </span>
                <span className="text-sm font-semibold text-foreground">72.50 €</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HardDrive className="h-4 w-4 text-warning" />
                  Materiales
                </span>
                <span className="text-sm font-semibold text-foreground">45.00 €</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Route className="h-4 w-4 text-secondary" />
                  Desplazamiento
                </span>
                <span className="text-sm font-semibold text-foreground">0.00 €</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-lg font-bold text-gradient">117.50 €</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-center pb-8">
        <div className="glass-strong inline-flex items-center gap-3 rounded-2xl px-6 py-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <span className="text-sm text-foreground/80">
            Expediente procesado correctamente —{" "}
            <span className="font-semibold text-success">12 min</span> de inicio a fin
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
