import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let whereClause: any = { isActive: true };

    if (type && type !== 'all') {
      whereClause.type = type;
    }
    
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

    return NextResponse.json({ data, count: data.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await prisma.partner.create({
      data: {
        name: body.name,
        type: body.type,
        email: body.email,
        phone: body.phone,
        country: body.country,
        address: body.address,
        creditLimit: body.credit_limit ?? 0,
        paymentTerms: body.payment_terms ?? 'Net 30',
      }
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    const mappedUpdates: any = { ...updates };
    if (updates.credit_limit !== undefined) mappedUpdates.creditLimit = updates.credit_limit;
    if (updates.payment_terms !== undefined) mappedUpdates.paymentTerms = updates.payment_terms;

    const data = await prisma.partner.update({
      where: { id },
      data: mappedUpdates
    });

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
