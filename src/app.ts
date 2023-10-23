import './init';
import mongoose from 'mongoose';
import LocalSession from 'telegraf-session-local';
import TelegramBot from './bot/TelegramBot';
import ConfigService, { IConfigService } from './bot/config/ConfigService';
import Command from './bot/commands/Command';
import Scheduler from './data/Scheduler/Scheduler';
import DBManager from './data/mongodb/DBManager';
import StartCommand from './bot/commands/StartCommand';
import logger from './data/logger/logger';
import getErrorMsg from './utils/getErrorMessage';

class App {
  bot: TelegramBot;

  commands: Command[] = [];

  scheduler: Scheduler;

  constructor(private readonly configService: IConfigService, dbManager: DBManager) {
    this.bot = new TelegramBot(
      this.configService.get('BOT_TOKEN'),
      dbManager,
    );
    this.bot.use((
      new LocalSession({ database: `${this.configService.get('SESSIONS_PATH')}/sessions.json` })).middleware());
    this.scheduler = new Scheduler('0 0 19 * * *', dbManager, this.bot);
  }

  async init() {
    // Adding listeners for commands
    this.commands = [new StartCommand(this.bot)];
    this.commands.forEach((command) => command.handle());

    // Launching bot itself
    this.bot.launch();

    this.bot.catch((e) => {
      logger.error(getErrorMsg(e));
    });

    // Initializing scheduler (everyday at 19:00 for now)
    await this.scheduler.init();
  }
}

const main = async () => {
  const config = new ConfigService();
  logger.info('Bot started');

  // TODO: implement mongoose connection and operations with db
  // mongoose.connect('mongodb://localhost/your-database-name');

  // const db = mongoose.connection;

  // db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  // Connect to database
  const dbManager = new DBManager(config);
  await dbManager.connect();

  // Launch bot
  const bot = new App(config, dbManager);
  bot.init();
};

main();
