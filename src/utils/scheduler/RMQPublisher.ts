import amqp from 'amqplib';

class RMQPublisher {
  private RMQ_URL: string = 'fjfn';

  private connection?: amqp.Connection;

  private channel?: amqp.Channel;

  private exchangeName: string;

  constuctor(exchangeName: string) {
    this.exchangeName = exchangeName;
  }

  async init() {
    this.connection = await amqp.connect('amqp://your-rabbitmq-host');
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchangeName, 'fanout', { durable: false });
  }
}

export default RMQPublisher;
