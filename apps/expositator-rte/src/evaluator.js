export class EvaluatorEngine {
    constructor(onUpdate) {
        this.onUpdate = onUpdate;
        // Lexicón de penalización 2026
        this.fillers = ['eh', 'este', 'bueno', 'o sea', 'digamos', 'tipo', 'nada', 'pues', 'entonces'];
        this.state = {
            score: 10.0,
            wordCount: 0,
            fillerCount: 0,
            silenceCount: 0,
            startTime: 0,
            logs: []
        };
    }

    start() {
        this.state.startTime = Date.now();
        this.state.score = 10.0;
        this.state.wordCount = 0;
        this.state.fillerCount = 0;
        this.state.silenceCount = 0;
        this.state.logs = [];
    }

    processUtterance(text) {
        if (!text) return;
        const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
        this.state.wordCount += words.length;

        let localFillers = 0;
        words.forEach(word => {
            if (this.fillers.includes(word)) {
                this.state.fillerCount++;
                localFillers++;
                this.state.score = Math.max(0, this.state.score - 0.25); // Penalización estricta por muletilla
            }
        });

        if (localFillers > 0) {
            this.logEvent('ERR_LEXICAL_FILLER', { 
                count: localFillers, 
                context: text, 
                deduction: (localFillers * 0.25).toFixed(2) 
            });
        }

        this.dispatchUpdate();
    }

    processSilence(durationMs) {
        this.state.silenceCount++;
        this.state.score = Math.max(0, this.state.score - 0.5); // Penalización por silencio largo
        this.logEvent('ERR_COGNITIVE_SILENCE', { 
            duration_ms: durationMs, 
            threshold_exceeded_by_ms: durationMs - 3000,
            deduction: 0.5 
        });
        this.dispatchUpdate();
    }

    logEvent(type, payload) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            payload,
            score_after_event: parseFloat(this.state.score.toFixed(2))
        };
        this.state.logs.push(logEntry);
        this.state.latestLog = logEntry;
    }

    dispatchUpdate() {
        const elapsedMinutes = (Date.now() - this.state.startTime) / 60000;
        const wpm = elapsedMinutes > 0.1 ? Math.round(this.state.wordCount / elapsedMinutes) : 0;

        this.onUpdate({
            wpm: wpm,
            fillerCount: this.state.fillerCount,
            silenceCount: this.state.silenceCount,
            score: this.state.score,
            latestLog: this.state.latestLog
        });
        
        this.state.latestLog = null; // reset per tick
    }

    stop() {
        this.logEvent('SYS_HALT', { state: 'finalized' });
        return {
            final_score: this.state.score,
            total_words: this.state.wordCount,
            total_fillers: this.state.fillerCount,
            total_silences: this.state.silenceCount,
            session_duration_ms: Date.now() - this.state.startTime,
            telemetry: this.state.logs
        };
    }
}
