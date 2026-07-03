// PDF Export Utility — Uses jsPDF to generate compliant RFQ documents
import { jsPDF } from 'jspdf'

interface RfqPdfOptions {
    content: string
    origin: string
    destination: string
    mode: string
    date?: string
}

/**
 * Generate a professional PDF from RFQ content.
 * The PDF follows business document standards with proper formatting.
 */
export function exportRfqToPdf({ content, origin, destination, mode, date }: RfqPdfOptions): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    const dateStr = date || new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })

    const modeLabel = mode === 'mar' ? 'Marítimo' : mode === 'aire' ? 'Aéreo' : 'Terrestre'

    // ─── Header ───
    // Blue header bar
    doc.setFillColor(0, 21, 46) // Navy #00152E
    doc.rect(0, 0, pageWidth, 35, 'F')

    doc.setTextColor(0, 180, 216) // Cyan #00B4D8
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('LogiSearch AI', margin, 15)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Solicitud de Cotización (RFQ)', margin, 23)

    // Route summary on header
    doc.setFontSize(9)
    doc.setTextColor(150, 200, 220)
    doc.text(`${origin} → ${destination} | ${modeLabel} | ${dateStr}`, margin, 30)

    // ─── Content ───
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(content, contentWidth)

    let y = 45
    const lineHeight = 5

    for (const line of lines) {
        // Check if we need a new page
        if (y + lineHeight > pageHeight - 25) {
            // Footer on current page
            addFooter(doc, pageWidth, pageHeight, margin)
            doc.addPage()
            y = 20
        }

        // Check if line is a heading (all caps or starts with number + dot)
        if (line.match(/^[A-ZÁÉÍÓÚÑ\d][A-ZÁÉÍÓÚÑ\s\d.:()]+$/) || line.match(/^\d+\.\s/)) {
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            doc.setTextColor(0, 21, 46)
            y += 3 // Extra spacing before headings
        } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9.5)
            doc.setTextColor(60, 60, 60)
        } else {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(40, 40, 40)
        }

        doc.text(line, margin, y)
        y += lineHeight
    }

    // ─── Footer on last page ───
    addFooter(doc, pageWidth, pageHeight, margin)

    // ─── Compliance notice ───
    y = Math.min(y + 10, pageHeight - 30)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5

    doc.setFontSize(7)
    doc.setTextColor(130, 130, 130)
    doc.setFont('helvetica', 'italic')
    const notice = 'Este documento ha sido generado por LogiSearch AI. Los datos proporcionados son estimaciones basadas en información de mercado en tiempo real. Las cotizaciones definitivas deben ser confirmadas por el transportista/freight forwarder. Conforme a Incoterms® 2020 (ICC).'
    const noticeLines = doc.splitTextToSize(notice, contentWidth)
    noticeLines.forEach((nl: string) => {
        doc.text(nl, margin, y)
        y += 3.5
    })

    // Save file
    const filename = `RFQ_${origin.replace(/\s+/g, '_')}_${destination.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`
    doc.save(filename)
}

function addFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number): void {
    doc.setFillColor(0, 21, 46)
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')
    doc.setTextColor(100, 140, 160)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('LogiSearch AI © 2026 — logisearch.ai', margin, pageHeight - 5)
    doc.text('Documento generado automáticamente', pageWidth - margin - 55, pageHeight - 5)
}
