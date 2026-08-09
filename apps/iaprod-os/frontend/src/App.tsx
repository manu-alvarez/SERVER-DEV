import React, { useRef, useEffect, useState } from 'react';
import NeuralOrb from './components/NeuralOrb';
import ModelSelector from './components/ModelSelector';
import './index.css';
import { useCoreLogic } from './hooks/useCoreLogic';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useCamera } from './hooks/useCamera';
import GodModeListener from './components/GodModeListener';
import { ApiConfigModal } from './components/ApiConfigModal';

export default function App() {
  const [input, setInput] = useState('');
  const {
    messages, loading, offlineMode, orbState, speaking,
    setOrbState, handleSendText, handleVisionAnalyze, addMessage
  } = useCoreLogic();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { recording, startRecording, stopRecording } = useSpeechRecognition(
    setOrbState,
    (text) => addMessage('user', text),
    (text) => handleSendText(text), // It actually triggers speak internally in handleSendText if done right. Wait!
    (errorMsg) => addMessage('system', errorMsg)
  );

  const { visionModeActive, videoRef, startVisionMode, stopVisionMode } = useCamera();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      handleSendText(input);
      setInput('');
    }
  };

  const handleVisionUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      handleVisionAnalyze(base64Image, 'upload', 'Describe detalladamente lo que ves en esta imagen. Sé concisa pero directa.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const captureVisionFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    
    stopVisionMode();
    handleVisionAnalyze(base64Image, 'camera', 'Analiza detalladamente lo que capturó la cámara y descríbelo de forma útil, como un asistente de inteligencia artificial.');
  };

  return (
    <div className="app-container">
      <GodModeListener />
      <ApiConfigModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {visionModeActive && (
        <div className="vision-mode-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '80%', objectFit: 'contain' }}></video>
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <button type="button" onClick={stopVisionMode} style={{ padding: '15px 30px', borderRadius: '30px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', fontSize: '18px' }}>❌ Cancelar</button>
            <button type="button" onClick={captureVisionFrame} style={{ padding: '15px 30px', borderRadius: '30px', background: '#3b82f6', color: 'white', border: 'none', fontSize: '18px', fontWeight: 'bold' }}>📸 Capturar y Analizar</button>
          </div>
        </div>
      )}

      {/* Background with Noise */}
      <div className="noise-overlay"></div>
      
      {/* Background Neural Orb fills the viewport contextually */}
      <div className="spatial-orb-layer">
        <div className="glow-backdrop"></div>
        <NeuralOrb state={orbState} volume={speaking ? 1 : 0} />
      </div>

      {/* Main Spatial UI Layer */}
      <div className="spatial-ui-layer">
        
        {/* Sleek Top Bar */}
        <header className="sleek-header">
          <div className="header-content">
            <div className="brand-group">
              <div className="brand-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="M12 12l9.9 4.9"/></svg>
              </div>
              <h1 className="brand-title">IAPROD OS</h1>
              <div className="version-tag">v1.0.0</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ModelSelector selected={selectedModel} onSelect={setSelectedModel} />
              <button 
                onClick={() => setSettingsOpen(true)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                title="API Settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
              <div className={`status-indicator ${offlineMode ? 'offline' : 'online'}`}>
                <div className="status-dot"></div>
                <span>{offlineMode ? 'Enterprise Core' : 'C2 Cluster'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <main className="sleek-chat-area">
          <div className="chat-container-inner">
            {messages.length === 0 ? (
              <div className="sleek-empty-state">
                <div className="empty-graphic">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <h2>System Ready</h2>
                <p>Sistema en línea. Esperando directivas.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message-row message-row--${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="M12 12l9.9 4.9"/></svg>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {msg.content.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="message-row message-row--assistant">
                 <div className="message-avatar">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="M12 12l9.9 4.9"/></svg>
                 </div>
                 <div className="message-content">
                    <div className="loader-pulse"></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} className="scroll-anchor" />
          </div>
        </main>

        {/* Floating Bottom Dock */}
        <footer className="sleek-dock-container">
          <div className="portal-card" style={{ width: '100%', maxWidth: 800, pointerEvents: 'auto' }}>
          <form className="portal-card-inner sleek-input-dock" onSubmit={handleSubmit} style={{ background: 'rgba(10,10,10,0.85)' }}>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleVisionUpload} 
            />
            
            <button type="button" className="action-btn" onClick={() => fileInputRef.current?.click()} title="Upload Image">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <button type="button" className="action-btn" onClick={() => startVisionMode((err) => addMessage('system', err))} title="Live Vision">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>

            <input 
              type="text" 
              placeholder="Ask IAProd OS or inject commands..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              disabled={loading}
              className="sleek-input"
            />
            
            <button type="button" className={`action-btn mic-btn ${recording ? 'recording' : ''}`} onClick={recording ? stopRecording : startRecording} title="Voice Command">
              {recording ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              )}
            </button>

            {input.trim() && !loading && (
              <button type="submit" className="action-btn submit-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            )}
          </form>
          </div>
          <div className="dock-footer-text">IAProd OS Environment</div>
        </footer>
      </div>
    </div>
  );
}
