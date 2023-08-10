import { MongoClient, Db } from 'mongodb';
import { IConfigService } from '../config/ConfigService.interface';
import { Event } from '../types';

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

  /** Get Event by name
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
}

export default DBManager;
