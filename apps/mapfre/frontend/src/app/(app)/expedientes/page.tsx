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
import { motion, type Variants } from "motion/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useEffect, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- Types & Enums ---

export enum ExpedienteStatus {
  COMPLETADO = "Completado",
  PENDIENTE = "Pendiente",
  EN_PROCESO = "En Proceso",
}

export interface Expediente {
  id: string;
  description: string;
  notes: string;
  status: ExpedienteStatus;
  locality: string;
  time: string;
  codes: ReadonlyArray<string>;
  displacementKm: number;
  materialCost: number;
  totalCost: number;
}

// --- Constants & Mocks ---

const MOCK_EXPEDIENTES: ReadonlyArray<Expediente> = [
  {
    id: "V67391281",
    description: "Fuga de agua en tubería del baño - Reparación urgente",
    notes: "Piso 3° · Humedad en pared medianera",
    status: ExpedienteStatus.COMPLETADO,
    locality: "Lardero",
    time: "12 min",
    codes: ["YYDDDYT", "XADDD2T"],
    displacementKm: 4.5,
    materialCost: 45.0,
    totalCost: 117.5,
  },
  {
    id: "V67391291",
    description: "Rotura de tubería en cocina - Sustitución tramo",
    notes: "Bajo comercial · Acceso limitado",
    status: ExpedienteStatus.COMPLETADO,
    locality: "Logroño",
    time: "35 min",
    codes: ["YYDDDYT", "XADDD1T"],
    displacementKm: 0,
    materialCost: 120.0,
    totalCost: 85.0,
  },
  {
    id: "V67391301",
    description: "Cambio de grifo monomando lavabo",
    notes: "Cliente mayor · Revisión general",
    status: ExpedienteStatus.PENDIENTE,
    locality: "Navarrete",
    time: "1h",
    codes: ["JEDDD1T"],
    displacementKm: 12,
    materialCost: 35.0,
    totalCost: 70.0,
  },
  {
    id: "V67391311",
    description: "Reparación de cisterna - Sustitución mecanismo",
    notes: "Avería recurrente",
    status: ExpedienteStatus.EN_PROCESO,
    locality: "Logroño",
    time: "2h",
    codes: ["VBDDD1T"],
    displacementKm: 0,
    materialCost: 25.0,
    totalCost: 50.0,
  },
  {
    id: "V67391321",
    description: "Desatasco fregadero cocina",
    notes: "Acumulación de grasa",
    status: ExpedienteStatus.PENDIENTE,
    locality: "Alberite",
    time: "3h",
    codes: ["XADDD1T"],
    displacementKm: 8.5,
    materialCost: 0.0,
    totalCost: 42.5,
  },
];

const STATUS_CONFIG: Record<ExpedienteStatus, { variant: "success" | "warning" | "info"; icon: string }> = {
  [ExpedienteStatus.COMPLETADO]: { variant: "success", icon: "✓" },
  [ExpedienteStatus.PENDIENTE]: { variant: "warning", icon: "●" },
  [ExpedienteStatus.EN_PROCESO]: { variant: "info", icon: "◐" },
};

const formatCurrency = (value: number) => `${value.toFixed(2)} €`;
const formatDistance = (value: number) => `${value} km`;

const CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.15 },
  },
};

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

// --- Subcomponent with Search logic ---

function ExpedientesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);

  // Sync URL params to local state safely
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);

  // O(N) Single-pass stats computation
  const stats = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let processing = 0;

    for (let i = 0; i < MOCK_EXPEDIENTES.length; i++) {
      const status = MOCK_EXPEDIENTES[i].status;
      if (status === ExpedienteStatus.COMPLETADO) completed++;
      else if (status === ExpedienteStatus.PENDIENTE) pending++;
      else if (status === ExpedienteStatus.EN_PROCESO) processing++;
    }

    return { total: MOCK_EXPEDIENTES.length, completed, pending, processing };
  }, []);

  // O(N) Filter with memoization
  const filtered = useMemo(() => {
    const trimmedSearch = search.trim().toLowerCase();
    if (!trimmedSearch) return MOCK_EXPEDIENTES;

    return MOCK_EXPEDIENTES.filter((e) => {
      return (
        e.id.toLowerCase().includes(trimmedSearch) ||
        e.description.toLowerCase().includes(trimmedSearch) ||
        e.locality.toLowerCase().includes(trimmedSearch) ||
        e.codes.some((c) => c.toLowerCase().includes(trimmedSearch))
      );
    });
  }, [search]);

  // Event Handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    router.replace("/expedientes");
  }, [router]);

  const handleExport = useCallback(() => {
    // @todo: Replace with robust Toast notification API
    console.info("Exportación CSV iniciada");
  }, []);

  const handleProcessAll = useCallback(() => {
    if (processing) return;
    setProcessing(true);
    const timer = setTimeout(() => setProcessing(false), 2000);
    return () => clearTimeout(timer);
  }, [processing]);

  const STATS_CARDS = [
    { label: "Total", value: stats.total, color: "text-foreground" },
    { label: "Completados", value: stats.completed, color: "text-success" },
    { label: "Pendientes", value: stats.pending, color: "text-warning" },
    { label: "En proceso", value: stats.processing, color: "text-info" },
  ];

  return (
    <motion.div
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div
        variants={ITEM_VARIANTS}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Expedientes</h1>
            <Badge variant="warning">
              {stats.pending} pendientes
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Cola de partes pendientes y procesados · Total {stats.total}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} aria-label="Exportar expedientes a CSV">
            <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Exportar
          </Button>
          <Button onClick={handleProcessAll} disabled={processing} aria-label="Procesar todos los expedientes pendientes">
            {processing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Zap className="mr-1.5 h-4 w-4" aria-hidden="true" />
            )}
            {processing ? "Procesando..." : "Procesar todos"}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={ITEM_VARIANTS} className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="region" aria-label="Estadísticas de expedientes">
        {STATS_CARDS.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-bold tracking-tight", s.color)}>{s.value}</p>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={ITEM_VARIANTS} className="flex items-center gap-3">
        <div className="relative flex-1" role="search">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por ID, descripción, localidad..."
            aria-label="Buscar expedientes"
            className="glass-subtle h-11 w-full rounded-xl border border-border/40 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <Button variant="outline" onClick={handleClearSearch} aria-label={search ? "Limpiar filtros de búsqueda" : "Abrir filtros avanzados"}>
          <Filter className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {search ? "Limpiar" : "Filtros"}
          <ChevronDown className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </motion.div>

      <motion.div variants={ITEM_VARIANTS} className="space-y-2.5" role="list" aria-label="Lista de expedientes filtrados">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 py-16" role="status" aria-live="polite">
            <Search className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              No se encontraron expedientes para &ldquo;{search}&rdquo;
            </p>
            <Button variant="link" onClick={handleClearSearch} className="mt-1">
              Limpiar búsqueda
            </Button>
          </div>
        ) : (
          filtered.map((exp) => {
            const config = STATUS_CONFIG[exp.status];
            return (
              <Link key={exp.id} href={`/expedientes/${exp.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                <motion.div
                  whileHover={{ scale: 1.005, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="group glass relative overflow-hidden rounded-2xl border border-border/30 p-5 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                  role="listitem"
                >
                  <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20" aria-hidden="true">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary">{exp.id}</span>
                        <Badge variant={config.variant}>
                          <span aria-hidden="true" className="mr-1">{config.icon}</span> 
                          {exp.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">· {exp.time}</span>
                      </div>
                      <p className="mt-1.5 text-base font-semibold text-foreground">
                        {exp.description}
                      </p>
                      <p className="text-xs text-muted-foreground">{exp.notes}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground" aria-label={`Localidad: ${exp.locality}`}>
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {exp.locality}
                        </span>
                        {exp.codes.map((code) => (
                          <span
                            key={code}
                            className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary"
                            aria-label={`Código: ${code}`}
                          >
                            {code}
                          </span>
                        ))}
                        {exp.displacementKm > 0 && (
                          <span className="flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info" aria-label={`Desplazamiento: ${formatDistance(exp.displacementKm)}`}>
                            <Route className="h-3 w-3" aria-hidden="true" />
                            {formatDistance(exp.displacementKm)}
                          </span>
                        )}
                        {exp.materialCost > 0 && (
                          <span className="flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning" aria-label={`Costo de material: ${formatCurrency(exp.materialCost)}`}>
                            <Package className="h-3 w-3" aria-hidden="true" />
                            {formatCurrency(exp.materialCost)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-bold text-foreground">{formatCurrency(exp.totalCost)}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                      <ArrowRight className="ml-auto mt-2 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:text-primary group-hover:opacity-100" aria-hidden="true" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}

// --- Page Wrapper with Suspense Boundary for useSearchParams ---

export default function ExpedientesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ExpedientesContent />
    </Suspense>
  );
}
