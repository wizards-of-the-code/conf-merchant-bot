import {
  MongoClient, Db, Document, OptionalUnlessRequiredId,
} from 'mongodb';
import { IConfigService } from '../config/ConfigService.interface';
import { Event, Participant, Speaker } from '../types';

interface Item extends Document {}

class DBManager {
  instance: Db | undefined;

  uri: string;

  dbName: string;

  client: MongoClient;

  constructor(private readonly configService: IConfigService) {
    this.instance = undefined;
    this.uri = `mongodb+srv://${configService.get('MONGO_USERNAME')}:${configService.get('MONGO_PASSWORD')}@botdb.ixjj9ng.mongodb.net/`;
    this.dbName = `${configService.get('MONGO_DB_NAME')}`;
    this.client = new MongoClient(this.uri);
  }

  async connect() {
    try {
      // For a server console logs
      /* eslint no-console: 0 */
      console.log('Connecting...');
      await this.client.connect();
      this.instance = this.client.db(this.dbName);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

  /** Get all events from the database */
  async getEvents(): Promise<Event[]> {
    const arr: Event[] = [];

    if (this.instance) {
      const collection = this.instance.collection<Event>('events');
      const cursor = collection.find();

      for await (const doc of cursor) {
        arr.push({ ...doc });
      }
    }

    return arr;
  }

  /** Get all Participants from the database for specified Event
   * @param {string} [eventName] - name of the Event in DB
  */
  async getEventParticipants(eventName: string): Promise<Participant[]> {
    const arr: Participant[] = [];

    if (this.instance) {
      const collection = this.instance.collection<Participant>('participants');
      const cursor = collection.find({ event_name: eventName });

      for await (const doc of cursor) {
        arr.push({ ...doc });
      }
    }

    return arr;
  }

  /** Get all Speakers from the database for specified Event
   * @param {string} [eventName] - name of the Event in DB
  */
  async getEventSpeakers(eventName: string): Promise<Speaker[]> {
    const arr: Speaker[] = [];

    if (this.instance) {
      const collection = this.instance.collection<Speaker>('speakers');
      const cursor = collection.find({ event_name: eventName });

      for await (const doc of cursor) {
        arr.push({ ...doc });
      }
    }

    return arr;
  }

  /** Get Event from the database by name
  * @param {string} [name] Event name
  * @returns {Promise<Event | null>} Promise object with Event if it was found, or null
  */
  async getEventByName(name: string): Promise<Event | null> {
    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Event>('events');
      return collection.findOne<Event>({ name });
    }
  }

  /** Add a participant to an Event.
   * @param {Event} [event] Event
   * @param {Participant} [participant] Participant to add.
   * @returns {boolean} True if success, False if participant is already added to an Event.
   */
  async addParticipant(event: Event, user: Participant): Promise<boolean> {
    const participants = await this.getEventParticipants(event.name);

    // Check if user is not already participated in this event
    const isAlreadyPatricipated = participants.find(
      (participant) => participant.tg_id === user.tg_id,
    );

    if (!isAlreadyPatricipated) {
      this.insertOne('participants', user);
      return true;
    }

    return false;
  }

  // PRIVATE CLASS METHODS

  private async insertOne<T extends Item>(
    collectionName: string,
    item: OptionalUnlessRequiredId<T>,
  ): Promise<boolean> {
    const collection = this.instance!.collection<T>(collectionName);
    const result = await collection.insertOne(item);

    if (result.acknowledged) {
      return true;
    }

    return false;
  }
}

export default DBManager;
