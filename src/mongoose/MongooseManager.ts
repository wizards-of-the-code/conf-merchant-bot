import * as mongoose from 'mongoose';
import { IConfigService } from '../config/ConfigService.interface';

class DbManagerMongoose {
  private readonly uri: string;

  constructor(private readonly configService: IConfigService) {
    this.uri = `mongodb+srv://${configService.get('MONGO_USERNAME')}:${configService.get(
      'MONGO_PASSWORD',
    )}@botdb.ixjj9ng.mongodb.net/${configService.get('MONGO_DB_NAME')}`;
  }

  async connect() {
    try {
      // For a server console logs
      console.log('Connecting...');
      await mongoose.connect(this.uri);
      console.log('Connected to Mongoose');
    } catch (error) {
      console.error('Error connecting to Mongoose:', error);
    }
  }
}

export default DbManagerMongoose;
