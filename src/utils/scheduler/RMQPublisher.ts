import amqp from 'amqplib';
import logger from '../../logger/logger';
import { Notification } from '../../types';

export interface MessageObject {
  recipientId: number,
  notification: Notification,
}

class RMQPublisher {
  private RMQ_URL: string = 'fjfn';

  private connection?: amqp.Connection;

  private channel?: amqp.Channel;

  private exchangeName: string;

  constructor(exchangeName: string) {
    this.exchangeName = exchangeName;
  }

  async init() {
    this.connection = await amqp.connect('amqp://your-rabbitmq-host');
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.exchangeName, { durable: false });
    logger.info('RMQPublisher initialized');
  }

  async publish(message: MessageObject) {
    if (!this.channel) {
      throw new Error('RabbitMQ not initialized!');
    }

    this.channel.sendToQueue(this.exchangeName, Buffer.from(JSON.stringify(message)));
    logger.info('message published!');
    console.log(JSON.stringify(message));
  }

  async closeChannel() {
    if (!this.connection || !this.channel) {
      throw new Error('RabbitMQ not initialized!');
    }

    await this.channel.close();
    await this.connection.close();
  }
}

export default RMQPublisher;
