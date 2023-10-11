import { Telegraf, Context } from 'telegraf';
import { Db } from 'mongodb';
import DBManager from '../data/mongodb/DBManager';
import { Event } from '../data/types';

export interface SessionData {
  userId: number | undefined;
  selectedEvent: Event | null;
  role: string;
  currentMessage: number;
  currentPage: number;
}

export interface BotContext extends Context {
  session: SessionData;
}

class TelegramBot extends Telegraf<BotContext> {
  db: Db | undefined;

  dbManager: DBManager;

  constructor(token: string, dbManager: DBManager) {
    super(token);
    this.dbManager = dbManager;
  }
}

export default TelegramBot;
