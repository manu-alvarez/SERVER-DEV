/**
 * Trading Calculator — Motor de cálculo profesional para Trading de Perfumería.
 *
 * Ajustes logísticos por Incoterm y comisión de bróker.
 * Basado en lógica de pricing de SAP y Dynamics 365.
 */
import type { Incoterm } from '@/types';

/**
 * Factores de ajuste logístico por Incoterm.
 * Representan costos estimados sobre el precio unitario:
 * - EXW: 0%   (recogida en fábrica)
 * - FOB: 3%   (gastos de puerto origen)
 * - CIF: 7%   (seguro + flete internacional)
 * - DDP: 12%  (impuestos + entrega destino)
 * - CIP: 8%   (transporte + seguro hasta destino)
 * - CPT: 5%   (transporte principal pagado)
 * - DAP: 10%  (entrega en destino sin aduana)
 */
export const INCOTERN_LOGISTICS_FACTORS: Record<Incoterm, number> = {
  EXW: 0,
  FOB: 0.03,
  CIF: 0.07,
  DDP: 0.12,
  CIP: 0.08,
  CPT: 0.05,
  DAP: 0.10,
};

export interface MarginResult {
  /** Precio total sin ajustes */
  baseTotal: number;
  /** Costo logístico adicional según Incoterm */
  logisticsCost: number;
  /** Comisión del bróker */
  brokerCost: number;
  /** Total neto después de ajustes */
  netTotal: number;
  /** Margen bruto si se conoce el marketPrice */
  grossMarginAmount: number;
  /** Porcentaje de margen bruto */
  grossMarginPct: number;
  /** Costo total por unidad */
  costPerUnit: number;
}

/**
 * Calcula el margen neto profesional de una operación de trading.
 *
 * @param unitPrice - Precio unitario de la operación
 * @param quantity - Cantidad de unidades
 * @param incoterm - Código Incoterm (EXW, FOB, CIF, DDP, etc.)
 * @param marketPrice - Precio de mercado del producto (opcional, para margen)
 * @param brokerFeePct - Porcentaje de comisión del bróker (opcional)
 */
export function calculateNetMargin(
  unitPrice: number,
  quantity: number,
  incoterm: Incoterm,
  marketPrice?: number,
  brokerFeePct: number = 0
): MarginResult {
  const baseTotal = unitPrice * quantity;
  const logisticsFactor = INCOTERN_LOGISTICS_FACTORS[incoterm] ?? 0;
  const logisticsCost = baseTotal * logisticsFactor;
  const brokerCost = baseTotal * (brokerFeePct / 100);
  const netTotal = baseTotal + logisticsCost + brokerCost;
  const costPerUnit = netTotal / quantity;

  let grossMarginAmount = 0;
  let grossMarginPct = 0;

  if (marketPrice && marketPrice > 0) {
    const marketTotal = marketPrice * quantity;
    grossMarginAmount = marketTotal - netTotal;
    grossMarginPct = marketTotal > 0
      ? Math.round((grossMarginAmount / marketTotal) * 1000) / 10
      : 0;
  }

  return {
    baseTotal,
    logisticsCost,
    brokerCost,
    netTotal,
    grossMarginAmount,
    grossMarginPct,
    costPerUnit,
  };
}

/**
 * Calcula el precio de venta recomendado para lograr un margen objetivo.
 *
 * @param targetMarginPct - Margen objetivo (ej: 25 para 25%)
 * @param costPrice - Precio de costo unitario
 * @param quantity - Cantidad
 * @param incoterm - Incoterm
 * @param brokerFeePct - Comisión del bróker
 */
export function calculateTargetPrice(
  targetMarginPct: number,
  costPrice: number,
  quantity: number,
  incoterm: Incoterm,
  brokerFeePct: number = 0
): number {
  const baseCost = costPrice * quantity;
  const logisticsFactor = INCOTERN_LOGISTICS_FACTORS[incoterm] ?? 0;
  const logisticsCost = baseCost * logisticsFactor;
  const brokerCost = baseCost * (brokerFeePct / 100);
  const totalCost = baseCost + logisticsCost + brokerCost;

  // Precio necesario para lograr el margen objetivo
  // targetMarginPct = (revenue - cost) / revenue
  // revenue = cost / (1 - targetMarginPct/100)
  const requiredRevenue = totalCost / (1 - targetMarginPct / 100);
  return Math.round((requiredRevenue / quantity) * 100) / 100;
}
