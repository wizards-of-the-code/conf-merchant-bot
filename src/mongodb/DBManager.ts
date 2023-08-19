import {
  MongoClient, Db, Document,
  OptionalUnlessRequiredId, ObjectId, UpdateResult,
  InsertOneResult,
} from 'mongodb';
import { IConfigService } from '../config/ConfigService.interface';
import {
  Event, Participant, Speaker, ScheduleItem, ParticipantEventDetails, LogEntry, TGUser,
} from '../types';

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
      /* eslint no-console: 1 */
    }
  }

  /** Get all `active` events from the database */
  async getEvents(): Promise<Event[]> {
    const arr: Event[] = [];

    if (this.instance) {
      const collection = this.instance.collection<Event>('events');
      const cursor = collection.find({ is_active: true });

      for await (const doc of cursor) {
        arr.push({ ...doc });
      }
    }

    return arr;
  }

  async getParticipant(tgId: number): Promise<Participant | null> {
    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Participant>('participants');
      return collection.findOne<Participant>({ tg_id: tgId });
    }
  }

  /** Get all Participants from the database for specified Event
   * @param {ObjectId} [eventId] - Event ID in DB
  */
  async getEventParticipants(eventId: ObjectId): Promise<Participant[]> {
    const arr: Participant[] = [];

    if (this.instance) {
      const collection = this.instance.collection<Participant>('participants');
      const cursor = collection.find({ _id: eventId });

      for await (const doc of cursor) {
        arr.push({ ...doc });
      }
    }

    return arr;
  }

  /** Get all Speakers from the database for specified Event
   * @param {ObjectId} [eventId] - name of the Event in DB
  */
  async getEventSpeakers(eventId: ObjectId): Promise<Speaker[]> {
    const arr: Speaker[] = [];

    if (this.instance) {
      const collection = this.instance.collection<Speaker>('speakers');
      const cursor = collection.find({ event_id: eventId });

      for await (const doc of cursor) {
        arr.push({ ...doc });
      }
    }

    return arr;
  }

  /** Get all Schedule items from the database for specified Event
   * @param {ObjectId} [eventId] - Event ID
  */
  async getEventScheduleItems(eventId: ObjectId): Promise<ScheduleItem[]> {
    const arr: ScheduleItem[] = [];

    if (this.instance) {
      const collection = this.instance.collection<ScheduleItem>('schedule');
      const cursor = collection.find({ event_id: eventId });

      for await (const doc of cursor) {
        arr.push({ ...doc });
      }
    }

    return arr;
  }

  /** Get Event from the database by name
  * @param {ObjectId} [eventId] Event ID
  * @returns {Promise<Event | null>} Promise object with Event if it was found, or null
  */
  async getEventById(eventId: ObjectId): Promise<Event | null> {
    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Event>('events');
      return collection.findOne<Event>({ _id: eventId });
    }
  }

  /** Add a new participant.
   * @param {Participant} [participant] Participant to add.
   * @returns {ObjectId} Inserted participant ObjectId
   */
  async insertParticipant(participant: Participant): Promise<ObjectId> {
    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Participant>('participants');
      const result: InsertOneResult = await collection.insertOne(participant);
      return result.insertedId;
    }
  }

  /** Add a new participant.
   * @param {ObjectId} [eventId] Event ID.
   * @param {ObjectId} [participantId] Participant ID to add.
   * @returns {UpdateResult}
   */
  async addParticipantToEvent(eventId: ObjectId, participantId: ObjectId): Promise<UpdateResult> {
    let result: UpdateResult;

    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Event>('events');

      result = await collection
        .updateOne({ _id: eventId }, { $addToSet: { participants: participantId } });
    }

    return result;
  }

  /** Add a new participant.
   * @param {ObjectId} [eventId] Participant to add.
   * @param {ObjectId} [participantId] Participant to add.
   * @returns {ObjectId} Inserted participant ObjectId
   */
  async addEventDetailsToParticipant(
    eventId: ObjectId,
    participantId: ObjectId,
  ): Promise<UpdateResult> {
    let result: UpdateResult;

    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Participant>('participants');

      const eventDetails: ParticipantEventDetails = {
        event_id: eventId,
        is_payed: false,
      };

      result = await collection
        .updateOne({ _id: participantId }, { $push: { events: eventDetails } });
    }

    return result;
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

  async logToDB(
    initiator: TGUser,
    event: string,
    message: string,
  ): Promise<boolean> {
    const entry: LogEntry = {
      datetime: new Date(),
      initiator,
      event,
      message,
    };

    const result = this.insertOne('log', entry);
    return result;
  }
}

export default DBManager;
