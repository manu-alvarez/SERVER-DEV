import { startCapture, stopCapture } from './vision.js';
import { STTEngine } from './speech.js';
import { EvaluatorEngine } from './evaluator.js';

const ui = {
    btnStart: document.getElementById('btn-start'),
    video: document.getElementById('screen-viewport'),
    transcript: document.getElementById('transcript-output'),
    log: document.getElementById('log-output'),
    status: document.getElementById('status-indicator'),
    wpm: document.getElementById('metric-wpm'),
    fillers: document.getElementById('metric-fillers'),
    silences: document.getElementById('metric-silences'),
    score: document.getElementById('metric-score'),
    confidence: document.getElementById('stt-confidence'),
    overlay: document.getElementById('semantic-overlay')
};

let isRunning = false;
let stt = null;
let evaluator = null;

const init = async () => {
    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW Registration failed:', err));
    }

    evaluator = new EvaluatorEngine((telemetry) => {
        ui.wpm.textContent = telemetry.wpm;
        ui.fillers.textContent = telemetry.fillerCount;
        ui.silences.textContent = telemetry.silenceCount;
        ui.score.textContent = telemetry.score.toFixed(1);
        
        if (telemetry.latestLog) {
            const logStr = `[${telemetry.latestLog.timestamp.split('T')[1].replace('Z', '')}] ${telemetry.latestLog.type}\n${JSON.stringify(telemetry.latestLog.payload)}\n\n`;
            ui.log.textContent = logStr + ui.log.textContent;
        }
    });

    stt = new STTEngine(
        // onPartial
        (text) => { ui.transcript.textContent = text; },
        // onFinal
        (text, confidence) => {
            ui.transcript.textContent = text;
            ui.confidence.textContent = `CONF: ${(confidence * 100).toFixed(1)}%`;
            evaluator.processUtterance(text);
        },
        // onSilence
        (duration) => { evaluator.processSilence(duration); }
    );

    ui.btnStart.addEventListener('click', async () => {
        if (!isRunning) {
            try {
                const stream = await startCapture();
                ui.video.srcObject = stream;
                stt.start();
                evaluator.start();
                
                isRunning = true;
                ui.btnStart.textContent = 'TERMINATE';
                ui.btnStart.classList.replace('bg-emerald-600', 'bg-red-600');
                ui.btnStart.classList.replace('hover:bg-emerald-500', 'hover:bg-red-500');
                ui.status.textContent = 'SYS_ACTIVE';
                ui.status.classList.add('text-emerald-400', 'border-emerald-500');
                ui.overlay.classList.remove('hidden');
                
                stream.getVideoTracks()[0].onended = () => stopSystem();
            } catch (err) {
                ui.log.textContent = `[ERROR] ${err.message}\n` + ui.log.textContent;
            }
        } else {
            stopSystem();
        }
    });
};

const stopSystem = () => {
    if (!isRunning) return;
    
    stopCapture(ui.video.srcObject);
    ui.video.srcObject = null;
    stt.stop();
    const finalReport = evaluator.stop();
    
    isRunning = false;
    ui.btnStart.textContent = 'INITIALIZE';
    ui.btnStart.classList.replace('bg-red-600', 'bg-emerald-600');
    ui.btnStart.classList.replace('hover:bg-red-500', 'hover:bg-emerald-500');
    ui.status.textContent = 'STANDBY';
    ui.status.classList.remove('text-emerald-400', 'border-emerald-500');
    ui.overlay.classList.add('hidden');
    
    ui.log.textContent = `[SYS_TERMINATED] FINAL SCORE: ${finalReport.final_score.toFixed(1)}\n\n` + ui.log.textContent;
};

document.addEventListener('DOMContentLoaded', init);
