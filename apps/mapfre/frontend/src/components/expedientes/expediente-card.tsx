import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight, MapPin, Package, Route, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Expediente, ExpedienteStatus } from "@/types/expedientes";

const STATUS_CONFIG: Record<ExpedienteStatus, { variant: "success" | "warning" | "info"; icon: string }> = {
  [ExpedienteStatus.COMPLETADO]: { variant: "success", icon: "✓" },
  [ExpedienteStatus.PENDIENTE]: { variant: "warning", icon: "●" },
  [ExpedienteStatus.EN_PROCESO]: { variant: "info", icon: "◐" },
};

const formatCurrency = (value: number) => `${value.toFixed(2)} €`;
const formatDistance = (value: number) => `${value} km`;

export function ExpedienteCard({ exp }: { exp: Expediente }) {
  const config = STATUS_CONFIG[exp.status];

  return (
    <Link
      href={`/expedientes/${exp.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
    >
      <motion.article
        whileHover={{ scale: 1.01, y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="group relative overflow-hidden rounded-3xl border border-border/20 bg-card/40 p-6 backdrop-blur-3xl transition-all hover:border-primary/40 hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/10"
        role="listitem"
      >
        {/* Glow effect on hover */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />

        <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Leading Icon / Bento Accent */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-inner" aria-hidden="true">
            <Wrench className="h-6 w-6 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <header className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-sm font-extrabold tracking-tight text-primary">
                {exp.id}
              </span>
              <Badge variant={config.variant} className="shadow-sm">
                <span aria-hidden="true" className="mr-1.5">{config.icon}</span>
                {exp.status}
              </Badge>
              <time className="text-xs font-medium text-muted-foreground ml-auto sm:ml-0">
                {exp.time}
              </time>
            </header>

            <h3 className="text-lg font-bold tracking-tight text-foreground line-clamp-1">
              {exp.description}
            </h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground/80 line-clamp-1">
              {exp.notes}
            </p>

            <footer className="mt-4 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm" aria-label={`Localidad: ${exp.locality}`}>
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {exp.locality}
              </span>

              {exp.codes.map((code) => (
                <span
                  key={code}
                  className="rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-primary ring-1 ring-primary/20"
                  aria-label={`Código IA: ${code}`}
                >
                  {code}
                </span>
              ))}

              {exp.displacementKm > 0 && (
                <span className="flex items-center gap-1.5 rounded-lg bg-info/10 px-2.5 py-1 text-xs font-bold text-info ring-1 ring-info/20" aria-label={`Desplazamiento: ${formatDistance(exp.displacementKm)}`}>
                  <Route className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDistance(exp.displacementKm)}
                </span>
              )}

              {exp.materialCost > 0 && (
                <span className="flex items-center gap-1.5 rounded-lg bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning ring-1 ring-warning/20" aria-label={`Costo de material: ${formatCurrency(exp.materialCost)}`}>
                  <Package className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatCurrency(exp.materialCost)}
                </span>
              )}
            </footer>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start mt-4 sm:mt-0 pl-0 sm:pl-4 sm:border-l border-border/20">
            <div className="text-left sm:text-right">
              <p className="text-xl font-black tracking-tight text-foreground">
                {formatCurrency(exp.totalCost)}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                Total
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 transition-colors group-hover:bg-primary group-hover:text-white mt-auto sm:mt-4">
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
