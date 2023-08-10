import TelegramBot from '../TelegramBot';

abstract class Command {
  constructor(public bot: TelegramBot) {}

  abstract handle(): void;
}

export default Command;
