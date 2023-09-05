import cron, { ScheduledTask } from 'node-cron';
import { InlineKeyboardButton, InputMediaPhoto } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import { MediaGroup } from 'telegraf/typings/telegram-types';
import { ObjectId } from 'mongodb';
import DBManager from './mongodb/DBManager';
import {
  ScheduledMessage, EventWithParticipants, ParticipantShort, Media,
} from './types';
import TelegramBot from './TelegramBot';
import { isValidUrl } from './utils/isValidUrl';

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

    const minutelyTask: ScheduledTask = cron.schedule('*/15 * * * * *', async () => {
      // Every minute check DB for changes ragarding active MANUAL messages
      const messages = await this.dbManager.getCollectionData<ScheduledMessage>('notifications', { is_active: true, sent: null });

      if (messages.length > 0) {
        // Filter ready for sending messages
        const toSentArr = messages.filter((message) => (
          message.datetime_to_send <= new Date()
        ));
        const events: EventWithParticipants[] = await this.dbManager.getEventsWithParticipants();
        // console.log('ready to send:', toSentArr);

        // Take toSentArray with messages, ready for sending
        for (const message of toSentArr) {
          // Find event object
          const recipients = events.find(
            (event) => (
              event._id.toString() === message.event_id.toString()
            ),
          )?.participants;

          if (recipients && recipients.length > 0) {
            /* eslint-disable no-await-in-loop --
            * The general idea to wait until each message will be sent
            * until next message executes
            */
            await this.sentNotifications(message, recipients);
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
    message: ScheduledMessage,
    recipients: ParticipantShort[],
  ) {
    // Construct telegram message buttons
    const buttonsArray: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [];

    // Add links
    if (message.links.length > 0) {
      for (const link of message.links) {
        // Mandatory link validation - in other case bot will crash
        if (await isValidUrl(link.url)) {
          buttonsArray.push([Markup.button.url(link.name, link.url)]);
        }
      }
    }

    // Add photos
    let mediaGroup: MediaGroup;
    // Put photos in MediaGroup
    if (message.images.length > 0) {
      const paths = message.images.map((item) => new ObjectId(item.media_id));

      // Get image paths from DB
      const media = await this.dbManager.getCollectionData<Media>(
        'media',
        { _id: { $in: paths } },
      );

      const mediaArray: InputMediaPhoto[] = [];
      for (const image of media) {
        // Get file right from the server's volume
        const fullPath = `/var/payload-admin/media/${image.filename}`;

        console.log('path', fullPath);

        const inputPhoto: InputMediaPhoto = { type: 'photo', media: { source: fullPath } };
        mediaArray.push(inputPhoto);
      }
      mediaGroup = [...mediaArray];
    } else {
      mediaGroup = [];
    }

    console.log('mediaGroup', mediaGroup);

    // Counter for checking if all messages has been sent or not
    let counter = 0;
    // Sent message to each recipient
    for (const recipient of recipients) {
      const sentResult = await this.sendMessageToUser(
        recipient.tg.id,
        message,
        buttonsArray,
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
    await this.dbManager.insertOrUpdateDocumentToCollection('notifications', { _id: message._id }, { $set: { sent: new Date() } });
  }

  /** Send a single message to a single recepient.
   * @param {ObjectId} [tgId] Recipient's Telegram ID
   * @param {ScheduledMessage} [message] Message object to be sent.
   * @param {(InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton)[][]}
   * [buttonsArray] Inline buttons to be attached to the message.
   * @param {MediaGroup} [mediaGroup] Array of links to photos.
   * @param {boolean} [photosOnTop] Photos position.
   * True: at the top of the message.
   * False: at the bottom.
   * @returns {boolean} True - sent successfully, False - sending failed.
   */
  private async sendMessageToUser(
    tgId: number,
    message: ScheduledMessage,
    buttonsArray: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][],
    mediaGroup: MediaGroup,
  ): Promise<boolean> {
    // Send photos first if photosOnTop === true
    if (mediaGroup.length > 0 && message.images_on_top) {
      await this.sendMessagePhotos(tgId, mediaGroup);
    }

    // Send message text with buttons
    await this.sendMessageText(tgId, message, buttonsArray);

    // Send photos in the end if photosOnTop === true
    if (mediaGroup.length > 0 && !message.images_on_top) {
      await this.sendMessagePhotos(tgId, mediaGroup);
    }

    return true;
  }

  private async sendMessageText(
    tgId: number,
    message: ScheduledMessage,
    buttonsArray: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][],
  ): Promise<boolean> {
    // Send text part with buttons
    const sendResult = await this.bot
      .telegram
      .sendMessage(tgId, message.text, Markup.inlineKeyboard(buttonsArray));

    if (sendResult) return true;
    return false;
  }

  private async sendMessagePhotos(
    tgId: number,
    mediaGroup: MediaGroup,
  ): Promise<boolean> {
    // Send photos
    const sendResult = await this.bot.telegram.sendMediaGroup(tgId, mediaGroup);
    console.log('sendResult', sendResult);
    console.log('mediaGroup', mediaGroup);

    if (sendResult) return true;
    return false;
  }
}

export default Scheduler;
