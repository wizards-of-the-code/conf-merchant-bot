import amqp from 'amqplib';
import { NotificationObject } from '../../NotificationController';

class RMQPublisher {
  private readonly RMQ_HOSTNAME = 'rabbitmq';

  private connection?: amqp.Connection;

  private channel?: amqp.Channel;

  private queueName: string;

  constructor(queueName: string) {
    this.queueName = queueName;
  }

  async init() {
    this.connection = await amqp.connect(`amqp://${this.RMQ_HOSTNAME}`);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: false });
  }

  async publish(notification: NotificationObject) {
    if (!this.channel) {
      throw new Error('RabbitMQ Publisher not initialized!');
    }

    this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(notification)));
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
