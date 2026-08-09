"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ApiConfigModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("openai");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem("msbross_user_api_key") || "");
      setProvider(localStorage.getItem("msbross_model_provider") || "openai");
      setOllamaUrl(localStorage.getItem("msbross_ollama_url") || "http://localhost:11434");
    }
  }, [isOpen]);

  const save = () => {
    localStorage.setItem("msbross_user_api_key", apiKey);
    localStorage.setItem("msbross_model_provider", provider);
    localStorage.setItem("msbross_ollama_url", ollamaUrl);
    alert("✅ Configuración guardada correctamente.");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl"
        >
          <h2 className="text-xl text-white font-bold mb-2">⚙️ Configuración de IA (BYOK)</h2>
          <p className="text-xs text-white/50 mb-6">Utiliza tu propia clave de API para procesar las peticiones. Las claves no se guardan en nuestros servidores.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Proveedor de LLM</label>
              <select 
                value={provider} 
                onChange={e => setProvider(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-gold"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google Gemini</option>
                <option value="groq">Groq</option>
                <option value="mistral">Mistral</option>
                <option value="ollama">Ollama (Local/Tailscale)</option>
              </select>
            </div>

            {provider === "ollama" ? (
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Ollama URL</label>
                <input 
                  type="text" 
                  value={ollamaUrl} 
                  onChange={e => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-gold"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Tu API Key</label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-gold"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-8">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white transition-colors">
              Cancelar
            </button>
            <button onClick={save} className="px-6 py-2 text-xs font-bold text-black bg-gold rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:scale-105 transition-transform">
              Guardar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ApiConfigModal;
