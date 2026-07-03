let recognition = null;
let silenceInterval = null;
let lastSpeechTime = 0;
let isRecording = false;

export function initSpeechEngine(onPartial, onUtterance, onSilence, onError) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        onError('SpeechRecognition API not supported. Requires Chromium V8.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    lastSpeechTime = Date.now();
    isRecording = true;
    let silenceReported = false;

    recognition.onresult = (event) => {
        lastSpeechTime = Date.now();
        silenceReported = false;
        
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
            onPartial(finalTranscript.trim());
            onUtterance({
                text: finalTranscript.trim(),
                confidence: event.results[event.results.length - 1][0].confidence,
                timestamp: Date.now()
            });
        } else if (interimTranscript) {
            onPartial(interimTranscript.trim());
        }
    };

    recognition.onerror = (e) => onError(e.error);
    
    recognition.onend = () => {
        if (isRecording) {
            try { recognition.start(); } catch(e) {}
        }
    };

    recognition.start();

    silenceInterval = setInterval(() => {
        if (!isRecording) return;
        const silenceDuration = Date.now() - lastSpeechTime;
        if (silenceDuration >= 3000 && !silenceReported) {
            onSilence(silenceDuration);
            silenceReported = true;
        }
    }, 100);
}

export function stopSpeechEngine() {
    isRecording = false;
    if (silenceInterval) clearInterval(silenceInterval);
    if (recognition) recognition.stop();
}
