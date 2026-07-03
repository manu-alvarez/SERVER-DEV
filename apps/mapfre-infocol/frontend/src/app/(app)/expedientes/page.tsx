"use client";

import {
  ArrowRight,
  ChevronDown,
  Download,
  Filter,
  Loader2,
  MapPin,
  Package,
  Route,
  Search,
  Wrench,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const expedientes = [
  {
    id: "V67391281",
    description: "Fuga de agua en tubería del baño - Reparación urgente",
    notes: "Piso 3° · Humedad en pared medianera",
    status: "Completado",
    locality: "Lardero",
    time: "12 min",
    codes: ["YYDDDYT", "XADDD2T"],
    displacement: "4.5 km",
    material: "45.00 €",
    cost: "117.50 €",
  },
  {
    id: "V67391291",
    description: "Rotura de tubería en cocina - Sustitución tramo",
    notes: "Bajo comercial · Acceso limitado",
    status: "Completado",
    locality: "Logroño",
    time: "35 min",
    codes: ["YYDDDYT", "XADDD1T"],
    displacement: "0 km",
    material: "120.00 €",
    cost: "85.00 €",
  },
  {
    id: "V67391301",
    description: "Cambio de grifo monomando lavabo",
    notes: "Cliente mayor · Revisión general",
    status: "Pendiente",
    locality: "Navarrete",
    time: "1h",
    codes: ["JEDDD1T"],
    displacement: "12 km",
    material: "35.00 €",
    cost: "70.00 €",
  },
  {
    id: "V67391311",
    description: "Reparación de cisterna - Sustitución mecanismo",
    notes: "Avería recurrente",
    status: "En Proceso",
    locality: "Logroño",
    time: "2h",
    codes: ["VBDDD1T"],
    displacement: "0 km",
    material: "25.00 €",
    cost: "50.00 €",
  },
  {
    id: "V67391321",
    description: "Desatasco fregadero cocina",
    notes: "Acumulación de grasa",
    status: "Pendiente",
    locality: "Alberite",
    time: "3h",
    codes: ["XADDD1T"],
    displacement: "8.5 km",
    material: "0.00 €",
    cost: "42.50 €",
  },
];

const statusVariant: Record<string, "success" | "warning" | "info"> = {
  Completado: "success",
  Pendiente: "warning",
  "En Proceso": "info",
};

const statusIcon: Record<string, string> = {
  Completado: "✓",
  Pendiente: "●",
  "En Proceso": "◐",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.15 },
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

export default function ExpedientesPage() {
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  const filtered = expedientes.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.id.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.locality.toLowerCase().includes(q) ||
      e.codes.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Expedientes</h1>
            <Badge variant="warning">
              {expedientes.filter((e) => e.status === "Pendiente").length} pendientes
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Cola de partes pendientes y procesados · Total {expedientes.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.alert("Exportación iniciada — CSV")}>
            <Download className="mr-1.5 h-4 w-4" />
            Exportar
          </Button>
          <Button
            onClick={() => {
              setProcessing(true);
              setTimeout(() => setProcessing(false), 2000);
            }}
          >
            {processing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-1.5 h-4 w-4" />
            )}
            {processing ? "Procesando..." : "Procesar todos"}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: expedientes.length, color: "text-foreground" },
          {
            label: "Completados",
            value: expedientes.filter((e) => e.status === "Completado").length,
            color: "text-success",
          },
          {
            label: "Pendientes",
            value: expedientes.filter((e) => e.status === "Pendiente").length,
            color: "text-warning",
          },
          {
            label: "En proceso",
            value: expedientes.filter((e) => e.status === "En Proceso").length,
            color: "text-info",
          },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-bold tracking-tight", s.color)}>{s.value}</p>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, descripción, localidad..."
            className="glass-subtle h-11 w-full rounded-xl border border-border/40 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <Button variant="outline" onClick={() => setSearch("")}>
          <Filter className="mr-1.5 h-4 w-4" />
          {search ? "Limpiar" : "Filtros"}
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 py-16">
            <Search className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              No se encontraron expedientes para &ldquo;{search}&rdquo;
            </p>
            <Button variant="link" onClick={() => setSearch("")} className="mt-1">
              Limpiar búsqueda
            </Button>
          </div>
        ) : (
          filtered.map((exp) => (
            <Link key={exp.id} href={`/expedientes/${exp.id}`}>
              <motion.div
                whileHover={{ scale: 1.005, y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="group glass relative overflow-hidden rounded-2xl border border-border/30 p-5 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">{exp.id}</span>
                      <Badge variant={statusVariant[exp.status]}>
                        {statusIcon[exp.status]} {exp.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">· {exp.time}</span>
                    </div>
                    <p className="mt-1.5 text-base font-semibold text-foreground">
                      {exp.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{exp.notes}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {exp.locality}
                      </span>
                      {exp.codes.map((code) => (
                        <span
                          key={code}
                          className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary"
                        >
                          {code}
                        </span>
                      ))}
                      {exp.displacement !== "0 km" && (
                        <span className="flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
                          <Route className="h-3 w-3" />
                          {exp.displacement}
                        </span>
                      )}
                      {parseFloat(exp.material) > 0 && (
                        <span className="flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                          <Package className="h-3 w-3" />
                          {exp.material}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-bold text-foreground">{exp.cost}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                    <ArrowRight className="ml-auto mt-2 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:text-primary group-hover:opacity-100" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
