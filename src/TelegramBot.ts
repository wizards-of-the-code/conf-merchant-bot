import { Telegraf } from 'telegraf';
import { Db } from 'mongodb';
import { IBotContext } from './context/IBotContext';
import DBManager from './mongodb/DBManager';

class TelegramBot extends Telegraf<IBotContext> {
  db: Db | undefined;

  dbManager: DBManager;

  constructor(token: string, dbManager: DBManager) {
    super(token);
    this.dbManager = dbManager;
  }
}

export default TelegramBot;
