'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const localInvoices: Record<string, {
  number: string; partner: string; partnerAddress: string; type: string;
  incoterm: string; issueDate: string; dueDate: string; status: string;
  items: Array<{ brand: string; product: string; ean: string; qty: number; price: number; total: number }>;
  totalNet: number; taxPercent: number; totalGross: number;
}> = {};

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}



export default function InvoiceViewPage() {
  const params = useParams();
  const inv = localInvoices[params.id as string];

  if (!inv) {
    return (
      <div className="text-center py-20 text-[#605E5C]">
        <p className="text-lg font-semibold">Factura no encontrada</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Toolbar (hidden when printing) */}
      <div className="flex justify-between items-center no-print">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => window.history.back()}>
          Volver
        </Button>
        <div className="flex space-x-2">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button variant="primary" icon={Download}>
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <Card padding={false}>
        <div className="p-8 space-y-8" id="invoice-print">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-[#EDEBE9] pb-6">
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#f43f5e] flex items-center justify-center mb-3">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <h1 className="text-2xl font-bold text-[#323130]">PROFORMA INVOICE</h1>
              <p className="text-sm text-[#605E5C]">Teringo</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#f43f5e] font-mono">{inv.number}</p>
              <p className="text-xs text-[#605E5C]">Issue: {inv.issueDate}</p>
              <p className="text-xs text-[#605E5C]">Due: {inv.dueDate}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase text-[#605E5C] tracking-wider mb-1">Seller</p>
              <p className="font-bold">Perfume Trading SL</p>
              <p className="text-[#605E5C]">Calle Mayor 42</p>
              <p className="text-[#605E5C]">28001 Madrid, España</p>
              <p className="text-[#605E5C]">VAT: ES-B12345678</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-[#605E5C] tracking-wider mb-1">Buyer</p>
              <p className="font-bold">{inv.partner}</p>
              <p className="text-[#605E5C]">{inv.partnerAddress}</p>
              <p className="text-[#605E5C]">VAT: DE-123456789</p>
            </div>
          </div>

          {/* Incoterm & Payment */}
          <div className="grid grid-cols-3 gap-4 text-xs bg-[#F3F2F1] p-4">
            <div>
              <span className="font-semibold text-[#605E5C]">Incoterm:</span>
              <span className="ml-2 font-mono font-bold">{inv.incoterm}</span>
            </div>
            <div>
              <span className="font-semibold text-[#605E5C]">Payment Terms:</span>
              <span className="ml-2">Net 30</span>
            </div>
            <div>
              <span className="font-semibold text-[#605E5C]">Status:</span>
              <span className="ml-2">{inv.status}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EDEBE9] text-[#605E5C] text-[10px] uppercase tracking-wider">
                <th className="py-2 text-left font-semibold">#</th>
                <th className="py-2 text-left font-semibold">Brand</th>
                <th className="py-2 text-left font-semibold">Product</th>
                <th className="py-2 text-left font-semibold">EAN</th>
                <th className="py-2 text-right font-semibold">Qty</th>
                <th className="py-2 text-right font-semibold">Unit Price</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEBE9]">
              {inv.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 text-[#605E5C]">{idx + 1}</td>
                  <td className="py-3 font-semibold">{item.brand}</td>
                  <td className="py-3">{item.product}</td>
                  <td className="py-3 font-mono text-[11px] text-[#605E5C]">{item.ean}</td>
                  <td className="py-3 text-right">{item.qty}</td>
                  <td className="py-3 text-right">{formatCurrency(item.price)}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#605E5C]">Total Net</span>
                <span>{formatCurrency(inv.totalNet)}</span>
              </div>
              <div className="flex justify-between text-[#605E5C]">
                <span>VAT ({inv.taxPercent}%)</span>
                <span>{formatCurrency(inv.totalNet * inv.taxPercent / 100)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-[#EDEBE9] pt-2">
                <span>Total Gross</span>
                <span className="text-[#f43f5e]">{formatCurrency(inv.totalGross)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[#EDEBE9] pt-4 text-[10px] text-[#605E5C] text-center">
            <p>Perfume Trading SL — CIF: B-12345678 — info@perfumetrading.com</p>
            <p className="mt-1">This is a computer-generated proforma invoice. No signature required.</p>
          </div>
        </div>
      </Card>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          #invoice-print { box-shadow: none !important; border: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
