'use server';

import prisma from '@/lib/prisma';

export async function getPartners() {
  return await prisma.partner.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function getProducts() {
  return await prisma.product.findMany({
    include: { brand: true, inventory: true },
    orderBy: { name: 'asc' }
  });
}

export async function getInventory() {
  return await prisma.inventory.findMany({
    include: { product: { include: { brand: true } }, warehouse: true, partner: true },
    orderBy: { receivedAt: 'desc' }
  });
}

export async function getTrades() {
  return await prisma.tradingItem.findMany({
    include: { product: { include: { brand: true } }, partner: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getInvoices() {
  return await prisma.invoice.findMany({
    include: { partner: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getDashboardKpis() {
  const [activeOffers, pendingBids, lowStockCount, activePartners] = await Promise.all([
    prisma.tradingItem.count({ where: { type: 'Offer', status: 'Active' } }),
    prisma.tradingItem.count({ where: { type: 'Bid', status: { in: ['Active', 'Negotiating'] } } }),
    prisma.inventory.count({ where: { quantity: { lt: 20 } } }),
    prisma.partner.count({ where: { isActive: true } })
  ]);

  // For totalSales and avgMargin, we might need aggregations
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentInvoices = await prisma.invoice.findMany({
    where: { status: { in: ['Paid', 'Shipped'] }, createdAt: { gte: thirtyDaysAgo } }
  });
  const totalSales = recentInvoices.reduce((sum, inv) => sum + inv.totalGross, 0);

  // We return the dashboard KPI object
  return {
    totalSales,
    salesChange: 12.5, // Mocked change percentage
    activeOffers,
    pendingBids,
    lowStockCount,
    activePartners,
    avgMargin: 15.0 // Mocked for now, can be computed properly
  };
}

export async function getInvoiceById(id: string) {
  return await prisma.invoice.findUnique({
    where: { id },
    include: {
      partner: true,
      items: {
        include: {
          product: {
            include: { brand: true }
          }
        }
      }
    }
  });
}
