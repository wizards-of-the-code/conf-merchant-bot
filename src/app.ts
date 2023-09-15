import LocalSession from 'telegraf-session-local';
import TelegramBot from './TelegramBot';
import { IConfigService } from './config/ConfigService.interface';
import ConfigService from './config/ConfigService';
import Command from './commands/Command';
import Scheduler from './Scheduler';
import DBManager from './mongodb/DBManager';
import StartCommand from './commands/StartCommand';
import setupListeners from './listeners/setupListeners';
import connectToMongoose from './mongoose/MongooseManager';

class App {
  bot: TelegramBot;

  commands: Command[] = [];

  scheduler: Scheduler;

  constructor(
    private readonly configService: IConfigService,
    dbManager: DBManager,
  ) {
    this.bot = new TelegramBot(this.configService.get('BOT_TOKEN'), dbManager);
    this.bot.use(new LocalSession({ database: 'sessions.json' }).middleware());
    this.scheduler = new Scheduler('0 0 19 * * *', dbManager, this.bot);
  }

  async init() {
    // Adding listeners for commands
    this.commands = [new StartCommand(this.bot)];
    this.commands.forEach((command) => command.handle());

    setupListeners(this.bot);

    // Launching bot itself
    this.bot.launch();

    // Initializing scheduler (everyday at 19:00 for now)
    this.scheduler.init();
  }
}

const main = async () => {
  const config = new ConfigService();

  // Connect to database
  const dbManager = new DBManager(config);
  await dbManager.connect();

  await connectToMongoose(config);

  // Launch bot
  const bot = new App(config, dbManager);
  bot.init();
};

main();
