import React, { useEffect, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

export default function SidebarGlass({ messages, setMessages, visible, onClose }) {
    const room = useRoomContext();
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!room) return;

        const handleData = (payload, participant, kind, topic) => {
            if (topic === 'chat' || topic === 'lk-chat') {
                const text = new TextDecoder().decode(payload);
                try {
                    const data = JSON.parse(text);
                    setMessages(prev => [...prev, { id: data.id || Date.now(), text: data.message, isUser: false, name: 'Nikolina' }]);
                } catch (e) {
                    setMessages(prev => [...prev, { id: Date.now(), text: text, isUser: false, name: 'Nikolina' }]);
                }
            }
        };

        const handleTranscription = (segments, participant) => {
            const text = segments.map(s => s.text).join(' ');
            if (text.trim().length === 0) return;
            const isUser = participant?.identity !== 'msb-assistant';
            const name = isUser ? 'Tú' : 'Nikolina';

            setMessages(prev => {
                const newMsgs = [...prev];
                const last = newMsgs[newMsgs.length - 1];
                if (last && last.isUser === isUser && (Date.now() - (last.timestamp || 0) < 3000)) {
                    last.text = text;
                    return [...newMsgs];
                }
                return [...prev, { id: Date.now(), text, isUser, name, timestamp: Date.now() }];
            });
        };

        room.on(RoomEvent.DataReceived, handleData);
        room.on(RoomEvent.TranscriptionReceived, handleTranscription);
        return () => {
            room.off(RoomEvent.DataReceived, handleData);
            room.off(RoomEvent.TranscriptionReceived, handleTranscription);
        };
    }, [room, setMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, visible]);

    return (
        <aside className={`sidebar-glass ${visible ? 'visible' : ''}`}>
            <div className="sidebar-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span className="sidebar-title">HISTORIAL MSB</span>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem' }}>&times;</button>
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '1px' }}>SESIÓN SEGURA · CIFRADO E2EE</p>
            </div>
            
            <div className="transcript-viewport" ref={scrollRef}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', opacity: 0.3, marginTop: '20px' }}>
                        <p style={{ fontSize: '0.8rem' }}>Conversación encriptada...</p>
                        <p style={{ fontSize: '0.7rem' }}>Comience a hablar para transcribir</p>
                    </div>
                )}
                {messages.map(m => (
                    <div key={m.id} className={`lux-bubble ${m.isUser ? 'bubble-user' : 'bubble-agent'}`}>
                        <span className="bubble-name">{m.name}</span>
                        <p>{m.text}</p>
                    </div>
                ))}
            </div>

            <footer style={{ padding: '2rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent-emerald)', borderRadius: '50%' }}></div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>NIKOLINA ONLINE</span>
                </div>
            </footer>
        </aside>
    );
}
