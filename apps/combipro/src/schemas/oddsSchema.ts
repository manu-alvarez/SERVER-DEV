import { z } from 'zod';

export const oddsOutcomeSchema = z.object({
  name: z.string(),
  price: z.number(),
});

export const oddsMarketSchema = z.object({
  key: z.string(),
  last_update: z.string().optional(),
  outcomes: z.array(oddsOutcomeSchema),
});

export const oddsBookmakerSchema = z.object({
  key: z.string(),
  title: z.string(),
  last_update: z.string().optional(),
  markets: z.array(oddsMarketSchema),
});

export const oddsEventSchema = z.object({
  id: z.string(),
  sport_key: z.string(),
  sport_title: z.string(),
  commence_time: z.string(),
  home_team: z.string(),
  away_team: z.string(),
  bookmakers: z.array(oddsBookmakerSchema),
});

export const oddsApiResponseSchema = z.array(oddsEventSchema);

export type OddsEvent = z.infer<typeof oddsEventSchema>;
export type OddsApiResponse = z.infer<typeof oddsApiResponseSchema>;
