import cron, { ScheduledTask } from 'node-cron';
import DBManager from './mongodb/DBManager';
import {
  AutoScheduledMessage, EventWithParticipants, ManualScheduledMessage, ParticipantShort,
} from './types';
import TelegramBot from './TelegramBot';

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

    // cron.schedule(this.cronExpression, async () => {
    //   // Every day check DB for SCHEDULED messages
    //   const messages: AutoScheduledMessage[] = this.dbManager.getAutoMessages();
    // });

    const minutelyTask: ScheduledTask = cron.schedule('*/30 * * * * *', async () => {
      // Every minute check DB for changes ragarding active MANUAL messages
      const messages: ManualScheduledMessage[] = await this.dbManager.getManualNotifications();

      console.log('messages', messages);
      if (messages.length > 0) {
        // Filter ready for sending messages
        const toSentArr = messages.filter((message) => message.datetime_to_send <= new Date());
        const events: EventWithParticipants[] = await this.dbManager.getEventsWithParticipants();
        console.log('Active events:', events[0].participants);

        // TODO: Write an algorithm to sent messages to event participants
        console.log('toSentArr', toSentArr);
        // Take toSentArray
        for (const message of toSentArr) {
          // Find event object
          const recipients = events.find((event) => (
            event._id.toString() === message.event_id.toString()
          ))?.participants;
          console.log('recipients', recipients);

          if (recipients && recipients.length > 0) {
            /* eslint-disable no-await-in-loop --
            * The general idea to wait until each message will be sent
            * until next message executes
            */
            await this.sentNotifications(message, recipients);
          }
        }

        // if (toSentArr.length > 0) {
        //   await this.sentNotifications(toSentArr);
        // }
      }
    });

    this.tasks.push(minutelyTask);
    // this.bot.telegram.sendMessage(214955237, "Отправлено по расписанию");

    // Enable graceful stop
    process.prependOnceListener('SIGINT', () => this.tasks.forEach((task) => task.stop()));
    process.prependOnceListener('SIGTERM', () => this.tasks.forEach((task) => task.stop()));
  }

  private async sentNotifications(
    message: ManualScheduledMessage,
    recipients: ParticipantShort[],
  ) {
    console.log('Test notification');
    // Sent message to each recipient
    console.log('Message', message.text);

    let counter = 0;
    for (const recipient of recipients) {
      const sentResult = await this.sentMessageToUser(recipient.tg.id, message);
      if (sentResult) counter += 1;
    }

    if (counter !== recipients.length) {
      console.log('Warning: Not all messages has been sent!');
    }

    // Mark notification as sent in DB
    await this.dbManager.markNotificationAsSent();
  }

  private async sentMessageToUser(
    tgId: number,
    message: ManualScheduledMessage | AutoScheduledMessage,
  ): Promise<boolean> {
    const result = await this.bot.telegram.sendMessage(tgId, message.text);
    console.log('Message sent result', result);
    console.log('Sent to:', tgId);

    return true;
  }
}

export default Scheduler;
