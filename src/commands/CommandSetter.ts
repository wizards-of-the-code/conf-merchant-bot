import TelegramBot from '../TelegramBot';
import { Command } from '../types';

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
      console.error('Failed to fetch commands:', error);
      return [];
    }
  }

  async setCommands() {
    this.commandList = await this.fetchCommands();
    this.bot.telegram.setMyCommands(this.commandList);
  }
}

export default CommandSetter;
