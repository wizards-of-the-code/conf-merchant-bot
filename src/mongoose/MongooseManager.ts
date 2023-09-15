import * as mongoose from 'mongoose';
import { IConfigService } from '../config/ConfigService.interface';

const connectToMongoose = async (configService: IConfigService) => {
  const uri = `mongodb+srv://${configService.get('MONGO_USERNAME')}:${configService.get(
    'MONGO_PASSWORD',
  )}@botdb.ixjj9ng.mongodb.net/${configService.get('MONGO_DB_NAME')}`;

  try {
    // For a server console logs
    console.log('Connecting...');
    await mongoose.connect(uri);
    console.log('Connected to Mongoose');
  } catch (error) {
    console.error('Error connecting to Mongoose:', error);
  }
};

export default connectToMongoose;
