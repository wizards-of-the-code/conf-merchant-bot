import cron from 'node-cron';
import DBManager from './mongodb/DBManager';
import { AutoScheduledMessage, ManualScheduledMessage } from './types';

class Scheduler {
  constructor(private readonly cronExpression: string, private readonly dbManager: DBManager) {}

  async init() {
    // For a server console logs
    /* eslint no-console: 0 */
    console.log('Scheduler initialized');

    // cron.schedule(this.cronExpression, async () => {
    //   // Every day check DB for SCHEDULED messages
    //   const messages: AutoScheduledMessage[] = this.dbManager.getAutoMessages();
    // });

    cron.schedule('0 */1 * * * *', async () => {
      // Every minute check DB for changes ragarding active MANUAL messages
      const messages: ManualScheduledMessage[] = await this.dbManager.getScheduledNotifications('manual');

      if (messages.length > 0) {
        // Filter ready for sending messages
        const toSentArr = messages.filter((message) => message.datetime_to_send <= new Date());

        if (toSentArr.length > 0) {
          await this.sentNotifications(toSentArr);
        }
      }
    });

    // this.bot.telegram.sendMessage(214955237, "Отправлено по расписанию");
  }
}

export default Scheduler;
