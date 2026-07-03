"use client";

import {
  Bell,
  BookOpen,
  Camera,
  Check,
  Cpu,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const sections = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "cuenta", label: "Cuenta MAPFRE", icon: Shield },
  { id: "tarifa", label: "Tarifa MAPFRE", icon: BookOpen },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "tema", label: "Apariencia", icon: Palette },
  { id: "avanzado", label: "Avanzado", icon: Cpu },
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

export default function AjustesPage() {
  const [activeSection, setActiveSection] = useState("perfil");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [theme, setThemeState] = useState<"dark" | "light" | "auto">("dark");
  const setTheme = (t: "dark" | "light" | "auto") => {
    setThemeState(t);
    if (t === "dark") {
      document.documentElement.classList.remove("light");
    } else if (t === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };
  const [language, setLanguage] = useState<"es" | "ca" | "eu" | "gl">("es");
  const [notifications, setNotifications] = useState({
    expediente_completed: true,
    expediente_failed: true,
    daily_summary: true,
    weekly_report: false,
    error_alerts: true,
    beta_features: false,
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-muted-foreground">
          Configura tu perfil, la tarifa MAPFRE, notificaciones y preferencias del sistema
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr] lg:grid-cols-[260px_1fr]">
        <motion.nav
          variants={itemVariants}
          className="flex flex-wrap gap-1 md:flex-col md:space-y-1"
        >
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                activeSection === s.id
                  ? "bg-primary/10 text-white"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
              )}
            >
              {activeSection === s.id && (
                <motion.div
                  layoutId="active-section"
                  className="absolute left-0 h-6 w-1 rounded-r-full bg-primary"
                />
              )}
              <s.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  activeSection === s.id ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span>{s.label}</span>
            </button>
          ))}
        </motion.nav>

        <div className="space-y-6">
          {activeSection === "perfil" && (
            <motion.div
              key="perfil"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Estos datos solo se usan en este dispositivo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-2xl font-bold text-white shadow-lg shadow-primary/20">
                        PG
                      </div>
                      <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-white shadow-md hover:scale-110 transition-transform">
                        <Camera className="h-3 w-3" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) window.alert(`Foto seleccionada: ${file.name}`);
                        }} />
                      </label>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">Pedro González</p>
                      <p className="text-sm text-muted-foreground">Fontanero profesional</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="success">Cuenta verificada</Badge>
                        <Badge variant="outline">MAPFRE Partner</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Nombre completo"
                      defaultValue="Pedro González Martínez"
                      icon={User}
                    />
                    <Field label="Email" defaultValue="pedro@infocol.local" icon={Mail} />
                    <Field label="Teléfono" defaultValue="+34 600 000 000" icon={MapPin} />
                    <Field label="NIF / CIF" defaultValue="***4567**" icon={Shield} />
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Dirección del Taller</CardTitle>
                  <CardDescription>Para cálculos de desplazamiento</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Calle y número" defaultValue="C/ Sagasta 12" />
                    <Field label="Código postal" defaultValue="26001" />
                    <Field label="Localidad" defaultValue="Logroño" />
                    <Field label="Provincia" defaultValue="La Rioja" />
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Especialidad Profesional</CardTitle>
                  <CardDescription>Para adaptar los códigos de tarifa</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { id: "fontaneria", label: "Fontanería", icon: Wrench, active: true },
                      { id: "calefaccion", label: "Calefacción", icon: Zap, active: false },
                      { id: "electricidad", label: "Electricidad", icon: Sparkles, active: false },
                      { id: "general", label: "Reformas generales", icon: Wrench, active: false },
                    ].map((s) => (
                      <motion.button
                        key={s.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                          s.active
                            ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                            : "border-border/40 hover:border-border/80",
                        )}
                      >
                        <s.icon
                          className={cn(
                            "h-4 w-4",
                            s.active ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            s.active ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {s.label}
                        </span>
                        {s.active && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === "cuenta" && (
            <motion.div
              key="cuenta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Credenciales de InfoCol</CardTitle>
                      <CardDescription>
                        Almacenadas en el llavero del sistema, nunca en texto plano
                      </CardDescription>
                    </div>
                    <Badge variant="success">
                      <Lock className="mr-1 h-2.5 w-2.5" />
                      Cifrado
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Usuario</p>
                        <p className="font-mono text-sm font-medium text-foreground">
                          pedro.fontanero
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const val = window.prompt("Nuevo usuario:", "pedro.fontanero");
                        if (val) window.alert("Usuario actualizado a: " + val);
                      }}>
                        Cambiar
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Contraseña</p>
                        <p className="font-mono text-sm font-medium text-foreground">
                          ••••••••••••••••
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const val = window.prompt("Nueva contraseña:");
                        if (val) window.alert("Contraseña actualizada correctamente");
                      }}>
                        Actualizar
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-4 w-4 text-success" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Cifrado AES-256 activo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Las credenciales se derivan del identificador único de tu Mac y nunca
                          salen del dispositivo.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Sesión Activa</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/10 p-4">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-info" />
                      <div>
                        <p className="text-sm font-medium text-foreground">MacBook Pro · macOS</p>
                        <p className="text-xs text-muted-foreground">
                          Inicio de sesión: hoy 08:30 · IP local
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      if (window.confirm("¿Cerrar sesión de InfoCOL?")) {
                        window.location.href = "/";
                      }
                    }}>
                      Cerrar sesión
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

           {activeSection === "tarifa" && (
            <motion.div
              key="tarifa"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Códigos de Tarifa MAPFRE</CardTitle>
                      <CardDescription>
                        Gestiona los códigos y reglas de asignación automática por descripción
                      </CardDescription>
                    </div>
                    <Badge variant="default">
                      <Check className="mr-1 h-2.5 w-2.5" />
                      12 códigos activos
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Buscar código o descripción..."
                        className="h-10 w-full rounded-xl border border-border/40 bg-muted/20 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <Button size="sm">
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Nuevo código
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {[
                      { code: "YYDDDYT", name: "Exclusión con cala", desc: "Rotura de tubería que requiere cala en pared", amount: "72.50 €", active: true },
                      { code: "XADDD2T", name: "Exclusión sin cala", desc: "Rotura de tubería accesible sin obras", amount: "45.00 €", active: true },
                      { code: "SMDDDIT", name: "Sustitución grifería", desc: "Cambio de grifo monomando, bimando o mezclador", amount: "38.00 €", active: true },
                      { code: "FADDD8T", name: "Desplazamiento >20km", desc: "Kilometraje superior a 20km desde el taller", amount: "15.00 €", active: true },
                      { code: "JEDDD1T", name: "Desatranco", desc: "Obstrucción en desagüe, bote sifónico o bajante", amount: "55.00 €", active: true },
                      { code: "KADDD3T", name: "Reparación cisterna", desc: "Sustitución o reparación de mecanismo interior", amount: "35.00 €", active: false },
                    ].map((c) => (
                      <div
                        key={c.code}
                        className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                          c.active ? "border-border/30" : "border-border/10 opacity-50"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-primary">{c.code}</span>
                            <span className="text-sm font-medium text-foreground">{c.name}</span>
                            {!c.active && (
                              <Badge variant="outline" className="text-[9px]">Inactivo</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-foreground">{c.amount}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => window.alert(`Editando código ${c.code}`)}>
                          Editar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Reglas de asignación</CardTitle>
                  <CardDescription>
                    Cómo se relacionan las descripciones de los partes con los códigos de tarifa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-0">
                  {[
                    { keyword: "fuga, tubería, baño, cocina", code: "YYDDDYT", priority: "Alta" },
                    { keyword: "rotura, accesible, vista", code: "XADDD2T", priority: "Alta" },
                    { keyword: "grifo, monomando, bimando", code: "SMDDDIT", priority: "Media" },
                    { keyword: "desatranco, atasco, bajante", code: "JEDDD1T", priority: "Media" },
                  ].map((r) => (
                    <div
                      key={r.keyword}
                      className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/10 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Palabras clave:</span> {r.keyword}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="font-mono text-xs font-bold text-primary">{r.code}</span>
                        <span className="text-[10px] text-muted-foreground">{r.priority}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px]">Editar</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Añadir regla
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === "notificaciones" && (
            <motion.div
              key="notificaciones"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Alertas del Sistema</CardTitle>
                  <CardDescription>Cuándo quieres que el sistema te avise</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {[
                      {
                        id: "expediente_completed",
                        label: "Expediente completado",
                        desc: "Cuando un parte se procesa correctamente",
                      },
                      {
                        id: "expediente_failed",
                        label: "Expediente fallido",
                        desc: "Cuando la IA no puede procesar un expediente",
                      },
                      {
                        id: "daily_summary",
                        label: "Resumen diario",
                        desc: "Estadísticas del día a las 20:00",
                      },
                      {
                        id: "weekly_report",
                        label: "Informe semanal",
                        desc: "Reporte completo cada lunes",
                      },
                      {
                        id: "error_alerts",
                        label: "Alertas de error",
                        desc: "Cualquier error crítico del sistema",
                      },
                      {
                        id: "beta_features",
                        label: "Funciones beta",
                        desc: "Notificar sobre nuevas features en pruebas",
                      },
                    ].map((n, idx) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center justify-between rounded-xl p-3 hover:bg-muted/20 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{n.label}</p>
                          <p className="text-[11px] text-muted-foreground">{n.desc}</p>
                        </div>
                        <Switch
                          checked={notifications[n.id as keyof typeof notifications]}
                          onChange={(v) => setNotifications((s) => ({ ...s, [n.id]: v }))}
                        />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === "tema" && (
            <motion.div
              key="tema"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Tema</CardTitle>
                  <CardDescription>Apariencia de la interfaz</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { id: "light", label: "Claro", icon: Sun },
                      { id: "dark", label: "Oscuro", icon: Moon },
                      { id: "auto", label: "Automático", icon: Monitor },
                    ].map((t) => (
                      <motion.button
                        key={t.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTheme(t.id as "dark" | "light" | "auto")}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                          theme === t.id
                            ? "border-primary/50 bg-primary/10"
                            : "border-border/40 hover:border-border/80",
                        )}
                      >
                        <t.icon
                          className={cn(
                            "h-5 w-5",
                            theme === t.id ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <span className="text-sm font-medium text-foreground">{t.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Idioma</CardTitle>
                  <CardDescription>Idioma de la interfaz</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid gap-3 sm:grid-cols-4">
                    {[
                      { id: "es", label: "Español", abbr: "ES" },
                      { id: "ca", label: "Català", abbr: "CAT" },
                      { id: "eu", label: "Euskara", abbr: "EUS" },
                      { id: "gl", label: "Galego", abbr: "GAL" },
                    ].map((l) => (
                      <motion.button
                        key={l.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLanguage(l.id as "es" | "ca" | "eu" | "gl")}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                          language === l.id
                            ? "border-primary/50 bg-primary/10"
                            : "border-border/40 hover:border-border/80",
                        )}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/40 text-[10px] font-bold tracking-wider text-muted-foreground">
                          {l.abbr}
                        </span>
                        <span className="text-sm font-medium text-foreground">{l.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === "avanzado" && (
            <motion.div
              key="avanzado"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Rendimiento</CardTitle>
                  <CardDescription>Parámetros de ejecución del navegador</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <Slider label="Velocidad de automatización" defaultValue={50} max={100} />
                  <Slider
                    label="Tiempo de espera entre acciones"
                    defaultValue={100}
                    max={500}
                    unit="ms"
                  />
                  <Slider label="Reintentos en caso de error" defaultValue={3} max={10} />
                </CardContent>
              </Card>

              <Card className="border-danger/30 p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-danger">Zona Peligrosa</CardTitle>
                  <CardDescription>Acciones irreversibles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-0">
                  <div className="flex items-center justify-between rounded-xl border border-border/30 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Borrar caché local</p>
                      <p className="text-[11px] text-muted-foreground">
                        Limpia archivos temporales y caché del navegador
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      if (window.confirm("¿Borrar caché local? Se eliminarán archivos temporales.")) {
                        window.alert("Caché limpiada correctamente");
                      }
                    }}>
                      Limpiar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-danger/30 bg-danger/5 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Borrar credenciales</p>
                      <p className="text-[11px] text-muted-foreground">
                        Elimina usuario y contraseña del llavero
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="text-danger border-danger/30" onClick={() => {
                      if (window.confirm("¿ESTÁS SEGURO? Se eliminarán las credenciales del llavero del sistema. Esta acción no se puede deshacer.")) {
                        window.alert("Credenciales eliminadas del llavero");
                      }
                    }}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Borrar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            variants={itemVariants}
            className="sticky bottom-0 -mx-8 mt-6 border-t border-border/30 bg-background/80 px-8 py-4 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Cambios sin guardar · Autoguardado en 30s
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => window.location.reload()}>
                  Descartar
                </Button>
                <Button
                  onClick={() => {
                    setSaving(true);
                    setTimeout(() => setSaving(false), 1500);
                  }}
                >
                  {saving ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-4 w-4" />
                  )}
                  {saving ? "Guardado" : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  defaultValue,
  icon: Icon,
}: {
  label: string;
  defaultValue: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative mt-1.5">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          type="text"
          defaultValue={defaultValue}
          className={cn(
            "h-10 w-full rounded-xl border border-border/40 bg-muted/20 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
            Icon && "pl-9",
          )}
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  defaultValue,
  max,
  unit = "",
}: {
  label: string;
  defaultValue: number;
  max: number;
  unit?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <span className="font-mono text-sm font-semibold text-foreground">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted/50 accent-primary"
      />
    </div>
  );
}
