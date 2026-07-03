import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-border/40">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Página no encontrada</h1>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        La página que buscas no existe o ha sido movida. Verifica la URL o vuelve al inicio.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Ir al Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
