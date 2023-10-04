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
import RMQPublisher, { MessageObject } from './utils/scheduler/RMQPublisher';

class Scheduler {
  tasks: ScheduledTask[];

  bot: TelegramBot;

  private RMQPublisher: RMQPublisher;

  constructor(
    private readonly cronExpression: string,
    private readonly dbManager: DBManager,
    bot: TelegramBot,
  ) {
    this.tasks = [];
    this.bot = bot;
    this.RMQPublisher = new RMQPublisher('notifications');
  }

  async init() {
    this.RMQPublisher.init();
    const MESSAGE_BATCH_SIZE = 30;
    const TIME_BETWEEN_BATCHES_MS = 30000; // 30 seconds

    logger.info('Scheduler initialized');

    const minutelyTask: ScheduledTask = cron.schedule('0 */1 * * * *', async () => {
      // Every minute, check the DB for changes regarding active messages
      const currentDateTime = new Date();
      const notifications = await this.dbManager.getCollectionData<Notification>(
        'notifications',
        {
          is_active: true,
          sent: null,
          datetime_to_send: { $lte: currentDateTime },
        },
      );

      if (notifications.length > 0) {
        const events: EventWithParticipants[] = await this.dbManager.getEventsWithParticipants();

        // Split the messages into batches of MESSAGE_BATCH_SIZE
        for (let i = 0; i < notifications.length; i += MESSAGE_BATCH_SIZE) {
          const batch = notifications.slice(i, i + MESSAGE_BATCH_SIZE);

          // Take messagesToSent with messages, ready for sending
          for (const notification of batch) {
            // Find the event object
            const recipients = events.find(
              (event) => (
                event._id.toString() === notification.event_id.toString()
              ),
            )?.participants;
            if (recipients && recipients.length > 0) {
              // eslint-disable-next-line no-await-in-loop
              await this.sentNotifications(notification, recipients);
            }
          }

          // Sleep for TIME_BETWEEN_BATCHES_MS milliseconds before sending the next batch
          // eslint-disable-next-line no-await-in-loop
          await this.sleep(TIME_BETWEEN_BATCHES_MS);
        }
      }
    });

    this.tasks.push(minutelyTask);

    // Enable graceful stop
    process.prependOnceListener('SIGINT', () => this.tasks.forEach((task) => task.stop()));
    process.prependOnceListener('SIGTERM', () => this.tasks.forEach((task) => task.stop()));
  }

  // Sleep function for delaying message batches
  // eslint-disable-next-line class-methods-use-this
  private sleep(ms: number) {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      const messageObject: MessageObject = {
        recipientId: recipient.tg.tg_id,
        notification,
      };

      this.RMQPublisher.publish(messageObject);
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
