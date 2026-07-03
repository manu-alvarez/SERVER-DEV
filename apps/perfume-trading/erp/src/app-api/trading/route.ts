import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { TradingItem } from '@/types';

function mapItem(item: any): TradingItem {
  return {
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
    incoterm: (item.incoterm as TradingItem['incoterm']) ?? 'EXW',
    market_price: item.marketPrice ?? 0,
    margin_pct: 0, // Calculated dynamically if needed
    margin_amount: 0, // Calculated dynamically if needed
    status: item.status as TradingItem['status'],
    valid_until: item.validUntil ? item.validUntil.toISOString() : undefined,
    created_at: item.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let whereClause: any = {};
    if (type && type !== 'all') whereClause.type = type;
    if (status && status !== 'all') whereClause.status = status;

    const data = await prisma.tradingItem.findMany({
      where: whereClause,
      include: {
        partner: true,
        product: { include: { brand: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const items = data.map(mapItem);
    return NextResponse.json({ data: items, count: items.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newItem = await prisma.tradingItem.create({
      data: {
        type: body.type,
        partnerId: body.partner_id,
        productId: body.product_id,
        quantity: body.quantity,
        priceUnit: body.price_unit,
        incoterm: body.incoterm ?? 'EXW',
        marketPrice: body.market_price ?? 0,
        status: body.status ?? 'Draft',
        validUntil: body.valid_until ? new Date(body.valid_until) : undefined,
        notes: body.notes,
      },
      include: {
        partner: true,
        product: { include: { brand: true } }
      }
    });

    const mappedItem = mapItem(newItem);
    return NextResponse.json({ data: mappedItem }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const updatedItem = await prisma.tradingItem.update({
      where: { id },
      data: { status },
      include: {
        partner: true,
        product: { include: { brand: true } }
      }
    });

    const mappedItem = mapItem(updatedItem);
    return NextResponse.json({ data: mappedItem });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
