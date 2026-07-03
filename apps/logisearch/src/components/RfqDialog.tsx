import { useState } from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, IconButton, Divider,
} from '@mui/material'
import {
    Description as FileTextIcon,
    Close as CloseIcon,
    ContentCopy as CopyIcon,
    Save as SaveIcon,
    CheckCircle as CheckIcon,
    PictureAsPdf as PdfIcon,
} from '@mui/icons-material'
import { exportRfqToPdf } from '../utils/pdfExport'

interface RfqDialogProps {
    open: boolean
    onClose: () => void
    content: string
    onSave?: () => Promise<void>
    canSave?: boolean
    origin?: string
    destination?: string
    mode?: string
}

export default function RfqDialog({ open, onClose, content, onSave, canSave, origin, destination, mode }: RfqDialogProps) {
    const [copied, setCopied] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            const textArea = document.createElement('textarea')
            textArea.value = content
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleSave = async () => {
        if (!onSave) return
        setSaving(true)
        try {
            await onSave()
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } finally {
            setSaving(false)
        }
    }

    const handleExportPdf = () => {
        if (!content) return
        exportRfqToPdf({
            content,
            origin: origin || 'Origen',
            destination: destination || 'Destino',
            mode: mode || 'mar',
        })
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: {
                sx: { maxHeight: '85vh' },
            }}}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FileTextIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h5" component="span">
                        Solicitud de Cotización (RFQ)
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ bgcolor: 'rgba(0,0,0,0.2)', py: 3 }}>
                <Box
                    sx={{
                        p: 3,
                        bgcolor: 'rgba(0,0,0,0.3)',
                        borderRadius: 2,
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.85rem',
                        lineHeight: 1.9,
                        color: 'text.secondary',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        minHeight: 250,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    {content || 'Generando solicitud de cotización...'}
                </Box>

                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 2, textAlign: 'center' }}>
                    Este documento cumple con las normas Incoterms® 2020 (ICC) y la normativa aplicable de comercio.
                </Typography>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                {canSave && (
                    <Button
                        variant="outlined"
                        startIcon={saved ? <CheckIcon /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving || saved}
                        size="small"
                    >
                        {saved ? 'Guardado ✓' : saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                )}
                <Button
                    variant="outlined"
                    startIcon={<PdfIcon />}
                    onClick={handleExportPdf}
                    disabled={!content}
                    size="small"
                    color="primary"
                >
                    Exportar PDF
                </Button>
                <Button
                    variant="contained"
                    startIcon={copied ? <CheckIcon /> : <CopyIcon />}
                    onClick={handleCopy}
                    size="small"
                >
                    {copied ? 'Copiado ✓' : 'Copiar'}
                </Button>
                <Button variant="outlined" onClick={onClose} size="small">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    )
}
