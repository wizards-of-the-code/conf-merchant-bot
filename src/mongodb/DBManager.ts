import {
  MongoClient, Db, Document,
  OptionalUnlessRequiredId, ObjectId, UpdateResult,
  InsertOneResult,
} from 'mongodb';
import { IConfigService } from '../config/ConfigService.interface';
import {
  Event,
  Participant,
  ScheduleItem,
  ParticipantEventDetails,
  LogEntry,
  TelegramUser,
  Message,
  ScheduledMessage,
  EventWithParticipants,
  Sponsor,
} from '../types';
import { statuses } from '../constants';

interface Item extends Document { }

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

  async getCollectionData<T>(
    collectionName: string,
    selectionCondition: any,
  ): Promise<T[]> {
    if (this.instance) {
      const collection = this.instance.collection(collectionName);
      const result = await collection.find(selectionCondition).toArray();
      return result as T[];
    }
    return [];
  }

  async getDocumentData<T>(
    collectionName: string,
    selectionCondition: any,
  ) {
    if (this.instance) {
      const collection = this.instance.collection(collectionName);
      return collection.findOne<T>(selectionCondition) as T;
    }
    throw new Error('No instance');
  }

  async addDocumentToCollection<T>(
    collectionName: string,
    data: any,
  ): Promise<ObjectId> {
    if (this.instance) {
      const collection = this.instance.collection(collectionName);
      const result: InsertOneResult = await collection.insertOne(data);
      return result.insertedId;
    }
    throw new Error('Error! No instance!');
  }

  /** Get all `active` events from the database */
  async getEventsWithParticipants(): Promise<EventWithParticipants[]> {
    if (!this.instance) {
      throw new Error('No DB instance.');
    }

    const collection = this.instance.collection<Event>('events');
    const cursor = collection.aggregate([
      {
        $lookup: {
          from: 'participants',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants',
          pipeline: [
            {
              $project: {
                tg: 1,
              },
            },
          ],
        },
      },
      {
        $match: {
          is_active: true,
        },
      },
    ]);

    const results = await cursor.toArray();
    return results as EventWithParticipants[];
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

      // Log event to DB
      await this.logToDB(
        {
          id: participant.tg.id,
          first_name: participant.tg.first_name,
        },
        statuses.NEW_PARTICIPANT,
        `New participant @${participant.tg.first_name} added`,
      );

      return result.insertedId;
    }
  }

  /** Add a new participant.
   * @param {ObjectId} [eventId] Event ID.
   * @param {Participant} [participant] Participant to add.
   * @returns {UpdateResult}
   */
  async addParticipantToEvent(eventId: ObjectId, participant: Participant): Promise<UpdateResult> {
    let result: UpdateResult;

    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Event>('events');

      result = await collection
        .updateOne({ _id: eventId }, { $addToSet: { participants: participant._id } });
    }

    // Log event to DB
    await this.logToDB(
      {
        id: participant.tg.id,
        first_name: participant.tg.first_name,
      },
      statuses.EVENT_UPDATE,
      `To event ${eventId} added participant @${participant.tg.first_name}`,
    );

    return result;
  }

  /** Add event details to participant entry.
   * @param {ObjectId} [eventId] Participant to add.
   * @param {ObjectId} [participantId] Participant to add.
   * @returns {ObjectId} Inserted participant ObjectId
   */
  async addEventDetailsToParticipant(
    eventId: ObjectId,
    participant: Participant,
    role: string,
  ): Promise<UpdateResult> {
    let result: UpdateResult;

    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Participant>('participants');

      const eventDetails: ParticipantEventDetails = {
        event_id: eventId,
        is_payed: false,
        role,
      };

      result = await collection
        .updateOne({ _id: participant._id }, { $push: { events: eventDetails } });
    }

    // Log event to DB
    await this.logToDB(
      {
        id: participant.tg.id,
        first_name: participant.tg.first_name,
      },
      statuses.PARTICIPANT_UPDATE,
      `Participant @${participant.tg.first_name} added to event: ${eventId}`,
    );

    return result;
  }

  /** Get messages array from DB.
   * @param {string} [messageName] Name of the message entry in DB.
   * @returns {string[]} String array of messages.
   */
  async getMessagesArray(messageName: string): Promise<string[]> {
    const messages: string[] = [];

    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Message>('messages');
      const msg = await collection.findOne<Message>({ name: messageName });

      if (msg && msg?.value.length > 0) {
        messages.push(...msg.value);
      }
    }

    return messages;
  }

  async addSponsor(user: Sponsor): Promise<boolean> {
    const sponsors: Sponsor[] = await this.getCollectionData('sponsors', {});

    const isAlreadySponsor = sponsors.find(
      (sponsor) => sponsor.tg.id === user.tg.id,
    );

    if (isAlreadySponsor) {
      return false;
    }

    this.insertOne('sponsors', user);
    return true;
  }

  // LOGGER METHODS

  /** Add a new participant.
   * @param {TelegramUser} [initiator] Participant to add.
   * @param {string} [event] Logging event.
   * @param {string} [message] Optional log message.
   * @returns {boolean} True - logged successfully, False - logging failed.
   */
  async logToDB(
    initiator: TelegramUser,
    event: string,
    message?: string,
  ): Promise<boolean> {
    const logEntry: LogEntry = {
      datetime: new Date(),
      initiator,
      event,
      message,
    };

    const result = this.insertOne('log', logEntry);
    return result;
  }

  // SCHEDULER METHODS

  /** Get all Scheduled Messages from DB which are ACTIVE and NOT SENT yet.
   * @returns {ScheduledMessage[]} Array of ScheduledMessages.
   */
  async getScheduledNotifications(): Promise<ScheduledMessage[]> {
    const arr: ScheduledMessage[] = [];

    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<ScheduledMessage>('notifications');
      const cursor = collection.find({ is_active: true, sent: null });

      for await (const doc of cursor) {
        arr.push({ ...doc });
      }
    }

    return arr;
  }

  /** Mark Scheduled Message as SENT in the DB.
   * @param {ObjectId} [messageId] Scheduled Message ID
   * @returns {boolean} True - marked successfully, False - marking failed.
   */
  async markNotificationAsSent(
    messageId: ObjectId,
  ): Promise<UpdateResult> {
    let result: UpdateResult;

    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      /* eslint @typescript-eslint/no-unused-vars: 0 */
      const collection = this.instance.collection<ScheduledMessage>('notifications');
      result = await collection
        .updateOne({ _id: messageId }, { $set: { sent: new Date() } });
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
}

export default DBManager;
