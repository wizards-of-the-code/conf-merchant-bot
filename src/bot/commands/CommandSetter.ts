import TelegramBot from '../TelegramBot';
import logger from '../../data/logger/logger';
import { Command } from '../../data/types';
import getErrorMsg from '../../utils/getErrorMessage';

class CommandSetter {
  private bot: TelegramBot;

  private commandList: Command[] = [];

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  private async fetchCommands(): Promise<Command[]> {
    try {
      return await this.bot.dbManager.getCollectionData<Command>('commands', { active: true });
    } catch (error) {
      logger.error(`Failed to fetch commands: ${getErrorMsg(error)}`);
      return [];
    }
  }

  async setCommands() {
    this.commandList = await this.fetchCommands();
    this.bot.telegram.setMyCommands(this.commandList);
  }
}

export default CommandSetter;
