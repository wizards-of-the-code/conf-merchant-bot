import { InlineKeyboardButton, InputMediaPhoto } from 'telegraf/typings/core/types/typegram';
import { MediaGroup } from 'telegraf/typings/telegram-types';
import { Markup } from 'telegraf';
import { ObjectId } from 'mongodb';
import TelegramBot from './TelegramBot';
import DBManager from './mongodb/DBManager';
import { EventWithParticipants, Media, Notification } from './types';
import parseRichText from './utils/parseRichText';
import { isValidUrl } from './utils/isValidUrl';

export interface NotificationObject {
  recipientId: number,
  content: Notification,
  buttons: (
    InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
  )[][],
  mediaGroup: MediaGroup,
}

class NotificationController {
  private bot: TelegramBot;

  constructor(
    private readonly dbManager: DBManager,
    bot: TelegramBot,
  ) {
    this.bot = bot;
  }

  async getNotifications(): Promise<Notification[]> {
    const currentDateTime = new Date();
    const notifications = await this.dbManager.getCollectionData<Notification>(
      'notifications',
      {
        is_active: true,
        sent: null,
        datetime_to_send: { $lte: currentDateTime },
      },
    );

    return notifications;
  }

  async getRecipients() {
    const events: EventWithParticipants[] = await this.dbManager.getEventsWithParticipants();
    // for (const notification of notifications) {

    // }
    // TODO make notifications iterable!!!
    return events;
  }

  async contsructNotification(notification: Notification, recipientId: number) {
    const buttons: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [];

    if (notification.links.length > 0) {
      this.addLinksButtons(notification, buttons);
    }

    const mediaGroup: MediaGroup = await this.addMediaGroup(notification);

    const notificationObject: NotificationObject = {
      recipientId,
      content: notification,
      buttons,
      mediaGroup,
    };

    return notificationObject;
  }

  // eslint-disable-next-line class-methods-use-this
  async addLinksButtons(
    notification: Notification,
    buttons: (InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton)[][],
  ) {
    for (const link of notification.links) {
      // Mandatory link validation - in other case bot will crash
      // eslint-disable-next-line no-await-in-loop
      if (await isValidUrl(link.url)) {
        buttons.push([Markup.button.url(link.name, link.url)]);
      }
    }
  }

  async addMediaGroup(notification: Notification) {
    if (notification.images.length < 0) {
      return [];
    }

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
    return [...mediaArray];
  }

  async sendMessage(message: string) {
    const content = JSON.parse(message);
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
  }
}

export default NotificationController;
