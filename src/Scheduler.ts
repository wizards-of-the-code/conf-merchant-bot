import { Db } from "mongodb";
import { Event, Participant } from "./types";
import cron from 'node-cron';

export class Scheduler {
  db: Db | undefined;

  constructor(private readonly cronExpression: string) {}

  async init(db: Db | undefined) {
    this.db = db;
    console.log('Scheduler initialized');

    cron.schedule(this.cronExpression, async () => {
      // Check participants
      if(!this.db) {
        console.log('No database initialized.');
      } else {
        const participansId = new Set();
        const events = new Set();


        const participantsCollection = this.db.collection<Participant>("participants");
        const participantsCursor = participantsCollection.find();
        
        const eventsCollection = this.db.collection<Event>("events");
        const eventsCursor = eventsCollection.find();
  
        for await (const participant of participantsCursor) {
          participansId.add(participant.tg_id);
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
      
      //this.bot.telegram.sendMessage(214955237, "Отправлено по расписанию");
    });
  }
}