"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { Expediente, ExpedienteStatus } from "@/types/expedientes";

const INITIAL_EXPEDIENTES: ReadonlyArray<Expediente> = [
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

/**
 * Custom Hook: useExpedientes
 * Handles state management, optimistic UI updates, and algorithmic filtering.
 */
export function useExpedientes(searchQuery: string) {
  const [data, setData] = useState<ReadonlyArray<Expediente>>(INITIAL_EXPEDIENTES);
  const [isPending, startTransition] = useTransition();

  // Optimistic processing of all pending expedientes
  const processAllPending = useCallback(() => {
    startTransition(() => {
      setData((prev) =>
        prev.map((exp) =>
          exp.status === ExpedienteStatus.PENDIENTE
            ? { ...exp, status: ExpedienteStatus.EN_PROCESO }
            : exp
        )
      );
    });

    // Simulate Network Request
    setTimeout(() => {
      // If error occurs, we would rollback here using a saved snapshot
      // For now, we assume success.
    }, 1500);
  }, []);

  // Filter Algorithm: O(N) complexity
  const filteredExpedientes = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return data;

    return data.filter(
      (e) =>
        e.id.toLowerCase().includes(trimmed) ||
        e.description.toLowerCase().includes(trimmed) ||
        e.locality.toLowerCase().includes(trimmed) ||
        e.codes.some((c) => c.toLowerCase().includes(trimmed))
    );
  }, [data, searchQuery]);

  // Fast single-pass metrics computation
  const metrics = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let processing = 0;

    for (let i = 0; i < data.length; i++) {
      const s = data[i].status;
      if (s === ExpedienteStatus.COMPLETADO) completed++;
      else if (s === ExpedienteStatus.PENDIENTE) pending++;
      else if (s === ExpedienteStatus.EN_PROCESO) processing++;
    }

    return { total: data.length, completed, pending, processing };
  }, [data]);

  return {
    expedientes: filteredExpedientes,
    metrics,
    isProcessing: isPending,
    processAllPending,
  };
}
