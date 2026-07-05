import { useQuery } from '@tanstack/react-query';
import { ModelConfigSchema } from '../lib/schemas';
import { z } from 'zod';

const fetchModels = async () => {
  const response = await fetch('/_msbross/api/models');
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  const data = await response.json();
  
  // Zod validation at runtime
  return z.array(ModelConfigSchema).parse(data);
};

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: fetchModels,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    placeholderData: [
      { id: 'gm/gemini-3.5-flash',      name: 'Gemini 3.5 Flash',       provider: 'Gemini', free: true },
      { id: 'gm/gemini-3.1-pro',        name: 'Gemini 3.1 Pro',         provider: 'Gemini', free: true },
      { id: 'gm/gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite',  provider: 'Gemini', free: true },
      { id: 'gr/llama-3.3-70b-versatile', name: 'Llama 3.3 70B',        provider: 'Groq',   free: true },
    ]
  });
}
