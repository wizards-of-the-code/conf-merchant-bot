import { Context } from 'telegraf';
import { Event } from '../types';
// eslint-disable-next-line import/no-cycle
import Paginator from '../utils/paginator';

export interface SessionData {
  userId: number | undefined;
  selectedEvent: Event | null;
  role: string;
  currentMessage: number;
  paginator: Paginator<any>;
}

export interface IBotContext extends Context {
  session: SessionData;
}
