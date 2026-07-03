export class STTEngine {
    constructor(onPartial, onFinal, onSilence) {
        // [WARNING] Utiliza Web Speech API, puede requerir conexión en Chrome.
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            throw new Error("ERR_API_MISSING: Web Speech API. Require Chromium 2026+");
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'es-ES';
        
        this.onPartial = onPartial;
        this.onFinal = onFinal;
        this.onSilence = onSilence;
        
        this.lastSpeechTime = Date.now();
        this.silenceInterval = null;
        this.isRecording = false;
        this.silenceReported = false;

        this.recognition.onresult = (event) => {
            this.lastSpeechTime = Date.now();
            this.silenceReported = false; // reset flag on new speech
            
            let interimTranscript = '';
            let finalTranscript = '';
            let confidence = 0;

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const res = event.results[i];
                if (res.isFinal) {
                    finalTranscript += res[0].transcript;
                    confidence = res[0].confidence;
                } else {
                    interimTranscript += res[0].transcript;
                }
            }

            if (finalTranscript !== '') {
                this.onFinal(finalTranscript.trim(), confidence);
            } else if (interimTranscript !== '') {
                this.onPartial(interimTranscript.trim());
            }
        };

        this.recognition.onerror = (event) => {
            console.warn("STT_WARN:", event.error);
        };
        
        this.recognition.onend = () => {
            if (this.isRecording) {
                try { this.recognition.start(); } catch(e) {}
            }
        };
    }

    start() {
        this.isRecording = true;
        this.lastSpeechTime = Date.now();
        this.silenceReported = false;
        this.recognition.start();
        
        // Timer de alta frecuencia para precisión de telemetría (< 50ms drift)
        this.silenceInterval = setInterval(() => {
            const silenceDuration = Date.now() - this.lastSpeechTime;
            if (silenceDuration >= 3000 && !this.silenceReported) {
                this.onSilence(silenceDuration);
                this.silenceReported = true; // Prevents triggering every 100ms
            }
        }, 100);
    }

    stop() {
        this.isRecording = false;
        clearInterval(this.silenceInterval);
        this.recognition.stop();
    }
}
