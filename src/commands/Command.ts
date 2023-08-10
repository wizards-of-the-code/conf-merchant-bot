import { TelegramBot } from "../TelegramBot";

export abstract class Command {
  constructor(public bot: TelegramBot) {}

  abstract handle(): void;
}