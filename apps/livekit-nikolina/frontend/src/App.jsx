import { useState, useEffect, useCallback } from 'react';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    VoiceAssistantControlBar,
    useVoiceAssistant,
    useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { RoomEvent, Track } from 'livekit-client';
import { useLocalParticipant } from '@livekit/components-react';
import './index.css';

// Premium Components
import LuxMenu from './components/LuxMenu';
import SidebarGlass from './components/SidebarGlass';

// ---------------------------------------------------------------------------
// Custom Mute Button (replaces VoiceAssistantControlBar entirely)
// ---------------------------------------------------------------------------
const MuteToggle = () => {
    const { localParticipant } = useLocalParticipant();
    const [muted, setMuted] = useState(false);

    const toggle = useCallback(async () => {
        if (!localParticipant) return;
        const newMuted = !muted;
        await localParticipant.setMicrophoneEnabled(!newMuted);
        setMuted(newMuted);
    }, [localParticipant, muted]);

    return (
        <button className="btn-mute" onClick={toggle} title={muted ? 'Activar micrófono' : 'Silenciar'}>
            {muted ? '🔇 SILENCIADO' : '🎙️ MICRÓFONO'}
        </button>
    );
};

// ---------------------------------------------------------------------------
// Metadata Sync — Receives mood & menu signals from the agent
// ---------------------------------------------------------------------------
const MetadataSync = ({ setMood, setShowMenu }) => {
    const room = useRoomContext();
    
    useEffect(() => {
        if (!room) return;
        const handleData = (payload) => {
            try {
                const data = JSON.parse(new TextDecoder().decode(payload));
                console.log('[MSB] Metadata:', data);
                if (data.mood) setMood(data.mood);
                if (data.show_menu || data.action === 'show_menu') setShowMenu(true);
            } catch (e) {
                // Not JSON metadata, ignore
            }
        };
        room.on(RoomEvent.DataReceived, handleData);
        return () => room.off(RoomEvent.DataReceived, handleData);
    }, [room, setMood, setShowMenu]);

    return null;
};

// ---------------------------------------------------------------------------
// Static Orb (disconnected state)
// ---------------------------------------------------------------------------
const StaticOrb = () => (
    <div className="orb-portal">
        <div className="orb-ring-outer" />
        <div className="orb-core" />
        <div className="status-badge">
            <span className="dot" />
            DESCONECTADO
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Live Orb — Reacts to voice state + mood for color/animation shifts
// ---------------------------------------------------------------------------
const LuxuryOrbPortal = ({ mood = 'calm' }) => {
    const { state } = useVoiceAssistant();
    const isActive = state !== 'inactive';

    const stateMap = {
        'inactive': 'DESCONECTADO',
        'listening': 'ESCUCHANDO...',
        'thinking': 'PENSANDO...',
        'speaking': 'HABLANDO...',
    };
    
    return (
        <div className="orb-portal">
            <div className="orb-ring-outer" />
            <div className={`orb-core ${isActive ? 'active' : ''} mood-${mood} state-${state}`} />
            <div className="status-badge">
                <span className={`dot ${isActive ? 'pulse' : ''}`} />
                {stateMap[state] || state?.toUpperCase() || 'CONECTANDO...'}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Root App
// ---------------------------------------------------------------------------
export default function App() {
    const [token, setToken] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [mood, setMood] = useState('calm');
    const [messages, setMessages] = useState([]);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    const serverUrl = import.meta.env.VITE_LIVEKIT_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? 'wss://nikolina-1jg7t00i.livekit.cloud' : 'ws://localhost:7880');

    const handleConnect = useCallback(async () => {
        if (token) {
            setToken("");
            setMessages([]);
            setMood('calm');
            return;
        }
        setConnecting(true);
        try {
            const tokenUrl = window.location.hostname.includes('nikolina') ? '/_nikolina/api/token' : '/api/token';
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participant_identity: `Usuario_${Math.floor(Math.random() * 1000)}`,
                    room_name: "nikolina-room"
                })
            });
            const data = await response.json();
            if (data.accessToken || data.token) setToken(data.accessToken || data.token);
        } catch (e) {
            console.error("Connection failed", e);
            alert("Error al conectar con el servidor MSB.");
        } finally {
            setConnecting(false);
        }
    }, [token]);

    return (
        <>
            {/* Atmospheric Background — OUTSIDE app-container so nothing covers it */}
            <div className="bg-atmosphere" />

            <div className="app-container">
                <main className="main-stage">
                    <header className="app-header">
                        <h1 className="luxury-title">RESTAURANTE MSB</h1>
                        <p className="luxury-subtitle">MALASOMBRABROSS LUXURY</p>
                    </header>

                    {!token ? (
                        <div className="connection-portal">
                            <StaticOrb />
                            <div className="connection-controls">
                                <h2 className="portal-message">NIKOLINA TE ESTÁ ESPERANDO...</h2>
                                <button className="btn-luxury" onClick={handleConnect} disabled={connecting}>
                                    {connecting ? 'INICIANDO PROTOCOLO...' : 'ESTABLECER CONEXIÓN'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <LiveKitRoom
                            serverUrl={serverUrl}
                            token={token}
                            connect={true}
                            audio={true}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', background: 'transparent' }}
                        >
                            <MetadataSync setMood={setMood} setShowMenu={setShowMenu} />
                            
                            <div className="live-interface">
                                <LuxuryOrbPortal mood={mood} />

                                <div className="action-row">
                                    <button className="btn-luxury btn-menu" onClick={() => setShowMenu(true)}>
                                        VER MENÚ
                                    </button>
                                    <button className="btn-luxury btn-disconnect" onClick={handleConnect}>
                                        DESCONECTAR
                                    </button>
                                </div>

                                <div className="controls-row">
                                    <VoiceAssistantControlBar />
                                    <MuteToggle />
                                    <button 
                                        className={`btn-toggle-sidebar ${sidebarVisible ? 'active' : ''}`}
                                        onClick={() => setSidebarVisible(!sidebarVisible)}
                                    >
                                        {sidebarVisible ? 'OCULTAR' : 'HISTORIAL'}
                                    </button>
                                </div>
                            </div>

                            {showMenu && <LuxMenu onClose={() => setShowMenu(false)} />}
                            <RoomAudioRenderer />
                            <SidebarGlass 
                                messages={messages} 
                                setMessages={setMessages} 
                                visible={sidebarVisible} 
                                onClose={() => setSidebarVisible(false)} 
                            />
                        </LiveKitRoom>
                    )}
                </main>

                <footer className="app-footer">
                    <p>POTENCIADO POR MSB AI NETWORKS</p>
                </footer>
            </div>
        </>
    );
}
