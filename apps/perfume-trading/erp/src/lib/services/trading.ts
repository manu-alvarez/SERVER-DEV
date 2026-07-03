import prisma from '../prisma';
import type { TradingItem, ApiResponse, TradeStatus, TradeType, Incoterm } from '@/types';

export interface CreateTradeInput {
  type: TradeType;
  partner_id: string;
  product_id: string;
  quantity: number;
  price_unit: number;
  incoterm: Incoterm;
  market_price: number;
  status?: TradeStatus;
  valid_until?: string;
  notes?: string;
}

export const TradingService = {
  async list(type?: string, status?: string): Promise<ApiResponse<TradingItem[]>> {
    try {
      let whereClause: any = {};
      if (type && type !== 'all') whereClause.type = type;
      if (status && status !== 'all') whereClause.status = status;

      const data = await prisma.tradingItem.findMany({
        where: whereClause,
        include: { partner: true, product: { include: { brand: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      const items = data.map(item => ({
        id: item.id,
        type: item.type as TradingItem['type'],
        partner_id: item.partnerId,
        partner_name: item.partner?.name ?? '',
        product_id: item.productId,
        product_name: item.product?.name ?? '',
        brand_name: item.product?.brand?.name ?? '',
        quantity: item.quantity,
        price_unit: item.priceUnit,
        total_amount: item.quantity * item.priceUnit,
        incoterm: (item.incoterm as Incoterm) ?? 'EXW',
        market_price: item.marketPrice ?? 0,
        margin_pct: 0,
        margin_amount: 0,
        status: item.status as TradingItem['status'],
        valid_until: item.validUntil ? item.validUntil.toISOString() : undefined,
        notes: item.notes ?? undefined,
        created_at: item.createdAt.toISOString(),
      }));

      return { data: items, count: items.length };
    } catch (err) { throw err; }
  },

  async create(input: CreateTradeInput): Promise<ApiResponse<TradingItem>> {
    try {
      const data = await prisma.tradingItem.create({
        data: {
          type: input.type,
          partnerId: input.partner_id,
          productId: input.product_id,
          quantity: input.quantity,
          priceUnit: input.price_unit,
          incoterm: input.incoterm ?? 'EXW',
          marketPrice: input.market_price ?? 0,
          status: input.status ?? 'Active',
          validUntil: input.valid_until ? new Date(input.valid_until) : undefined,
          notes: input.notes,
        },
        include: { partner: true, product: { include: { brand: true } } }
      });
      return { data: data as unknown as TradingItem };
    } catch (err) { throw err; }
  },

  async updateStatus(id: string, status: TradeStatus): Promise<ApiResponse<TradingItem>> {
    try {
      const data = await prisma.tradingItem.update({
        where: { id },
        data: { status },
        include: { partner: true, product: { include: { brand: true } } }
      });
      return { data: data as unknown as TradingItem };
    } catch (err) { throw err; }
  },

  async acceptOffer(id: string): Promise<ApiResponse<TradingItem>> {
    const result = await TradingService.updateStatus(id, 'Accepted');
    try {
      // Best effort inventory deduction
      const item = await prisma.tradingItem.findUnique({ where: { id } });
      if (item) {
        // Simplified FIFO equivalent
        const invs = await prisma.inventory.findMany({
          where: { productId: item.productId, quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' }
        });
        let remaining = item.quantity;
        for (const inv of invs) {
          if (remaining <= 0) break;
          const deduct = Math.min(inv.quantity, remaining);
          await prisma.inventory.update({
            where: { id: inv.id },
            data: { quantity: inv.quantity - deduct }
          });
          remaining -= deduct;
        }
      }
    } catch {
      console.warn('[TradingService] Inventory deduction failed for trade:', id);
    }
    return result;
  },
};
