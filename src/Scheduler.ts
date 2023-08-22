import cron from 'node-cron';
import DBManager from './mongodb/DBManager';
import { AutoScheduledMessage, ManualScheduledMessage } from './types';

class Scheduler {
  constructor(private readonly cronExpression: string, private readonly dbManager: DBManager) {}

  async init() {
    // For a server console logs
    /* eslint no-console: 0 */
    console.log('Scheduler initialized');

    cron.schedule(this.cronExpression, async () => {
      // Check participants
      if (!this.db) {
        console.log('No database initialized.');
      } else {
        const participansId = new Set();
        const events = new Set();

        const participantsCollection = this.db.collection<Participant>('participants');
        const participantsCursor = participantsCollection.find();

        const eventsCollection = this.db.collection<Event>('events');
        const eventsCursor = eventsCollection.find();

        for await (const participant of participantsCursor) {
          participansId.add(participant.tg.id);
        }

        for await (const event of eventsCursor) {
          events.add(event.name);
        }

        // TODO: Logic for finiding what participants should be notified
        console.log(participansId);
        console.log(events);
      }
      // Send reminders to them
      // TODO: Loop for sending reminders and other messages

      // this.bot.telegram.sendMessage(214955237, "Отправлено по расписанию");
    });

    cron.schedule('*/1 * * * * *', async () => {
      // Every minute check DB for changes ragarding MANUAL messages
      const messages: ManualScheduledMessage[] = this.dbManager.getManualMessages();
    });

    // this.bot.telegram.sendMessage(214955237, "Отправлено по расписанию");
  }

  async sentReminder() {
    console.log('Sent reminder');
    // Sent message to a participant
  }
}

export default Scheduler;
