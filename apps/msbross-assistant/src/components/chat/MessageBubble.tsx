import { Message } from '../../lib/schemas';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';
import { useMemo } from 'react';

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  const renderedContent = useMemo(() => (
    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#0f1115] prose-pre:border prose-pre:border-white/10 break-words overflow-x-hidden">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {message.content}
      </ReactMarkdown>
    </div>
  ), [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full gap-4 p-4 md:p-6 ${isUser ? 'bg-transparent' : 'bg-white/[0.02] border-y border-white/[0.05]'}`}
    >
      <div className="flex-shrink-0 mt-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-[#00ffcc]/20 text-[#00ffcc]' : 'bg-[#ffcc00]/20 text-[#ffcc00]'}`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm mb-1 opacity-50 flex items-center justify-between">
          <span>{isUser ? 'Tú' : 'MSBrOSs Assistant (Adele)'}</span>
          {!isUser && (
            <span className="text-[10px] bg-[#ffcc00]/10 text-[#ffcc00] px-2 py-0.5 rounded border border-[#ffcc00]/20 font-mono tracking-wider">
              BYOK_ENV_ACTIVE
            </span>
          )}
        </div>
        <div className="text-white/90">
          {renderedContent}
        </div>
        {!isUser && (
          <div className="mt-3 pt-2 border-t border-white/5 flex gap-4 text-[10px] text-white/40 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
              STATUS: OK
            </span>
            <span>MODEL: {message.model || 'auto-selected'}</span>
            <span>CTX_TOKENS: ~{Math.floor(message.content.length / 4)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
