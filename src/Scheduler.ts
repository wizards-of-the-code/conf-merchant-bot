import cron, { ScheduledTask } from 'node-cron';
import { InlineKeyboardButton, InputMediaPhoto } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import { MediaGroup } from 'telegraf/typings/telegram-types';
import { ObjectId } from 'mongodb';
import DBManager from './mongodb/DBManager';
import {
  Notification, EventWithParticipants, ParticipantShort, Media,
} from './types';
import TelegramBot from './TelegramBot';
import { isValidUrl } from './utils/isValidUrl';
import 'dotenv/config';
import parseRichText from './utils/parseRichText';
import logger from './logger/logger';
import RMQPublisher from './utils/scheduler/RMQPublisher';
import RMQConsumer from './utils/scheduler/RMQConsumer';
import NotificationController, { NotificationObject } from './NotificationController';

class Scheduler {
  tasks: ScheduledTask[];

  bot: TelegramBot;

  private RMQPublisher: RMQPublisher;

  private RMQConsumer: RMQConsumer;

  private notificationController: NotificationController;

  constructor(
    private readonly cronExpression: string,
    private readonly dbManager: DBManager,
    bot: TelegramBot,
  ) {
    this.tasks = [];
    this.bot = bot;
    this.notificationController = new NotificationController(this.dbManager, this.bot);
    this.RMQPublisher = new RMQPublisher('notifications');
    this.RMQConsumer = new RMQConsumer('notifications', this.bot, this.notificationController);
  }

  async init() {
    await this.RMQPublisher.init();

    await this.RMQConsumer.init();
    logger.info('Scheduler initialized');

    const minutelyTask: ScheduledTask = cron.schedule('0 */1 * * * *', async () => {
      // Every minute, check the DB for changes regarding active messages
      const notifications: Notification[] = await this.notificationController.getNotifications();

      if (notifications.length > 0) {
        const events: EventWithParticipants[] = await this.dbManager.getEventsWithParticipants();

        // Take messagesToSent with messages, ready for sending
        for (const notification of notifications) {
          // Find the event object
          const eventMap = new Map(events.map((event) => [event._id.toString(), event]));
          const event = eventMap.get(notification.event_id.toString());

          if (event && event.participants.length > 0) {
            // Send notifications to participants
            // eslint-disable-next-line no-await-in-loop
            await this.sentNotifications(notification, event.participants);
          }
        }
      }
    });

    this.tasks.push(minutelyTask);

    // Enable graceful stop
    process.prependOnceListener('SIGINT', () => this.tasks.forEach((task) => task.stop()));
    process.prependOnceListener('SIGTERM', () => this.tasks.forEach((task) => task.stop()));
  }

  private async sentNotifications(
    notification: Notification,
    recipients: ParticipantShort[],
  ) {
    // Construct telegram message buttons
    const buttons: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [];

    // Add links
    if (notification.links.length > 0) {
      for (const link of notification.links) {
        // Mandatory link validation - in other case bot will crash
        // eslint-disable-next-line no-await-in-loop
        if (await isValidUrl(link.url)) {
          buttons.push([Markup.button.url(link.name, link.url)]);
        }
      }
    }

    // Add photos
    let mediaGroup: MediaGroup;
    // Put photos in MediaGroup
    if (notification.images.length > 0) {
      const paths = notification.images.map((item) => new ObjectId(item.media_id));

      // Get image paths from DB
      const media = await this.dbManager.getCollectionData<Media>(
        'media',
        { _id: { $in: paths } },
      );

      const mediaArray: InputMediaPhoto[] = [];
      for (const image of media) {
        // Get file right from the server's volume
        const fullPath = `${process.env.MEDIA_PATH}/${image.filename}`;

        const inputPhoto: InputMediaPhoto = { type: 'photo', media: { source: fullPath } };
        mediaArray.push(inputPhoto);
      }
      mediaGroup = [...mediaArray];
    } else {
      mediaGroup = [];
    }

    // Counter for checking if all messages has been sent or not
    let counter = 0;
    // Sent message to each recipient
    for (const recipient of recipients) {
      const messageObject: NotificationObject = {
        recipientId: recipient.tg.tg_id,
        notification,
        buttons,
        mediaGroup,
      };

      // eslint-disable-next-line no-await-in-loop
      await this.RMQPublisher.publish(messageObject);

      // eslint-disable-next-line no-await-in-loop
      const sentResult = await this.sendMessageToUser(
        recipient.tg.tg_id,
        notification,
        buttons,
        mediaGroup,
      );
      if (sentResult) counter += 1;
    }

    if (counter !== recipients.length) {
      logger.warn('Warning: Not all messages has been sent!');
    } else {
      logger.info(`${counter} messages successfully sent!`);
    }

    // Mark notification as sent in DB
    await this.dbManager.insertOrUpdateDocumentToCollection('notifications', { _id: notification._id }, { $set: { sent: new Date() } });
  }

  /** Send a single message to a single recepient.
   * @param {ObjectId} [tgId] Recipient's Telegram ID
   * @param {Notification} [notification] Message object to be sent.
   * @param {(InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton)[][]}
   * [buttons] Inline buttons to be attached to the message.
   * @param {MediaGroup} [mediaGroup] Array of links to photos.
   * True: at the top of the message.
   * False: at the bottom.
   * @returns {boolean} True - sent successfully, False - sending failed.
   */
  private async sendMessageToUser(
    tgId: number,
    notification: Notification,
    buttons: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][],
    mediaGroup: MediaGroup,
  ): Promise<boolean> {
    await this.RMQConsumer.consumeQueue();

    // Send photos first if photosOnTop === true
    if (mediaGroup.length > 0 && notification.images_on_top) {
      await this.sendMessagePhotos(tgId, mediaGroup);
    }

    // Send message text with buttons
    await this.sendMessageText(tgId, notification, buttons);

    // Send photos in the end if photosOnTop === true
    if (mediaGroup.length > 0 && !notification.images_on_top) {
      await this.sendMessagePhotos(tgId, mediaGroup);
    }

    return true;
  }

  private async sendMessageText(
    tgId: number,
    notification: Notification,
    buttons: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][],
  ): Promise<boolean> {
    // Send text part with buttons
    const sendResult = await this.bot
      .telegram
      .sendMessage(tgId, parseRichText(notification.text), {
        ...Markup.inlineKeyboard(buttons),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

    if (sendResult) return true;
    return false;
  }

  private async sendMessagePhotos(
    tgId: number,
    mediaGroup: MediaGroup,
  ): Promise<boolean> {
    // Send photos
    const sendResult = await this.bot.telegram.sendMediaGroup(tgId, mediaGroup);

    if (sendResult) return true;
    return false;
  }
}

export default Scheduler;
