import { useState } from 'react'
import {
  Box, Card, Typography, Button, Grid, Snackbar, Alert,
} from '@mui/material'
import {
  Email as EmailIcon, ContentCopy as CopyIcon, CheckCircle as CheckIcon,
  Summarize as TemplateIcon,
} from '@mui/icons-material'

interface Template {
  id: string
  category: string
  title: string
  body: string
}

const TEMPLATES: Template[] = [
  {
    id: 'negotiation',
    category: 'Negociación',
    title: 'Solicitud de mejora de tarifa',
    body: `Asunto: Solicitud de revisión de tarifa - [RUTA]

Estimado/a [NOMBRE],

Agradecemos la cotización recibida para la ruta [ORIGEN → DESTINO] con referencia [REF].

Actualmente estamos evaluando varias opciones y nos gustaría solicitar una revisión de su tarifa actual de [TARIFA_ACTUAL] para ajustarla a las condiciones del mercado.

Estamos comprometidos a enviar un volumen significativo de [VOLUMEN] contenedores/mes en esta ruta y creemos que una tarifa revisada beneficiaría a ambas partes.

Agradeceríamos su mejor oferta antes del [FECHA].

Quedo a la espera de sus noticias.

Saludos cordiales,
[NOMBRE]
[EMPRESA]
[TELÉFONO]`,
  },
  {
    id: 'confirmation',
    category: 'Confirmación',
    title: 'Confirmación de reserva',
    body: `Asunto: Confirmación de reserva - [REF]

Estimado/a [NOMBRE],

Por la presente confirmamos la reserva del siguiente envío:

• Referencia: [REF]
• Ruta: [ORIGEN] → [DESTINO]
• Fecha estimada de salida: [FECHA_SALIDA]
• Tipo de contenedor: [TIPO_CONTENEDOR]
• Mercancía: [DESCRIPCION]
• Incoterm: [INCOTERM]

Adjuntamos la documentación correspondiente:
- Instrucciones de carga
- Documentos de transporte
- Certificados requeridos

Por favor, confirmen recepción y envíen el número de booking/tracking a la mayor brevedad.

Saludos cordiales,
[NOMBRE]
[EMPRESA]`,
  },
  {
    id: 'clarification',
    category: 'Aclaración',
    title: 'Solicitud de aclaración documental',
    body: `Asunto: Solicitud de aclaración - Documentación - [REF]

Estimado/a [NOMBRE],

En relación con el envío referenciado [REF], le agradeceríamos nos aclarase los siguientes puntos respecto a la documentación presentada:

1. [PUNTO 1 - Ej: El peso declarado no coincide con el peso bruto en el packing list]
2. [PUNTO 2 - Ej: Falta el certificado de origen para el tratamiento arancelario preferencial]
3. [PUNTO 3 - Ej: La descripción de la mercancía es insuficiente para clasificación HS]

Agradeceríamos nos remitan la documentación corregida antes de [FECHA] para evitar demoras en el despacho aduanero.

Quedo a su disposición para cualquier aclaración adicional.

Saludos cordiales,
[NOMBRE]
[EMPRESA]`,
  },
  {
    id: 'void_fill',
    category: 'Estiba',
    title: 'Instrucciones de estiba y void fill',
    body: `Asunto: Instrucciones de estiba - Contenedor [NRO_CONTENEDOR]

Estimado/a [NOMBRE],

Adjuntamos las instrucciones de estiba para el contenedor [NRO_CONTENEDOR] con referencia [REF]:

ESPECIFICACIONES DE CARGA:
• Tipo de contenedor: [TIPO]
• Peso total estimado: [PESO] kg
• Volumen total: [VOLUMEN] CBM
• Número de bultos/palets: [BULTOS]

INSTRUCCIONES DE ESTIBA:
1. Distribuir la carga uniformemente en el contenedor
2. No exceder el peso máximo por eje
3. Utilizar materiales de estiba adecuados (air bags, espuma o madera)
4. Asegurar la carga con flejes y esquineros
5. Dejar espacio mínimo del 5% para materiales de estiba

MATERIALES RECOMENDADOS:
• [MATERIAL_ESTIBA] para el void fill estimado de [CBM_VOID] CBM
• Esquineros de cartón en todas las esquinas
• Fleje de poliéster o acero según peso

Por favor, confirmen que las instrucciones se han cumplido antes del cierre del contenedor.

Saludos cordiales,
[NOMBRE]
[EMPRESA]`,
  },
  {
    id: 'claim',
    category: 'Reclamación',
    title: 'Reclamación por daños o retraso',
    body: `Asunto: RECLAMACIÓN - Daños/Retraso - Envío [REF]

Estimado/a [NOMBRE],

Por la presente formalizamos una reclamación en relación con el envío [REF] ([ORIGEN] → [DESTINO]).

DETALLES DE LA RECLAMACIÓN:
• Fecha del incidente: [FECHA]
• Tipo de incidencia: [DAÑOS/RETRASO/PERDIDA]
• Descripción: [DESCRIPCION_DETALLADA]
• Valor de la mercancía afectada: [VALOR] [DIVISA]
• Referencia del conocimiento de embarque: [B/L o AWB]

DOCUMENTACIÓN ADJUNTA:
□ Conocimiento de embarque original
□ Factura comercial
□ Packing list
□ Fotografías de los daños (si aplica)
□ Informe de peritaje (si aplica)
□ Certificado de seguro (si aplica)

Solicitamos:
1. Investigación del incidente
2. Respuesta en un plazo máximo de 15 días hábiles
3. Compensación según lo estipulado en el contrato de transporte

Quedamos a la espera de su respuesta.

Atentamente,
[NOMBRE]
[EMPRESA]`,
  },
]

export default function EmailTemplates() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const handleCopy = async (t: Template) => {
    let success = false;
    try {
      await navigator.clipboard.writeText(t.body)
      success = true;
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = t.body
        document.body.appendChild(ta)
        ta.select()
        success = document.execCommand('copy')
        document.body.removeChild(ta)
      } catch (e) {
        success = false;
      }
    }
    
    if (success) {
      setCopiedId(t.id)
      setToast(`Plantilla "${t.title}" copiada`)
      setTimeout(() => setCopiedId(null), 2000)
    } else {
      setToast(`Error al copiar: Permiso denegado`)
    }
  }

  const categories = [...new Set(TEMPLATES.map(t => t.category))]

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmailIcon sx={{ color: 'primary.main' }} />
        Plantillas de Email
      </Typography>

      {categories.map(cat => (
        <Box key={cat} sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 1.5 }}>
            {cat}
          </Typography>
          <Grid container spacing={2}>
            {TEMPLATES.filter(t => t.category === cat).map(t => (
              <Grid key={t.id} size={{ xs: 12 }}>
                <Card sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TemplateIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      {t.title}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={copiedId === t.id ? <CheckIcon /> : <CopyIcon />}
                      onClick={() => handleCopy(t)}
                      color={copiedId === t.id ? 'success' : 'primary'}
                    >
                      {copiedId === t.id ? 'Copiado' : 'Copiar'}
                    </Button>
                  </Box>
                  <Box
                    sx={{
                      p: 2, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.3)',
                      fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.6,
                      color: 'text.secondary', whiteSpace: 'pre-wrap',
                      maxHeight: 200, overflow: 'auto',
                      border: '1px solid', borderColor: 'divider',
                    }}
                  >
                    {t.body}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      <Snackbar open={!!toast} autoHideDuration={2000} onClose={() => setToast(null)}>
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>{toast}</Alert>
      </Snackbar>
    </Card>
  )
}
