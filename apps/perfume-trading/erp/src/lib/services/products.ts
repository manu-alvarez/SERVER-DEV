import prisma from '../prisma';
import type { Product, ApiResponse } from '@/types';

export const ProductsService = {
  async list(search?: string): Promise<ApiResponse<Product[]>> {
    try {
      let whereClause: any = { isActive: true };
      if (search) {
        whereClause.OR = [
          { name: { contains: search } },
          { ean: { contains: search } },
          { brand: { name: { contains: search } } }
        ];
      }

      const data = await prisma.product.findMany({
        where: whereClause,
        include: { brand: true },
        orderBy: { createdAt: 'desc' }
      });

      const products = data.map((p) => ({
        id: p.id,
        brand_id: p.brandId,
        brand_name: p.brand?.name ?? '',
        brand_category: p.brand?.category ?? '',
        name: p.name,
        line: p.line ?? undefined,
        gender: p.gender as Product['gender'],
        format: p.format as Product['format'],
        concentration: p.concentration as Product['concentration'],
        size_ml: p.sizeMl,
        ean: p.ean,
        market_price: p.marketPrice,
        cost_price: p.costPrice ?? undefined,
        is_active: p.isActive,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      }));

      return { data: products, count: products.length };
    } catch (err) { throw err; }
  },

  async getById(id: string): Promise<ApiResponse<Product>> {
    try {
      const data = await prisma.product.findUnique({
        where: { id },
        include: { brand: true }
      });
      if (!data) throw new Error('Product not found');
      
      const product = {
        id: data.id,
        brand_id: data.brandId,
        brand_name: data.brand?.name ?? '',
        brand_category: data.brand?.category ?? '',
        name: data.name,
        line: data.line ?? undefined,
        gender: data.gender as Product['gender'],
        format: data.format as Product['format'],
        concentration: data.concentration as Product['concentration'],
        size_ml: data.sizeMl,
        ean: data.ean,
        market_price: data.marketPrice,
        cost_price: data.costPrice ?? undefined,
        is_active: data.isActive,
        created_at: data.createdAt.toISOString(),
        updated_at: data.updatedAt.toISOString(),
      };
      return { data: product };
    } catch (err) { throw err; }
  },

  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Product>> {
    try {
      const data = await prisma.product.create({
        data: {
          brandId: product.brand_id,
          name: product.name,
          line: product.line,
          gender: product.gender,
          format: product.format,
          concentration: product.concentration,
          sizeMl: product.size_ml,
          ean: product.ean,
          marketPrice: product.market_price,
          costPrice: product.cost_price,
        },
        include: { brand: true }
      });
      return { data: data as unknown as Product, count: 1 };
    } catch (err) { throw err; }
  },

  async update(id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const data = await prisma.product.update({
        where: { id },
        data: {
          brandId: updates.brand_id,
          name: updates.name,
          line: updates.line,
          gender: updates.gender,
          format: updates.format,
          concentration: updates.concentration,
          sizeMl: updates.size_ml,
          ean: updates.ean,
          marketPrice: updates.market_price,
          costPrice: updates.cost_price,
          isActive: updates.is_active,
        },
        include: { brand: true }
      });
      return { data: data as unknown as Product };
    } catch (err) { throw err; }
  },

  async getLowStock(threshold = 20): Promise<ApiResponse<(Product & { stock_qty: number })[]>> {
    try {
      const data = await prisma.inventory.findMany({
        where: { quantity: { gt: 0, lt: threshold } },
        include: { product: { include: { brand: true } } }
      });
      
      const items = data.map(item => ({
        ...item.product,
        stock_qty: item.quantity,
      })) as unknown as (Product & { stock_qty: number })[];
      
      return { data: items, count: items.length };
    } catch (err) { throw err; }
  },
};
