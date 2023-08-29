import {
  MongoClient, Db, Document,
  OptionalUnlessRequiredId, ObjectId, UpdateResult,
  InsertOneResult,
} from 'mongodb';
import { IConfigService } from '../config/ConfigService.interface';
import {
  Event,
  Participant,
  ParticipantEventDetails,
  LogEntry,
  TelegramUser,
  EventWithParticipants,
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
    try {
      if (!this.instance) {
        throw new Error('Database instance not available.');
      }

      const collection = this.instance.collection(collectionName);
      const result = await collection.find(selectionCondition).toArray();
      return result as T[];
    } catch (error) {
      console.error('Error fetching collection data:', error);
      throw new Error('Failed to fetch data from collection.');
    }
  }

  async getDocumentData<T>(
    collectionName: string,
    selectionCondition: any,
  ): Promise<T | null> {
    try {
      if (!this.instance) {
        throw new Error('Database instance not available.');
      }
      const collection = this.instance.collection(collectionName);
      const result: T | null = await collection.findOne<T>(selectionCondition);
      return result;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw new Error('Failed to fetch document from collection.');
    }
  }

  async insertOrUpdateDocumentToCollection(
    collectionName: string,
    query: any,
    data: any,
  ) {
    try {
      if (!this.instance) {
        throw new Error('No database instance found.');
      }
      const collection = this.instance.collection(collectionName);
      const options = { upsert: true };
      const result = await collection.updateOne(query, data, options);
      return result;
    } catch (error) {
      console.error('Error adding document:', error);
      throw new Error('Failed to add document to collection.');
    }
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
          username: participant.tg.username,
          first_name: participant.tg.first_name,
        },
        statuses.NEW_PARTICIPANT,
        `New participant @${participant.tg.username} added`,
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
        username: participant.tg.username,
        first_name: participant.tg.first_name,
      },
      statuses.EVENT_UPDATE,
      `To event ${eventId} added participant @${participant.tg.username}`,
    );

    return result;
  }

  /** Remove a participant from event.
   * @param {ObjectId} [eventId] Event ID.
   * @param {Participant} [participant] Participant to remove.
   * @returns {UpdateResult}
   */
  async removeParticipantFromEvent(
    eventId: ObjectId,
    participant: Participant,
  ): Promise<UpdateResult> {
    let result: UpdateResult;

    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Event>('events');

      result = await collection
        .updateOne({ _id: eventId }, { $pull: { participants: participant._id } });
    }

    // Log event to DB
    await this.logToDB(
      {
        id: participant.tg.id,
        username: participant.tg.username,
        first_name: participant.tg.first_name,
      },
      statuses.EVENT_UPDATE,
      `From event ${eventId} removed participant @${participant.tg.username}`,
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
        attended: false,
      };

      result = await collection
        .updateOne({ _id: participant._id }, { $push: { events: eventDetails } });
    }

    // Log event to DB
    await this.logToDB(
      {
        id: participant.tg.id,
        username: participant.tg.username,
        first_name: participant.tg.first_name,
      },
      statuses.PARTICIPANT_UPDATE,
      `Participant @${participant.tg.username} added to event: ${eventId}`,
    );

    return result;
  }

  /** Remove event details from participant entry.
   * @param {ObjectId} [eventId] Participant to remove.
   * @param {Participant} [participant] Participant to add.
   * @returns {UpdateResult} UpdateResult
   */
  async removeEventDetailsFromParticipant(
    eventId: ObjectId,
    participant: Participant,
  ): Promise<UpdateResult> {
    let result: UpdateResult;

    if (!this.instance) {
      throw new Error('No DB instance.');
    } else {
      const collection = this.instance.collection<Participant>('participants');

      result = await collection
        .updateOne({ _id: participant._id }, { $pull: { events: { event_id: eventId } } });
    }

    // Log event to DB
    await this.logToDB(
      {
        id: participant.tg.id,
        username: participant.tg.username,
        first_name: participant.tg.first_name,
      },
      statuses.PARTICIPANT_UPDATE,
      `Participant @${participant.tg.username} removed from event: ${eventId}`,
    );

    return result;
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
