import { Context } from 'telegraf';
import { Event } from '../types';

export interface SessionData {
  userId: number | undefined;
  selectedConf: Event | undefined;
  role: string;
}

export interface IBotContext extends Context {
  session: SessionData;
}
