import cron, { ScheduledTask } from 'node-cron';
import DBManager from './mongodb/DBManager';
import { EventWithParticipants, ManualScheduledMessage } from './types';

class Scheduler {
  tasks: ScheduledTask[];

  constructor(private readonly cronExpression: string, private readonly dbManager: DBManager) {
    this.tasks = [];
  }

  async init() {
    // For a server console logs
    /* eslint no-console: 0 */
    console.log('Scheduler initialized');

    // cron.schedule(this.cronExpression, async () => {
    //   // Every day check DB for SCHEDULED messages
    //   const messages: AutoScheduledMessage[] = this.dbManager.getAutoMessages();
    // });
    console.log('tasks', cron.getTasks());

    const minutelyTask: ScheduledTask = cron.schedule('0 */1 * * * *', async () => {
      // Every minute check DB for changes ragarding active MANUAL messages
      const messages: ManualScheduledMessage[] = await this.dbManager.getManualNotifications();

      if (messages.length > 0) {
        // Filter ready for sending messages
        const toSentArr = messages.filter((message) => message.datetime_to_send <= new Date());
        const events: EventWithParticipants[] = await this.dbManager.getEventsWithParticipants();
        console.log('Active events:', events.length);

        // TODO: Find out how to get normal ObjectId instead of new ObjectId(...) in events

        // TODO: Write an algorithm to sent messages to event participants

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
    messages: ManualScheduledMessage[],
  ) {
    console.log('Sent notifications');
    // Get all events with participants included
    const full = this.dbManager.getEventsWithParticipants();
    // Sent message to a participants
    console.log(messages);
    console.log(full);

    // Mark notification as sent in DB
    // this.dbManager.markNotificationAsSent();
  }
}

export default Scheduler;
