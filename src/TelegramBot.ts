import { Telegraf } from "telegraf";
import { IBotContext } from "./context/BotContext.interface";
import { Db } from "mongodb";
import { DBManager } from "./mongodb/DBManager";

export class TelegramBot extends Telegraf<IBotContext> {
  db: Db | undefined;
  dbManager: DBManager;

  constructor(token: string, dbManager: DBManager) {
    super(token);
    this.dbManager = dbManager;
  }
}