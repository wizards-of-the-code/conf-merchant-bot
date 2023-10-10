import amqp from 'amqplib';
import logger from '../../logger/logger';
import NotificationController from '../../NotificationController';

class RMQConsumer {
  private connection?: amqp.Connection;

  private channel?: amqp.Channel;

  private queueName: string;

  private notificationController: NotificationController;

  constructor(
    queueName: string,
    notificationController: NotificationController,
  ) {
    this.queueName = queueName;
    this.notificationController = notificationController;
  }

  async init() {
    // this.connection = await amqp.connect(`amqp://${this.RMQ_HOSTNAME}`);
    this.connection = await amqp.connect(`${process.env.RABBITMQ_URL}`);
    this.channel = await this.connection.createChannel();
    this.channel.prefetch(1);
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
          await this.notificationController.sendNotification(message.content.toString());

          this.channel?.ack(message);
        }
      });
    } catch (error) {
      logger.error('RabbitMQ Consumer error');
    }
  }
}

export default RMQConsumer;
