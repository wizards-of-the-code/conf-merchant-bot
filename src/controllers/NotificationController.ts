import { InlineKeyboardButton, InputMediaPhoto } from 'telegraf/typings/core/types/typegram';
import { MediaGroup } from 'telegraf/typings/telegram-types';
import { Markup } from 'telegraf';
import { ObjectId } from 'mongodb';
import TelegramBot from '../bot/TelegramBot';
import DBManager from '../data/mongodb/DBManager';
import {
  EventWithParticipants, Media, Notification, ParticipantShort,
} from '../data/types';
import parseRichText from '../utils/parseRichText';
import { isValidUrl } from '../utils/isValidUrl';
// eslint-disable-next-line import/no-cycle
import RMQPublisher from '../data/Scheduler/Publisher';

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

  private publisher: RMQPublisher;

  constructor(
    private readonly dbManager: DBManager,
    bot: TelegramBot,
  ) {
    this.bot = bot;
    this.publisher = new RMQPublisher('notifications');
    this.publisher.init();
  }

  async generateAndPublishNotifications() {
    const notifications: Notification[] = await this.getNotifications();

    await Promise.all(
      notifications.map(async (notification) => {
        const recipients: ParticipantShort[] | undefined = await this.getRecipients(notification);

        if (!recipients) return;

        const generatedNotifications = await this.contsructNotification(
          notification,
          recipients,
        );

        await Promise.all(
          generatedNotifications.map(async (item) => {
            await this.publisher.publish(item);
          }),
        );
      }),
    );
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

    return events.find(
      (event) => (
        event._id.toString() === notification.event_id.toString()
      ),
    )?.participants;
  }

  async contsructNotification(
    notification: Notification,
    recipients: ParticipantShort[],
  ): Promise<NotificationObject[]> {
    const buttons = await this.addLinksButtons(notification);
    const mediaGroup = await this.addMediaGroup(notification);

    return recipients.map((recipient) => ({
      recipientId: recipient.tg.tg_id,
      notification,
      buttons,
      mediaGroup,
    }));
  }

  // eslint-disable-next-line class-methods-use-this
  async addLinksButtons(notification: Notification) {
    const buttons = [];

    const validUrls = await isValidUrl(notification.links);
    for (let i = 0; i < notification.links.length; i += 1) {
      if (validUrls[i]) {
        buttons.push([Markup.button.url(notification.links[i].name, notification.links[i].url)]);
      }
    }

    return buttons;
  }

  async addMediaGroup(notification: Notification) {
    if (notification.images.length === 0) {
      return [];
    }

    const paths = notification.images.map((item) => new ObjectId(item.media_id));

    // Get image paths from DB
    const media = await this.dbManager.getCollectionData<Media>(
      'media',
      { _id: { $in: paths } },
    );

    const mediaArray: InputMediaPhoto[] = media.map((image) => ({
      type: 'photo',
      media: { source: `${process.env.MEDIA_PATH}/${image.filename}` },
    }));

    return mediaArray;
  }

  async sendNotification(notificationItem: string) {
    const {
      recipientId, notification, buttons, mediaGroup,
    } = JSON.parse(notificationItem);

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
