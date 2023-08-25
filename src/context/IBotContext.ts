import { Context } from 'telegraf';
import { Event } from '../types';

export interface SessionData {
  userId: number | undefined;
  selectedEvent: Event | null;
  role: string;
}

export interface IBotContext extends Context {
  session: SessionData;
}