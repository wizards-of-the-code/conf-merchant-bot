import amqp from 'amqplib';
// import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
// import { MediaGroup } from 'telegraf/typings/telegram-types';
import logger from '../../logger/logger';
import TelegramBot from '../../TelegramBot';
import parseRichText from '../parseRichText';

class RMQConsumer {
  private readonly RMQ_HOSTNAME = 'rabbitmq';

  private connection?: amqp.Connection;

  private channel?: amqp.Channel;

  private queueName: string;

  private bot: TelegramBot;

  constructor(queueName: string, bot: TelegramBot) {
    this.queueName = queueName;
    this.bot = bot;
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
          const content = JSON.parse(message.content.toString());
          const {
            recipientId, notification, buttons, mediaGroup,
          } = content;

          if (mediaGroup.length > 0 && notification.images_on_top) {
            await this.bot.telegram.sendMediaGroup(recipientId, mediaGroup);
          }

          await this.bot.telegram.sendMessage(
            recipientId,
            parseRichText(notification.text),
            {
              ...Markup.inlineKeyboard(buttons),
              parse_mode: 'HTML',
              disable_web_page_preview: true,
            },
          );

          if (mediaGroup.length > 0 && !notification.images_on_top) {
            await this.bot.telegram.sendMediaGroup(recipientId, mediaGroup);
          }

          this.channel?.ack(message);

          logger.info('Consumer message sent');
        }
      });
    } catch (error) {
      logger.error('RabbitMQ Consumer error');
    }
  }
}

export default RMQConsumer;
