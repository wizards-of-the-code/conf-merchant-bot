import amqp from 'amqplib';
import logger from '../../logger/logger';
import TelegramBot from '../../TelegramBot';
import NotificationController from '../../NotificationController';

class RMQConsumer {
  private readonly RMQ_HOSTNAME = 'rabbitmq';

  private connection?: amqp.Connection;

  private channel?: amqp.Channel;

  private queueName: string;

  private bot: TelegramBot;

  private notificationController: NotificationController;

  constructor(
    queueName: string,
    bot: TelegramBot,
    notificationController: NotificationController,
  ) {
    this.queueName = queueName;
    this.bot = bot;
    this.notificationController = notificationController;
  }

  async init() {
    this.connection = await amqp.connect(`amqp://${this.RMQ_HOSTNAME}`);
    this.channel = await this.connection.createChannel();
    this.channel.assertQueue(this.queueName, { durable: false });
    logger.info('RMQConsumer initialized');
  }

  async consumeQueue() {
    if (!this.channel) {
      throw new Error('RabbitMQ Consumer not initialized!');
    }
    try {
      this.channel.consume(this.queueName, async (message) => {
        if (message) {
          await this.notificationController.sendMessage(message.content.toString());

          this.channel?.ack(message);
        }
      });
    } catch (error) {
      logger.error('RabbitMQ Consumer error');
    }
  }
}

export default RMQConsumer;
