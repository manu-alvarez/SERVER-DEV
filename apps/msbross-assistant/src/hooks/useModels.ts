import { useQuery } from '@tanstack/react-query';
import { ModelConfigSchema } from '../lib/schemas';
import { z } from 'zod';

const fetchModels = async () => {
  const adminToken = localStorage.getItem('msbross_godmode_token');
  const customKeys = localStorage.getItem('msbross_user_api_key');
  
  const headers: Record<string, string> = {};
  if (adminToken) headers['x-godmode-token'] = adminToken;
  if (customKeys) headers['x-user-custom-keys'] = customKeys;

  const response = await fetch('/_msbross/api/models', { headers });
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
  });
}
