import { MongoClient, Db, Document, OptionalUnlessRequiredId, ObjectId } from 'mongodb';
import { IConfigService } from '../config/ConfigService.interface';
import { Event, EventWithParticipants, LogEntry } from '../types';

interface Item extends Document {}

class DBManager {
  private instance: Db | undefined;

  private uri: string;

  private dbName: string;

  private client: MongoClient;

  constructor(private readonly configService: IConfigService) {
    this.uri = `mongodb+srv://${configService.get('MONGO_USERNAME')}:${configService.get(
      'MONGO_PASSWORD',
    )}@botdb.ixjj9ng.mongodb.net/`;
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

  async getCollectionData<T>(collectionName: string, selectionCondition: any): Promise<T[]> {
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

  async getCollection<T>(collectionName: string) {
    try {
      if (!this.instance) {
        throw new Error('Database instance not available.');
      }
      const collection = await this.instance.collection(collectionName).find().toArray();
      return collection as T[];
    } catch (error) {
      console.error('Error fetching collection data:', error);
      throw new Error('Failed to fetch data from collection.');
    }
  }

  async getDocumentData<T>(collectionName: string, selectionCondition: any): Promise<T | null> {
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
    logData?: LogEntry,
  ): Promise<ObjectId | undefined> {
    try {
      if (!this.instance) {
        throw new Error('No database instance found.');
      }
      const collection = this.instance.collection(collectionName);
      const options = { upsert: true };
      const insertResult = await collection.updateOne(query, data, options);

      if (logData) {
        await this.insertOne('logs', logData);
      }

      if (insertResult.upsertedId) {
        return insertResult.upsertedId;
      }

      return undefined;
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
