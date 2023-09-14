import { Context } from 'telegraf';
import { Event } from '../types';

export interface SessionData {
  userId: number | undefined;
  selectedEvent: Event | null;
  role: string;
  currentMessage: number;
}

export interface IBotContext extends Context {
  session: SessionData;
}
