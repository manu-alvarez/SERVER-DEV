import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.number().optional()
});

export type Message = z.infer<typeof MessageSchema>;

export const ModelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  free: z.boolean().optional()
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

export const StreamChunkSchema = z.object({
  type: z.enum(["text", "error", "done"]),
  content: z.string().optional(),
  error: z.string().optional()
});

export type StreamChunk = z.infer<typeof StreamChunkSchema>;
