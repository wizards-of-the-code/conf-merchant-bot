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

class Scheduler {
  tasks: ScheduledTask[];

  bot: TelegramBot;

  constructor(
    private readonly cronExpression: string,
    private readonly dbManager: DBManager,
    bot: TelegramBot,
  ) {
    this.tasks = [];
    this.bot = bot;
  }

  async init() {
    // For a server console logs
    /* eslint no-console: 0 */
    console.log('Scheduler initialized');

    const minutelyTask: ScheduledTask = cron.schedule('0 */1 * * * *', async () => {
      // Every minute check DB for changes ragarding active messages
      const notifications = await this.dbManager.getCollectionData<Notification>('notifications', { is_active: true, sent: null });

      if (notifications.length > 0) {
        // Filter ready for sending messages
        const notificationsToSend = notifications.filter((item) => (
          item.datetime_to_send <= new Date()
        ));
        const events: EventWithParticipants[] = await this.dbManager.getEventsWithParticipants();

        // Take messagesToSent with messages, ready for sending
        for (const notification of notificationsToSend) {
          // Find event object
          const recipients = events.find(
            (event) => (
              event._id.toString() === notification.event_id.toString()
            ),
          )?.participants;

          if (recipients && recipients.length > 0) {
            /* eslint-disable no-await-in-loop --
            * The general idea to wait until each message will be sent
            * until next message executes
            */
            await this.sentNotifications(notification, recipients);
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
      const sentResult = await this.sendMessageToUser(
        recipient.tg.tg_id,
        notification,
        buttons,
        mediaGroup,
      );
      if (sentResult) counter += 1;
    }

    if (counter !== recipients.length) {
      console.log('Warning: Not all messages has been sent!');
    } else {
      console.log(`${counter} messages successfully sent!`);
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
   * @param {boolean} [photosOnTop] Photos position.
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
