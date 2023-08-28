import cron, { ScheduledTask } from 'node-cron';
import { InlineKeyboardButton, InputMediaPhoto } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import { MediaGroup } from 'telegraf/typings/telegram-types';
import DBManager from './mongodb/DBManager';
import { ScheduledMessage, EventWithParticipants, ParticipantShort } from './types';
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

    const minutelyTask: ScheduledTask = cron.schedule('*/30 * * * * *', async () => {
      // Every minute check DB for changes ragarding active MANUAL messages
      const messages: ScheduledMessage[] = await this.dbManager.getScheduledNotifications();

      if (messages.length > 0) {
        // Filter ready for sending messages
        const toSentArr = messages.filter((message) => (
          message.datetime_to_send <= new Date()
        ));
        const events: EventWithParticipants[] = await this.dbManager.getEventsWithParticipants();

        // Take toSentArray with messages, ready for sending
        for (const message of toSentArr) {
          // Find event object
          const recipients = events.find((event) => (
            event._id.toString() === message.event_id.toString()
          ))?.participants;

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
    let photos: string[] = [];

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
    if (message.photos.length > 0) {
      photos = message.photos;
    }

    // Counter for checking is all messages has been sent or not
    let counter = 0;
    // Sent message to each recipient
    for (const recipient of recipients) {
      const sentResult = await this.sendMessageToUser(
        recipient.tg.id,
        message,
        buttonsArray,
        photos,
      );
      if (sentResult) counter += 1;
    }

    if (counter !== recipients.length) {
      console.log('Warning: Not all messages has been sent!');
    } else {
      console.log(`${counter} messages successfully sent!`);
    }

    // Mark notification as sent in DB
    await this.dbManager.markNotificationAsSent(message._id);
  }

  /** Send a single message to a single recepient.
   * @param {ObjectId} [tgId] Recipient's Telegram ID
   * @param {ScheduledMessage} [message] Message object to be sent.
   * @param {(InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton)[][]}
   * [buttonsArray] Inline buttons to be attached to the message.
   * @param {string[]} [photos] Array of links to photos.
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
    photos: string[],
    photosOnTop: boolean = true,
  ): Promise<boolean> {
    let sendResult: any;
    // Send photos if they exists
    if (photos.length > 0) {
      const mediaArray: any[] = [];
      for (const photo of photos) {
        if (await isValidUrl(photo)) {
          const inputPhoto: InputMediaPhoto = { type: 'photo', media: photo };
          mediaArray.push(inputPhoto);
        }
      }
      const mediaGroup: MediaGroup = [...mediaArray];

      if (photosOnTop) {
        // Send photos
        await this.bot.telegram.sendMediaGroup(tgId, mediaGroup);
        // Send text with buttons
        sendResult = await this.bot
          .telegram
          .sendMessage(tgId, message.text, Markup.inlineKeyboard(buttonsArray));
      } else {
        // Send text with buttons
        sendResult = await this.bot
          .telegram
          .sendMessage(tgId, message.text, Markup.inlineKeyboard(buttonsArray));
        // Send photos
        await this.bot.telegram.sendMediaGroup(tgId, mediaGroup);
      }
    } else {
      // Send text with buttons
      sendResult = await this.bot
        .telegram
        .sendMessage(tgId, message.text, Markup.inlineKeyboard(buttonsArray));
    }

    if (sendResult) {
      return true;
    }
    return false;
  }
}

export default Scheduler;
