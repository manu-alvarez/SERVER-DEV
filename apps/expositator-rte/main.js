import { initSpeechEngine, stopSpeechEngine } from './speech.js';
import { handleVisionSync } from './vision.js';
import { EvaluatorEngine } from './evaluator.js';

const DOM = {
    btnStart: document.getElementById('btn-start'),
    btnSaveApi: document.getElementById('btn-save-api'),
    video: document.getElementById('webcam-viewport'),
    dropzone: document.getElementById('dropzone'),
    capturePreview: document.getElementById('current-capture'),
    logs: document.getElementById('logs-container'),
    transcript: document.getElementById('live-transcript'),
    score: document.getElementById('live-score'),
    wpm: document.getElementById('metric-wpm'),
    fillers: document.getElementById('metric-fillers'),
    deviations: document.getElementById('metric-deviations'),
    statusDot: document.getElementById('status-dot'),
    apiKeyInput: document.getElementById('gemini-api-key'),
    knowledgeUpload: document.getElementById('knowledge-upload'),
    knowledgeStatus: document.getElementById('knowledge-status')
};

let activeStream = null;
let isRunning = false;
let evaluator = null;
let knowledgeBaseText = "";

if (localStorage.getItem('gemini_api_key')) {
    DOM.apiKeyInput.value = localStorage.getItem('gemini_api_key');
    DOM.btnSaveApi.textContent = '✓ GUARDADA';
    DOM.btnSaveApi.classList.replace('text-slate-300', 'text-emerald-400');
}

DOM.btnSaveApi.addEventListener('click', () => {
    const key = DOM.apiKeyInput.value.trim();
    if (key !== '') {
        localStorage.setItem('gemini_api_key', key);
        DOM.btnSaveApi.textContent = '✓ GUARDADA';
        DOM.btnSaveApi.classList.replace('text-slate-300', 'text-emerald-400');
        logToTribunal({ level: 'INFO', event: 'API_KEY_STORED_LOCALLY' });
    }
});

DOM.knowledgeUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        knowledgeBaseText = evt.target.result;
        DOM.knowledgeStatus.textContent = `✅ Base cargada: ${file.name} (${Math.round(knowledgeBaseText.length/1024)} KB)`;
        DOM.knowledgeStatus.className = 'text-[10px] text-emerald-400';
    };
    reader.readAsText(file);
});

function logToTribunal(payload) {
    const entry = document.createElement('div');
    entry.className = `p-2 rounded border font-mono text-[11px] whitespace-pre-wrap ${payload.level === 'CRITICAL' || payload.level === 'WARNING' ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-slate-900 border-slate-700'}`;
    entry.textContent = JSON.stringify({ timestamp: new Date().toISOString(), ...payload }, null, 2);
    DOM.logs.prepend(entry);
}

function updateMetricsUI(state) {
    DOM.score.textContent = state.score.toFixed(1);
    DOM.wpm.textContent = state.wpm;
    DOM.fillers.textContent = state.fillerCount;
    DOM.deviations.textContent = state.deviationCount;
    
    if (state.score < 5.0) DOM.score.className = 'text-3xl text-red-500 font-bold';
    else if (state.score < 8.0) DOM.score.className = 'text-3xl text-amber-400 font-bold';
    else DOM.score.className = 'text-3xl text-emerald-400 font-bold';
}

async function initMedia() {
    try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        DOM.video.srcObject = new MediaStream([activeStream.getVideoTracks()[0]]);
        return true;
    } catch (err) {
        logToTribunal({ level: 'CRITICAL', error: 'Hardware access denied' });
        return false;
    }
}

DOM.btnStart.addEventListener('click', async () => {
    if (!isRunning) {
        if (await initMedia()) {
            isRunning = true;
            DOM.btnStart.textContent = 'FINALIZAR';
            DOM.statusDot.classList.replace('bg-slate-500', 'bg-red-500');
            DOM.statusDot.classList.add('animate-pulse');
            
            DOM.logs.innerHTML = '';
            evaluator = new EvaluatorEngine(logToTribunal, updateMetricsUI);
            
            if (DOM.apiKeyInput.value && knowledgeBaseText) {
                evaluator.setupRAG(DOM.apiKeyInput.value, knowledgeBaseText);
                logToTribunal({ level: 'INFO', event: 'RAG_ENGINE_ARMED' });
            }
            
            evaluator.start();
            handleVisionSync(DOM.dropzone, DOM.capturePreview, evaluator);
            
            initSpeechEngine(
                (text) => { DOM.transcript.textContent = text; },
                (utteranceData) => { evaluator.processUtterance(utteranceData); },
                (silenceDuration) => { evaluator.processSilence(silenceDuration); },
                (err) => { logToTribunal({ level: 'CRITICAL', source: 'STT', error: err }); }
            );
        }
    } else {
        isRunning = false;
        if (activeStream) activeStream.getTracks().forEach(t => t.stop());
        stopSpeechEngine();
        evaluator.stop();
        
        DOM.btnStart.textContent = 'INICIAR SESIÓN';
        DOM.statusDot.classList.replace('bg-red-500', 'bg-slate-500');
        DOM.statusDot.classList.remove('animate-pulse');
    }
});
