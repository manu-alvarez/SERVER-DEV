import { RagEngine } from './rag.js';

export class EvaluatorEngine {
    constructor(logger, onMetricsUpdate) {
        this.logger = logger;
        this.onMetricsUpdate = onMetricsUpdate;
        this.fillers = ['eh', 'este', 'bueno', 'o sea', 'digamos', 'tipo', 'nada', 'pues', 'entonces', 'mmm'];
        this.rag = new RagEngine();
        this.state = {
            score: 10.0,
            wordCount: 0,
            fillerCount: 0,
            deviationCount: 0,
            startTime: 0,
            activeViewport: null,
            utteranceBuffer: []
        };
    }

    setupRAG(apiKey, knowledgeText) {
        this.rag.setApiKey(apiKey);
        this.rag.setKnowledgeBase(knowledgeText);
    }

    start() {
        this.state.startTime = Date.now();
        this.state.score = 10.0;
        this.state.wordCount = 0;
        this.state.fillerCount = 0;
        this.state.deviationCount = 0;
        this.state.activeViewport = null;
        this.state.utteranceBuffer = [];
    }

    _applyPenalty(amount, reason, details) {
        this.state.score = Math.max(0, parseFloat((this.state.score - amount).toFixed(2)));
        this.logger({ level: 'WARNING', type: 'RTE_PENALTY', deduction: amount, new_score: this.state.score, reason, details });
        this._dispatch();
    }

    async processUtterance(data) {
        const words = data.text.toLowerCase().match(/\b(\w+)\b/g) || [];
        this.state.wordCount += words.length;
        
        let localFillers = 0;
        words.forEach(word => { if (this.fillers.includes(word)) localFillers++; });
        
        if (localFillers > 0) {
            this.state.fillerCount += localFillers;
            this._applyPenalty(0.25 * localFillers, 'LEXICAL_FILLER', `Detectadas ${localFillers} muletillas.`);
        }

        this.state.utteranceBuffer.push(data.text);
        
        if (this.state.utteranceBuffer.length >= 2) {
            const blockToEvaluate = this.state.utteranceBuffer.join(" ");
            this.state.utteranceBuffer = []; 

            if (this.rag.isReady()) {
                const result = await this.rag.evaluateSemanticAlignment(
                    blockToEvaluate, 
                    this.state.activeViewport ? this.state.activeViewport.filename : 'Ninguna'
                );
                
                if (result && result.aligned === false) {
                    this.state.deviationCount++;
                    this._applyPenalty(result.penalty || 0.3, 'SEMANTIC_DEVIATION', result.deviation_reason);
                } else if (result && result.aligned === true) {
                    this.logger({ level: 'INFO', type: 'RAG_VALIDATION', status: 'CONCEPTUALLY_ALIGNED' });
                }
            }
        }
        this._dispatch();
    }

    processSilence(durationMs) {
        this._applyPenalty(0.5, 'COGNITIVE_SILENCE', { duration_ms: durationMs });
    }

    processVisionUpdate(visionData) {
        this.state.activeViewport = visionData;
        this.logger({ level: 'INFO', type: 'VIEWPORT_SYNC', filename: visionData.filename });
    }

    _dispatch() {
        const elapsed = (Date.now() - this.state.startTime) / 60000;
        const wpm = elapsed > 0.05 ? Math.round(this.state.wordCount / elapsed) : 0;
        this.onMetricsUpdate({
            score: this.state.score,
            wpm: wpm,
            fillerCount: this.state.fillerCount,
            deviationCount: this.state.deviationCount
        });
    }

    stop() { return this.state; }
}
