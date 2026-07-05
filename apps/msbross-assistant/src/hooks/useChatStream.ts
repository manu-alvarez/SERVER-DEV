import { useChatStore } from '../store/useChatStore';

/**
 * Hook for streaming chat messages to/from the MSBrOSs backend (Adele).
 * 
 * Protocol contract with server.py:
 * - Request:  POST /_msbross/api/chat
 *   Body:     { message: string, model: string, history: Message[], conversation_id: string }
 * - Response: SSE stream (text/event-stream)
 *   Format:   "data: {json}\n\n" per chunk, "data: [DONE]\n\n" at end
 *   Chunk:    { type: "text" | "tool_status" | "error", content: string }
 */
export function useChatStream() {
  const { messages, addMessage, appendChunkToLastMessage, setIsGenerating, selectedModel } = useChatStore();

  const sendMessage = async (content: string, attachments: File[] = []) => {
    if (!content.trim() && attachments.length === 0) return;

    let finalContent = content;

    // Process attachments — inline file contents into the message
    if (attachments.length > 0) {
      finalContent += '\n\n[ARCHIVOS ADJUNTOS]\n';
      for (const file of attachments) {
        try {
          const text = await file.text();
          finalContent += `\n--- Archivo: ${file.name} ---\n\`\`\`\n${text}\n\`\`\`\n`;
        } catch (e) {
          console.error(`Error leyendo ${file.name}`, e);
          finalContent += `\n--- Archivo: ${file.name} (Error al leer) ---\n`;
        }
      }
    }

    // Optimistic UI update
    const userMsg = { role: 'user' as const, content: finalContent };
    addMessage(userMsg);
    
    // Add empty assistant message placeholder
    addMessage({ role: 'assistant', content: '' });
    setIsGenerating(true);

    try {
      // Build the history array from existing messages (exclude the two we just added)
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      // Generate a stable conversation ID from session
      const conversationId = `session-${Date.now()}`;

      const response = await fetch('/_msbross/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: finalContent,
          model: selectedModel,
          history,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable stream provided in response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE lines from buffer
        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // SSE format: "data: {json}" or "data: [DONE]"
          if (trimmed.startsWith('data: ')) {
            const payload = trimmed.slice(6);
            if (payload === '[DONE]') break;

            try {
              const data = JSON.parse(payload);
              if (data.type === 'text') {
                appendChunkToLastMessage(data.content);
              } else if (data.type === 'tool_status') {
                appendChunkToLastMessage(`\n\n🔧 *${data.content}*\n\n`);
              } else if (data.type === 'error') {
                console.error('Server stream error:', data.content);
                appendChunkToLastMessage(`\n\n**Error:** ${data.content}`);
              }
            } catch {
              // Incomplete JSON fragment — skip
            }
          } else {
            // Fallback: try parsing as raw JSON (legacy format)
            try {
              const data = JSON.parse(trimmed);
              if (data.type === 'text') {
                appendChunkToLastMessage(data.content);
              }
            } catch {
              // Not JSON, skip
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      appendChunkToLastMessage('\n\n**Error:** Hubo un problema de conexión. Adele no pudo responder.');
    } finally {
      setIsGenerating(false);
    }
  };

  return { sendMessage };
}
