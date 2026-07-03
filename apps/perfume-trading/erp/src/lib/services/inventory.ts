import prisma from '../prisma';
import type { Inventory, ApiResponse } from '@/types';

export interface StockAlert {
  product_id: string;
  product_name: string;
  brand_name: string;
  batch_code: string;
  quantity: number;
  threshold: number;
  expiry_date?: string;
  warehouse_location?: string;
  alert_type: 'low_stock' | 'expiring' | 'overstock';
}

export const InventoryService = {
  async list(warehouseId?: string): Promise<ApiResponse<Inventory[]>> {
    try {
      let whereClause: any = { quantity: { gt: 0 } };
      if (warehouseId) whereClause.warehouseId = warehouseId;

      const data = await prisma.inventory.findMany({
        where: whereClause,
        include: {
          product: { include: { brand: true } },
          warehouse: true,
          partner: true,
        },
        orderBy: { expiryDate: 'asc' }
      });

      const items = data.map((inv) => ({
        id: inv.id,
        product_id: inv.productId,
        product_name: inv.product?.name ?? '',
        warehouse_id: inv.warehouseId,
        warehouse_name: inv.warehouse?.name ?? '',
        partner_id: inv.partnerId ?? undefined,
        partner_name: inv.partner?.name ?? undefined,
        quantity: inv.quantity,
        batch_code: inv.batchCode,
        cost_price: inv.costPrice,
        expiry_date: inv.expiryDate ? inv.expiryDate.toISOString() : undefined,
        warehouse_location: inv.warehouseLocation ?? undefined,
        received_at: inv.receivedAt.toISOString(),
      })) as Inventory[];
      return { data: items, count: items.length };
    } catch (err) { throw err; }
  },

  async getAlerts(threshold = 20, expiryDays = 90): Promise<StockAlert[]> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + expiryDays);

      const data = await prisma.inventory.findMany({
        where: { quantity: { gt: 0 } },
        include: { product: { include: { brand: true } } }
      });

      const alerts: StockAlert[] = [];

      for (const record of data) {
        const qty = record.quantity;
        const prodName = record.product?.name ?? 'Unknown';
        const brandName = record.product?.brand?.name ?? '';

        if (qty < threshold) {
          alerts.push({
            product_id: record.productId,
            product_name: prodName,
            brand_name: brandName,
            batch_code: record.batchCode,
            quantity: qty,
            threshold,
            expiry_date: record.expiryDate ? record.expiryDate.toISOString() : undefined,
            warehouse_location: record.warehouseLocation ?? undefined,
            alert_type: 'low_stock',
          });
        }

        if (record.expiryDate && record.expiryDate <= cutoff) {
          alerts.push({
            product_id: record.productId,
            product_name: prodName,
            brand_name: brandName,
            batch_code: record.batchCode,
            quantity: qty,
            threshold,
            expiry_date: record.expiryDate.toISOString(),
            warehouse_location: record.warehouseLocation ?? undefined,
            alert_type: 'expiring',
          });
        }
      }

      return alerts;
    } catch (err) { throw err; }
  },

  async deductStock(productId: string, quantity: number, batchCode?: string): Promise<void> {
    try {
      if (batchCode) {
        const item = await prisma.inventory.findFirst({
          where: { productId, batchCode, quantity: { gte: quantity } }
        });
        if (item) {
          await prisma.inventory.update({
            where: { id: item.id },
            data: { quantity: item.quantity - quantity }
          });
        }
      } else {
        // FIFO logic simplified for mocked environment
        const items = await prisma.inventory.findMany({
          where: { productId, quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' }
        });
        let remaining = quantity;
        for (const item of items) {
          if (remaining <= 0) break;
          const deduct = Math.min(item.quantity, remaining);
          await prisma.inventory.update({
            where: { id: item.id },
            data: { quantity: item.quantity - deduct }
          });
          remaining -= deduct;
        }
      }
    } catch (err) { throw err; }
  },

  async addStock(input: {
    product_id: string;
    warehouse_id: string;
    quantity: number;
    batch_code: string;
    cost_price: number;
    expiry_date?: string;
    partner_id?: string;
  }): Promise<ApiResponse<Inventory>> {
    try {
      const newInv = await prisma.inventory.create({
        data: {
          productId: input.product_id,
          warehouseId: input.warehouse_id,
          quantity: input.quantity,
          batchCode: input.batch_code,
          costPrice: input.cost_price,
          expiryDate: input.expiry_date ? new Date(input.expiry_date) : undefined,
          partnerId: input.partner_id,
        }
      });
      return { data: newInv as unknown as Inventory };
    } catch (err) { throw err; }
  },
};
