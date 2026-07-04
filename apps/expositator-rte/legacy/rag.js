export class RagEngine {
    constructor() {
        this.endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
        this.apiKey = "";
        this.knowledgeBase = "";
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    setKnowledgeBase(text) {
        this.knowledgeBase = text;
    }

    isReady() {
        return this.apiKey.length > 0 && this.knowledgeBase.length > 0;
    }

    async evaluateSemanticAlignment(transcript, slideContext) {
        if (!this.isReady()) return null;

        const prompt = `
        Actúa como Tribunal de Oposiciones.
        BASE DE CONOCIMIENTO OBLIGATORIA:
        ${this.knowledgeBase}

        CONTEXTO VISUAL ACTUAL DEL OPOSITOR: ${slideContext || 'Ninguna diapositiva'}
        LO QUE ACABA DE DECIR EL OPOSITOR: "${transcript}"

        Evalúa si lo dicho es correcto según la base de conocimiento. 
        Responde ÚNICAMENTE con un JSON estricto:
        {"aligned": true/false, "deviation_reason": "explicación breve si es false o null si es true", "penalty": 0.0 a 0.5}
        `;

        try {
            const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            const jsonStr = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            return { error: "API_TIMEOUT_OR_PARSE_FAIL" };
        }
    }
}
