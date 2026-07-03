import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Invoice } from '@/types';

function mapInvoice(inv: any): Invoice {
  return {
    id: inv.id,
    partner_id: inv.partnerId,
    partner_name: inv.partner?.name ?? '',
    invoice_number: inv.invoiceNumber,
    type: inv.type as Invoice['type'],
    incoterm: (inv.incoterm as Invoice['incoterm']) ?? 'EXW',
    total_net: inv.totalNet,
    tax_percent: inv.taxPercent,
    tax_amount: inv.totalNet * (inv.taxPercent / 100),
    total_gross: inv.totalGross,
    status: inv.status as Invoice['status'],
    created_at: inv.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let whereClause = {};
    if (status && status !== 'all') {
      whereClause = { status };
    }

    const data = await prisma.invoice.findMany({
      where: whereClause,
      include: { partner: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const invoices = data.map(mapInvoice);
    return NextResponse.json({ data: invoices, count: invoices.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const totalGross = body.total_net * (1 + (body.tax_percent ?? 21) / 100);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const newInvoice = await prisma.invoice.create({
      data: {
        partnerId: body.partner_id,
        invoiceNumber: invoiceNumber,
        type: body.type,
        incoterm: body.incoterm ?? 'EXW',
        totalNet: body.total_net,
        taxPercent: body.tax_percent ?? 21,
        totalGross: totalGross,
        status: 'Pending',
        dueDate: body.due_date ? new Date(body.due_date) : undefined,
        notes: body.notes,
      },
      include: { partner: true }
    });

    const mappedInvoice = mapInvoice(newInvoice);
    return NextResponse.json({ data: mappedInvoice }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
