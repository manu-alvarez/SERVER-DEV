import { Router } from 'express';
import { ProviderFactory } from '../providers/index.js';

const router = Router();

type Modo =
  | 'traducir_estandar'
  | 'traducir'
  | 'traducir_profesional'
  | 'traducir_coloquial'
  | 'resumir'
  | 'traducir_resumir';
type Nivel = 'breve' | 'normal' | 'detallado';

router.post('/process', async (req, res) => {
  try {
    const {
      texto,
      origen = 'auto',
      destino = 'es',
      modo = 'traducir_resumir',
      nivelResumen = 'normal',
    }: {
      texto: string;
      origen?: string;
      destino?: string;
      modo?: Modo;
      nivelResumen?: Nivel;
    } = req.body;

    if (!texto || !texto.trim()) {
      return res.status(400).json({ error: 'Texto vacío' });
    }

    const detalleMap: Record<Nivel, string> = {
      breve: 'muy breve (1-3 frases)',
      normal: 'de longitud media (3-6 frases)',
      detallado: 'detallado pero conciso (varios párrafos breves)',
    };

    let systemPrompt = '';
    if (modo === 'traducir_estandar') {
      systemPrompt = `Realiza una traducción ESTÁNDAR y equilibrada de ${origen} a ${destino}. Debe ser correcta, clara y neutra.
      traduccion = <texto traducido>, resumen = ""`;
    } else if (modo === 'traducir') {
      systemPrompt = `Realiza una traducción ORIGINAL de ${origen} a ${destino}. Debe ser NATURAL y fluida, respetando el estilo original del autor.
      traduccion = <texto traducido>, resumen = ""`;
    } else if (modo === 'traducir_profesional') {
      systemPrompt = `Eres un traductor de alto nivel. Realiza una traducción PROFESIONAL, CRÍTICA y EXPERTA de ${origen} a ${destino}. Usa un tono formal, técnico y preciso.
      traduccion = <texto traducido>, resumen = ""`;
    } else if (modo === 'traducir_coloquial') {
      systemPrompt = `Realiza una traducción COLOQUIAL, SENCILLA y BREVE de ${origen} a ${destino}. Usa un lenguaje directo y cotidiano.
      traduccion = <texto traducido>, resumen = ""`;
    } else if (modo === 'resumir') {
      systemPrompt = `No traduzcas. Resume el texto en su idioma original (${origen}).
      Nivel de resumen: ${detalleMap[nivelResumen]}.
      traduccion = "", resumen = <resumen>`;
    } else if (modo === 'traducir_resumir') {
      systemPrompt = `Primero traduce al idioma ${destino} y luego haz el resumen SOBRE EL TEXTO TRADUCIDO.
      Nivel de resumen: ${detalleMap[nivelResumen]}.
      traduccion = <traducción>, resumen = <resumen>`;
    }

    const system = `
Eres un asistente experto en traducción y resumen.
Devuelves SIEMPRE un JSON válido con esta forma:
{
  "traduccion": "...",
  "resumen": "..."
}
Instrucción específica: ${systemPrompt}
- Si el idioma origen es "auto", detecta el idioma tú mismo.
- No añadas explicaciones fuera del JSON.
    `.trim();

    const providersToTry = ['groq', 'gemini', 'openrouter', 'openai'];
    let lastError: any = null;
    let successfulProvider = '';
    let parsed: any = null;

    for (const providerName of providersToTry) {
      try {
        console.log(`[process] Intentando proveedor: ${providerName}`);
        const aiProvider = ProviderFactory.create(providerName);
        const completion = await aiProvider.chat.completions.create({
          model: aiProvider.getDefaultModel(),
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            {
              role: 'user',
              content: JSON.stringify({ texto, origen, destino, modo, nivelResumen }),
            },
          ],
        });

        const raw = completion.choices[0]?.message?.content || '{}';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
        successfulProvider = providerName;
        console.log(`[process] Completado con éxito usando proveedor: ${providerName}`);
        break;
      } catch (err: any) {
        console.warn(`[process] Proveedor ${providerName} falló:`, err?.message || err);
        lastError = err;
      }
    }

    if (!parsed) {
      return res.status(502).json({
        error: 'Todos los proveedores de IA fallaron',
        details: lastError?.message || lastError,
      });
    }

    return res.json({
      traduccion: parsed.traduccion ?? '',
      resumen: parsed.resumen ?? '',
      provider: successfulProvider,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      error: 'Error procesando el texto',
      details: err?.message,
    });
  }
});

export default router;
