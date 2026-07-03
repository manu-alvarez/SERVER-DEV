"use client";

import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  Hourglass,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";
type ExpStatus = "ok" | "pending" | "error" | "processing";

const levelColor: Record<string, string> = {
  INFO: "text-info",
  WARN: "text-warning",
  ERROR: "text-danger",
  SUCCESS: "text-success",
};

const statusIcon: Record<ExpStatus, typeof CheckCircle2> = {
  ok: CheckCircle2,
  pending: Clock,
  error: XCircle,
  processing: Hourglass,
};

const statusColor: Record<ExpStatus, string> = {
  ok: "text-success",
  pending: "text-muted-foreground",
  error: "text-danger",
  processing: "text-info",
};

const statusLabel: Record<ExpStatus, string> = {
  ok: "Completado",
  pending: "Pendiente",
  error: "Error",
  processing: "Procesando",
};

const expedientesLog = [
  { id: "V67391281", status: "ok", codes: "YYDDDYT, XADDD2T, SMDDDIT", time: "12.3s", hace: "hace 2 min" },
  { id: "V67391282", status: "ok", codes: "YYDDDYT, XADDD2T", time: "8.1s", hace: "hace 8 min" },
  { id: "V67391283", status: "processing", codes: "—", time: "—", hace: "ahora" },
  { id: "V67391284", status: "pending", codes: "—", time: "—", hace: "—" },
  { id: "V67391285", status: "ok", codes: "FADDD3T, YYDDDYT", time: "6.7s", hace: "hace 32 min" },
  { id: "V67391286", status: "error", codes: "—", time: "—", hace: "hace 1h" },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
} as const;

export default function MonitorPage() {
  const [logs, setLogs] = useState<{ time: string; level: LogLevel; msg: string }[]>([
    { time: "13:15:22", level: "SUCCESS", msg: "Expediente V67391281 procesado · 3 códigos aplicados · 12.3s" },
    { time: "13:15:10", level: "INFO", msg: "Códigos asignados: YYDDDYT + XADDD2T + SMDDDIT" },
    { time: "13:14:58", level: "INFO", msg: "Inicio procesamiento V67391281 · 3 descripciones" },
    { time: "13:14:42", level: "SUCCESS", msg: "Login portal FIN exitoso · sesión activa" },
    { time: "13:14:30", level: "INFO", msg: "Browser Chromium iniciado · perfil InfoCol" },
    { time: "13:14:12", level: "INFO", msg: "Llavero macOS: credenciales OK · expira en 23h" },
    { time: "13:13:58", level: "WARN", msg: "Latencia de red elevada (610ms)" },
    { time: "13:13:40", level: "SUCCESS", msg: "Sincronización local: 12 expedientes descargados" },
  ]);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (level: LogLevel, msg: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev.slice(-50), { time, level, msg }]);
  };

  const startProcessing = async () => {
    if (processing) return;
    setProcessing(true);
    setProcessingMsg("Iniciando motor INFOCOL...");
    addLog("INFO", "Lanzando infocol run --dry-run (modo seguro)");

    try {
      const res = await fetch("/app/mapfre/api/run", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        addLog("SUCCESS", "Procesamiento completado con éxito");
      } else {
        addLog("ERROR", `Fallo en el motor: ${data.error}`);
      }
    } catch (err: any) {
      addLog("ERROR", `Error de red: ${err.message}`);
    } finally {
      setProcessing(false);
      setProcessingMsg("");
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Online
            </Badge>
            <span className="hidden text-xs text-muted-foreground sm:inline">Tiempo real</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Monitor de Procesamiento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sesión activa de trabajo. Estado de los partes y eventos en vivo.
          </p>
        </div>
        <button
          type="button"
          onClick={startProcessing}
          disabled={processing}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
              />
              {processingMsg}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Procesar pendiente
            </>
          )}
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Procesados hoy", value: "12", sub: "último hace 2 min", icon: CheckCircle2, color: "text-success" },
          { label: "Tiempo medio", value: "9.2s", sub: "−32% vs ayer", icon: Clock, color: "text-info" },
          { label: "Tasa de éxito", value: "97%", sub: "1 error en 30 días", icon: Activity, color: "text-primary" },
          { label: "Importe total", value: "352.50 €", sub: "tarifa MAPFRE 2026", icon: ShieldCheck, color: "text-secondary" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted-foreground">{kpi.label}</p>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">
              {kpi.value}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{kpi.sub}</p>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Últimos expedientes</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Historial de la sesión actual
                </p>
              </div>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {expedientesLog.map((e) => {
              const Icon = statusIcon[e.status];
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    e.status === "processing"
                      ? "border-primary/30 bg-primary/[0.03]"
                      : "border-border/30 hover:bg-muted/20"
                  }`}
                >
                  <div className={`${statusColor[e.status]} ${e.status === "processing" ? "animate-pulse" : ""}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{e.id}</span>
                      <span className={`text-[10px] font-medium ${statusColor[e.status]}`}>
                        {statusLabel[e.status]}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {e.status === "ok"
                        ? `Códigos: ${e.codes}`
                        : e.status === "processing"
                          ? "Asignando códigos de tarifa..."
                          : e.status === "error"
                            ? "Error: código no válido para esta descripción"
                            : "En cola para procesar"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-foreground tabular-nums">
                      {e.time}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{e.hace}</p>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Resumen de sesión</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Información de conexión actual</p>
                </div>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Usuario", value: "Pedro González" },
                { label: "Rol / Oficio", value: "Fontanero · La Rioja" },
                { label: "Sesión iniciada", value: "Hoy a las 09:42" },
                { label: "Portal FIN", value: "Conectado · expira en 23h" },
                { label: "Pendientes en cola", value: "3 expedientes" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-lg bg-muted/10 px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-xs font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
              <button
                type="button"
                onClick={startProcessing}
                disabled={processing}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-3 w-3 rounded-full border-2 border-primary/30 border-t-primary"
                    />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Procesar siguientes pendientes
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Distribución de tarifa</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Códigos más usados hoy</p>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { code: "YYDDDYT", label: "Exclusión con cala", pct: 36 },
                { code: "XADDD2T", label: "Exclusión sin cala", pct: 27 },
                { code: "SMDDDIT", label: "Sustitución grifería", pct: 18 },
                { code: "FADDD8T", label: "Desplazamiento >20km", pct: 18 },
              ].map((item) => (
                <div key={item.code}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">{item.code}</span>
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-400"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Stream de eventos</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {logs.length} eventos · sesión actual
                </p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto font-mono text-xs space-y-0.5">
              <AnimatePresence initial={false}>
                {logs.map((log, idx) => (
                  <motion.div
                    key={`${log.time}-${idx}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 rounded-md px-2 py-1 hover:bg-muted/20 transition-colors"
                  >
                    <span className="shrink-0 text-muted-foreground/50">{log.time}</span>
                    <span className={`shrink-0 font-bold ${levelColor[log.level]}`}>{log.level}</span>
                    <span className="text-foreground/80 flex-1">{log.msg}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
