import { useCallback, useRef } from 'react';
import { useExpositatorStore } from '../store/expositatorStore';

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const useEvaluator = () => {
  const { addLog, updateMetrics } = useExpositatorStore();
  const utteranceBufferRef = useRef<string[]>([]);
  const fillers = ['eh', 'este', 'bueno', 'o sea', 'digamos', 'tipo', 'nada', 'pues', 'entonces', 'mmm'];
  const wordCountRef = useRef(0);
  const fillerCountRef = useRef(0);
  const deviationCountRef = useRef(0);
  const scoreRef = useRef(10.0);
  const startTimeRef = useRef(0);

  const resetMetrics = useCallback(() => {
    wordCountRef.current = 0;
    fillerCountRef.current = 0;
    deviationCountRef.current = 0;
    scoreRef.current = 10.0;
    startTimeRef.current = Date.now();
    utteranceBufferRef.current = [];
  }, []);

  const dispatchMetrics = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 60000;
    const wpm = elapsed > 0.05 ? Math.round(wordCountRef.current / elapsed) : 0;
    updateMetrics({
      score: scoreRef.current,
      wpm,
      fillers: fillerCountRef.current,
      deviations: deviationCountRef.current
    });
  }, [updateMetrics]);

  const applyPenalty = useCallback((amount: number, reason: string, details?: any) => {
    scoreRef.current = Math.max(0, parseFloat((scoreRef.current - amount).toFixed(2)));
    addLog({ level: 'WARNING', type: 'RTE_PENALTY', message: reason, details: { deduction: amount, new_score: scoreRef.current, ...details } });
    dispatchMetrics();
  }, [addLog, dispatchMetrics]);

  const processUtterance = useCallback(async (data: { text: string }) => {
    const words = data.text.toLowerCase().match(/\b(\w+)\b/g) || [];
    wordCountRef.current += words.length;
    
    let localFillers = 0;
    words.forEach(word => { if (fillers.includes(word)) localFillers++; });
    
    if (localFillers > 0) {
      fillerCountRef.current += localFillers;
      applyPenalty(0.25 * localFillers, 'LEXICAL_FILLER', `Detectadas ${localFillers} muletillas.`);
    }

    utteranceBufferRef.current.push(data.text);
    
    if (utteranceBufferRef.current.length >= 2) {
      const blockToEvaluate = utteranceBufferRef.current.join(" ");
      utteranceBufferRef.current = []; 

      const { apiKey, knowledgeBase } = useExpositatorStore.getState();
      
      if (apiKey && knowledgeBase) {
        const prompt = `
        Actúa como Tribunal de Oposiciones.
        BASE DE CONOCIMIENTO OBLIGATORIA:
        ${knowledgeBase}

        CONTEXTO VISUAL ACTUAL DEL OPOSITOR: Ninguna diapositiva
        LO QUE ACABA DE DECIR EL OPOSITOR: "${blockToEvaluate}"

        Evalúa si lo dicho es correcto según la base de conocimiento. 
        Responde ÚNICAMENTE con un JSON estricto:
        {"aligned": true/false, "deviation_reason": "explicación breve si es false o null si es true", "penalty": 0.0 a 0.5}
        `;

        try {
          const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const apiData = await response.json();
          const jsonStr = apiData.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
          const result = JSON.parse(jsonStr);
          
          if (result && result.aligned === false) {
            deviationCountRef.current++;
            applyPenalty(result.penalty || 0.3, 'SEMANTIC_DEVIATION', result.deviation_reason);
          } else if (result && result.aligned === true) {
            addLog({ level: 'INFO', type: 'RAG_VALIDATION', message: 'Conceptually aligned' });
          }
        } catch (error) {
          addLog({ level: 'CRITICAL', type: 'RAG_ERROR', message: 'API_TIMEOUT_OR_PARSE_FAIL' });
        }
      }
    }
    dispatchMetrics();
  }, [applyPenalty, addLog, dispatchMetrics]);

  const processSilence = useCallback((durationMs: number) => {
    applyPenalty(0.5, 'COGNITIVE_SILENCE', { duration_ms: durationMs });
  }, [applyPenalty]);

  return { resetMetrics, processUtterance, processSilence };
};
