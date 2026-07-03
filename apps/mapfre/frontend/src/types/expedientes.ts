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
