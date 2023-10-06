import { InlineKeyboardButton, InputMediaPhoto } from 'telegraf/typings/core/types/typegram';
import { MediaGroup } from 'telegraf/typings/telegram-types';
import { Markup } from 'telegraf';
import { ObjectId } from 'mongodb';
import TelegramBot from './TelegramBot';
import DBManager from './mongodb/DBManager';
import {
  EventWithParticipants, Media, Notification, ParticipantShort,
} from './types';
import parseRichText from './utils/parseRichText';
import { isValidUrl } from './utils/isValidUrl';
import RMQPublisher from './utils/scheduler/RMQPublisher';

export interface NotificationObject {
  recipientId: number,
  notification: Notification,
  buttons: (
    InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
  )[][],
  mediaGroup: MediaGroup,
}

class NotificationController {
  private bot: TelegramBot;

  private RMQpublisher: RMQPublisher;

  constructor(
    private readonly dbManager: DBManager,
    bot: TelegramBot,
  ) {
    this.bot = bot;
    this.RMQpublisher = new RMQPublisher('notifications');
    this.RMQpublisher.init();
  }

  async generateAndPublishNotifications() {
    const notifications: Notification[] = await this.getNotifications();

    if (notifications.length > 0) {
      for (const notification of notifications) {
        // eslint-disable-next-line no-await-in-loop
        const recipients: ParticipantShort[] | undefined = await this.getRecipients(notification);

        const generatedNotifications = this.contsructNotification(
          notification,
          recipients,
        );

        for (const n of generatedNotifications) {
          this.RMQpublisher.publish(n);
        }
      }
    }
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

  async getRecipients(notification: Notification): Promise<ParticipantShort[] | undefined> {
    const events: EventWithParticipants[] = await this.dbManager.getEventsWithParticipants();

    const recipients: ParticipantShort[] | undefined = events.find(
      (event) => (
        event._id.toString() === notification.event_id.toString()
      ),
    )?.participants;

    return recipients;
  }

  async contsructNotification(
    notification: Notification,
    recipients: ParticipantShort[],
  ): Promise<NotificationObject[]> {
    const generatedNotifications: NotificationObject[] = [];

    const buttons: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [];

    if (notification.links.length > 0) {
      this.addLinksButtons(notification, buttons);
    }

    const mediaGroup: MediaGroup = await this.addMediaGroup(notification);

    recipients.forEach((recipient) => {
      const notificationObject: NotificationObject = {
        recipientId: recipient.tg.tg_id,
        notification,
        buttons,
        mediaGroup,
      };
      generatedNotifications.push(notificationObject);
    });

    return generatedNotifications;
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

  async sendNotification(notificationItem: string) {
    const test = JSON.parse(notificationItem);
    const {
      recipientId, notification, buttons, mediaGroup,
    } = test;
    if (mediaGroup.length > 0 && notification.images_on_top) {
      await this.bot.telegram.sendMediaGroup(recipientId, mediaGroup);
    }

    const result = await this.bot.telegram.sendMessage(
      recipientId,
      parseRichText(notification.text),
      {
        ...Markup.inlineKeyboard(buttons),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
    );

    console.log(result);

    if (mediaGroup.length > 0 && !notification.images_on_top) {
      await this.bot.telegram.sendMediaGroup(recipientId, mediaGroup);
    }
  }
}

export default NotificationController;
