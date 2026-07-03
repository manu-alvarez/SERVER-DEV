import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Product } from '@/types';

function mapProduct(p: any): Product {
  return {
    id: p.id,
    brand_id: p.brandId,
    brand_name: p.brand?.name ?? '',
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
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search } },
          { ean: { contains: search } },
          { brand: { name: { contains: search } } }
        ]
      };
    }

    const data = await prisma.product.findMany({
      where: whereClause,
      include: { brand: true },
      orderBy: { createdAt: 'desc' }
    });

    const products = data.map(mapProduct);
    return NextResponse.json({ data: products, count: products.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProduct = await prisma.product.create({
      data: {
        brandId: body.brand_id,
        name: body.name,
        line: body.line,
        gender: body.gender ?? 'Unisex',
        format: body.format ?? 'Regular',
        concentration: body.concentration ?? 'EDP',
        sizeMl: body.size_ml,
        ean: body.ean,
        marketPrice: body.market_price,
        costPrice: body.cost_price,
      },
      include: { brand: true }
    });

    const mappedProduct = mapProduct(newProduct);
    return NextResponse.json({ data: mappedProduct }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
