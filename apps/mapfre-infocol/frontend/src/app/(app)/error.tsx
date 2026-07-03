"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 ring-1 ring-danger/20">
        <AlertTriangle className="h-8 w-8 text-danger" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Error inesperado</h1>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        Se ha producido un error al procesar esta página. Puedes intentarlo de nuevo o volver al
        inicio.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Reintentar
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Volver al inicio
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-8 max-w-lg rounded-xl border border-danger/20 bg-danger/5 p-4 font-mono text-xs text-danger">
          {error.message}
        </p>
      )}
    </div>
  );
}
