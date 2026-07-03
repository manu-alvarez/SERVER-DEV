import prisma from '../prisma';
import type { Invoice, ApiResponse, InvoiceStatus, TradeType, Incoterm } from '@/types';

export interface CreateInvoiceInput {
  partner_id: string;
  type: TradeType;
  incoterm: Incoterm;
  total_net: number;
  tax_percent: number;
  due_date?: string;
  notes?: string;
  items?: Array<{
    product_id: string;
    description?: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const InvoicesService = {
  async list(status?: string): Promise<ApiResponse<Invoice[]>> {
    try {
      let whereClause: any = {};
      if (status && status !== 'all') whereClause.status = status;

      const data = await prisma.invoice.findMany({
        where: whereClause,
        include: { partner: true },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      const invoices = data.map(inv => ({
        id: inv.id,
        partner_id: inv.partnerId,
        partner_name: inv.partner?.name ?? '',
        invoice_number: inv.invoiceNumber,
        type: inv.type as Invoice['type'],
        incoterm: (inv.incoterm as Incoterm) ?? 'EXW',
        total_net: inv.totalNet,
        tax_percent: inv.taxPercent,
        tax_amount: inv.totalNet * (inv.taxPercent / 100),
        total_gross: inv.totalGross,
        status: inv.status as Invoice['status'],
        due_date: inv.dueDate ? inv.dueDate.toISOString() : undefined,
        notes: inv.notes ?? undefined,
        created_at: inv.createdAt.toISOString(),
      }));

      return { data: invoices, count: invoices.length };
    } catch (err) { throw err; }
  },

  async create(input: CreateInvoiceInput): Promise<ApiResponse<Invoice>> {
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
      const taxAmount = input.total_net * (input.tax_percent / 100);
      const totalGross = input.total_net + taxAmount;

      const newInvoice = await prisma.invoice.create({
        data: {
          partnerId: input.partner_id,
          invoiceNumber: invoiceNumber,
          type: input.type,
          incoterm: input.incoterm ?? 'EXW',
          totalNet: input.total_net,
          taxPercent: input.tax_percent,
          totalGross: totalGross,
          status: 'Pending',
          dueDate: input.due_date ? new Date(input.due_date) : undefined,
          notes: input.notes,
          items: input.items ? {
            create: input.items.map(item => ({
              productId: item.product_id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unit_price,
            }))
          } : undefined
        },
        include: { partner: true }
      });

      return { data: {
        id: newInvoice.id,
        partner_id: newInvoice.partnerId,
        partner_name: newInvoice.partner?.name ?? '',
        invoice_number: newInvoice.invoiceNumber,
        type: newInvoice.type as Invoice['type'],
        incoterm: (newInvoice.incoterm as Incoterm) ?? 'EXW',
        total_net: newInvoice.totalNet,
        tax_percent: newInvoice.taxPercent,
        tax_amount: newInvoice.totalNet * (newInvoice.taxPercent / 100),
        total_gross: newInvoice.totalGross,
        status: newInvoice.status as Invoice['status'],
        due_date: newInvoice.dueDate ? newInvoice.dueDate.toISOString() : undefined,
        notes: newInvoice.notes ?? undefined,
        created_at: newInvoice.createdAt.toISOString(),
      }};
    } catch (err) { throw err; }
  },

  async updateStatus(id: string, status: InvoiceStatus): Promise<ApiResponse<Invoice>> {
    try {
      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: { status },
        include: { partner: true }
      });

      return { data: {
        id: updatedInvoice.id,
        partner_id: updatedInvoice.partnerId,
        partner_name: updatedInvoice.partner?.name ?? '',
        invoice_number: updatedInvoice.invoiceNumber,
        type: updatedInvoice.type as Invoice['type'],
        incoterm: (updatedInvoice.incoterm as Incoterm) ?? 'EXW',
        total_net: updatedInvoice.totalNet,
        tax_percent: updatedInvoice.taxPercent,
        tax_amount: updatedInvoice.totalNet * (updatedInvoice.taxPercent / 100),
        total_gross: updatedInvoice.totalGross,
        status: updatedInvoice.status as Invoice['status'],
        due_date: updatedInvoice.dueDate ? updatedInvoice.dueDate.toISOString() : undefined,
        notes: updatedInvoice.notes ?? undefined,
        created_at: updatedInvoice.createdAt.toISOString(),
      }};
    } catch (err) { throw err; }
  },
};
