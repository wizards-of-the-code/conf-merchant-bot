import { Context } from 'telegraf';
import { Event } from '../types';

export type SessionMessage = { messageId: number; chatId: number; timestamp: number };
export interface SessionData {
  userId: number | undefined;
  selectedEvent: Event | null;
  role: string;
  currentMessage: number;
  messages?: SessionMessage[];
}

export interface IBotContext extends Context {
  session: SessionData;
}
