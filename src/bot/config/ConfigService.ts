import { config, DotenvParseOutput } from 'dotenv';

export interface IConfigService {
  get(key: string): string;
}

class ConfigService implements IConfigService {
  private config: DotenvParseOutput;

  constructor() {
    const { error, parsed } = config();
    if (error) {
      throw new Error('File .env not found.');
    }
    if (!parsed) {
      throw new Error('File .env is empty.');
    }
    this.config = parsed;
  }

  get(key: string): string {
    const res = this.config[key];

    if (!res) {
      throw new Error('No key in .env.');
    }

    return res;
  }
}

export default ConfigService;
