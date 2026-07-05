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
        <div className="font-medium text-sm mb-1 opacity-50">
          {isUser ? 'Tú' : 'Adele'}
        </div>
        <div className="text-white/90">
          {renderedContent}
        </div>
      </div>
    </motion.div>
  );
}
