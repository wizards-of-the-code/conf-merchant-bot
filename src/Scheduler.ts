import cron, { ScheduledTask } from 'node-cron';
import DBManager from './mongodb/DBManager';
import TelegramBot from './TelegramBot';
import 'dotenv/config';
import logger from './logger/logger';
import RMQPublisher from './utils/RMQ/RMQPublisher';
import RMQConsumer from './utils/RMQ/RMQConsumer';
import NotificationController from './NotificationController';

class Scheduler {
  tasks: ScheduledTask[];

  bot: TelegramBot;

  private publisher: RMQPublisher;

  private consumer: RMQConsumer;

  private notificationController: NotificationController;

  constructor(
    private readonly cronExpression: string,
    private readonly dbManager: DBManager,
    bot: TelegramBot,
  ) {
    this.tasks = [];
    this.bot = bot;
    this.notificationController = new NotificationController(this.dbManager, this.bot);
    this.publisher = new RMQPublisher('notifications');
    this.consumer = new RMQConsumer('notifications', this.notificationController);
  }

  async init() {
    await this.publisher.init();
    await this.consumer.init();
    this.setTasks();
    logger.info('Scheduler initialized');
  }

  private setTasks() {
    const minutelyTask: ScheduledTask = cron.schedule('0 */1 * * * *', async () => {
      await this.notificationController.generateAndPublishNotifications();
      await this.consumer.consumeQueue();
    });

    this.tasks.push(minutelyTask);

    // Enable graceful stop
    process.prependOnceListener('SIGINT', () => this.tasks.forEach((task) => task.stop()));
    process.prependOnceListener('SIGTERM', () => this.tasks.forEach((task) => task.stop()));
  }
}

export default Scheduler;
