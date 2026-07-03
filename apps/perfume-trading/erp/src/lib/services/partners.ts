import prisma from '../prisma';
import type { Partner, ApiResponse } from '@/types';

export const PartnersService = {
  async list(type?: string, search?: string): Promise<ApiResponse<Partner[]>> {
    try {
      let whereClause: any = { isActive: true };
      if (type && type !== 'all') whereClause.type = type;
      if (search) {
        whereClause.OR = [
          { name: { contains: search } },
          { country: { contains: search } },
          { email: { contains: search } }
        ];
      }

      const data = await prisma.partner.findMany({
        where: whereClause,
        orderBy: { name: 'asc' }
      });

      const partners = data.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type as Partner['type'],
        email: p.email ?? undefined,
        phone: p.phone ?? undefined,
        country: p.country ?? undefined,
        address: p.address ?? undefined,
        credit_limit: p.creditLimit,
        payment_terms: p.paymentTerms,
        is_active: p.isActive,
        broker_fee_pct: p.brokerFeePct ?? undefined,
        created_at: p.createdAt.toISOString()
      }));

      return { data: partners as Partner[], count: partners.length };
    } catch (err) { throw err; }
  },

  async create(partner: Omit<Partner, 'id' | 'created_at'>): Promise<ApiResponse<Partner>> {
    try {
      const data = await prisma.partner.create({
        data: {
          name: partner.name,
          type: partner.type,
          email: partner.email,
          phone: partner.phone,
          country: partner.country,
          address: partner.address,
          creditLimit: partner.credit_limit,
          paymentTerms: partner.payment_terms,
          brokerFeePct: partner.broker_fee_pct,
        }
      });
      return { data: data as unknown as Partner };
    } catch (err) { throw err; }
  },

  async update(id: string, updates: Partial<Partner>): Promise<ApiResponse<Partner>> {
    try {
      const data = await prisma.partner.update({
        where: { id },
        data: {
          name: updates.name,
          type: updates.type,
          email: updates.email,
          phone: updates.phone,
          country: updates.country,
          address: updates.address,
          creditLimit: updates.credit_limit,
          paymentTerms: updates.payment_terms,
          brokerFeePct: updates.broker_fee_pct,
          isActive: updates.is_active,
        }
      });
      return { data: data as unknown as Partner };
    } catch (err) { throw err; }
  },
};
